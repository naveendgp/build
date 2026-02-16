import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import {
  UserAuthDto,
  UserVerifyOtpDto,
  UpdateProfileDto,
  AddAddressDto,
  RemoveAddressDto,
  EditAddressDto,
  FilterVendorsDto,
  CreateReviewDto,
  GetVendorReviewsDto,
  MakeOrderDto,
} from './dto';
import { UserAuthGuard } from '../auth/guards/user.guard';

@Controller('user')
@ApiTags('User')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('auth')
  @ApiOperation({ summary: 'Send OTP for authentication' })
  @ApiBody({ type: UserAuthDto })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  auth(@Body() body: UserAuthDto) {
    return this.userService.auth(body.phoneNumber);
  }

  @Post('resend-otp')
  @ApiOperation({ summary: 'Resend OTP to user phone number' })
  @ApiBody({ type: UserAuthDto })
  @ApiResponse({ status: 200, description: 'OTP resent successfully' })
  resendOtp(@Body() body: UserAuthDto) {
    return this.userService.resendOtp(body.phoneNumber);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP and complete authentication' })
  @ApiBody({ type: UserVerifyOtpDto })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  verifyOtp(@Body() body: UserVerifyOtpDto) {
    return this.userService.verifyOtp(
      body.phoneNumber,
      body.otp,
      body.fcm_token,
    );
  }

  @UseGuards(UserAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  me(@Req() req: any) {
    return this.userService.getMeByPhoneNumber(req.user?.phone);
  }

  @UseGuards(UserAuthGuard)
  @Post('update-profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  updateProfile(@Req() req: any, @Body() body: UpdateProfileDto) {
    return this.userService.updateProfile(req.user?.phone, body);
  }

  @UseGuards(UserAuthGuard)
  @Post('add-address')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add a new address' })
  @ApiBody({ type: AddAddressDto })
  @ApiResponse({ status: 200, description: 'Address added successfully' })
  addAddress(@Req() req: any, @Body() body: AddAddressDto) {
    return this.userService.addAddress(req.user?.phone, body);
  }

  @UseGuards(UserAuthGuard)
  @Delete('remove-address')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove an address' })
  @ApiBody({ type: RemoveAddressDto })
  @ApiResponse({ status: 200, description: 'Address removed successfully' })
  removeAddress(@Req() req: any, @Body() body: RemoveAddressDto) {
    return this.userService.removeAddress(req.user?.phone, body.addressId);
  }

  @UseGuards(UserAuthGuard)
  @Post('edit-address')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Edit an existing address' })
  @ApiBody({ type: EditAddressDto })
  @ApiResponse({ status: 200, description: 'Address updated successfully' })
  editAddress(@Req() req: any, @Body() body: EditAddressDto) {
    return this.userService.editAddress(req.user?.phone, body.addressId, {
      label: body.label,
      address_line1: body.address_line1,
      address_line2: body.address_line2,
      latitude: body.latitude,
      longitude: body.longitude,
      is_default: body.is_default,
    });
  }

  @UseGuards(UserAuthGuard)
  @Get('addresses')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all user addresses' })
  @ApiResponse({ status: 200, description: 'Addresses retrieved successfully' })
  getAddresses(@Req() req: any) {
    return this.userService.getAddresses(req.user?.phone);
  }

  @UseGuards(UserAuthGuard)
  @Post('vendors')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List vendors with filters',
    description:
      'Retrieve a paginated list of vendors based on filters. Supports filtering by location (within 10km radius), service types, express delivery, offers, and vendor name search. Results are sorted and paginated.',
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
    example: 10,
  })
  @ApiBody({ type: FilterVendorsDto })
  listVendors(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Body() body: FilterVendorsDto,
  ) {
    return this.userService.listVendors(req.user?.phone, page, limit, body);
  }

  @Post('vendors-public')
  @ApiOperation({
    summary: 'List all vendors with filters (Public)',
    description:
      'Retrieve a paginated list of all vendors based on filters. Does not require authentication and ignores location-based filtering.',
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
    example: 10,
  })
  @ApiBody({ type: FilterVendorsDto })
  listVendorsPublic(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Body() body: FilterVendorsDto,
  ) {
    return this.userService.listVendorsPublic(
      Number(page),
      Number(limit),
      body,
    );
  }

  // @UseGuards(UserAuthGuard)
  @Get('list-services')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get list of available services' })
  @ApiResponse({
    status: 200,
    description: 'Services list retrieved successfully',
  })
  listServices(@Req() req: any) {
    return this.userService.getServicesList();
  }

  @UseGuards(UserAuthGuard)
  @Post('preview-order')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Preview order details before placing' })
  @ApiBody({ type: MakeOrderDto })
  @ApiResponse({
    status: 200,
    description: 'Order preview generated successfully',
  })
  previewOrder(@Req() req: any, @Body() body: MakeOrderDto) {
    return this.userService.previewOrder(req?.user, body);
  }

  @UseGuards(UserAuthGuard)
  @Post('make-order')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Place a new order' })
  @ApiBody({ type: MakeOrderDto })
  @ApiResponse({
    status: 200,
    description: 'Order placed successfully',
  })
  makeOrder(@Req() req: any, @Body() body: MakeOrderDto) {
    return this.userService.makeOrder(req?.user, body);
  }

  @UseGuards(UserAuthGuard)
  @Post('create-review')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a review for an order' })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({ status: 200, description: 'Review created successfully' })
  createReview(@Req() req: any, @Body() body: CreateReviewDto) {
    return this.userService.createReview(
      req.user?.phone,
      body.orderId,
      body.rating,
      body.comment,
    );
  }

  @UseGuards(UserAuthGuard)
  @Get('my-reviews')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user reviews' })
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
  getUserReviews(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.userService.getUserReviews(req.user?.phone, page, limit);
  }

  @UseGuards(UserAuthGuard)
  @Get('vendor/:vendorId/reviews')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get vendor reviews' })
  @ApiParam({
    name: 'vendorId',
    description: 'Vendor ID',
    example: '507f1f77bcf86cd799439011',
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
    example: 10,
  })
  getVendorReviews(
    @Param('vendorId') vendorId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.userService.getVendorReviews(vendorId, page, limit);
  }

  // @UseGuards(UserAuthGuard)
  @Get('vendor/details/:vendorId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get vendor details' })
  @ApiParam({
    name: 'vendorId',
    description: 'Vendor ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Vendor details retrieved successfully',
  })
  getVendorDetails(@Param('vendorId') vendorId: string, @Req() req: any) {
    return this.userService.getVendorDetails(vendorId, req.user?.phone);
  }

  // @UseGuards(UserAuthGuard)
  @Get('services/filter-list')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get filter lists for services' })
  @ApiResponse({
    status: 200,
    description: 'Filter lists retrieved successfully',
  })
  getFilterLists() {
    return this.userService.getFilterLists();
  }

  @UseGuards(UserAuthGuard)
  @Get('orders')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user order history' })
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
  getOrderHistory(
    @Req() req: any,
    @Query('page') page: any = 1,
    @Query('limit') limit: any = 10,
  ) {
    // Convert query parameters to numbers (they come as strings from URL)
    const pageNum =
      typeof page === 'string' ? parseInt(page, 10) || 1 : Number(page) || 1;
    const limitNum =
      typeof limit === 'string'
        ? parseInt(limit, 10) || 10
        : Number(limit) || 10;

    return this.userService.getOrderHistory(req.user?.phone, pageNum, limitNum);
  }

  @UseGuards(UserAuthGuard)
  @Get('order/:orderId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({
    name: 'orderId',
    description: 'Order ID',
    example: '507f1f77bcf86cd799439011',
  })
  getOrderById(@Req() req: any, @Param('orderId') orderId: string) {
    return this.userService.getOrderById(req.user?.phone, orderId);
  }



  @UseGuards(UserAuthGuard)
  @Get('notifications')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user notifications' })
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
    return this.userService.getNotifications(req.user?.phone, page, limit);
  }

  @UseGuards(UserAuthGuard)
  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User logged out successfully' })
  logout(@Req() req: any) {
    return this.userService.logout(req.user?.phone);
  }

  @UseGuards(UserAuthGuard)
  @Get('cancel-order/:orderId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiParam({
    name: 'orderId',
    description: 'Order ID to cancel',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  cancelOrder(@Req() req: any, @Param('orderId') orderId: string) {
    return this.userService.cancelOrder(req.user?._id.toString(), orderId);
  }

  @Post('delete')
  @ApiOperation({ summary: 'Dummy endpoint to acknowledge user deletion' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          example: '507f1f77bcf86cd799439011',
          description: 'Identifier of the user to delete',
        },
      },
      required: ['userId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Always returns success for user deletion request',
  })
  deleteUser(@Body('userId') userId: string) {
    return {
      success: true,
      message: 'User delete request success',
      data: userId,
    };
  }


  @Post('webhook-cf')
  async webhookCashfree(@Req() req: any, @Body() body: any) {
    return this.userService.webhookCashfree(body, req.headers);
  }

  @UseGuards(UserAuthGuard)
  @Post('make-payment')
  async makePayment(@Req() req: any, @Body() body: any) {
    return this.userService.makePayment(req.user?.phone, body);
  }

  @UseGuards(UserAuthGuard)
  @Post('change-payment-method')
  async changePaymentMethod(@Req() req: any, @Body() body: any) {
    return this.userService.changePaymentMethod(req.user?.phone, body);
  }
}
