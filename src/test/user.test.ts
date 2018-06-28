import { User } from '../handler';

const USER = {
    access_token: 'IkFEeamKo2DohdqU3pXaAUjkKo24OhZn0hDyZX_mc6k',
    subscriber_number: '9361462018',
    position: 'DCEO',
    department: 'PAD'
}

test('creates new user', () => {
    const user = new User(USER, USER.department, USER.position);

    expect(user).toEqual({
        access_token: USER.access_token,
        subscriber_number: USER.subscriber_number
    });
});

test('removes new user', () => {
    const user = new User(USER, USER.department, USER.position);
    user.remove();

    expect(user).toEqual({
        access_token: USER.access_token,
        subscriber_number: USER.subscriber_number
    });
});

test('gets user', async () => {
    const user = new User(USER, USER.department, USER.position);
    const data = await User.find(user.subscriber_number);

    expect(data).toEqual(USER);
});

test('gets multiple users', async () => {
    const data = await User.find(null, true);

    expect(Array.isArray(data)).toBeTruthy();
});