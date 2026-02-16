import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, AdminRole, OrderStatus, VendorStatus } from '@prisma/client';

@Injectable()
export class AdminService {
    constructor(private readonly prisma: PrismaService) { }

    async findByEmail(email: string) {
        return this.prisma.admin.findFirst({ where: { email } });
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

    async getDashboardStats(fromDate?: string, toDate?: string) {
        const dateFilter: Prisma.OrderWhereInput = {};
        if (fromDate && toDate) {
            dateFilter.createdAt = {
                gte: new Date(fromDate),
                lte: new Date(toDate),
            };
        }

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
            this.prisma.order.count({ where: dateFilter }),
            // Revenue
            this.prisma.order.aggregate({
                where: {
                    ...dateFilter,
                    OR: [{ paymentStatus: 'paid' }, { status: 'delivered' }],
                },
                _sum: { totalAmount: true },
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
                where: dateFilter,
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
                where: dateFilter,
                _count: { status: true },
            }),
            // Refunds (Cancelled + Paid)
            this.prisma.order.aggregate({
                where: {
                    ...dateFilter,
                    status: 'cancelled',
                    paymentStatus: 'paid',
                },
                _sum: { totalAmount: true },
            }),
        ]);

        const totalRevenue = totalRevenueResult._sum.totalAmount || 0;
        const totalRefunds = refundsResult._sum.totalAmount || 0;

        // Map status counts
        const statusMap = orderStatusCounts.reduce((acc, curr) => {
            acc[curr.status] = curr._count.status;
            return acc;
        }, {} as Record<string, number>);

        const completedOrders = statusMap['delivered'] || 0;
        const cancelledOrders = statusMap['cancelled'] || 0;
        // In Progress = Total - (Completed + Cancelled) roughly, or sum of other states
        const inProgressOrders = totalOrders - completedOrders - cancelledOrders;

        return {
            orders: {
                total: totalOrders,
                completed: completedOrders,
                cancelled: cancelledOrders,
                inProgress: inProgressOrders,
            },
            payments: {
                totalAmount: totalRevenue,
                refunds: totalRefunds,
                revenue: totalRevenue - totalRefunds,
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
    async getOrders(page: number, limit: number, status?: string, search?: string) {
        const skip = (page - 1) * limit;
        const where: Prisma.OrderWhereInput = {};

        if (status) where.status = status as OrderStatus;
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
                include: { addresses: true },
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
            include: { addresses: true },
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
            // ordersCount and totalSpent might need aggregation, setting defaults for now
            ordersCount: 0, // Placeholder — needs order aggregation
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

        if (status) where.status = status as VendorStatus;
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
                include: { servicesOffered: true },
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
        };
    }

    async getVendorById(id: string) {
        try {
            const vendor = await this.prisma.vendor.findUnique({
                where: { id },
                include: { servicesOffered: true },
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
            id: s.serviceId,
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

    // --- Settlement Management ---
    async getSettlements(page: number, limit: number, fromDate?: string, toDate?: string, partnerId?: string, status?: string) {
        // Placeholder implementation - fetching Vendors with pending settlements
        const skip = (page - 1) * limit;
        const where: Prisma.VendorWhereInput = {
            amountDue: { gt: 0 },
        };

        if (partnerId) where.id = partnerId;
        // Date filter might apply to 'last_settled_at' or similar, but for now we list vendors with due amounts

        const [vendors, total] = await Promise.all([
            this.prisma.vendor.findMany({
                where,
                orderBy: { amountDue: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    shopName: true,
                    ownerName: true,
                    phone: true,
                    amountDue: true,
                    bankAccountHolderName: true,
                    bankAccountNumber: true,
                    bankIfscCode: true,
                    bankName: true,
                    bankBranch: true,
                    bankUpiId: true,
                },
            }),
            this.prisma.vendor.count({ where }),
        ]);

        return {
            data: vendors.map(v => ({
                id: v.id,
                partnerName: v.shopName || v.ownerName,
                partnerId: v.id,
                amount: v.amountDue,
                status: 'PENDING', // Default logic
                bankDetails: {
                    accountHolderName: v.bankAccountHolderName,
                    accountNumber: v.bankAccountNumber,
                    ifscCode: v.bankIfscCode,
                    bankName: v.bankName,
                    branch: v.bankBranch,
                    upiId: v.bankUpiId,
                },
                createdAt: new Date(), // Placeholder
            })),
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    // --- Services Management ---
    async getServices() {
        const services = await this.prisma.service.findMany({
            include: { items: true },
        });
        return services.map(s => ({
            id: s.id,
            name: s.serviceName,
            tiers: (s.items || []).map((item: any) => ({
                name: item.itemName,
                minWeight: item.minWeight ?? 0,
                maxWeight: item.maxWeight ?? 0,
                price: item.itemPrice ?? 0,
                expressPrice: item.expressPrice ?? 0,
            }))
        }));
    }

    async updateServiceTiers(id: string, tiers: any[]) {
        // Delete existing items and recreate them
        await this.prisma.serviceItem.deleteMany({ where: { serviceId: id } });

        const createData = tiers.map((tier: any) => ({
            serviceId: id,
            itemName: tier.item_name || tier.itemName || tier.name,
            imageUrl: tier.image_url || tier.imageUrl || 'placeholder',
            itemDescription: tier.item_description || tier.itemDescription || '',
            itemSlug: tier.item_slug || tier.itemSlug || (tier.name || '').toLowerCase().replace(/ /g, '-'),
            category: tier.category,
        }));

        await this.prisma.serviceItem.createMany({ data: createData });

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
        const service = await this.prisma.service.findFirst({
            where: { serviceName: data.category },
        });
        if (!service) {
            throw new Error(`Service category '${data.category}' not found`);
        }

        return this.prisma.serviceItem.create({
            data: {
                serviceId: service.id,
                itemName: data.name,
                imageUrl: 'placeholder',
                itemDescription: 'No description',
                category: data.category,
                itemSlug: data.name.toLowerCase().replace(/ /g, '-'),
            },
        });
    }

    async deleteItem(id: string) {
        return this.prisma.serviceItem.delete({ where: { id } });
    }
}
