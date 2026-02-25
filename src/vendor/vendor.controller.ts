import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  UploadedFiles,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { VendorService } from './vendor.service';
import {
  VendorRegisterDto,
  VendorLoginDto,
  VendorVerifyOtpDto,
  UpdateOperatingHoursDto,
  UpdateBankDetailsDto,
  UpdateServicesOfferedDto,
  UpdateOrderStatusDto,
  VendorRegisterCompleteDto,
  VendorSendOtpDto,
  ToggleServiceActiveDto,
  VendorUserUpdateDto,
  UpdateShopDetailsDto,
  ToggleVendorSettingsDto,
  UpdateOrderItemsDto,
} from './dto';
import { VendorAuthGuard } from '../auth/guards/vendor.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FormDataJsonParserInterceptor } from '../common/interceptors/form-data-json-parser.interceptor';
import { ChaosInterceptor } from '../common/interceptors/chaos.interceptor';

@Controller('vendor')
@ApiTags('Vendor')
@UseInterceptors(ChaosInterceptor)
export class VendorController {
  constructor(private readonly vendorService: VendorService) { }

  @Post('register')
  register(@Body() body: VendorRegisterDto) {
    return this.vendorService.register(body);
  }

  @Post('send-otp')
  @ApiOperation({ summary: 'Send OTP for vendor register/login' })
  @ApiBody({ type: VendorSendOtpDto })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  sendOtp(@Body() body: VendorSendOtpDto) {
    return this.vendorService.sendOtp(body.phone);
  }

  @UseGuards(VendorAuthGuard)
  @Post('register-complete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'Complete vendor registration with documents, operating hours, and bank details',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: VendorRegisterCompleteDto })
  @ApiResponse({
    status: 200,
    description: 'Registration completed successfully with all details',
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'aadhaar_card', maxCount: 1 },
        { name: 'gst_certificate', maxCount: 1 },
        { name: 'pan_card', maxCount: 1 },
        { name: 'cancelled_cheque', maxCount: 1 },
        { name: 'shop_image', maxCount: 1 },
        { name: 'profile_pic', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
        limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per file
      },
    ),
    new FormDataJsonParserInterceptor(['operating_hours']),
  )
  registerComplete(
    @Req() req: any,
    @Body() body: VendorRegisterCompleteDto,
    @UploadedFiles()
    files: {
      aadhaar_card?: any;
      gst_certificate?: any;
      pan_card?: any;
      cancelled_cheque?: any;
      shop_image?: any;
      profile_pic?: any;
    },
  ) {
    return this.vendorService.registerComplete(body, req.vendor?.phone, files);
  }

  @Post('login')
  @ApiOperation({ summary: 'Send OTP for vendor login' })
  @ApiBody({ type: VendorLoginDto })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  login(@Body() body: VendorLoginDto) {
    return this.vendorService.login(body.phone);
  }

  @Post('resend-otp')
  @ApiOperation({ summary: 'Resend OTP to vendor phone number' })
  @ApiBody({ type: VendorLoginDto })
  @ApiResponse({ status: 200, description: 'OTP resent successfully' })
  resendOtp(@Body() body: VendorLoginDto) {
    return this.vendorService.resendOtp(body.phone);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP and complete vendor authentication' })
  @ApiBody({ type: VendorVerifyOtpDto })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  verifyOtp(@Body() body: VendorVerifyOtpDto) {
    return this.vendorService.verifyOtp(body.phone, body.otp, body.fcm_token);
  }

  @UseGuards(VendorAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get vendor profile' })
  @ApiResponse({
    status: 200,
    description: 'Vendor profile retrieved successfully',
  })
  me(@Req() req: any) {
    return this.vendorService.getMeByPhoneNumber(req.vendor?.phone);
  }

  @UseGuards(VendorAuthGuard)
  @Patch('vendor-user-update')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update vendor user profile' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        vendor: { type: 'string', example: 'Clean Laundry Services' },
        contactNum: { type: 'string', example: '+919876543210' },
        email: { type: 'string', example: 'vendor@example.com' },
        owner_name: { type: 'string', example: 'John Doe' },
        profile_pic: { type: 'string', format: 'binary' },
        aadhaar_card: { type: 'string', format: 'binary' },
        pan_card: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Vendor profile updated successfully',
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'profile_pic', maxCount: 1 },
        { name: 'aadhaar_card', maxCount: 1 },
        { name: 'pan_card', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
        limits: { fileSize: 50 * 1024 * 1024 },
      },
    ),
  )
  vendorUserUpdate(
    @Req() req: any,
    @Body() body: VendorUserUpdateDto,
    @UploadedFiles()
    files: {
      profile_pic?: any;
      aadhaar_card?: any;
      pan_card?: any;
    },
  ) {
    return this.vendorService.updateVendorUserProfile(
      req.vendor?.phone,
      body,
      files,
    );
  }

  @UseGuards(VendorAuthGuard)
  @Post('documents')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload vendor documents' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Documents uploaded successfully' })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'aadhaar_card', maxCount: 1 },
        { name: 'gst_certificate', maxCount: 1 },
        { name: 'pan_card', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
        limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per file
      },
    ),
  )
  uploadDocuments(
    @Req() req: any,
    @UploadedFiles()
    files: {
      aadhaar_card?: any;
      gst_certificate?: any;
      pan_card?: any;
    },
  ) {
    return this.vendorService.uploadDocuments(req.vendor?.phone, files);
  }

  @UseGuards(VendorAuthGuard)
  @Post('shop-image')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload shop image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Shop image uploaded successfully' })
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'shop_image', maxCount: 1 }], {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per file
    }),
  )
  uploadShopImage(
    @Req() req: any,
    @UploadedFiles()
    files: {
      shop_image: any;
    },
  ) {
    return this.vendorService.uploadShopImage(req.vendor?.phone, files);
  }

  @UseGuards(VendorAuthGuard)
  @Post('operating-hours')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update operating hours' })
  @ApiBody({ type: UpdateOperatingHoursDto })
  @ApiResponse({
    status: 200,
    description: 'Operating hours updated successfully',
  })
  updateOperatingHours(@Req() req: any, @Body() body: UpdateOperatingHoursDto) {
    return this.vendorService.updateOperatingHours(req.vendor?.phone, body);
  }

  @UseGuards(VendorAuthGuard)
  @Post('bank-details')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update bank details' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        account_holder_name: {
          type: 'string',
          example: 'John Doe',
          description: 'Bank account holder name',
        },
        account_number: {
          type: 'string',
          example: '1234567890',
          description: 'Bank account number',
        },
        ifsc_code: {
          type: 'string',
          example: 'HDFC0001234',
          description: 'IFSC code',
        },
        bank_name: {
          type: 'string',
          example: 'HDFC Bank',
          description: 'Bank name',
        },
        branch: {
          type: 'string',
          example: 'Andheri West',
          description: 'Bank branch',
        },
        upi_id: {
          type: 'string',
          example: 'vendor@upi',
          description: 'UPI ID linked to the bank account',
        },
        cancelled_cheque: {
          type: 'string',
          format: 'binary',
          description: 'Cancelled cheque image',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Bank details updated successfully',
  })
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'cancelled_cheque', maxCount: 1 }], {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per file
    }),
  )
  updateBankDetails(
    @Req() req: any,
    @Body() body: UpdateBankDetailsDto,
    @UploadedFiles()
    files: {
      cancelled_cheque?: any;
    },
  ) {
    return this.vendorService.updateBankDetails(req.vendor?.phone, body, files);
  }

  @UseGuards(VendorAuthGuard)
  @Post('services-offered')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update services offered' })
  @ApiBody({ type: UpdateServicesOfferedDto })
  @ApiResponse({ status: 200, description: 'Services updated successfully' })
  updateServicesOffered(
    @Req() req: any,
    @Body() body: UpdateServicesOfferedDto,
  ) {
    return this.vendorService.updateServicesOffered(req.vendor?.phone, body);
  }

  @UseGuards(VendorAuthGuard)
  @Get('status-update')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update shop status (open/close)' })
  @ApiResponse({ status: 200, description: 'Shop status updated successfully' })
  updateShopStatus(@Req() req: any) {
    return this.vendorService.updateStoreStatus(req.vendor?.phone);
  }

  @UseGuards(VendorAuthGuard)
  @Post('toggle-settings')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'Toggle express service availability and/or shop status in a single API call',
  })
  @ApiBody({ type: ToggleVendorSettingsDto })
  @ApiResponse({
    status: 200,
    description: 'Settings toggled successfully',
  })
  toggleSettings(@Req() req: any, @Body() body: ToggleVendorSettingsDto) {
    return this.vendorService.toggleVendorSettings(req.vendor?.phone, body);
  }

  @UseGuards(VendorAuthGuard)
  @Post('order')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update order status' })
  @ApiBody({ type: UpdateOrderStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully',
  })
  orderUpdate(@Req() req: any, @Body() body: UpdateOrderStatusDto) {
    return this.vendorService.updateOrderStatus(
      req.vendor?.phone,
      body.order_id,
      body.status,
    );
  }

  @UseGuards(VendorAuthGuard)
  @Post('order/update-items')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update order items (quantity/weight)' })
  @ApiBody({ type: UpdateOrderItemsDto })
  @ApiResponse({
    status: 200,
    description: 'Order items updated successfully',
  })
  updateOrderItems(@Req() req: any, @Body() body: UpdateOrderItemsDto) {
    return this.vendorService.updateOrderItems(req.vendor?.phone, body);
  }

  @UseGuards(VendorAuthGuard)
  @Get('order/accept/:orderid')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Accept an order' })
  @ApiParam({
    name: 'orderid',
    description: 'Order ID to accept',
    example: '507f1f77bcf86cd799439011',
  })
  acceptOrder(
    @Req() req: any,
    @Param('orderid') orderId: string,
    @Query('is_reject') isRejected?: string,
  ) {
    return this.vendorService.acceptOrder(
      req.vendor?.phone,
      orderId,
      isRejected,
    );
  }

  @UseGuards(VendorAuthGuard)
  @Patch('order/time/:orderid')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update order delivery time' })
  @ApiParam({
    name: 'orderid',
    description: 'Order ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        time: {
          type: 'string',
          description: 'Delivery time',
          example: '2 hours',
        },
      },
      required: ['time'],
    },
  })
  updateOrderTime(
    @Req() req: any,
    @Param('orderid') orderId: string,
    @Body('time') time: string,
  ) {
    return this.vendorService.updateOrderTime(req.vendor?.phone, orderId, time);
  }

  @UseGuards(VendorAuthGuard)
  @Patch('order/complete/:orderid')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mark order as complete (processed)' })
  @ApiParam({
    name: 'orderid',
    description: 'Order ID to mark as complete',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Order marked as complete successfully',
  })
  markOrderComplete(@Req() req: any, @Param('orderid') orderId: string) {
    return this.vendorService.markOrderComplete(req.vendor?.phone, orderId);
  }

  @UseGuards(VendorAuthGuard)
  @Get('orders')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'View vendor orders' })
  @ApiQuery({
    name: 'order_id',
    required: false,
    type: String,
    description: 'Order ID to fetch a specific order',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description:
      'Filter orders by status 1. pending,2. accepted, 3. processed, 4. delivered',
    example: '1',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 20,
  })
  viewOrders(
    @Req() req: any,
    @Query('order_id') orderId?: string,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.vendorService.viewOrders(
      req.vendor?.phone,
      orderId,
      status,
      page,
      limit,
    );
  }

  @UseGuards(VendorAuthGuard)
  @Get('list-services-master')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get master list of services' })
  @ApiResponse({
    status: 200,
    description: 'Services master list retrieved successfully',
  })
  servicesMaster() {
    return this.vendorService.servicesMaster();
  }

  @UseGuards(VendorAuthGuard)
  @Get('list-services')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get list of services from master database without service items',
  })
  @ApiResponse({
    status: 200,
    description: 'Services list retrieved successfully',
  })
  listServices(@Req() req: any) {
    return this.vendorService.listServices();
  }

  @UseGuards(VendorAuthGuard)
  @Post('service/toggle-active')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Activate or deactivate a vendor service',
  })
  @ApiBody({ type: ToggleServiceActiveDto })
  @ApiResponse({
    status: 200,
    description: 'Service status updated successfully',
  })
  toggleServiceActive(@Req() req: any, @Body() body: ToggleServiceActiveDto) {
    return this.vendorService.toggleServiceActive(req.vendor?.phone, body);
  }

  @UseGuards(VendorAuthGuard)
  @Get('notifications')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get vendor notifications' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
  })
  getNotifications(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.vendorService.getNotifications(req.vendor?.phone, page, limit);
  }

  @UseGuards(VendorAuthGuard)
  @Get('reviews')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get vendor reviews' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  getMyReviews(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.vendorService.getMyReviews(req.vendor?.phone, page, limit);
  }

  @UseGuards(VendorAuthGuard)
  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout vendor' })
  @ApiResponse({ status: 200, description: 'Vendor logged out successfully' })
  logout(@Req() req: any) {
    return this.vendorService.logout(req.vendor?.phone);
  }

  @UseGuards(VendorAuthGuard)
  @Get('services-by-state')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get services grouped by verified/unverified states',
  })
  @ApiResponse({
    status: 200,
    description: 'Services retrieved by state successfully',
    schema: {
      type: 'object',
      properties: {
        verified: {
          type: 'array',
          items: { type: 'object' },
        },
        unverified: {
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  })
  getServicesByState(@Req() req: any) {
    return this.vendorService.getServicesByState(req.vendor?.phone);
  }

  @UseGuards(VendorAuthGuard)
  @Patch('shop-details')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update shop details' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        shop_name: { type: 'string', example: 'Clean Laundry Services' },
        contactNum: { type: 'string', example: '+919876543210' },
        address: {
          type: 'object',
          properties: {
            address_line1: { type: 'string', example: '123 Main Street' },
            address_line2: { type: 'string', example: 'Near Market' },
            city: { type: 'string', example: 'Mumbai' },
            state: { type: 'string', example: 'Maharashtra' },
            pincode: { type: 'string', example: '400001' },
            latitude: { type: 'number', example: 19.076 },
            longitude: { type: 'number', example: 72.8777 },
            landmark: { type: 'string', example: 'Near Metro Station' },
          },
        },
        operating_hours: {
          type: 'object',
          description: 'Operating hours for all days of the week',
        },
        shop_image: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Shop details updated successfully',
  })
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'shop_image', maxCount: 1 }], {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per file
    }),
    new FormDataJsonParserInterceptor(['address', 'operating_hours']),
  )
  updateShopDetails(
    @Req() req: any,
    @Body() body: UpdateShopDetailsDto,
    @UploadedFiles()
    files: {
      shop_image?: any;
    },
  ) {
    return this.vendorService.updateShopDetails(req.vendor?.phone, body, files);
  }
}
