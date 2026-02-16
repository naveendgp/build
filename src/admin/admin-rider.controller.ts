import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminService } from './admin.service';

@ApiTags('Admin Riders')
@Controller('admin/riders')
@UseGuards(AdminAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AdminRiderController {
    constructor(private readonly adminService: AdminService) { }

    @Get()
    @ApiOperation({ summary: 'List all riders' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'search', required: false })
    async getRiders(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('status') status?: string,
        @Query('search') search?: string,
    ) {
        return this.adminService.getRiders(Number(page), Number(limit), status, search);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get rider details' })
    async getRider(@Param('id') id: string) {
        return this.adminService.getRiderById(id);
    }
}
