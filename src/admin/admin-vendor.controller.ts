import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminService } from './admin.service';

@ApiTags('Admin Partners')
@Controller('admin/partners')
@UseGuards(AdminAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AdminVendorController {
    constructor(private readonly adminService: AdminService) { }

    @Get()
    @ApiOperation({ summary: 'List all vendors' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'search', required: false })
    async getVendors(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('status') status?: string,
        @Query('search') search?: string,
    ) {
        return this.adminService.getVendors(Number(page), Number(limit), status, search);
    }

    @Get(':id/services')
    async getVendorServices(@Param('id') id: string) {
        return this.adminService.getVendorServices(id);
    }

    @Get(':id')
    async getVendor(@Param('id') id: string) {
        return this.adminService.getVendorById(id);
    }

    @Post(':id/decision')
    @ApiOperation({ summary: 'Approve or Reject a vendor' })
    async approveVendor(
        @Param('id') id: string,
        @Body('decision') decision: 'APPROVE' | 'REJECT',
        @Body('reason') reason?: string,
    ) {
        return this.adminService.approveVendor(id, decision, reason);
    }

    @Post(':id/status')
    @ApiOperation({ summary: 'Enable or Disable a vendor' })
    async toggleVendorStatus(@Param('id') id: string, @Body('enabled') enabled: boolean) {
        return this.adminService.toggleVendorStatus(id, enabled);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a vendor' })
    async deleteVendor(@Param('id') id: string) {
        return this.adminService.deleteVendor(id);
    }
}
