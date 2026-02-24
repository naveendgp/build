import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, AdminRole, OrderStatus, VendorStatus } from '@prisma/client';

@Injectable()
export class AdminService {
    constructor(private readonly prisma: PrismaService) { }

    async findByEmail(email: string) {
        return this.prisma.admin.findFirst({ where: { email } });
    }

    async findById(id: string) {
        return this.prisma.admin.findUnique({ where: { id } });
    }

    async updateLastLogin(id: string) {
        return this.prisma.admin.update({
            where: { id },
            data: { lastLogin: new Date() },
        });
    }

    async create(adminData: any) {
        return this.prisma.admin.create({ data: adminData });
    }

    async fixAdminPermissions() {
        const email = 'admin@otter.com';
        const admin = await this.prisma.admin.findFirst({ where: { email } });
        if (!admin) {
            throw new Error(`Admin ${email} not found`);
        }

        const saved = await this.prisma.admin.update({
            where: { id: admin.id },
            data: {
                role: AdminRole.SUPER_ADMIN,
                permissions: [
                    'ORDER_READ', 'ORDER_CANCEL',
                    'USER_READ', 'USER_WRITE',
                    'PARTNER_READ', 'PARTNER_WRITE',
                    'RIDER_READ', 'RIDER_WRITE',
                    'PAYMENT_READ', 'PAYMENT_WRITE',
                    'ADMIN_MANAGE', 'DASHBOARD_READ',
                    'OFFER_READ', 'OFFER_WRITE',
                    'SUPERADMIN', '*'
                ],
            },
        });

        return {
            message: 'Permissions fixed successfully',
            admin: {
                email: saved.email,
                role: saved.role,
                permissions: saved.permissions
            }
        };
    }

    // --- Unified Aggregation Pipeline Helpers ---
    private buildOrderWhereRules(filters: { fromDate?: string; toDate?: string; status?: string }): Prisma.OrderWhereInput {
        const where: Prisma.OrderWhereInput = {};
        if (filters.fromDate && filters.toDate) {
            where.createdAt = {
                gte: new Date(filters.fromDate),
                lte: new Date(filters.toDate),
            };
        }
        if (filters.status) {
            where.status = filters.status as OrderStatus;
        }
        return where;
    }

    private buildRevenueWhereRules(filters: { fromDate?: string; toDate?: string }): Prisma.OrderWhereInput {
        const where: Prisma.OrderWhereInput = {
            status: { notIn: ['cancelled', 'rejected'] }
        };
        if (filters.fromDate && filters.toDate) {
            where.createdAt = {
                gte: new Date(filters.fromDate),
                lte: new Date(filters.toDate),
            };
        }
        return where;
    }

    async getDashboardStats(fromDate?: string, toDate?: string) {
        console.log('[Dashboard] Fetching stats for:', { fromDate, toDate });

        // Single Source of Truth for Dashboard Queries
        const baseOrderWhere = this.buildOrderWhereRules({ fromDate, toDate });
        const baseRevenueWhere = this.buildRevenueWhereRules({ fromDate, toDate });

        const [
            totalOrders,
            totalRevenueResult,
            activeUsers,
            activePartners,
            pendingPartners,
            disabledPartners,
            activeRiders,
            disabledRiders,
            recentOrders,
            orderStatusCounts,
            refundsResult
        ] = await Promise.all([
            // Orders
            this.prisma.order.count({ where: baseOrderWhere }),
            // Revenue (GMV) and Platform Profit
            this.prisma.order.aggregate({
                where: baseRevenueWhere,
                _sum: {
                    totalAmount: true,
                    pdPlatformRevenue: true,
                    amountToVendorAfterCommission: true,
                    pdOfferDiscountAmount: true
                },
            }),
            // Users
            this.prisma.user.count({ where: { status: 'active' } }),
            // Partners
            this.prisma.vendor.count({ where: { status: 'active' } }),
            this.prisma.vendor.count({ where: { status: 'pending' } }),
            this.prisma.vendor.count({ where: { status: 'inactive' } }),
            // Riders
            this.prisma.deliveryPerson.count({ where: { status: 'active' } }),
            this.prisma.deliveryPerson.count({ where: { status: 'inactive' } }),
            // Recent Orders
            this.prisma.order.findMany({
                where: baseOrderWhere,
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                    user: { select: { name: true } },
                    vendor: { select: { shopName: true } },
                },
            }),
            // Order Status
            this.prisma.order.groupBy({
                by: ['status'],
                where: baseOrderWhere,
                _count: { status: true },
            }),
            // Refunds (Cancelled + Paid)
            this.prisma.order.aggregate({
                where: {
                    ...baseOrderWhere,
                    status: 'cancelled',
                    paymentStatus: 'paid',
                },
                _sum: { totalAmount: true },
            }),
        ]);

        console.log('[Dashboard] Total Revenue Aggregate Result:', JSON.stringify(totalRevenueResult, null, 2));
        console.log('[Dashboard] Refunds Result:', JSON.stringify(refundsResult, null, 2));

        const totalRevenue = totalRevenueResult._sum.totalAmount || 0;
        const netPlatformRevenue = totalRevenueResult._sum.pdPlatformRevenue || 0;
        const totalVendorPayouts = totalRevenueResult._sum.amountToVendorAfterCommission || 0;
        const totalOfferCost = totalRevenueResult._sum.pdOfferDiscountAmount || 0;
        const totalRefunds = refundsResult._sum.totalAmount || 0;

        // Map status counts
        const statusMap = orderStatusCounts.reduce((acc, curr) => {
            acc[curr.status] = curr._count.status;
            return acc;
        }, {} as Record<string, number>);

        const completedOrders = statusMap['delivered'] || 0;
        const cancelledOrders = statusMap['cancelled'] || 0;
        const acceptedOrders = statusMap['accepted'] || 0;
        const unacceptedOrders = statusMap['unaccepted'] || 0;
        const pickedUpOrders = statusMap['picked_up'] || 0;
        const outForDeliveryOrders = statusMap['out_for_delivery'] || 0;
        // In Progress = Total - (Completed + Cancelled) roughly, or sum of other states
        const inProgressOrders = totalOrders - completedOrders - cancelledOrders;

        return {
            orders: {
                total: totalOrders,
                completed: completedOrders,
                cancelled: cancelledOrders,
                inProgress: inProgressOrders,
                accepted: acceptedOrders,
                unaccepted: unacceptedOrders,
                pickedUp: pickedUpOrders,
                outForDelivery: outForDeliveryOrders,
            },
            payments: {
                totalAmount: totalRevenue,
                revenue: totalRevenue - totalRefunds,
                netPlatformRevenue: netPlatformRevenue,
                totalVendorPayouts: totalVendorPayouts,
                totalOfferCost: totalOfferCost,
                refunds: totalRefunds,
            },
            partners: {
                active: activePartners,
                pendingApproval: pendingPartners,
                disabled: disabledPartners,
            },
            riders: {
                active: activeRiders,
                disabled: disabledRiders,
            },
            series: await this.getGraphData(fromDate, toDate),
        };
    }

    async getPaymentConfig() {
        const config = await this.prisma.appConfig.findFirst();
        return {
            gstPercent: config?.gst ?? 18,
            platformFeePercent: config?.platformFee ?? 2,
            deliveryFee: config?.deliveryFee ?? 40,
            vendorCommission: config?.vendorCommission ?? 0,
            additionalFeeFlat: config?.additionalFeeFlat ?? 0,
            additionalFeeName: config?.additionalFeeName ?? "Additional Fee",
        };
    }

    async updatePaymentConfig(data: {
        gstPercent: number;
        platformFeePercent: number;
        deliveryFee: number;
        vendorCommission: number;
        additionalFeeFlat: number;
        additionalFeeName: string;
    }) {
        const existing = await this.prisma.appConfig.findFirst();

        if (existing) {
            return this.prisma.appConfig.update({
                where: { id: existing.id },
                data: {
                    gst: data.gstPercent,
                    platformFee: data.platformFeePercent,
                    deliveryFee: data.deliveryFee,
                    vendorCommission: data.vendorCommission,
                    additionalFeeFlat: data.additionalFeeFlat,
                    additionalFeeName: data.additionalFeeName,
                },
            });
        } else {
            return this.prisma.appConfig.create({
                data: {
                    configKey: 'GLOBAL_CONFIG',
                    configName: 'Global App Configuration',
                    gst: data.gstPercent,
                    platformFee: data.platformFeePercent,
                    deliveryFee: data.deliveryFee,
                    vendorCommission: data.vendorCommission,
                    additionalFeeFlat: data.additionalFeeFlat,
                    additionalFeeName: data.additionalFeeName,
                },
            });
        }
    }

    async getServiceAreas() {
        return this.prisma.serviceArea.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }

    async createServiceArea(data: { name: string; polygon: any; reason?: string; createdBy?: string }) {
        // For now, we only support one active area or check logic.
        // We will just create a new one. The frontend sends a single area usually.
        // If we want to replace the old one:
        // await this.prisma.serviceArea.deleteMany({});

        return this.prisma.serviceArea.create({
            data: {
                name: data.name || 'Service Zone',
                polygon: data.polygon,
                isActive: true,
                createdBy: data.createdBy,
            }
        });
    }

    async deleteServiceArea(id: string) {
        return this.prisma.serviceArea.delete({
            where: { id }
        });
    }

    private async getGraphData(fromDate?: string, toDate?: string) {
        // Group by day using raw SQL for complex aggregation
        const dateConditions: string[] = [];
        const params: any[] = [];

        if (fromDate && toDate) {
            dateConditions.push(`created_at >= $1 AND created_at <= $2`);
            params.push(new Date(fromDate), new Date(toDate));
        }

        const whereClause = dateConditions.length > 0 ? `WHERE ${dateConditions.join(' AND ')}` : '';

        const steps: any[] = await this.prisma.$queryRawUnsafe(`
            SELECT
                TO_CHAR(created_at, 'YYYY-MM-DD') as date,
                COUNT(*)::int as orders,
                SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END)::int as completed,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END)::int as cancelled,
                COALESCE(SUM(CASE WHEN payment_status = 'paid' OR status = 'delivered' THEN total_amount ELSE 0 END), 0)::float as revenue
            FROM orders
            ${whereClause}
            GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
            ORDER BY date ASC
        `, ...params);

        return steps.map(s => ({
            date: s.date,
            orders: s.orders,
            completed: s.completed,
            cancelled: s.cancelled,
            revenue: s.revenue
        }));
    }
    // --- Order Management ---
    async getOrders(page: number, limit: number, status?: string, search?: string, fromDate?: string, toDate?: string) {
        const skip = (page - 1) * limit;
        const where = this.buildOrderWhereRules({ fromDate, toDate, status });
        if (search) {
            const orConditions: Prisma.OrderWhereInput[] = [
                { userAddressLine1: { contains: search, mode: 'insensitive' } },
            ];

            // Attempt to search by Order Number if search is numeric
            if (!isNaN(Number(search))) {
                orConditions.push({ orderNumber: Number(search) });
            }

            where.OR = orConditions;
        }

        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    user: { select: { name: true, phone: true } },
                    vendor: { select: { shopName: true } },
                    items: true,
                },
            }),
            this.prisma.order.count({ where }),
        ]);

        const mappedOrders = orders.map((order: any) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            userName: order.user?.name || 'Unknown User',
            userContact: order.user?.phone || 'N/A',
            shopName: order.vendor?.shopName || 'Unknown Shop',
            serviceType: order.items?.[0]?.serviceName || 'Service', // Fallback
            status: order.status.toUpperCase(),
            totalAmount: order.totalAmount || 0,
            createdAt: order.createdAt,
        }));

        return {
            data: mappedOrders,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getOrderById(id: string) {
        return this.prisma.order.findUnique({
            where: { id },
            include: {
                user: true,
                vendor: true,
                items: {
                    include: {
                        service: true,
                        item: true,
                    },
                },
            },
        });
    }

    async cancelOrder(id: string, reason: string, refund: boolean) {
        const order = await this.prisma.order.findUnique({ where: { id } });
        if (!order) throw new Error('Order not found');

        const statusTimestamps = (order.statusTimestamps as Record<string, any>) || {};
        statusTimestamps['cancelled_at'] = new Date().toISOString();

        const orderNotes = reason ? `${order.orderNotes || ''} [Cancelled: ${reason}]` : order.orderNotes;

        // Logic for refund would go here if refund === true

        return this.prisma.order.update({
            where: { id },
            data: {
                status: 'cancelled',
                statusTimestamps,
                orderNotes,
            },
        });
    }

    async updateOrderStatus(id: string, status: string) {
        const order = await this.prisma.order.findUnique({ where: { id } });
        if (!order) throw new Error('Order not found');

        const statusTimestamps = (order.statusTimestamps as Record<string, any>) || {};
        statusTimestamps[`${status.toLowerCase()}_at`] = new Date().toISOString();

        return this.prisma.order.update({
            where: { id },
            data: {
                status: status as OrderStatus,
                statusTimestamps,
            }
        });
    }

    // --- User Management ---
    async getUsers(page: number, limit: number, search?: string) {
        const skip = (page - 1) * limit;
        const where: Prisma.UserWhereInput = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    addresses: true,
                    _count: {
                        select: { orders: true }
                    }
                },
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            data: users.map(user => this.mapUser(user)),
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async getUserOrders(userId: string, page: number, limit: number) {
        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: { items: true },
            }),
            this.prisma.order.count({ where: { userId } }),
        ]);

        const mappedOrders = orders.map((order: any) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            serviceType: order.items?.[0]?.serviceName || 'Service',
            status: order.status.toUpperCase(),
            totalAmount: order.totalAmount || 0,
            createdAt: order.createdAt,
        }));

        return {
            data: mappedOrders,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async getUserById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                addresses: true,
                _count: {
                    select: { orders: true }
                }
            },
        });
        if (!user) return null;
        return this.mapUser(user);
    }

    private mapUser(user: any) {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            contact: user.phone || 'N/A', // Map phone to contact
            status: user.status ? user.status.toUpperCase() : 'ACTIVE',
            isActive: user.status === 'active',
            ordersCount: user._count?.orders || 0, // Placeholder — needs order aggregation
            totalSpent: 0, // Needs order aggregation
            joinedAt: user.createdAt,
            addresses: user.addresses || [],
        };
    }

    async toggleUserStatus(id: string, status: string) {
        return this.prisma.user.update({
            where: { id },
            data: { status: status as any },
        });
    }

    // --- Vendor Management ---
    async getVendors(page: number, limit: number, status?: string, search?: string) {
        const skip = (page - 1) * limit;
        const where: Prisma.VendorWhereInput = {};

        if (status) {
            if (status === 'APPROVED') where.status = 'active';
            else if (status === 'PENDING') where.status = 'pending';
            else if (status === 'SUSPENDED') where.status = 'inactive';
            else where.status = status as VendorStatus;
        }
        if (search) {
            where.OR = [
                { shopName: { contains: search, mode: 'insensitive' } },
                { ownerName: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [vendors, total] = await Promise.all([
            this.prisma.vendor.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    servicesOffered: true,
                    _count: {
                        select: { orders: true }
                    }
                },
            }),
            this.prisma.vendor.count({ where }),
        ]);

        const mappedVendors = vendors.map(v => this.mapVendorToPartner(v));

        return {
            data: mappedVendors,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    private mapVendorToPartner(vendor: any) {
        return {
            id: vendor.id,
            name: vendor.shopName || vendor.ownerName || 'Unknown Vendor',
            shopName: vendor.shopName,
            ownerName: vendor.ownerName,
            contact: vendor.phone || 'N/A',
            phone: vendor.phone,
            email: vendor.email,
            status: vendor.status === 'active' ? 'APPROVED' :
                vendor.status === 'pending' ? 'PENDING' :
                    vendor.status === 'inactive' ? 'SUSPENDED' : 'PENDING',
            enabled: vendor.status === 'active',
            servicesCount: vendor.servicesOffered?.length || 0,
            totalOrders: vendor._count?.orders || 0,
            joinedAt: vendor.createdAt,
            revenue: vendor.walletBalance || 0,
            address: {
                addressLine1: vendor.addressLine1,
                addressLine2: vendor.addressLine2,
                city: vendor.city,
                state: vendor.state,
                pincode: vendor.pincode,
                latitude: vendor.latitude,
                longitude: vendor.longitude,
                landmark: vendor.landmark,
            },
            bankDetails: {
                accountHolderName: vendor.bankAccountHolderName,
                accountNumber: vendor.bankAccountNumber,
                ifscCode: vendor.bankIfscCode,
                bankName: vendor.bankName,
                branch: vendor.bankBranch,
                cancelledCheque: vendor.bankCancelledCheque,
                upiId: vendor.bankUpiId,
            },
            // Map documents to kyc
            kyc: {
                aadhaar: vendor.docAadhaarCard,
                pan: vendor.docPanCard,
                gst: vendor.docGstCertificate,
                verified: false, // No is_approved field in Prisma schema; derive as needed
            },
            servicesOffered: vendor.servicesOffered,
            subscriptionPlan: {
                planName: vendor.subscriptionPlanName,
                monthlyFee: vendor.subscriptionMonthlyFee,
                maxOrdersPerDay: vendor.subscriptionMaxOrdersPerDay,
                commissionPct: vendor.subscriptionCommissionPct,
            },
            shopStatus: vendor.shopOpenStatus,
            orders: vendor.orders || [],
        };
    }

    async getVendorById(id: string) {
        try {
            const vendor = await this.prisma.vendor.findUnique({
                where: { id },
                include: {
                    servicesOffered: true,
                    orders: {
                        orderBy: { createdAt: 'desc' },
                        take: 10,
                    },
                    _count: {
                        select: { orders: true }
                    }
                },
            });
            if (!vendor) return null;
            return this.mapVendorToPartner(vendor);
        } catch (error) {
            console.error('Error in getVendorById:', error);
            throw error;
        }
    }

    async approveVendor(id: string, decision: 'APPROVE' | 'REJECT', reason?: string) {
        const status: VendorStatus = decision === 'APPROVE' ? 'active' : 'inactive';
        return this.prisma.vendor.update({
            where: { id },
            data: { status },
        });
    }

    async toggleVendorStatus(id: string, enabled: boolean) {
        const status: VendorStatus = enabled ? 'active' : 'inactive';
        return this.prisma.vendor.update({
            where: { id },
            data: { status },
        });
    }

    async getVendorServices(id: string) {
        const services = await this.prisma.vendorService.findMany({
            where: { vendorId: id },
            include: { items: true },
        });

        const mapped = services.map((s: any) => ({
            id: s.id, // Use VendorService ID, not Global Service ID
            serviceId: s.serviceId, // Keep reference if needed
            name: s.serviceName,
            type: s.pricingType === 'per_kg' ? 'WEIGHT' : 'ITEM',
            enabled: s.isActive,
            config: s.pricingType === 'per_kg' && s.items?.length ? {
                minWeight: s.items[0].minWeight,
                maxWeight: s.items[0].maxWeight
            } : undefined
        }));

        return { data: mapped };
    }

    // --- Rider Management ---
    async getRiders(page: number, limit: number, status?: string, search?: string) {
        const skip = (page - 1) * limit;
        const where: Prisma.DeliveryPersonWhereInput = {};

        if (status) where.status = status as any;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [riders, total] = await Promise.all([
            this.prisma.deliveryPerson.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: { assignedOrders: true },
            }),
            this.prisma.deliveryPerson.count({ where }),
        ]);

        return {
            data: riders.map(rider => ({
                id: rider.id,
                name: rider.name || 'Unknown Rider',
                phone: rider.phone,
                email: rider.email,
                status: rider.status === 'active' ? 'ACTIVE' : 'INACTIVE',
                availability: rider.availabilityStatus === 1 ? 'AVAILABLE' : 'OFFLINE',
                currentOrder: rider.assignedOrders?.find((o: any) => ['accepted', 'in_transit'].includes(o.status))?.orderId,
                totalOrders: rider.completedOrders || 0,
                rating: rider.averageRating || 0,
                joinedAt: rider.createdAt,
            })),
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async getRiderById(id: string) {
        const rider = await this.prisma.deliveryPerson.findUnique({
            where: { id },
            include: { assignedOrders: true },
        });
        if (!rider) return null;

        return {
            id: rider.id,
            name: rider.name || 'Unknown Rider',
            phone: rider.phone,
            email: rider.email,
            status: rider.status === 'active' ? 'ACTIVE' : 'INACTIVE',
            availability: rider.availabilityStatus === 1 ? 'AVAILABLE' : 'OFFLINE',
            currentOrder: rider.assignedOrders?.find((o: any) => ['accepted', 'in_transit'].includes(o.status))?.orderId,
            totalOrders: rider.completedOrders || 0,
            rating: rider.averageRating || 0,
            joinedAt: rider.createdAt,
            walletBalance: rider.walletBalance || 0,
            vehicle: {
                type: rider.vehicleType,
                number: rider.vehicleNumber,
                model: rider.vehicleModel,
                color: rider.vehicleColor,
            },
            address: {
                area: rider.addressArea,
                locality: rider.addressLocality,
                city: rider.addressCity,
                state: rider.addressState,
                pincode: rider.addressPincode,
                country: rider.addressCountry,
            },
            bankDetails: {
                totalEarnings: rider.totalEarnings,
                completedOrders: rider.completedOrders,
                averageRating: rider.averageRating,
            },
            kyc: {
                aadhaar: rider.aadhaarNumber,
                license: rider.licenseNumber,
                verified: rider.licenseVerified && rider.aadhaarVerified
            }
        };
    }

    // --- Vendor Service Management ---
    async toggleVendorServiceStatus(id: string, enabled: boolean) {
        console.log(`[AdminService] Toggling VendorService ${id} to ${enabled}`);
        return this.prisma.vendorService.update({
            where: { id },
            data: { isActive: enabled },
        });
    }

    // --- Rider Management ---
    async updateRiderStatus(id: string, enabled: boolean, reason?: string) {
        const status = enabled ? 'active' : 'inactive';
        // You might want to store the reason in a separate table or log it
        if (reason) {
            console.log(`Rider ${id} status changed to ${status}. Reason: ${reason}`);
        }
        return this.prisma.deliveryPerson.update({
            where: { id },
            data: { status },
        });
    }

    // --- Settlement Management ---
    // MOVED to AdminSettlementService (admin-settlement.service.ts)
    // Settlements now use a proper Settlement table with DRAFT → READY → APPROVED → PAID lifecycle

    // --- Services Management ---
    async getServices() {
        const services = await this.prisma.service.findMany({
            include: { items: true },
        });
        return services.map(s => ({
            id: s.id,
            name: s.serviceName,
            tiers: (s.items || []).map((item: any) => ({
                id: item.id,
                name: item.itemName,
                minWeight: item.minWeight ?? 0,
                maxWeight: item.maxWeight ?? 0,
                price: item.itemPrice ?? 0,
                expressPrice: item.expressPrice ?? 0,
            }))
        }));
    }

    async updateServiceTiers(id: string, tiers: any[]) {
        // 1. Get existing items to find what to delete
        const existingItems = await this.prisma.serviceItem.findMany({
            where: { serviceId: id },
            select: { id: true }
        });
        const existingIds = existingItems.map(i => i.id);

        // 2. Separate updates and creates
        const payloadIds = tiers.map(t => t.id).filter(Boolean);
        const toDelete = existingIds.filter(eid => !payloadIds.includes(eid));

        // 3. Perform Updates and Creates
        for (const tier of tiers) {
            const baseData = {
                itemName: tier.item_name || tier.itemName || tier.name,
                imageUrl: tier.image_url || tier.imageUrl || 'placeholder',
                itemDescription: tier.item_description || tier.itemDescription || '',
                itemSlug: tier.item_slug || tier.itemSlug || (tier.name || '').toLowerCase().replace(/ /g, '-'),
                category: tier.category,
                minWeight: tier.minWeight ? parseFloat(tier.minWeight) : 0,
                maxWeight: tier.maxWeight ? parseFloat(tier.maxWeight) : 0,
                itemPrice: tier.price ? parseFloat(tier.price) : (tier.itemPrice ? parseFloat(tier.itemPrice) : 0),
                expressPrice: tier.expressPrice ? parseFloat(tier.expressPrice) : 0,
            };

            if (tier.id && existingIds.includes(tier.id)) {
                // Update: Do not include serviceId, as it's a relation foreign key and might be restricted
                await this.prisma.serviceItem.update({
                    where: { id: tier.id },
                    data: baseData
                });
            } else {
                // Create: Must include serviceId
                await this.prisma.serviceItem.create({
                    data: { ...baseData, serviceId: id }
                });
            }
        }

        // 4. Delete removed items (safely)
        if (toDelete.length > 0) {
            try {
                await this.prisma.serviceItem.deleteMany({
                    where: { id: { in: toDelete } }
                });
            } catch (error) {
                console.warn('Failed to delete some service items due to foreign key constraints:', error);
                // We suppress this error so that updates/creates still succeed.
                // The orphaned items will remain. Future improvement: Soft delete.
            }
        }

        return this.prisma.service.findUnique({
            where: { id },
            include: { items: true },
        });
    }


    async getItems() {
        try {
            const services = await this.prisma.service.findMany({
                include: { items: true },
            });
            const allItems: any[] = [];
            services.forEach(service => {
                if (service.items && Array.isArray(service.items)) {
                    service.items.forEach((item: any) => {
                        // Only add items that are NOT pricing tiers (if that's the distinction?)
                        // Or just add everything that looks like an item.
                        // Frontend ItemCatalog expects flat list.
                        if (item.category !== 'Weight') { // Assuming 'Weight' category implies tier
                            allItems.push({
                                id: item.id,
                                name: item.itemName,
                                category: service.serviceName, // Map Service Name as Category
                                active: true,
                                description: item.itemDescription,
                                price: item.itemPrice || 0,
                                expressPrice: item.expressPrice || 0,
                            });
                        }
                    });
                }
            });
            return { data: allItems };
        } catch (error) {
            console.error('Error in getItems:', error);
            return { data: [] }; // Return empty list instead of 500
        }
    }

    async createItem(data: any) {
        // Normalize category to array
        const categories = Array.isArray(data.category) ? data.category : [data.category];
        const createdItems = [];

        for (const catName of categories) {
            const service = await this.prisma.service.findFirst({
                where: { serviceName: catName },
            });

            if (!service) {
                console.warn(`Service category '${catName}' not found`);
                continue;
            }

            const item = await this.prisma.serviceItem.create({
                data: {
                    serviceId: service.id,
                    itemName: data.name,
                    imageUrl: 'placeholder',
                    itemDescription: 'No description',
                    category: catName,
                    itemSlug: data.name.toLowerCase().replace(/ /g, '-'),
                    itemPrice: data.price ? parseFloat(data.price) : 0,
                    expressPrice: data.expressPrice ? parseFloat(data.expressPrice) : 0,
                    minWeight: data.minWeight ? parseFloat(data.minWeight) : 0,
                    maxWeight: data.maxWeight ? parseFloat(data.maxWeight) : 0,
                },
            });
            createdItems.push(item);
        }

        if (createdItems.length === 0) {
            throw new Error(`No valid services found for categories: ${categories.join(', ')}`);
        }

        return createdItems[0];
    }

    async deleteItem(id: string) {
        // Manually cascade delete vendor items first to avoid FK constraint error
        await this.prisma.vendorServiceItem.deleteMany({
            where: { itemId: id }
        });
        return this.prisma.serviceItem.delete({ where: { id } });
    }

    // --- Payment Management ---
    async getPayments(
        page: number,
        limit: number,
        status?: string,
        method?: string,
        fromDate?: string,
        toDate?: string
    ) {
        const skip = (page - 1) * limit;
        const where: Prisma.OrderWhereInput = {};

        // Only show orders that have some payment activity (not just pending if no records exist)
        // Adjusting to show all orders since the admin wants to see financial data
        if (status && status !== 'ALL') {
            const mappedStatus = status.toLowerCase() === 'success' ? 'paid' : status.toLowerCase();
            where.paymentStatus = mappedStatus as any;
        }

        if (fromDate && toDate) {
            where.createdAt = {
                gte: new Date(fromDate),
                lte: new Date(toDate),
            };
        }

        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    items: true,
                    user: true,
                    paymentRecord: true,
                },
            }),
            this.prisma.order.count({ where }),
        ]);

        const mappedPayments = orders.map((order) => {
            const itemBreakup: Record<string, number> = {};

            if (order.items) {
                order.items.forEach((item) => {
                    if (item.itemName && item.totalPrice) {
                        itemBreakup[item.itemName] = (itemBreakup[item.itemName] || 0) + item.totalPrice;
                    }
                });
            }

            // Map Order status to Frontend SUCCESS/FAILED/PENDING
            let displayStatus = 'PENDING';
            if (order.paymentStatus === 'paid') displayStatus = 'SUCCESS';
            if (order.status === 'cancelled') displayStatus = 'FAILED';

            return {
                paymentId: order.paymentRecord?.id || order.id,
                orderId: String(order.id),
                orderNumber: String(order.orderNumber),
                itemsTotal: order.pdItemTotal || 0,
                itemBreakup,
                deliveryCharge: order.pdDeliveryFee || 0,
                platformFee: order.amountToPlatform || 0,
                gst: order.pdGst || 0,
                vendorCommission: order.pdVendorCommission || 0,
                additionalFee: order.pdAdditionalFee || 0,
                vendorPayable: (order.pdItemTotal || 0) - (order.pdVendorCommission || 0) - (order.pdAdditionalFee || 0),
                offer: order.pdIsOfferApplied ? {
                    code: order.pdOfferCode || 'OFFER',
                    discountAmount: order.pdOfferDiscountAmount || 0,
                } : undefined,
                totalPaid: order.paymentRecord?.amount || order.pdTotalPayableAmount || 0,
                status: displayStatus,
                createdAt: order.createdAt,
            };
        });

        return {
            data: mappedPayments,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    // --- Revenue Management ---
    async getRevenueList(
        page: number,
        limit: number,
        fromDate: string,
        toDate: string
    ) {
        if (!fromDate || !toDate) {
            throw new Error('fromDate and toDate are mandatory for revenue calculation.');
        }

        const skip = (page - 1) * limit;
        const where = this.buildRevenueWhereRules({ fromDate, toDate });

        const [orders, total, aggregates] = await Promise.all([
            this.prisma.order.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.order.count({ where }),
            this.prisma.order.aggregate({
                where,
                _sum: {
                    pdPlatformRevenue: true,
                    amountToVendorAfterCommission: true,
                    pdOfferDiscountAmount: true,
                },
            }),
        ]);

        const mappedRevenue = orders.map((order) => {
            return {
                orderId: String(order.id),
                orderNumber: String(order.orderNumber),
                itemsTotal: order.pdItemTotal || 0,
                platformFee: order.amountToPlatform || 0,
                deliveryCharge: order.pdDeliveryFee || 0,
                offerDiscount: order.pdOfferDiscountAmount ?? null,
                vendorCommission: order.pdVendorCommission || 0,
                additionalFee: order.pdAdditionalFee || 0,
                vendorPayable: order.amountToVendorAfterCommission || 0,
                platformRevenue: order.pdPlatformRevenue ?? null,
                createdAt: order.createdAt,
            };
        });

        return {
            data: mappedRevenue,
            aggregates: {
                totalPlatformRevenue: Math.round((aggregates._sum.pdPlatformRevenue || 0) * 100) / 100,
                totalVendorPayout: Math.round((aggregates._sum.amountToVendorAfterCommission || 0) * 100) / 100,
                totalOfferDiscount: Math.round((aggregates._sum.pdOfferDiscountAmount || 0) * 100) / 100,
                totalOrders: total,
            },
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            }
        };
    }

    // --- Delete Operations ---
    async deleteUser(id: string) {
        // Soft Delete: Set status to INACTIVE
        return this.prisma.user.update({
            where: { id },
            data: { status: 'inactive' }
        });
    }

    async deleteVendor(id: string) {
        // Soft Delete: Set status to INACTIVE
        return this.prisma.vendor.update({
            where: { id },
            data: { status: 'inactive' }
        });
    }

    async deleteRider(id: string) {
        // Soft Delete: Set status to INACTIVE
        return this.prisma.deliveryPerson.update({
            where: { id },
            data: { status: 'inactive' }
        });
    }

    async createRider(data: any) {
        console.log('Creating Rider with data:', JSON.stringify(data, null, 2));
        try {
            // Check if rider with phone already exists
            const existing = await this.prisma.deliveryPerson.findUnique({
                where: { phone: data.phone }
            });

            if (existing) {
                console.warn(`Rider with phone ${data.phone} already exists`);
                throw new Error(`Rider with phone ${data.phone} already exists`);
            }

            const result = await this.prisma.deliveryPerson.create({
                data: {
                    name: data.name,
                    phone: data.phone,
                    email: data.email || '',
                    status: 'active',
                    vehicleType: data.vehicleType,
                    vehicleNumber: data.vehicleNumber,
                    vehicleModel: data.vehicleModel,
                    vehicleColor: data.vehicleColor,
                    addressCity: data.city,
                    addressArea: data.area,
                }
            });
            console.log('Rider created successfully:', result.id);
            return result;
        } catch (error) {
            console.error('Error creating rider:', error);
            throw error;
        }
    }
}
