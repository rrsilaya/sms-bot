# sms-bot
SMS Bot powered by Globe Labs SMS API.

#### Keywords
1. `REQUEST` - request agenda to all subscribers
2. `STASH` - remove all saved agenda
3. `VIEW` - view saved agenda
4. `HELLO` - displays the welcome message
5. `KEYWORDS` - displays all available keywords
6. `DISTRIBUTE` - distribute agenda list to all subscribers
7. `ANNOUNCE <department> <announcement>` - send a message to all subscribers
8. `AGENDA <department> <agenda>` - save agenda to the list

#### Sending Agenda
In order to send and save your agenda list, you must follow the specified format as shown in this example:

```
AGENDA <department>

> Agenda 1
> Agenda 2
```
