import {
    Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminSettlementService } from './admin-settlement.service';

@ApiTags('Admin Settlements')
@Controller('admin/settlements')
@UseGuards(AdminAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AdminSettlementController {
    constructor(private readonly settlementService: AdminSettlementService) { }

    @Post('generate')
    @ApiOperation({ summary: 'Generate draft settlements for a period' })
    async generateDrafts(
        @Body() body: { periodFrom: string; periodTo: string },
        @Request() req,
    ) {
        return this.settlementService.generateDraftSettlements(
            body.periodFrom,
            body.periodTo,
            req.user.id,
        );
    }

    @Get()
    @ApiOperation({ summary: 'List settlements' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'partnerId', required: false })
    async getSettlements(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
        @Query('status') status?: string,
        @Query('partnerId') partnerId?: string,
    ) {
        return this.settlementService.getSettlements(
            Number(page),
            Number(limit),
            status,
            partnerId,
        );
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get settlement details' })
    async getSettlement(@Param('id') id: string) {
        return this.settlementService.getSettlementById(id);
    }

    @Patch(':id/transition')
    @ApiOperation({ summary: 'Transition settlement state (ready / approve)' })
    async transitionSettlement(
        @Param('id') id: string,
        @Body() body: { action: 'ready' | 'approve' },
    ) {
        switch (body.action) {
            case 'ready':
                return this.settlementService.transitionToReady(id);
            case 'approve':
                return this.settlementService.transitionToApproved(id);
            default:
                return { error: 'Invalid action. Use "ready" or "approve".' };
        }
    }

    @Patch(':id/pay')
    @ApiOperation({ summary: 'Mark settlement as paid' })
    async markPaid(
        @Param('id') id: string,
        @Body() body: { paymentReference: string },
    ) {
        return this.settlementService.transitionToPaid(id, body.paymentReference);
    }
}
