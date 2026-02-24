import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    Request,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
} from '@nestjs/swagger';
import { OfferService } from './offer.service';
import {
    CreateOfferDto,
    UpdateOfferDto,
    ValidateCouponDto,
    ApplyCouponDto,
} from './dto';
import { AdminAuthGuard } from '../admin/guards/admin-auth.guard';
import { UserAuthGuard } from '../auth/guards/user.guard';

@ApiTags('Offers')
@Controller('offer')
export class OfferController {
    constructor(private readonly offerService: OfferService) { }

    // ==================== ADMIN ENDPOINTS ====================

    @Post('create')
    @UseGuards(AdminAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new offer (Admin)' })
    @ApiResponse({ status: 201, description: 'Offer created successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async createOffer(@Request() req, @Body() dto: CreateOfferDto) {
        const createdBy = req.user?.email || 'admin';
        const offer = await this.offerService.createOffer(dto, createdBy);
        return {
            success: true,
            message: 'Offer created successfully',
            data: offer,
        };
    }

    @Get('list')
    @UseGuards(AdminAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all offers (Admin)' })
    @ApiQuery({ name: 'search', required: false, description: 'Search term' })
    @ApiResponse({ status: 200, description: 'List of offers' })
    async getAllOffers(@Query('search') search?: string) {
        const offers = await this.offerService.getAllOffers(search);
        return {
            success: true,
            data: offers,
        };
    }

    @Get('detail/:id')
    @UseGuards(AdminAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get offer by ID (Admin)' })
    @ApiResponse({ status: 200, description: 'Offer details' })
    @ApiResponse({ status: 404, description: 'Offer not found' })
    async getOfferById(@Param('id') id: string) {
        const offer = await this.offerService.getOfferById(id);
        return {
            success: true,
            data: offer,
        };
    }

    @Put(':id')
    @UseGuards(AdminAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update an offer (Admin)' })
    @ApiResponse({ status: 200, description: 'Offer updated successfully' })
    @ApiResponse({ status: 404, description: 'Offer not found' })
    async updateOffer(@Param('id') id: string, @Body() dto: UpdateOfferDto) {
        const offer = await this.offerService.updateOffer(id, dto);
        return {
            success: true,
            message: 'Offer updated successfully',
            data: offer,
        };
    }

    @Delete(':id')
    @UseGuards(AdminAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete an offer (Admin)' })
    @ApiResponse({ status: 200, description: 'Offer deleted successfully' })
    @ApiResponse({ status: 404, description: 'Offer not found' })
    async deleteOffer(@Param('id') id: string) {
        await this.offerService.deleteOffer(id);
        return {
            success: true,
            message: 'Offer deleted successfully',
        };
    }

    // ==================== USER ENDPOINTS ====================

    @Get('user-offers')
    @UseGuards(UserAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get offers available for the logged-in user' })
    @ApiResponse({ status: 200, description: 'List of available offers' })
    async getUserOffers(@Request() req) {
        const userId = req.user?.userId || req.user?.id;
        const offers = await this.offerService.getUserOffers(userId);
        return {
            success: true,
            data: offers,
        };
    }

    @Post('validate')
    @UseGuards(UserAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Validate a coupon code' })
    @ApiResponse({ status: 200, description: 'Coupon validation result' })
    async validateCoupon(@Request() req, @Body() dto: ValidateCouponDto) {
        const userId = req.user?.userId || req.user?.id;
        const result = await this.offerService.validateCoupon(userId, dto);
        return {
            success: true,
            data: result,
        };
    }

    @Post('apply')
    @UseGuards(UserAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Apply a coupon to an order' })
    @ApiResponse({ status: 200, description: 'Coupon applied successfully' })
    async applyCoupon(@Request() req, @Body() dto: ApplyCouponDto) {
        const userId = req.user?.userId || req.user?.id;
        return this.offerService.applyCoupon(userId, dto);
    }
}
