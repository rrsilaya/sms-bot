import * as axios from 'axios';
import * as uniqid from 'uniqid';

import db from '../database/config';
import { logger } from '../util';

export class Message {
    constructor(address, access_token, content) {
        this.address = address;
        this.access_token = access_token;
        this.content = content.trim();
    }

    send() {
        return new Promise(async (resolve, reject) => {
            try {
                const { data } = await axios.post(this.access_token, {
                    outboundSMSMessageRequest: {
                        senderAddress: process.env.SENDER_ADDRESS,
                        outboundSMSMessageRequest: { message: this.message },
                        address: this.adderss
                    }
                });

                resolve(data);
            } catch (err) {
                logger(err.message, 'MESSAGE', true);
                console.log(err);

                reject();
            }
        })
    }

    static receive({ inboundSMSMessageList }) {
        const { inboundSMSMessage, numberOfMessagesInThisBatch } = inboundSMSMessageList;
        const { multipartRefId = uniqid(), multipartSeqNum = '1' } = inboundSMSMessage;
        
        db.ref('/messages/' + multipartRefId + '_total').set(parseFloat(numberOfMessagesInThisBatch));
        db.ref('/messages/' + multipartRefId + multipartSeqNum).set({ ...inboundSMSMessage, multipartSeqNum });

        return inboundSMSMessageList;
    }

    static retrieve(ref) {
        return new Promise(async resolve => {
            const data = await db.ref(`/messages${ref ? `/${ref}` : ''}`).once('value');
            const message = [];

            const entries = Object.values(data.val() || {}).filter(val => typeof val === 'object');
            entries.forEach(chunk => message[parseFloat(chunk.multipartSeqNum)] = chunk);

            resolve(message.join(''));
        });
    }
}