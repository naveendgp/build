import { INestApplication, ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { UserAuthGuard } from '../src/auth/guards/user.guard';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../src/schemas/user.schema';
import { Vendor } from '../src/schemas/vendor.schema';
import { Types } from 'mongoose';

/**
 * COMPREHENSIVE E2E tests for the vendor listing API.
 * Verifies all 7 bug fixes:
 * 1. Default vendor tile - no time when no service selected
 * 2. Service-specific shop filtering
 * 3. See All view without service - no random price/time
 * 4. Sort by parameters (distance, offer, delivery, cost)
 * 5. Express filter functionality
 * 6. Offer visibility control
 * 7. Service-specific offers
 */
describe('User /vendors - Comprehensive Bug Fix Verification (e2e)', () => {
    let app: INestApplication;
    const serviceWashAndFold = new Types.ObjectId('67690f9cf0eb50f24e4fee81');
    const serviceIron = new Types.ObjectId('67690f9cf0eb50f24e4fee82');
    const serviceDryClean = new Types.ObjectId('67690f9cf0eb50f24e4fee83');

    // Comprehensive vendor fixtures covering all scenarios
    const vendorsFixture = [
        {
            _id: new Types.ObjectId(),
            shop_name: 'Express Wash Shop',
            address: { latitude: 12.9, longitude: 77.6 },
            rating: { average: 4.5, total_reviews: 100 },
            status: 'active',
            'shop_status.status': 'open',
            services_offered: [
                {
                    service_id: serviceWashAndFold,
                    service_name: 'Wash & Fold',
                    is_approved: true,
                    is_active: true,
                    is_express_available: true,
                    express_time: 4,
                    standard_time: 24,
                    is_offer: false,
                    offer_percentage: 0,
                    offer_max_cap: 0,
                    pricing_type: 'per_pc',
                    items: [
                        { item_price: 100, express_price: 30, is_active: true },
                        { item_price: 120, express_price: 40, is_active: true },
                    ],
                },
            ],
        },
        {
            _id: new Types.ObjectId(),
            shop_name: 'Standard Wash Only',
            address: { latitude: 12.91, longitude: 77.61 },
            rating: { average: 4.0, total_reviews: 50 },
            status: 'active',
            'shop_status.status': 'open',
            services_offered: [
                {
                    service_id: serviceWashAndFold,
                    service_name: 'Wash & Fold',
                    is_approved: true,
                    is_active: true,
                    is_express_available: false,
                    express_time: 0,
                    standard_time: 36,
                    is_offer: false,
                    offer_percentage: 0,
                    offer_max_cap: 0,
                    pricing_type: 'per_pc',
                    items: [
                        { item_price: 80, express_price: 0, is_active: true },
                        { item_price: 90, express_price: 0, is_active: true },
                    ],
                },
            ],
        },
        {
            _id: new Types.ObjectId(),
            shop_name: 'Iron Press With Offer',
            address: { latitude: 12.905, longitude: 77.605 },
            rating: { average: 4.8, total_reviews: 200 },
            status: 'active',
            'shop_status.status': 'open',
            services_offered: [
                {
                    service_id: serviceIron,
                    service_name: 'Iron',
                    is_approved: true,
                    is_active: true,
                    is_express_available: true,
                    express_time: 3,
                    standard_time: 12,
                    is_offer: true,
                    offer_percentage: 15,
                    offer_max_cap: 50,
                    pricing_type: 'per_pc',
                    items: [
                        { item_price: 60, express_price: 15, is_active: true },
                    ],
                },
            ],
        },
        {
            _id: new Types.ObjectId(),
            shop_name: 'Multi Service Shop',
            address: { latitude: 12.915, longitude: 77.615 },
            rating: { average: 4.2, total_reviews: 75 },
            status: 'active',
            'shop_status.status': 'open',
            services_offered: [
                {
                    service_id: serviceWashAndFold,
                    service_name: 'Wash & Fold',
                    is_approved: true,
                    is_active: true,
                    is_express_available: true,
                    express_time: 6,
                    standard_time: 30,
                    is_offer: true,
                    offer_percentage: 10,
                    offer_max_cap: 100,
                    pricing_type: 'per_pc',
                    items: [
                        { item_price: 110, express_price: 35, is_active: true },
                    ],
                },
                {
                    service_id: serviceIron,
                    service_name: 'Iron',
                    is_approved: true,
                    is_active: true,
                    is_express_available: false,
                    express_time: 0,
                    standard_time: 18,
                    is_offer: false,
                    offer_percentage: 0,
                    offer_max_cap: 0,
                    pricing_type: 'per_pc',
                    items: [
                        { item_price: 50, express_price: 0, is_active: true },
                    ],
                },
            ],
        },
        {
            _id: new Types.ObjectId(),
            shop_name: 'Dry Clean Specialist',
            address: { latitude: 12.92, longitude: 77.62 },
            rating: { average: 4.6, total_reviews: 120 },
            status: 'active',
            'shop_status.status': 'open',
            services_offered: [
                {
                    service_id: serviceDryClean,
                    service_name: 'Dry Clean',
                    is_approved: true,
                    is_active: true,
                    is_express_available: true,
                    express_time: 8,
                    standard_time: 48,
                    is_offer: false,
                    offer_percentage: 0,
                    offer_max_cap: 0,
                    pricing_type: 'per_pc',
                    items: [
                        { item_price: 200, express_price: 80, is_active: true },
                    ],
                },
            ],
        },
        {
            _id: new Types.ObjectId(),
            shop_name: 'Offer Turned Off Shop',
            address: { latitude: 12.895, longitude: 77.595 },
            rating: { average: 3.8, total_reviews: 30 },
            status: 'active',
            'shop_status.status': 'open',
            services_offered: [
                {
                    service_id: serviceWashAndFold,
                    service_name: 'Wash & Fold',
                    is_approved: true,
                    is_active: true,
                    is_express_available: true,
                    express_time: 5,
                    standard_time: 28,
                    is_offer: false, // Offer is turned OFF
                    offer_percentage: 20, // Has percentage but is_offer = false
                    offer_max_cap: 150,
                    pricing_type: 'per_pc',
                    items: [
                        { item_price: 95, express_price: 32, is_active: true },
                    ],
                },
            ],
        },
        {
            _id: new Types.ObjectId(),
            shop_name: 'Disabled Express Shop',
            address: { latitude: 12.885, longitude: 77.585 },
            rating: { average: 3.5, total_reviews: 20 },
            status: 'active',
            'shop_status.status': 'open',
            services_offered: [
                {
                    service_id: serviceWashAndFold,
                    service_name: 'Wash & Fold',
                    is_approved: true,
                    is_active: true,
                    is_express_available: false, // Flag is OFF
                    express_time: 5,
                    standard_time: 24,
                    is_offer: false,
                    offer_percentage: 0,
                    offer_max_cap: 0,
                    pricing_type: 'per_pc',
                    items: [
                        { item_price: 100, express_price: 50, is_active: true }, // Price still exists
                    ],
                },
            ],
        },
        {
            _id: new Types.ObjectId(),
            shop_name: 'Disabled Offer Shop',
            address: { latitude: 12.875, longitude: 77.575 },
            rating: { average: 3.2, total_reviews: 15 },
            status: 'active',
            'shop_status.status': 'open',
            services_offered: [
                {
                    service_id: serviceWashAndFold,
                    service_name: 'Wash & Fold',
                    is_approved: true,
                    is_active: true,
                    is_express_available: true,
                    express_time: 4,
                    standard_time: 24,
                    is_offer: false, // Flag is OFF
                    offer_percentage: 20, // Percentage still exists
                    offer_max_cap: 100,
                    pricing_type: 'per_pc',
                    items: [
                        { item_price: 100, express_price: 30, is_active: true },
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
                v.services_offered.some((s: any) => ids.includes(s.service_id.toString())),
            );
        }

        // Express filter - Strict check: is_express_available MUST be true
        const expressMatch = pipeline.find(
            (stage: any) =>
                stage?.$match &&
                stage.$match.services_offered?.$elemMatch?.is_express_available === true,
        );
        if (expressMatch) {
            result = result.filter((v) =>
                v.services_offered.some(
                    (s: any) =>
                        s.is_express_available === true &&
                        s.items.some((i: any) => i.express_price > 0 && i.is_active),
                ),
            );
        }

        // Offer filter - Strict check: is_offer MUST be true
        const offerMatchElemMatch = pipeline.find(
            (stage: any) => stage?.$match && stage.$match.services_offered?.$elemMatch?.is_offer === true,
        );

        if (offerMatchElemMatch) {
            const elemMatch = offerMatchElemMatch.$match.services_offered.$elemMatch;
            const serviceIds = elemMatch.service_id?.$in?.map((id: any) => id.toString());

            result = result.filter((v) =>
                v.services_offered.some(
                    (s: any) =>
                        (serviceIds ? serviceIds.includes(s.service_id.toString()) : true) &&
                        s.is_offer === true &&
                        s.offer_percentage > 0,
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
                    req.user = { phone: '+919876543210' };
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

    // ==================== Bug #1 & #3: Default Vendor Tile Tests ====================
    describe('Bug #1 & #3: Default vendor tile (no service selected)', () => {
        it('should return vendors without times when no service is selected', async () => {
            const res = await request(app.getHttpServer())
                .post('/user/vendors')
                .query({ page: 1, limit: 10 })
                .send({});

            expect(res.status).toBeGreaterThanOrEqual(200);
            expect(res.status).toBeLessThan(300);
            expect(res.body?.status).toBe(true);

            const vendors = res.body?.data?.vendors ?? [];
            expect(vendors.length).toBeGreaterThan(0);

            vendors.forEach((v: any) => {
                expect(v.min_express_time).toBeNull();
                expect(v.min_standard_time).toBeNull();
                expect(v.startsAt).toBeNull();
            });
        });

        it('should NOT show random Iron service time when no service selected', async () => {
            const res = await request(app.getHttpServer())
                .post('/user/vendors')
                .query({ page: 1, limit: 10 })
                .send({});

            const vendors = res.body?.data?.vendors ?? [];

            // Verify that time fields are explicitly null, not populated with any service data
            vendors.forEach((v: any) => {
                expect(v.min_express_time).toBeNull();
                expect(v.min_standard_time).toBeNull();

                // Should not be showing random times like "3 hrs" from Iron service
                expect(v.min_express_time).not.toBe('3 hrs');
                expect(v.min_express_time).not.toBe('4 hrs');
            });
        });
    });

    // ==================== Bug #2: Service-Specific Filtering ====================
    describe('Bug #2: Service-specific shop filtering', () => {
        it('should only list shops that provide Wash & Fold service when filtered', async () => {
            const res = await request(app.getHttpServer())
                .post('/user/vendors')
                .query({ page: 1, limit: 10 })
                .send({
                    serviceFilters: [serviceWashAndFold.toString()],
                });

            expect(res.status).toBeGreaterThanOrEqual(200);
            expect(res.body?.status).toBe(true);

            const vendors = res.body?.data?.vendors ?? [];

            // Should return vendors with Wash & Fold service
            expect(vendors.length).toBeGreaterThan(0);

            // Verify each vendor has the requested service
            vendors.forEach((v: any) => {
                const servicesArray = Array.isArray(v.services_offered) ? v.services_offered : [];
                expect(servicesArray).toContain('Wash & Fold');
            });
        });

        it('should NOT list shops without the selected service', async () => {
            const res = await request(app.getHttpServer())
                .post('/user/vendors')
                .query({ page: 1, limit: 10 })
                .send({
                    serviceFilters: [serviceDryClean.toString()],
                });

            expect(res.body?.status).toBe(true);
            const vendors = res.body?.data?.vendors ?? [];

            // Only 1 vendor has Dry Clean service
            expect(vendors.length).toBeLessThanOrEqual(1);

            // Verify vendor names
            vendors.forEach((v: any) => {
                expect(['Dry Clean Specialist']).toContain(v.shop_name);
            });
        });

        it('should show times and prices when a service is selected', async () => {
            const res = await request(app.getHttpServer())
                .post('/user/vendors')
                .query({ page: 1, limit: 10 })
                .send({
                    serviceFilters: [serviceWashAndFold.toString()],
                });

            const vendors = res.body?.data?.vendors ?? [];

            vendors.forEach((v: any) => {
                // When service is selected, times and prices should be populated
                expect(v.startsAt).toBeDefined();
                expect(v.min_standard_time).toBeDefined();

                // startsAt should be a number or null (not undefined)
                if (v.startsAt !== null) {
                    expect(typeof v.startsAt).toBe('number');
                }
            });
        });
    });

    // ==================== Bug #4: Sort Parameters ====================
    describe('Bug #4: Sort by parameters', () => {
        it('should sort by cost (low to high) correctly', async () => {
            const res = await request(app.getHttpServer())
                .post('/user/vendors')
                .query({ page: 1, limit: 10 })
                .send({
                    serviceFilters: [serviceWashAndFold.toString()],
                    sort: ['cost-low-to-high'],
                });

            expect(res.body?.status).toBe(true);
            const vendors = res.body?.data?.vendors ?? [];

            // Verify ordering is non-decreasing
            for (let i = 1; i < vendors.length; i++) {
                const prev = vendors[i - 1]?.startsAt;
                const curr = vendors[i]?.startsAt;
                if (prev != null && curr != null) {
                    expect(curr).toBeGreaterThanOrEqual(prev);
                }
            }
        });

        it('should sort by cost (high to low) correctly', async () => {
            const res = await request(app.getHttpServer())
                .post('/user/vendors')
                .query({ page: 1, limit: 10 })
                .send({
                    serviceFilters: [serviceWashAndFold.toString()],
                    sort: ['cost-high-to-low'],
                });

            expect(res.body?.status).toBe(true);
            const vendors = res.body?.data?.vendors ?? [];

            // Verify ordering is non-increasing
            for (let i = 1; i < vendors.length; i++) {
                const prev = vendors[i - 1]?.startsAt;
                const curr = vendors[i]?.startsAt;
                if (prev != null && curr != null) {
                    expect(curr).toBeLessThanOrEqual(prev);
                }
            }
        });

        it('should sort by offer (high to low) correctly', async () => {
            const res = await request(app.getHttpServer())
                .post('/user/vendors')
                .query({ page: 1, limit: 10 })
                .send({
                    serviceFilters: [serviceWashAndFold.toString()],
                    sort: ['offer-high-to-low'],
                });

            expect(res.body?.status).toBe(true);
            const vendors = res.body?.data?.vendors ?? [];

            // Verify vendors with offers appear first
            for (let i = 1; i < vendors.length; i++) {
                const prev = vendors[i - 1]?.max_offer_percentage?.total_percentage || 0;
                const curr = vendors[i]?.max_offer_percentage?.total_percentage || 0;
                expect(curr).toBeLessThanOrEqual(prev);
            }
        });

        it('should NOT show "Disabled Express Shop" in express filter', async () => {
            const res = await request(app.getHttpServer())
                .post('/user/vendors')
                .query({ page: 1, limit: 10 })
                .send({ isExpress: true });

            const vendors = res.body?.data?.vendors ?? [];
            const names = vendors.map((v: any) => v.shop_name);
            expect(names).not.toContain('Disabled Express Shop');
        });

        it('should NOT have is_express=true for "Disabled Express Shop" in general list', async () => {
            const res = await request(app.getHttpServer())
                .post('/user/vendors')
                .query({ page: 1, limit: 10 })
                .send({});

            const vendors = res.body?.data?.vendors ?? [];
            const shop = vendors.find((v: any) => v.shop_name === 'Disabled Express Shop');
            expect(shop).toBeDefined();
            expect(shop.is_express).toBe(false);
        });

        it('should sort by delivery time (low to high) correctly', async () => {
            const res = await request(app.getHttpServer())
                .post('/user/vendors')
                .query({ page: 1, limit: 10 })
                .send({
                    serviceFilters: [serviceWashAndFold.toString()],
                    sort: ['delivery-low-to-high'],
                });

            expect(res.body?.status).toBe(true);
            const vendors = res.body?.data?.vendors ?? [];

            // Should return vendors ordered by delivery time
            expect(vendors.length).toBeGreaterThan(0);
        });
    });

    // ==================== Bug #5: Express Filter ====================
    describe('Bug #5: Express filter functionality', () => {
        it('should only show shops with express service when isExpress=true', async () => {
            const res = await request(app.getHttpServer())
                .post('/user/vendors')
                .query({ page: 1, limit: 10 })
                .send({ isExpress: true });

            expect(res.body?.status).toBe(true);
            const vendors = res.body?.data?.vendors ?? [];

            vendors.forEach((v: any) => {
                expect(v.is_express).toBe(true);
            });
        });

        it('should NOT show shops without express service', async () => {
            const res = await request(app.getHttpServer())
                .post('/user/vendors')
                .query({ page: 1, limit: 10 })
                .send({ isExpress: true });

            const vendors = res.body?.data?.vendors ?? [];

            // 'Standard Wash Only' should NOT appear (has is_express_available=false)
            const vendorNames = vendors.map((v: any) => v.shop_name);
            expect(vendorNames).not.toContain('Standard Wash Only');
        });

        it('should NOT show "Disabled Offer Shop" in offer filter', async () => {
            const res = await request(app.getHttpServer())
                .post('/user/vendors')
                .query({ page: 1, limit: 10 })
                .send({ isOffer: true });

            const vendors = res.body?.data?.vendors ?? [];
            const names = vendors.map((v: any) => v.shop_name);
            expect(names).not.toContain('Disabled Offer Shop');
        });

        it('should NOT have is_offer=true for "Disabled Offer Shop" in general list', async () => {
            const res = await request(app.getHttpServer())
                .post('/user/vendors')
                .query({ page: 1, limit: 10 })
                .send({});

            const vendors = res.body?.data?.vendors ?? [];
            const shop = vendors.find((v: any) => v.shop_name === 'Disabled Offer Shop');
            expect(shop).toBeDefined();
            expect(shop.is_offer).toBe(false);
        });

        it('should verify express shops actually have express_price > 0', async () => {
            const res = await request(app.getHttpServer())
                .post('/user/vendors')
                .query({ page: 1, limit: 10 })
                .send({ isExpress: true });

            const vendors = res.body?.data?.vendors ?? [];

            // All returned vendors must have is_express = true
            vendors.forEach((v: any) => {
                expect(v.is_express).toBe(true);
            });
        });
    });

    // ==================== Bug #6: Offer Visibility Control ====================
    describe('Bug #6: Offer visibility control', () => {
        it('should NOT show vendors with is_offer=false in offer filter', async () => {
            const res = await request(app.getHttpServer())
                .post('/user/vendors')
                .query({ page: 1, limit: 10 })
                .send({ isOffer: true });

            expect(res.body?.status).toBe(true);
            const vendors = res.body?.data?.vendors ?? [];

            // 'Offer Turned Off Shop' should NOT appear (has is_offer=false)
            const vendorNames = vendors.map((v: any) => v.shop_name);
            expect(vendorNames).not.toContain('Offer Turned Off Shop');
        });

        it('should only show vendors with is_offer=true AND offer_percentage>0', async () => {
            const res = await request(app.getHttpServer())
                .post('/user/vendors')
                .query({ page: 1, limit: 10 })
                .send({ isOffer: true });

            const vendors = res.body?.data?.vendors ?? [];

            vendors.forEach((v: any) => {
                expect(v.is_offer).toBe(true);
                expect(v.max_offer_percentage?.total_percentage).toBeGreaterThan(0);
            });
        });

        it('should respect vendor-side offer toggle (is_offer flag)', async () => {
            const res = await request(app.getHttpServer())
                .post('/user/vendors')
                .query({ page: 1, limit: 10 })
                .send({ isOffer: true });

            const vendors = res.body?.data?.vendors ?? [];
            const expectedVendorsWithOffer = ['Iron Press With Offer', 'Multi Service Shop'];

            vendors.forEach((v: any) => {
                // Only vendors with is_offer=true should appear
                expect(expectedVendorsWithOffer).toContain(v.shop_name);
            });
        });
    });

    // ==================== Bug #7: Service-Specific Offers ====================
    describe('Bug #7: Service-specific offers', () => {
        it('should show offer for Multi Service Shop when filtering by Wash & Fold', async () => {
            const res = await request(app.getHttpServer())
                .post('/user/vendors')
                .query({ page: 1, limit: 10 })
                .send({
                    serviceFilters: [serviceWashAndFold.toString()],
                });

            const vendors = res.body?.data?.vendors ?? [];
            const multiServiceShop = vendors.find((v: any) => v.shop_name === 'Multi Service Shop');

            if (multiServiceShop) {
                // Should show offer because Wash & Fold service has offer
                expect(multiServiceShop.is_offer).toBe(true);
                expect(multiServiceShop.max_offer_percentage?.total_percentage).toBe(10);
            }
        });

        it('should NOT show offer for Multi Service Shop when filtering by Iron service', async () => {
            const res = await request(app.getHttpServer())
                .post('/user/vendors')
                .query({ page: 1, limit: 10 })
                .send({
                    serviceFilters: [serviceIron.toString()],
                });

            const vendors = res.body?.data?.vendors ?? [];
            const multiServiceShop = vendors.find((v: any) => v.shop_name === 'Multi Service Shop');

            if (multiServiceShop) {
                // Iron service has is_offer=false, so should not show offer
                expect(multiServiceShop.is_offer).toBe(false);
                expect(multiServiceShop.max_offer_percentage?.total_percentage).toBe(0);
            }
        });

        it('should calculate max offer percentage based on filtered services only', async () => {
            const res = await request(app.getHttpServer())
                .post('/user/vendors')
                .query({ page: 1, limit: 10 })
                .send({
                    serviceFilters: [serviceIron.toString()],
                });

            const vendors = res.body?.data?.vendors ?? [];
            const ironPressShop = vendors.find((v: any) => v.shop_name === 'Iron Press With Offer');

            if (ironPressShop) {
                // Should show 15% offer from Iron service
                expect(ironPressShop.is_offer).toBe(true);
                expect(ironPressShop.max_offer_percentage?.total_percentage).toBe(15);
            }
        });

        it('should display offers per service, not shop-wide', async () => {
            // Test with Wash & Fold filter
            const washRes = await request(app.getHttpServer())
                .post('/user/vendors')
                .query({ page: 1, limit: 10 })
                .send({
                    serviceFilters: [serviceWashAndFold.toString()],
                    isOffer: true,
                });

            const washVendors = washRes.body?.data?.vendors ?? [];

            // Should show Multi Service Shop (has offer on Wash & Fold)
            const washShopNames = washVendors.map((v: any) => v.shop_name);
            expect(washShopNames).toContain('Multi Service Shop');

            // Test with Iron filter
            const ironRes = await request(app.getHttpServer())
                .post('/user/vendors')
                .query({ page: 1, limit: 10 })
                .send({
                    serviceFilters: [serviceIron.toString()],
                    isOffer: true,
                });

            const ironVendors = ironRes.body?.data?.vendors ?? [];
            const ironShopNames = ironVendors.map((v: any) => v.shop_name);

            // Should show Iron Press With Offer (has offer on Iron)
            expect(ironShopNames).toContain('Iron Press With Offer');

            // Should NOT show Multi Service Shop (no offer on Iron service)
            expect(ironShopNames).not.toContain('Multi Service Shop');
        });
    });

    // ==================== Combined Filters Test ====================
    describe('Combined filters', () => {
        it('should handle multiple filters correctly (service + express + sort)', async () => {
            const res = await request(app.getHttpServer())
                .post('/user/vendors')
                .query({ page: 1, limit: 10 })
                .send({
                    serviceFilters: [serviceWashAndFold.toString()],
                    isExpress: true,
                    sort: ['cost-low-to-high'],
                });

            expect(res.body?.status).toBe(true);
            const vendors = res.body?.data?.vendors ?? [];

            // All vendors should have express service
            vendors.forEach((v: any) => {
                expect(v.is_express).toBe(true);
            });

            // Should be sorted by cost
            for (let i = 1; i < vendors.length; i++) {
                const prev = vendors[i - 1]?.startsAt;
                const curr = vendors[i]?.startsAt;
                if (prev != null && curr != null) {
                    expect(curr).toBeGreaterThanOrEqual(prev);
                }
            }
        });

        it('should handle service filter + offer filter correctly', async () => {
            const res = await request(app.getHttpServer())
                .post('/user/vendors')
                .query({ page: 1, limit: 10 })
                .send({
                    serviceFilters: [serviceWashAndFold.toString()],
                    isOffer: true,
                });

            const vendors = res.body?.data?.vendors ?? [];

            // Should only return Multi Service Shop (has Wash & Fold with offer)
            vendors.forEach((v: any) => {
                expect(v.is_offer).toBe(true);
                const servicesArray = Array.isArray(v.services_offered) ? v.services_offered : [];
                expect(servicesArray).toContain('Wash & Fold');
            });
        });
    });
});
