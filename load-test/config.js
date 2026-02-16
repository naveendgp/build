export const config = {
    BASE_URL: 'https://api.otterlaundry.com',
    HEADERS: {
        'Content-Type': 'application/json',
    },
    TEST_PHONE: '9999999999',
    TEST_OTP: '1234',
    TEST_FCM: 'test_fcm_token_load_test',

    options: {
        stages: [
            { duration: '30s', target: 20 },
            { duration: '1m', target: 20 },
            { duration: '30s', target: 0 }, 
        ],
        thresholds: {
            http_req_duration: ['p(95)<500'], 
            http_req_failed: ['rate<0.01'],
        },
    },
};
