import http from 'k6/http';
import { check } from 'k6';
import { config } from './config.js';

export class VendorApi {
    constructor(token) {
        this.params = {
            headers: {
                ...config.HEADERS,
                Authorization: `Bearer ${token}`,
            },
        };
    }

    getMe() {
        const res = http.get(`${config.BASE_URL}/vendor/profile`, this.params);
        check(res, {
            'getVendorProfile status is 200': (r) => r.status === 200,
        });
        return res;
    }

    updateOperatingHours() {
        const payload = JSON.stringify({
            monday: { open: "09:00", close: "18:00" },
            tuesday: { open: "09:00", close: "18:00" }
        });

        const res = http.post(`${config.BASE_URL}/vendor/operating-hours`, payload, this.params);
        check(res, {
            'updateOperatingHours status is 200 or 201': (r) => r.status === 200 || r.status === 201,
        });
        return res;
    }

    viewOrders() {
        const res = http.get(`${config.BASE_URL}/vendor/orders?page=1&limit=10`, this.params);
        check(res, {
            'viewOrders status is 200': (r) => r.status === 200,
        });
        return res;
    }

    servicesMaster() {
        const res = http.get(`${config.BASE_URL}/vendor/list-services-master`, this.params);
        check(res, {
            'servicesMaster status is 200': (r) => r.status === 200
        });
        return res;
    }

    updateShopStatus() {
        const res = http.get(`${config.BASE_URL}/vendor/status-update`, this.params);
        check(res, {
            'updateShopStatus status is 200': (r) => r.status === 200
        });
        return res;
    }

    getNotifications() {
        const res = http.get(`${config.BASE_URL}/vendor/notifications?page=1&limit=10`, this.params);
        check(res, {
            'getVendorNotifications status is 200': (r) => r.status === 200
        });
        return res;
    }

}
