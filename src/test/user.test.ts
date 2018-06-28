import { User } from '../handler';

const USER = {
    access_token: 'IkFEeamKo2DohdqU3pXaAUjkKo24OhZn0hDyZX_mc6k',
    subscriber_number: '9361462018',
    position: 'DCEO',
    department: 'PAD'
}

describe('User', () => {
    test('is created', () => {
        const user = new User(USER, USER.department, USER.position);

        expect(user).toEqual(USER);
    });

    test('is removed', () => {
        const user = new User(USER, USER.department, USER.position);
        user.remove();

        expect(user).toEqual(USER);
    });

    test('is retrieved', async () => {
        const user = new User(USER, USER.department, USER.position);
        const data = await User.find(user.subscriber_number);

        expect(data).toEqual(USER);
    });

    test('list is retrieved', async () => {
        const data = await User.find(null, true);

        expect(Array.isArray(data)).toBeTruthy();
    });
});

