import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { Model, Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Vendor, VendorDocument } from '../src/schemas/vendor.schema';
import { Order, OrderDocument } from '../src/schemas/order.schema';
import { JwtHelper } from '../src/auth/jwt.helper';

describe('Vendor Orders API (e2e) - Timestamp Logs Test', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let vendorModel: Model<VendorDocument>;
  let orderModel: Model<OrderDocument>;
  let jwtHelper: JwtHelper;

  let testVendor: any;
  let vendorToken: string;

  // Test orders with different statuses and timestamps
  let acceptedOrder: any;
  let processingOrder: any;
  let pickedUpOrder: any;
  let processedOrder: any;
  let deliveredOrder: any;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    vendorModel = moduleFixture.get<Model<VendorDocument>>(
      getModelToken(Vendor.name),
    );
    orderModel = moduleFixture.get<Model<OrderDocument>>(
      getModelToken(Order.name),
    );
    jwtHelper = moduleFixture.get<JwtHelper>(JwtHelper);

    // Clean test data (only delete test data we create)
    await vendorModel.deleteMany({ phone: '+9999999999' });
    await orderModel.deleteMany({ order_number: { $gte: 999900 } });

    // Create test vendor
    testVendor = await vendorModel.create({
      phone: '+9999999999',
      shop_name: 'Test Laundry Shop',
      email: 'testvendor@test.com',
      status: 'active',
      address: {
        address_line1: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '12345',
        latitude: 40.7128,
        longitude: -74.006,
      },
      shop_status: {
        status: 'open',
        close_time: null,
      },
      services_offered: [],
      rating: {
        average: 0,
        total_reviews: 0,
        reviews: [],
      },
      total_orders: 0,
      wallet: {
        balance: 0,
        currency: 'INR',
      },
    });

    // Generate vendor token
    vendorToken = jwtHelper.sign({ phone: testVendor.phone }, 'vendor', {
      expiresIn: '1h',
    });

    // Create test orders with different statuses and timestamps
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    // Order 1: Accepted (has accepted_at timestamp, no picked_up_at)
    acceptedOrder = await orderModel.create({
      order_number: 999901,
      vendor_id: testVendor._id,
      user_id: new Types.ObjectId(),
      status: 'accepted',
      status_type: 2,
      status_timestamps: new Map([
        ['accepted_at', oneHourAgo],
      ]),
      user_address: {
        address_line1: 'User Address 1',
        city: 'User City',
        state: 'User State',
        pincode: '54321',
      },
      vendor_address: testVendor.address,
      items: [],
      total_amount: 100,
      currency: 'INR',
      payment_status: 'pending',
      trip_type: 1,
    });

    // Order 2: Processing (has accepted_at and processing_at, no picked_up_at)
    processingOrder = await orderModel.create({
      order_number: 999902,
      vendor_id: testVendor._id,
      user_id: new Types.ObjectId(),
      status: 'processing',
      status_type: 10,
      status_timestamps: new Map([
        ['accepted_at', twoHoursAgo],
        ['processing_at', oneHourAgo],
      ]),
      user_address: {
        address_line1: 'User Address 2',
        city: 'User City',
        state: 'User State',
        pincode: '54321',
      },
      vendor_address: testVendor.address,
      items: [],
      total_amount: 200,
      currency: 'INR',
      payment_status: 'pending',
      trip_type: 1,
    });

    // Order 3: Picked Up (has accepted_at and picked_up_at)
    pickedUpOrder = await orderModel.create({
      order_number: 999903,
      vendor_id: testVendor._id,
      user_id: new Types.ObjectId(),
      status: 'picked_up',
      status_type: 6,
      status_timestamps: new Map([
        ['accepted_at', twoHoursAgo],
        ['picked_up_at', oneHourAgo],
      ]),
      user_address: {
        address_line1: 'User Address 3',
        city: 'User City',
        state: 'User State',
        pincode: '54321',
      },
      vendor_address: testVendor.address,
      items: [],
      total_amount: 300,
      currency: 'INR',
      payment_status: 'pending',
      trip_type: 1,
    });

    // Order 4: Processed (has accepted_at, picked_up_at, processed_at, and out_for_delivery_at)
    processedOrder = await orderModel.create({
      order_number: 999904,
      vendor_id: testVendor._id,
      user_id: new Types.ObjectId(),
      status: 'processed',
      status_type: 11,
      status_timestamps: new Map([
        ['accepted_at', new Date(now.getTime() - 3 * 60 * 60 * 1000)],
        ['picked_up_at', new Date(now.getTime() - 2 * 60 * 60 * 1000)],
        ['processed_at', oneHourAgo],
        ['out_for_delivery_at', oneHourAgo], // Set when vendor marks complete
      ]),
      user_address: {
        address_line1: 'User Address 4',
        city: 'User City',
        state: 'User State',
        pincode: '54321',
      },
      vendor_address: testVendor.address,
      items: [],
      total_amount: 400,
      currency: 'INR',
      payment_status: 'pending',
      trip_type: 1,
    });

    // Order 5: Processed without out_for_delivery_at (edge case - order marked complete but timestamp not set)
    const processedOrderNoPickup = await orderModel.create({
      order_number: 999905,
      vendor_id: testVendor._id,
      user_id: new Types.ObjectId(),
      status: 'processed',
      status_type: 11,
      status_timestamps: new Map([
        ['accepted_at', twoHoursAgo],
        ['processed_at', oneHourAgo],
        // No out_for_delivery_at
      ]),
      user_address: {
        address_line1: 'User Address 5',
        city: 'User City',
        state: 'User State',
        pincode: '54321',
      },
      vendor_address: testVendor.address,
      items: [],
      total_amount: 500,
      currency: 'INR',
      payment_status: 'pending',
      trip_type: 1,
    });

    // Order 6: Delivered (for status 4 test)
    deliveredOrder = await orderModel.create({
      order_number: 999906,
      vendor_id: testVendor._id,
      user_id: new Types.ObjectId(),
      status: 'delivered',
      status_type: 9,
      status_timestamps: new Map([
        ['accepted_at', new Date(now.getTime() - 4 * 60 * 60 * 1000)],
        ['picked_up_at', new Date(now.getTime() - 3 * 60 * 60 * 1000)],
        ['processed_at', new Date(now.getTime() - 2 * 60 * 60 * 1000)],
        ['delivered_at', oneHourAgo],
      ]),
      user_address: {
        address_line1: 'User Address 6',
        city: 'User City',
        state: 'User State',
        pincode: '54321',
      },
      vendor_address: testVendor.address,
      items: [],
      total_amount: 600,
      currency: 'INR',
      payment_status: 'paid',
      trip_type: 1,
    });

    // Order 7: Processing with picked_up_at (driver picked up, delivered to vendor, now processing)
    const processingWithPickup = await orderModel.create({
      order_number: 999907,
      vendor_id: testVendor._id,
      user_id: new Types.ObjectId(),
      status: 'processing',
      status_type: 10,
      status_timestamps: new Map([
        ['accepted_at', new Date(now.getTime() - 3 * 60 * 60 * 1000)],
        ['picked_up_at', new Date(now.getTime() - 2 * 60 * 60 * 1000)],
        ['processing_at', oneHourAgo],
      ]),
      user_address: {
        address_line1: 'User Address 7',
        city: 'User City',
        state: 'User State',
        pincode: '54321',
      },
      vendor_address: testVendor.address,
      items: [],
      total_amount: 700,
      currency: 'INR',
      payment_status: 'pending',
      trip_type: 1,
    });

    // Order 8: Accepted with no timestamps at all (edge case)
    const acceptedNoTimestamps = await orderModel.create({
      order_number: 999908,
      vendor_id: testVendor._id,
      user_id: new Types.ObjectId(),
      status: 'accepted',
      status_type: 2,
      status_timestamps: new Map([]), // No timestamps
      user_address: {
        address_line1: 'User Address 8',
        city: 'User City',
        state: 'User State',
        pincode: '54321',
      },
      vendor_address: testVendor.address,
      items: [],
      total_amount: 800,
      currency: 'INR',
      payment_status: 'pending',
      trip_type: 1,
    });

    // Order 9: Picked up with only picked_up_at (no accepted_at - edge case)
    const pickedUpOnly = await orderModel.create({
      order_number: 999909,
      vendor_id: testVendor._id,
      user_id: new Types.ObjectId(),
      status: 'picked_up',
      status_type: 6,
      status_timestamps: new Map([
        ['picked_up_at', oneHourAgo], // Only picked_up_at, no accepted_at
      ]),
      user_address: {
        address_line1: 'User Address 9',
        city: 'User City',
        state: 'User State',
        pincode: '54321',
      },
      vendor_address: testVendor.address,
      items: [],
      total_amount: 900,
      currency: 'INR',
      payment_status: 'pending',
      trip_type: 1,
    });

    // Order 10: Processed with processing_at but no out_for_delivery_at (edge case)
    const processedWithProcessing = await orderModel.create({
      order_number: 999910,
      vendor_id: testVendor._id,
      user_id: new Types.ObjectId(),
      status: 'processed',
      status_type: 11,
      status_timestamps: new Map([
        ['accepted_at', twoHoursAgo],
        ['processing_at', oneHourAgo],
        ['processed_at', new Date(now.getTime() - 30 * 60 * 1000)],
        // No out_for_delivery_at
      ]),
      user_address: {
        address_line1: 'User Address 10',
        city: 'User City',
        state: 'User State',
        pincode: '54321',
      },
      vendor_address: testVendor.address,
      items: [],
      total_amount: 1000,
      currency: 'INR',
      payment_status: 'pending',
      trip_type: 1,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await vendorModel.deleteMany({ phone: '+9999999999' });
    await orderModel.deleteMany({ order_number: { $gte: 999900 } });
    await app.close();
  });

  describe('GET /vendor/orders - Status 2 (accepted/processing/picked_up)', () => {
    it('should return orders with status 2 and correct timestamp logs', async () => {
      const response = await request(app.getHttpServer())
        .get('/vendor/orders?status=2')
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      expect(response.body.status).toBe(true);
      expect(response.body.data.orders).toBeDefined();
      expect(Array.isArray(response.body.data.orders)).toBe(true);

      // Should include accepted, processing, and picked_up orders
      const orderNumbers = response.body.data.orders.map(
        (o: any) => o.order_number,
      );
      expect(orderNumbers).toContain(999901); // accepted
      expect(orderNumbers).toContain(999902); // processing (no picked_up)
      expect(orderNumbers).toContain(999903); // picked_up
      expect(orderNumbers).toContain(999907); // processing (with picked_up)
      expect(orderNumbers).toContain(999908); // accepted (no timestamps)
      expect(orderNumbers).toContain(999909); // picked_up (only picked_up_at)

      // Verify timestamp logs for each order
      const acceptedOrderResponse = response.body.data.orders.find(
        (o: any) => o.order_number === 999901,
      );
      expect(acceptedOrderResponse).toBeDefined();
      expect(acceptedOrderResponse.updateLogs).toBeDefined();
      expect(Array.isArray(acceptedOrderResponse.updateLogs)).toBe(true);
      // Should have "Pending rider" since no picked_up_at
      const pendingRiderLog = acceptedOrderResponse.updateLogs.find(
        (log: any) => log.statusStr === 'Pending rider',
      );
      expect(pendingRiderLog).toBeDefined();

      const processingOrderResponse = response.body.data.orders.find(
        (o: any) => o.order_number === 999902,
      );
      expect(processingOrderResponse).toBeDefined();
      expect(processingOrderResponse.updateLogs).toBeDefined();
      // Should have "Pending rider" since no picked_up_at
      const processingPendingRider = processingOrderResponse.updateLogs.find(
        (log: any) => log.statusStr === 'Pending rider',
      );
      expect(processingPendingRider).toBeDefined();

      const pickedUpOrderResponse = response.body.data.orders.find(
        (o: any) => o.order_number === 999903,
      );
      expect(pickedUpOrderResponse).toBeDefined();
      expect(pickedUpOrderResponse.updateLogs).toBeDefined();
      // Should have picked_up timestamp and PHONE + OTP
      const pickedUpLog = pickedUpOrderResponse.updateLogs.find(
        (log: any) => log.statusStr === 'picked_up',
      );
      expect(pickedUpLog).toBeDefined();
      expect(pickedUpLog.timestamp).toBeDefined();

      const phoneLog = pickedUpOrderResponse.updateLogs.find(
        (log: any) => log.statusStr === 'PHONE',
      );
      expect(phoneLog).toBeDefined();

      const otpLog = pickedUpOrderResponse.updateLogs.find(
        (log: any) => log.statusStr === 'OTP',
      );
      expect(otpLog).toBeDefined();

      // Verify accepted_at and processing_at are NOT in updateLogs
      const acceptedTimestamp = acceptedOrderResponse.updateLogs.find(
        (log: any) => log.statusStr === 'accepted',
      );
      expect(acceptedTimestamp).toBeUndefined();

      const processingTimestamp = processingOrderResponse.updateLogs.find(
        (log: any) => log.statusStr === 'processing',
      );
      expect(processingTimestamp).toBeUndefined();

      // Test Order 7: Processing with picked_up_at should show picked_up + PHONE + OTP
      const processingWithPickupResponse = response.body.data.orders.find(
        (o: any) => o.order_number === 999907,
      );
      expect(processingWithPickupResponse).toBeDefined();
      const processingPickupLog = processingWithPickupResponse.updateLogs.find(
        (log: any) => log.statusStr === 'picked_up',
      );
      expect(processingPickupLog).toBeDefined();
      expect(processingPickupLog.timestamp).toBeDefined();
      const processingPhoneLog = processingWithPickupResponse.updateLogs.find(
        (log: any) => log.statusStr === 'PHONE',
      );
      expect(processingPhoneLog).toBeDefined();

      // Test Order 8: Accepted with no timestamps should show "Pending rider"
      const acceptedNoTimestampsResponse = response.body.data.orders.find(
        (o: any) => o.order_number === 999908,
      );
      expect(acceptedNoTimestampsResponse).toBeDefined();
      const noTimestampPendingRider =
        acceptedNoTimestampsResponse.updateLogs.find(
          (log: any) => log.statusStr === 'Pending rider',
        );
      expect(noTimestampPendingRider).toBeDefined();

      // Test Order 9: Picked up with only picked_up_at should show picked_up + PHONE + OTP
      const pickedUpOnlyResponse = response.body.data.orders.find(
        (o: any) => o.order_number === 999909,
      );
      expect(pickedUpOnlyResponse).toBeDefined();
      const pickedUpOnlyLog = pickedUpOnlyResponse.updateLogs.find(
        (log: any) => log.statusStr === 'picked_up',
      );
      expect(pickedUpOnlyLog).toBeDefined();
      expect(pickedUpOnlyLog.timestamp).toBeDefined();
    });
  });

  describe('GET /vendor/orders - Status 3 (processed)', () => {
    it('should return processed orders with correct timestamp logs', async () => {
      const response = await request(app.getHttpServer())
        .get('/vendor/orders?status=3')
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      expect(response.body.status).toBe(true);
      expect(response.body.data.orders).toBeDefined();

      // Should include processed orders
      const orderNumbers = response.body.data.orders.map(
        (o: any) => o.order_number,
      );
      expect(orderNumbers).toContain(999904); // processed with picked_up_at
      expect(orderNumbers).toContain(999905); // processed without picked_up_at

      // Order with out_for_delivery_at should have PHONE and OTP
      const processedWithPickup = response.body.data.orders.find(
        (o: any) => o.order_number === 999904,
      );
      expect(processedWithPickup).toBeDefined();
      expect(processedWithPickup.updateLogs).toBeDefined();

      const phoneLog = processedWithPickup.updateLogs.find(
        (log: any) => log.statusStr === 'PHONE',
      );
      expect(phoneLog).toBeDefined();
      expect(phoneLog.timestamp).toBeDefined(); // Should have timestamp from out_for_delivery_at

      const otpLog = processedWithPickup.updateLogs.find(
        (log: any) => log.statusStr === 'OTP',
      );
      expect(otpLog).toBeDefined();
      expect(otpLog.timestamp).toBeDefined(); // Should have timestamp from out_for_delivery_at

      // Order without out_for_delivery_at should have "Pending rider"
      const processedNoPickup = response.body.data.orders.find(
        (o: any) => o.order_number === 999905,
      );
      expect(processedNoPickup).toBeDefined();
      expect(processedNoPickup.updateLogs).toBeDefined();

      const pendingRiderLog = processedNoPickup.updateLogs.find(
        (log: any) => log.statusStr === 'Pending rider',
      );
      expect(pendingRiderLog).toBeDefined();

      // Test Order 10: Processed with processing_at but no out_for_delivery_at should show "Pending rider"
      const processedWithProcessingResponse = response.body.data.orders.find(
        (o: any) => o.order_number === 999910,
      );
      expect(processedWithProcessingResponse).toBeDefined();
      expect(processedWithProcessingResponse.updateLogs).toBeDefined();
      const processedPendingRider =
        processedWithProcessingResponse.updateLogs.find(
          (log: any) => log.statusStr === 'Pending rider',
        );
      expect(processedPendingRider).toBeDefined();
      // Should NOT have PHONE/OTP since no out_for_delivery_at
      const processedPhone = processedWithProcessingResponse.updateLogs.find(
        (log: any) => log.statusStr === 'PHONE',
      );
      expect(processedPhone).toBeUndefined();
    });
  });

  describe('GET /vendor/orders - Specific Order by ID', () => {
    it('should return single order with timestamp logs when order_id provided', async () => {
      const response = await request(app.getHttpServer())
        .get(
          `/vendor/orders?order_id=${pickedUpOrder._id.toString()}&status=2`,
        )
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      expect(response.body.status).toBe(true);
      expect(response.body.data.orders).toBeDefined();
      expect(response.body.data.orders.length).toBe(1);
      expect(response.body.data.orders[0].order_number).toBe(999903);
      expect(response.body.data.orders[0].updateLogs).toBeDefined();
      expect(Array.isArray(response.body.data.orders[0].updateLogs)).toBe(
        true,
      );
    });
  });

  describe('GET /vendor/orders - No Status Filter', () => {
    it('should return all orders with default timestamp logs', async () => {
      const response = await request(app.getHttpServer())
        .get('/vendor/orders')
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      expect(response.body.status).toBe(true);
      expect(response.body.data.orders).toBeDefined();
      expect(response.body.data.orders.length).toBeGreaterThan(0);

      // All orders should have updateLogs
      response.body.data.orders.forEach((order: any) => {
        expect(order.updateLogs).toBeDefined();
        expect(Array.isArray(order.updateLogs)).toBe(true);
      });
    });
  });

  describe('GET /vendor/orders - Pagination', () => {
    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/vendor/orders?status=2&page=1&limit=2')
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      expect(response.body.status).toBe(true);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(2);
      expect(response.body.data.orders.length).toBeLessThanOrEqual(2);
      expect(response.body.data.totalPages).toBeGreaterThan(0);
    });
  });

  describe('GET /vendor/orders - Authentication', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/vendor/orders?status=2')
        .expect(401);
    });
  });

  describe('GET /vendor/orders - Active Vendor Only', () => {
    it('should only allow active vendors to view orders', async () => {
      // Create inactive vendor
      const inactiveVendor = await vendorModel.create({
        phone: '+8888888888',
        shop_name: 'Inactive Vendor',
        email: 'inactive@test.com',
        status: 'inactive',
        address: {
          address_line1: '123 Test',
          city: 'Test',
          state: 'Test',
          pincode: '12345',
        },
        shop_status: {
          status: 'open',
        },
        services_offered: [],
        rating: { average: 0, total_reviews: 0, reviews: [] },
        total_orders: 0,
        wallet: { balance: 0, currency: 'INR' },
      });

      const inactiveToken = jwtHelper.sign(
        { phone: inactiveVendor.phone },
        'vendor',
        { expiresIn: '1h' },
      );

      await request(app.getHttpServer())
        .get('/vendor/orders?status=2')
        .set('Authorization', `Bearer ${inactiveToken}`)
        .expect(404);

      // Cleanup
      await vendorModel.deleteOne({ _id: inactiveVendor._id });
    });
  });
});

