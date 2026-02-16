import http from 'k6/http';
import { check } from 'k6';
import { config } from './config.js';

export class UserApi {
    constructor(token) {
        this.params = {
            headers: {
                ...config.HEADERS,
                Authorization: `Bearer ${token}`,
            },
        };
    }

    getMe() {
        const res = http.get(`${config.BASE_URL}/user/me`, this.params);
        check(res, {
            'getMe status is 200': (r) => r.status === 200,
        });
        return res;
    }

    updateProfile() {
        const payload = JSON.stringify({
            name: 'otter',
            email: 'otter@test.com',
        });
        const res = http.post(`${config.BASE_URL}/user/update-profile`, payload, this.params);
        check(res, {
            'updateProfile status is 201 or 200': (r) => r.status === 201 || r.status === 200,
        });
        return res;
    }

    getAddresses() {
        const res = http.get(`${config.BASE_URL}/user/addresses`, this.params);
        check(res, {
            'getAddresses status is 200': (r) => r.status === 200,
        });
        return res;
    }

    listVendors() {
      
        const payload = JSON.stringify({
            page: 1,
            limit: 10
        });
        const res = http.post(`${config.BASE_URL}/user/vendors?page=1&limit=10`, payload, this.params);

        check(res, {
            'listVendors status is 200/201 or 400 (if no address)': (r) => r.status === 200 || r.status === 201 || r.status === 400,
        });
        return res;
    }

    listVendorsPublic() {
        const payload = JSON.stringify({
            page: 1,
            limit: 10
        });
        const res = http.post(`${config.BASE_URL}/user/vendors-public?page=1&limit=10`, payload, this.params);
        check(res, {
            'listVendorsPublic status is 200 or 201': (r) => r.status === 200 || r.status === 201,
            'response has vendors': (r) => r.json('data.vendors') !== undefined
        });
        return res;
    }

    listServices() {
        const res = http.get(`${config.BASE_URL}/user/list-services`, this.params);
        check(res, {
            'listServices status is 200': (r) => r.status === 200,
        });
        return res;
    }

    getNotifications() {
        const res = http.get(`${config.BASE_URL}/user/notifications?page=1&limit=10`, this.params);
        check(res, {
            'getNotifications status is 200': (r) => r.status === 200
        });
        return res;
    }

    getOrderHistory() {
        const res = http.get(`${config.BASE_URL}/user/orders?page=1&limit=10`, this.params);
        check(res, {
            'getOrderHistory status is 200': (r) => r.status === 200
        });
        return res;
    }
}
