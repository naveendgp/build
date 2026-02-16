import { group, sleep } from 'k6';
import { config } from './config.js'; // Imports BASE_URL and credentials
import { loginUser, loginVendor } from './auth.js';
import { UserApi } from './user-api.js';
import { VendorApi } from './vendor-api.js';

// Stress Test Configuration
// Goal: Push the system beyond normal load to find breaking points.
export const options = {
    stages: [
        { duration: '1m', target: 50 },  // Ramp up to 50 users quickly
        { duration: '3m', target: 50 },  // Substained load
        { duration: '1m', target: 100 }, // Ramp up to 100 users (Stress)
        { duration: '2m', target: 100 }, // Sustain stress
        { duration: '1m', target: 0 },   // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<1000'], // Relaxed threshold for stress (1s)
        http_req_failed: ['rate<0.05'],    // Allow up to 5% failure under stress
    },
};

export default function () {

    // Critical Path 1: User Browsing (High Volume)
    // Users constantly checking for vendors and services
    group('Critical: User Search Flow', function () {
        const userToken = loginUser();
        if (userToken) {
            const userApi = new UserApi(userToken);

            // The most hit endpoint usually
            userApi.listVendorsPublic();
            sleep(1);

            // authenticated listing
            userApi.listVendors();
            sleep(1);
        }
    });

    // Critical Path 2: Vendor Order Management (High Importance)
    // Vendors refreshing their dashboard
    group('Critical: Vendor Dashboard', function () {
        const vendorToken = loginVendor();
        if (vendorToken) {
            const vendorApi = new VendorApi(vendorToken);

            vendorApi.viewOrders();
            sleep(1);

            vendorApi.getNotifications();
            sleep(1);
        }
    });
}
