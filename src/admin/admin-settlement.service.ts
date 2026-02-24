import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class AdminSettlementService {
    private readonly logger = new Logger(AdminSettlementService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ─── Generate Draft Settlements ────────────────────────────────────
    async generateDraftSettlements(periodFrom: string, periodTo: string, adminId: string) {
        const from = new Date(periodFrom);
        const to = new Date(periodTo);

        if (isNaN(from.getTime()) || isNaN(to.getTime())) {
            throw new BadRequestException('Invalid date range');
        }
        if (from >= to) {
            throw new BadRequestException('periodFrom must be before periodTo');
        }

        // Find completed, unsettled orders in the period
        const orders = await this.prisma.order.findMany({
            where: {
                OR: [{ status: 'delivered' }, { paymentStatus: 'paid' }],
                isSettledToVendor: false,
                createdAt: { gte: from, lte: to },
            },
            select: {
                id: true,
                vendorId: true,
                pdItemTotal: true,
                pdVendorCommission: true,
                pdAdditionalFee: true,
                pdGst: true,
                amountToVendorAfterCommission: true,
            },
        });

        if (orders.length === 0) {
            return { message: 'No unsettled orders found for the given period', settlements: [] };
        }

        // Group orders by vendorId
        const grouped = new Map<string, typeof orders>();
        for (const order of orders) {
            if (!order.vendorId) continue;
            const existing = grouped.get(order.vendorId) || [];
            existing.push(order);
            grouped.set(order.vendorId, existing);
        }

        const settlements: any[] = [];

        for (const [vendorId, vendorOrders] of grouped) {
            const grossAmount = vendorOrders.reduce((sum, o) => sum + (o.pdItemTotal || 0), 0);
            const platformFee = vendorOrders.reduce((sum, o) => sum + (o.pdVendorCommission || 0), 0);
            const additionalFee = vendorOrders.reduce((sum, o) => sum + (o.pdAdditionalFee || 0), 0);
            const gst = vendorOrders.reduce((sum, o) => sum + (o.pdGst || 0), 0);
            const netPayout = vendorOrders.reduce((sum, o) => sum + (o.amountToVendorAfterCommission || 0), 0);
            const fallback = grossAmount > 0 ? grossAmount - platformFee - additionalFee - gst : 0;

            const settlement = await this.prisma.settlement.create({
                data: {
                    partnerId: vendorId,
                    periodFrom: from,
                    periodTo: to,
                    grossAmount: Number(grossAmount.toFixed(2)),
                    platformFee: Number(platformFee.toFixed(2)),
                    additionalFee: Number(additionalFee.toFixed(2)),
                    gst: Number(gst.toFixed(2)),
                    netPayout: Number((netPayout > 0 ? netPayout : fallback).toFixed(2)),
                    status: 'DRAFT',
                    settlementCode: null,
                    orderIds: vendorOrders.map((o) => o.id),
                    ordersCount: vendorOrders.length,
                    createdBy: adminId,
                },
                include: { partner: { select: { shopName: true, ownerName: true } } },
            });

            settlements.push(settlement);
        }

        this.logger.log(`Generated ${settlements.length} draft settlement(s) for ${periodFrom} to ${periodTo}`);
        return { message: `Generated ${settlements.length} draft settlement(s)`, settlements };
    }

    // ─── List Settlements (Paginated) ──────────────────────────────────
    async getSettlements(page: number, limit: number, status?: string, partnerId?: string) {
        const skip = (page - 1) * limit;
        const where: Prisma.SettlementWhereInput = {};

        if (status) {
            where.status = status.toUpperCase() as any;
        }
        if (partnerId) {
            where.partnerId = partnerId;
        }

        const [settlements, total] = await Promise.all([
            this.prisma.settlement.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    partner: {
                        select: {
                            shopName: true,
                            ownerName: true,
                            phone: true,
                            bankAccountHolderName: true,
                            bankAccountNumber: true,
                            bankIfscCode: true,
                            bankName: true,
                            bankBranch: true,
                            bankUpiId: true,
                        },
                    },
                },
            }),
            this.prisma.settlement.count({ where }),
        ]);

        const data = settlements.map((s) => ({
            id: s.id,
            settlementCode: s.settlementCode,
            partnerId: s.partnerId,
            partnerName: s.partner.shopName || s.partner.ownerName || 'Unknown',
            periodFrom: s.periodFrom.toISOString(),
            periodTo: s.periodTo.toISOString(),
            grossAmount: s.grossAmount,
            platformFee: s.platformFee,
            additionalFee: s.additionalFee,
            gst: s.gst,
            netPayout: s.netPayout,
            status: s.status,
            ordersCount: s.ordersCount,
            approvedAt: s.approvedAt?.toISOString() || null,
            paidAt: s.paidAt?.toISOString() || null,
            paymentReference: s.paymentReference,
            createdAt: s.createdAt.toISOString(),
            bankDetails: {
                accountHolderName: s.partner.bankAccountHolderName,
                accountNumber: s.partner.bankAccountNumber,
                ifscCode: s.partner.bankIfscCode,
                bankName: s.partner.bankName,
                branch: s.partner.bankBranch,
                upiId: s.partner.bankUpiId,
            },
        }));

        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    // ─── Get Single Settlement with Order Details ──────────────────────
    async getSettlementById(id: string) {
        const settlement = await this.prisma.settlement.findUnique({
            where: { id },
            include: {
                partner: {
                    select: {
                        shopName: true,
                        ownerName: true,
                        phone: true,
                        bankAccountHolderName: true,
                        bankAccountNumber: true,
                        bankIfscCode: true,
                        bankName: true,
                        bankBranch: true,
                        bankUpiId: true,
                    },
                },
            },
        });

        if (!settlement) {
            throw new BadRequestException('Settlement not found');
        }

        // Fetch the actual order details
        let orders: any[] = [];
        if (settlement.orderIds.length > 0) {
            orders = await this.prisma.order.findMany({
                where: { id: { in: settlement.orderIds } },
                select: {
                    id: true,
                    orderNumber: true,
                    createdAt: true,
                    pdItemTotal: true,
                    pdVendorCommission: true,
                    pdAdditionalFee: true,
                    amountToVendorAfterCommission: true,
                },
            });
        }

        return {
            id: settlement.id,
            settlementCode: settlement.settlementCode,
            partnerId: settlement.partnerId,
            partnerName: settlement.partner.shopName || settlement.partner.ownerName,
            periodFrom: settlement.periodFrom.toISOString(),
            periodTo: settlement.periodTo.toISOString(),
            grossAmount: settlement.grossAmount,
            platformFee: settlement.platformFee,
            additionalFee: settlement.additionalFee,
            gst: settlement.gst,
            netPayout: settlement.netPayout,
            status: settlement.status,
            ordersCount: settlement.ordersCount,
            approvedAt: settlement.approvedAt?.toISOString() || null,
            paidAt: settlement.paidAt?.toISOString() || null,
            paymentReference: settlement.paymentReference,
            notes: settlement.notes,
            createdBy: settlement.createdBy,
            createdAt: settlement.createdAt.toISOString(),
            bankDetails: {
                accountHolderName: settlement.partner.bankAccountHolderName,
                accountNumber: settlement.partner.bankAccountNumber,
                ifscCode: settlement.partner.bankIfscCode,
                bankName: settlement.partner.bankName,
                branch: settlement.partner.bankBranch,
                upiId: settlement.partner.bankUpiId,
            },
            orders: orders.map((o) => ({
                orderId: o.id,
                orderNumber: String(o.orderNumber),
                createdAt: o.createdAt.toISOString(),
                itemsTotal: o.pdItemTotal || 0,
                vendorCommission: o.pdVendorCommission || 0,
                additionalFee: o.pdAdditionalFee || 0,
                vendorPayable: o.amountToVendorAfterCommission || 0,
            })),
        };
    }

    // ─── State Transitions ─────────────────────────────────────────────

    /**
     * DRAFT → READY: Freeze amounts, no more recalculation.
     */
    async transitionToReady(id: string) {
        const settlement = await this.prisma.settlement.findUnique({ where: { id } });
        if (!settlement) throw new BadRequestException('Settlement not found');
        if (settlement.status !== 'DRAFT') {
            throw new BadRequestException(`Cannot mark as ready: current status is ${settlement.status} (expected DRAFT)`);
        }

        return this.prisma.settlement.update({
            where: { id },
            data: { status: 'READY' },
        });
    }

    /**
     * READY → APPROVED: Generate settlementCode, set approvedAt.
     */
    async transitionToApproved(id: string) {
        const settlement = await this.prisma.settlement.findUnique({ where: { id } });
        if (!settlement) throw new BadRequestException('Settlement not found');
        if (settlement.status !== 'READY') {
            throw new BadRequestException(`Cannot approve: current status is ${settlement.status} (expected READY)`);
        }

        const settlementCode = this.generateSettlementCode();

        return this.prisma.settlement.update({
            where: { id },
            data: {
                status: 'APPROVED',
                settlementCode,
                approvedAt: new Date(),
            },
        });
    }

    /**
     * APPROVED → PAID: Record payment, mark orders as settled, create transaction.
     */
    async transitionToPaid(id: string, paymentReference: string) {
        if (!paymentReference || !paymentReference.trim()) {
            throw new BadRequestException('Payment reference is required');
        }

        const settlement = await this.prisma.settlement.findUnique({ where: { id } });
        if (!settlement) throw new BadRequestException('Settlement not found');
        if (settlement.status !== 'APPROVED') {
            throw new BadRequestException(`Cannot mark as paid: current status is ${settlement.status} (expected APPROVED)`);
        }

        return this.prisma.$transaction(async (tx) => {
            // 1. Update settlement status
            const updated = await tx.settlement.update({
                where: { id },
                data: {
                    status: 'PAID',
                    paidAt: new Date(),
                    paymentReference: paymentReference.trim(),
                },
            });

            // 2. Mark orders as settled
            if (settlement.orderIds.length > 0) {
                await tx.order.updateMany({
                    where: { id: { in: settlement.orderIds } },
                    data: { isSettledToVendor: true },
                });
            }

            // 3. Adjust vendor balance
            const vendor = await tx.vendor.findUnique({ where: { id: settlement.partnerId } });
            if (vendor) {
                await tx.vendor.update({
                    where: { id: settlement.partnerId },
                    data: {
                        amountDue: Math.max(0, (vendor.amountDue || 0) - settlement.netPayout),
                    },
                });
            }

            // 4. Create transaction record for audit
            await tx.transaction.create({
                data: {
                    vendorId: settlement.partnerId,
                    entityType: 'vendor' as any,
                    transactionType: 'debit' as any,
                    method: 'bank_transfer',
                    amount: settlement.netPayout,
                    description: `Settlement ${settlement.settlementCode} Paid. Ref: ${paymentReference}`,
                    timestamp: new Date(),
                },
            });

            return updated;
        });
    }

    // ─── Helpers ───────────────────────────────────────────────────────

    private generateSettlementCode(): string {
        const hex = crypto.randomBytes(3).toString('hex').toUpperCase();
        return `SETL-${hex}`;
    }
}
