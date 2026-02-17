import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminService } from './admin.service';

@ApiTags('Admin Users')
@Controller('admin/users')
@UseGuards(AdminAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AdminUserController {
    constructor(private readonly adminService: AdminService) { }

    @Get()
    @ApiOperation({ summary: 'List all users' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'search', required: false })
    async getUsers(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('search') search?: string,
    ) {
        return this.adminService.getUsers(Number(page), Number(limit), search);
    }

    @Get(':id/orders')
    async getUserOrders(
        @Param('id') id: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
    ) {
        return this.adminService.getUserOrders(id, Number(page), Number(limit));
    }

    @Get(':id')
    async getUser(@Param('id') id: string) {
        return this.adminService.getUserById(id);
    }

    @Post(':id/status')
    @ApiOperation({ summary: 'Toggle user status (active/inactive)' })
    async toggleUserStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.adminService.toggleUserStatus(id, status);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a user' })
    async deleteUser(@Param('id') id: string) {
        return this.adminService.deleteUser(id);
    }
}
