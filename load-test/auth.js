import http from 'k6/http';
import { check, sleep } from 'k6';
import { config } from './config.js';

export function loginUser() {
    const url = `${config.BASE_URL}/user/auth`;
    const verifyUrl = `${config.BASE_URL}/user/verify-otp`;

    let res = http.post(url, JSON.stringify({ phoneNumber: config.TEST_PHONE }), { headers: config.HEADERS });

    check(res, {
        'user status is 201 or 200': (r) => r.status === 201 || r.status === 200,
    });

    const payload = JSON.stringify({
        phoneNumber: config.TEST_PHONE,
        otp: config.TEST_OTP,
        fcm_token: config.TEST_FCM,
    });

    res = http.post(verifyUrl, payload, { headers: config.HEADERS });

    const isSuccessful = check(res, {
        'user login successful': (r) => r.status === 201 || r.status === 200,
        'user has token': (r) => r.json('data.token') !== undefined,
    });

    if (!isSuccessful) {
        console.error(`User Login failed: ${res.body}`);
        return null;
    }

    return res.json('data.token');
}

export function loginVendor() {
    const url = `${config.BASE_URL}/vendor/login`;
    const verifyUrl = `${config.BASE_URL}/vendor/verify-otp`;

    
    let res = http.post(url, JSON.stringify({ phone: config.TEST_PHONE }), { headers: config.HEADERS });

    check(res, {
        'vendor status is 201 or 200': (r) => r.status === 201 || r.status === 200,
    });

    const payload = JSON.stringify({
        phone: config.TEST_PHONE,
        otp: config.TEST_OTP,
        fcm_token: config.TEST_FCM,
    });

    res = http.post(verifyUrl, payload, { headers: config.HEADERS });

    const isSuccessful = check(res, {
        'vendor login successful': (r) => r.status === 201 || r.status === 200,
        'vendor has token': (r) => r.json('data.token') !== undefined,
    });

    if (!isSuccessful) {
        console.log('Vendor login failed, trying registration...');
       
    }

    return res.json('data.token');
}
