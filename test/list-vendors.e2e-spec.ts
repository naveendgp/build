import { INestApplication, ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { UserAuthGuard } from '../src/auth/guards/user.guard';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../src/schemas/user.schema';
import { Vendor } from '../src/schemas/vendor.schema';

/**
 * E2E tests for the vendor listing API.
 * These tests stub the auth guard to avoid session token requirements and
 * set a known user phone so list-vendors can run without mutating the DB.
 */
describe('User /vendors (e2e)', () => {
  let app: INestApplication;
  const serviceA = '0000000000000000000000a1'; // e.g., wash & fold
  const serviceB = '0000000000000000000000b2'; // e.g., iron

  const vendorsFixture = [
    {
      _id: 'v1',
      shop_name: 'Express Wash',
      address: { latitude: 12.9, longitude: 77.6 },
      services_offered: [
        {
          service_id: serviceA,
          service_name: 'Wash & Fold',
          is_express_available: true,
          express_time: 4,
          standard_time: 24,
          is_offer: false,
          offer_percentage: 0,
          offer_max_cap: 0,
          items: [
            { item_price: 100, express_price: 30, is_active: true },
            { item_price: 120, express_price: 40, is_active: true },
          ],
        },
      ],
    },
    {
      _id: 'v2',
      shop_name: 'Standard Wash',
      address: { latitude: 12.91, longitude: 77.61 },
      services_offered: [
        {
          service_id: serviceA,
          service_name: 'Wash & Fold',
          is_express_available: false,
          express_time: 6,
          standard_time: 36,
          is_offer: false,
          offer_percentage: 0,
          offer_max_cap: 0,
          items: [
            { item_price: 80, express_price: 0, is_active: true },
            { item_price: 90, express_price: 0, is_active: true },
          ],
        },
      ],
    },
    {
      _id: 'v3',
      shop_name: 'Offer Press',
      address: { latitude: 12.905, longitude: 77.605 },
      services_offered: [
        {
          service_id: serviceB,
          service_name: 'Iron',
          is_express_available: true,
          express_time: 3,
          standard_time: 12,
          is_offer: true,
          offer_percentage: 15,
          offer_max_cap: 50,
          items: [
            {
              item_price: 60,
              express_price: 15,
              is_active: true,
              discount_percentage: 15,
            },
          ],
        },
      ],
    },
  ];

  const aggregateStub = async (pipeline: any[]) => {
    let result = [...vendorsFixture];

    // Service filter
    const serviceMatch = pipeline.find(
      (stage: any) =>
        stage?.$match && stage.$match['services_offered.service_id'],
    );
    if (serviceMatch) {
      const ids: string[] = serviceMatch.$match[
        'services_offered.service_id'
      ].$in.map((x: any) => x.toString());
      result = result.filter((v) =>
        v.services_offered.some((s: any) => ids.includes(s.service_id)),
      );
    }

    // Express filter
    const expressMatch = pipeline.find(
      (stage: any) =>
        stage?.$match &&
        stage.$match['services_offered.is_express_available'] === true,
    );
    if (expressMatch) {
      result = result.filter((v) =>
        v.services_offered.some(
          (s: any) =>
            s.is_express_available &&
            s.items.some((i: any) => i.express_price > 0 && i.is_active),
        ),
      );
    }

    // Offer filter
    const offerMatch = pipeline.find(
      (stage: any) => stage?.$match && stage.$match.$or,
    );
    if (offerMatch) {
      result = result.filter((v) =>
        v.services_offered.some(
          (s: any) => s.is_offer || (s.offer_percentage ?? 0) > 0,
        ),
      );
    }

    return result;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(UserAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = { phone: '+919876543210' }; // existing seeded user with default address
          return true;
        },
      })
      .overrideProvider(getModelToken(User.name))
      .useValue({
        findOne: () => ({
          lean: async () => ({
            phone: '+919876543210',
            addresses: [
              {
                is_default: true,
                latitude: 12.91,
                longitude: 77.61,
              },
            ],
          }),
        }),
      })
      .overrideProvider(getModelToken(Vendor.name))
      .useValue({
        aggregate: aggregateStub,
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('returns vendors without times/prices when no service is selected', async () => {
    const res = await request(app.getHttpServer())
      .post('/user/vendors')
      .query({ page: 1, limit: 5 })
      .send({});

    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    expect(res.body?.status).toBe(true);

    const vendors = res.body?.data?.vendors ?? [];
    vendors.forEach((v: any) => {
      expect(v.min_express_time).toBeNull();
      expect(v.min_standard_time).toBeNull();
      expect(v.startsAt).toBeNull();
    });
  });

  it('filters express vendors when isExpress=true', async () => {
    const res = await request(app.getHttpServer())
      .post('/user/vendors')
      .query({ page: 1, limit: 5 })
      .send({ isExpress: true });

    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    expect(res.body?.status).toBe(true);

    const vendors = res.body?.data?.vendors ?? [];
    vendors.forEach((v: any) => {
      expect(v.is_express).toBe(true);
    });
  });

  it('filters offer vendors when isOffer=true', async () => {
    const res = await request(app.getHttpServer())
      .post('/user/vendors')
      .query({ page: 1, limit: 5 })
      .send({ isOffer: true });

    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    expect(res.body?.status).toBe(true);

    const vendors = res.body?.data?.vendors ?? [];
    vendors.forEach((v: any) => {
      expect(v.is_offer).toBe(true);
    });
  });

  it('sorts by cost within a selected service', async () => {
    const res = await request(app.getHttpServer())
      .post('/user/vendors')
      .query({ page: 1, limit: 10 })
      .send({
        serviceFilters: [serviceA],
        sort: ['cost-low-to-high'],
      });

    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    expect(res.body?.status).toBe(true);

    const vendors = res.body?.data?.vendors ?? [];
    // Ensure ordering is non-decreasing; skips if only 0/1 vendors.
    for (let i = 1; i < vendors.length; i++) {
      const prev = vendors[i - 1]?.startsAt;
      const curr = vendors[i]?.startsAt;
      if (prev != null && curr != null) {
        expect(curr).toBeGreaterThanOrEqual(prev);
      }
    }
  });
});
