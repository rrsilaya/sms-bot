import db from '../database/config';
import { logger } from '../util';

export class User {
    constructor({ access_token, subscriber_number }, department, position) {
        this.access_token = access_token;
        this.subscriber_number = subscriber_number;

        db.ref('/users/' + subscriber_number).set({
            access_token,
            subscriber_number,
            department,
            position
        });
        logger(`New user subscribed: ${subscriber_number}`, 'NEW USER');
    }

    remove() {
        db.ref('/users/' + this.subscriber_number).set(null);
        logger(`User unsubscribed: ${this.subscriber_number}`, 'UNSUBSCRIBED', true);

        return this;
    }

    static find(ref, transform = false) {
        return new Promise(async resolve => {
            const user = await db.ref(`/users${ref ? `/${ref}` : ''}`).once('value');
            const data = transform ? Object.values(user.val() || {}) : user.val();

            resolve(data);
        });
    }
}