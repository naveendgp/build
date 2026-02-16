import { group } from 'k6';
import { config } from './config.js';
import { loginUser, loginVendor } from './auth.js';
import { UserApi } from './user-api.js';    
import { VendorApi } from './vendor-api.js';

export const options = config.options;

export default function () {

    group('User Flow', function () {
        const userToken = loginUser();
        if (userToken) {
            const userApi = new UserApi(userToken);

            userApi.getMe();
            userApi.updateProfile();
            userApi.getAddresses();

            userApi.listVendorsPublic();
            userApi.listVendors(); 

            userApi.listServices();
            userApi.getNotifications();
            userApi.getOrderHistory();
        }
    });

    group('Vendor Flow', function () {
        const vendorToken = loginVendor();
        if (vendorToken) {
            const vendorApi = new VendorApi(vendorToken);

            vendorApi.getMe();
            vendorApi.servicesMaster();
            vendorApi.viewOrders();
            vendorApi.getNotifications();

            vendorApi.updateOperatingHours();
            vendorApi.updateShopStatus();
        }
    });
}
