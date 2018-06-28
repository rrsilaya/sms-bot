import { Message } from '../handler';

const USER = {
    access_token: 'IkFEeamKo2DohdqU3pXaAUjkKo24OhZn0hDyZX_mc6k',
    subscriber_number: '9361462018',
    position: 'DCEO',
    department: 'PAD'
}

describe('Message', () => {
    test('is created', () => {
        const message = new Message(
            USER.subscriber_number,
            USER.access_token,
            'content'
        );

        expect(message.address).toBe(USER.subscriber_number);
        expect(message.access_token).toBe(USER.access_token);
        expect(message.content).toBe('content');
    });
});