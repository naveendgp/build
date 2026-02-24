import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminService } from './admin.service';

@ApiTags('Admin Services')
@Controller('admin')
@UseGuards(AdminAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AdminServiceController {
    constructor(private readonly adminService: AdminService) { }

    @Get('services')
    @ApiOperation({ summary: 'List all services' })
    async getServices() {
        const services = await this.adminService.getServices();
        return { data: services };
    }

    @Put('services/:id')
    @ApiOperation({ summary: 'Update service tiers' })
    async updateService(@Param('id') id: string, @Body() body: any) {
        return this.adminService.updateServiceTiers(id, body.tiers);
    }

    @Post('services/:id/status')
    @ApiOperation({ summary: 'Enable/Disable a vendor service' })
    async toggleServiceStatus(@Param('id') id: string, @Body() body: { enabled: boolean }) {
        return this.adminService.toggleVendorServiceStatus(id, body.enabled);
    }

    @Get('items')
    @ApiOperation({ summary: 'List all items' })
    async getItems() {
        return this.adminService.getItems();
    }

    @Post('items')
    @ApiOperation({ summary: 'Create new item' })
    async createItem(@Body() body: any) {
        return this.adminService.createItem(body);
    }

    @Delete('items/:id')
    @ApiOperation({ summary: 'Delete item' })
    async deleteItem(@Param('id') id: string) {
        return this.adminService.deleteItem(id);
    }
}
