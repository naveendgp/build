import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { Model, Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserDocument } from '../src/schemas/user.schema';
import { Vendor, VendorDocument } from '../src/schemas/vendor.schema';
import { Order, OrderDocument } from '../src/schemas/order.schema';
import { Review, ReviewDocument } from '../src/schemas/reviews.schema';
import { JwtHelper } from '../src/auth/jwt.helper';

describe('Review APIs (e2e) - Simplified Test Suite', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let userModel: Model<UserDocument>;
  let vendorModel: Model<VendorDocument>;
  let orderModel: Model<OrderDocument>;
  let reviewModel: Model<ReviewDocument>;
  let jwtHelper: JwtHelper;

  let testUser1: any;
  let testVendor: any;
  let deliveredOrder: any;
  let user1Token: string;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userModel = moduleFixture.get<Model<UserDocument>>(
      getModelToken(User.name),
    );
    vendorModel = moduleFixture.get<Model<VendorDocument>>(
      getModelToken(Vendor.name),
    );
    orderModel = moduleFixture.get<Model<OrderDocument>>(
      getModelToken(Order.name),
    );
    reviewModel = moduleFixture.get<Model<ReviewDocument>>(
      getModelToken(Review.name),
    );
    jwtHelper = moduleFixture.get<JwtHelper>(JwtHelper);

    // Clean database before tests
    await userModel.deleteMany({});
    await vendorModel.deleteMany({});
    await orderModel.deleteMany({});
    await reviewModel.deleteMany({});

    // Create test data
    testUser1 = await userModel.create({
      phone: '+1234567890',
      name: 'Test User 1',
      fcm_token: 'fcm_token_1',
    });

    testVendor = await vendorModel.create({
      shop_name: 'Test Laundry',
      phone: '+1234567892',
      email: 'test@laundry.com',
      status: 'active',
      address: {
        address_line1: '123 Test St',
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
      operating_hours: {
        monday: { open: '09:00', close: '18:00' },
      },
      services_offered: [],
      rating: {
        average: 0,
        total_reviews: 0,
        reviews: [],
      },
      total_orders: 0,
    });

    const serviceId = new Types.ObjectId();
    const itemId = new Types.ObjectId();

    deliveredOrder = await orderModel.create({
      order_number: 1,
      user_id: testUser1._id,
      vendor_id: testVendor._id,
      pickup_address_id: testUser1._id,
      delivery_address_id: testUser1._id,
      items: [
        {
          service_id: serviceId,
          service_name: 'Wash and Fold',
          item_id: itemId,
          item_name: 'Clothes',
          quantity: 2,
          price_per_item: 100,
          total_price: 200,
        },
      ],
      total_amount: 200,
      currency: 'INR',
      status: 'delivered',
      payment_status: 'paid',
      rating_given: false,
    });

    // Generate token for authentication
    user1Token = jwtHelper.sign({ phone: testUser1.phone }, 'user', {
      expiresIn: '24h',
    });
  });

  afterAll(async () => {
    // Clean up test data
    await userModel.deleteMany({});
    await vendorModel.deleteMany({});
    await orderModel.deleteMany({});
    await reviewModel.deleteMany({});
    await app.close();
  });

  describe('POST /user/create-review', () => {
    it('should create a review successfully', () => {
      return request(app.getHttpServer())
        .post('/user/create-review')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          orderId: deliveredOrder._id.toString(),
          rating: 5,
          comment: 'Great service!',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe(true);
          expect(res.body.message).toBe('Review submitted successfully');
          expect(res.body.data).toHaveProperty('reviewId');
        });
    });

    it('should prevent creating duplicate review', () => {
      return request(app.getHttpServer())
        .post('/user/create-review')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          orderId: deliveredOrder._id.toString(),
          rating: 4,
          comment: 'Another review',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe(false);
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/user/create-review')
        .send({
          orderId: deliveredOrder._id.toString(),
          rating: 5,
          comment: 'No auth',
        })
        .expect(401);
    });
  });

  describe('GET /user/my-reviews', () => {
    it('should get user reviews', () => {
      return request(app.getHttpServer())
        .get('/user/my-reviews')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(true);
          expect(res.body.data).toHaveProperty('reviews');
          expect(Array.isArray(res.body.data.reviews)).toBe(true);
        });
    });
  });

  describe('GET /user/vendor/:vendorId/reviews', () => {
    it('should get vendor reviews', () => {
      return request(app.getHttpServer())
        .get(`/user/vendor/${testVendor._id}/reviews`)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(true);
          if (res.body.data) {
            expect(res.body.data).toHaveProperty('reviews');
            expect(Array.isArray(res.body.data.reviews)).toBe(true);
          }
        });
    });

    it('should be accessible without authentication', () => {
      return request(app.getHttpServer())
        .get(`/user/vendor/${testVendor._id}/reviews`)
        .expect(200);
    });
  });
});
