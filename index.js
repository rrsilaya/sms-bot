const express = require('express');
const { fromExpress } = require('webtask-tools');
const bodyParser = require('body-parser');
const firebase = require('firebase');
const axios = require('axios');

// Global constants
const TEL_PREFIX = 7;
const DEPARTMENTS = [
  'CEO',
  'PAD',
  'SCHO',
  'VL',
  'HR',
  'FIN',
  'SEC'
];
const KEYWORDS = [
  { keyword: 'HELLO', definition: 'Display welcome message' },
  { keyword: 'KEYWORDS', definition: 'Display this help message' },
  { keyword: 'REQUEST', definition: 'Request agenda from subscribers' },
  { keyword: 'VIEW', definition: 'View list of saved agenda' },
  { keyword: 'DISTRIBUTE', definition: 'Send agenda list to all subscribers' },
  { keyword: 'STASH', definition: 'Remove all saved agenda' },
  { keyword: 'ANNOUNCE [department] [content]', definition: 'Announce to all subscribers' },
  { keyword: 'AGENDA [department]\n> [Agenda 1]\n> [Agenda 2]', definition: 'Add agenda' },
];

// Firebase config
firebase.initializeApp({
  /**
   * Firebase configs
   */
})

const app = express();
const database = firebase.database();

app.use(bodyParser.json());

// Redirect URI
app
  .get('/redirect', registerRouter)
  .post('/redirect', unsubscribeRouter);
app.post('/receive', receiveRouter);

module.exports = fromExpress(app);

/**
 * Constants
 */
const App = {
  name: 'YSES SMS Bot',
  tokenizer: 'https://developer.globelabs.com.ph/oauth/access_token',
  api_id: '', // API Id
  app_secret: '', // App secret
  senderAddress: 1111, // last 4 digits of provider number
  developer: { // dev contact for reports
    contact: '',
    name: 'Ralph'
  },
  SEND_SMS: token => `https://devapi.globelabs.com.ph/smsmessaging/v1/outbound/1111/requests?access_token=${token}`
}

const Template = {
  SEND_SMS: (address, message) => ({
    outboundSMSMessageRequest: {
      senderAddress: App.senderAddress,
      outboundSMSTextMessage: { message },
      address
    }
  }),
  AGENDA: content => {
    const [ , ...agenda ] = content.join(' ').split(/\s*>\s+/g);

    return agenda.reduce((acc, value) => acc + `> ${value}\n`, '');
  }
}

const Message = {
  welcome: `Hi, I am the ${App.name}. I will try to assist you in any way that I can. Start by entering "KEYWORDS" to see the things I can do. :)`,
  format: (header, body) => `[YSES / ${header}]\n\n${body}`,
  error: `Uh oh, I wasn't able to understand your request. If you think that this is a bug, please contact ${App.developer.name}.`,
  request: 'Hello, exec. Please send in your agenda and I\'ll process it. :)',
  dept_err: 'Sorry, I didn\'t get that. I only know the abbreviated department names (CEO, PAD, VL, HR, SEC, FIN, SCHO).',
  agenda: 'Thanks, boss. I\'ll save that for later. :)',
  no_agenda: 'Oops, it seems like there are no saved agenda yet.',
  stash: 'Sure, I\'ll do a spring cleaning of the agenda list.',
  blank: 'What? I wasn\'t able to record that. Are you sure it\'s not empty?',
  distribute: agenda => `[YSES / Agenda]\nHello, exec! Here are the agenda I\'ve collected so far:\n\n${agenda}\n\nLet me know if you need my help. :)`,
  help: `[YSES / Help]\nHi, I am the ${App.name}. In order to tell me something that you want me to do, please use the keywords below.\n\n${KEYWORDS.reduce((acc, { definition, keyword }) => acc + `> ${definition}\nSEND: ${keyword}\n\n`, '').trim()}`
}

/**
 * Utils
 */
const returnSend = (res, content = '') => {
  const OK = 200;

  res.set('Content-Type', 'text/html');
  res.status(OK).send(content);
}

const saveUser = data => {
  console.log(`New user subscribed: ${data.subscriber_number}`);

  database.ref('/users/' + data.subscriber_number).set(data);
}

const removeUser = data => {
  console.log(`User unsubscribed: ${data.subscriber_number}`);

  database.ref('/users/' + data.subscriber_number).set(null);
}

const logSMS = ({ messageId, senderAddress, message }) => {
  console.log(`------------------------------------------\nNew Message: ${messageId}\nFrom: ${senderAddress}\n${message}\n------------------------------------------`);
}

const sendSMS = async (address, content) => {
  try {
    const user = await database.ref('/users/' + address).once('value');
    const { access_token } = user.val();

    const { data } = await axios.post(App.SEND_SMS(access_token), Template.SEND_SMS(address, content.trim()));

    console.log(`Successfully sent SMS to ${address}`);
  } catch (err) {
    console.log(`Failure to send SMS to ${address}`);
    console.log(err);
  }
}

const sendToAll = async content => {
  try {
    console.log('Sending SMS to all subscribers');

    const users = await database.ref('/users').once('value');
    const subscribers = Object.values(users.val());

    await Promise.all(subscribers.map(subscriber =>
      sendSMS(subscriber.subscriber_number, content))
    );
    console.log('Successfully sent SMS to all subscribers');
  } catch (err) {
    console.log(`Failure to send SMS to all`);
    console.log(err);
  }
}

const report = async content => {
  try {
    sendSMS(
      App.developer.contact,
      Message.format('Update', content)
    );
  } catch (err) {
    console.log(err);
  }
}

const saveAgenda = async (department, sender, body) => {
  try {
    const agenda = await database.ref('/agenda').once('value');

    if (agenda.hasChild(department)) {
      body = agenda.val()[department].body + body;
    }

    await database.ref('/agenda/' + department).set({
      sender,
      body,
      department
    });
    console.log(`Successfully saved ${department}'s agenda`);
  } catch (err) {
    console.log(`Failure to save ${department}'s agenda`);
    console.log(err);
  }
}

const stashAgenda = async () => {
  try {
    await database.ref('/agenda').set(null);

    console.log(`Successfully stashed agenda list`);
  } catch (err) {
    console.log(`Failure to stash agenda list`);
    console.log(err);
  }
}

function getAllAgenda() {
  return new Promise(async (resolve, reject) => {
    try {
      const agenda = await database.ref('/agenda').once('value');
      const list = Object.values(agenda.val() || {}).reduce((acc, { department, body }) =>
        acc + `${department}\n${body}\n`
      , '');

      return resolve(list.trim());
    } catch (err) {
      console.log(`Failure to get all agenda`);
      console.log(err);

      return reject();
    }
  })
}

/**
 * Routes
 */
async function registerRouter(req, res) {
  const { subscriber_number } = req.query;

  saveUser(req.query);
  sendSMS(subscriber_number, Message.welcome);

  // Report to developer
  if (subscriber_number !== App.developer.contact) {
    sendSMS(
      App.developer.contact,
      report(`${subscriber_number} subscribed to the SMS bot`)
    );
  }

  returnSend(res);
}

function unsubscribeRouter(req, res) {
  removeUser(req.body.unsubscribed);

  returnSend(res);
}

async function receiveRouter(req, res) {
  let agenda = '';
  const [ sms ] = req.body.inboundSMSMessageList.inboundSMSMessage;
  logSMS(sms);

  let { senderAddress } = sms;
  senderAddress = senderAddress.slice(TEL_PREFIX);

  switch (sms.message.trim().toUpperCase()) {
    case 'REQUEST':
      report(`+63${senderAddress} requested for agenda`);
      sendToAll(Message.request);
      break;

    case 'STASH':
      report(`+63${senderAddress} requested to stash agenda list`);
      sendSMS(senderAddress, Message.stash);
      stashAgenda();
      break;

    case 'VIEW':
      agenda = await getAllAgenda();
      
      if (agenda) sendSMS(senderAddress, Message.format('Agenda', agenda));
      else sendSMS(senderAddress, Message.no_agenda);
      break;

    case 'DISTRIBUTE':
      report(`+63${senderAddress} requested to distribute agenda`);
      agenda = await getAllAgenda();

      if (agenda) sendToAll(Message.distribute(agenda));
      else sendSMS(senderAddress, Message.no_agenda);

      break;

    case 'HELLO':
      sendSMS(senderAddress, Message.welcome);
      break;

    case 'KEYWORDS':
      sendSMS(senderAddress, Message.help);
      break;

    default:
      handleQuery(sms);
      break;
  }

  returnSend(res);
}

async function handleQuery(sms) {
  const KEYWORDS = ['ANNOUNCE', 'AGENDA'];
  const sender = sms.senderAddress.slice(TEL_PREFIX);

  let [ query = '', meta = '', ...content ] = sms.message.split(/\s+/);

  query = query.toUpperCase();
  meta = meta.toUpperCase();

  if (KEYWORDS.includes(query)) {
    if (!DEPARTMENTS.includes(meta)) {
      sendSMS(sender, Message.dept_err);
    } else {
      if (content.length) {
        switch (query) {
          case 'ANNOUNCE':
            report(`+63${sender} (${meta}) requested for announcement`);
            sendToAll(Message.format(`Announcement from ${meta}`, content.join(' ')));
            break;

          case 'AGENDA':
            report(`+63${sender} (${meta}) sent their agenda`);
            saveAgenda(meta, sender, Template.AGENDA(content));
            sendSMS(sender, Message.agenda);
            break;
        }
      } else sendSMS(sender, Message.blank);
    }
  } else {
    sendSMS(sender, Message.error);
  }
}