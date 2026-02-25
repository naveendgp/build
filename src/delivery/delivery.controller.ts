import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
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
import { DeliveryService } from './delivery.service';
import {
  DeliveryLoginDto,
  DeliveryVerifyOtpDto,
  UpdateLocationDto,
  UpdateAvailabilityDto,
} from './dto';
import { DeliveryAuthGuard } from '../auth/guards/delivery.guard';
import { ChaosInterceptor } from '../common/interceptors/chaos.interceptor';

@Controller('delivery')
@ApiTags('Delivery')
@UseInterceptors(ChaosInterceptor)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  // Register removed: delivery persons must be pre-whitelisted

  @Post('login')
  @ApiOperation({ summary: 'Send OTP for delivery person login' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiBody({ type: DeliveryLoginDto })
  login(@Body() body: DeliveryLoginDto) {
    return this.deliveryService.login(body.phoneNumber);
  }

  @Post('resend-otp')
  @ApiOperation({ summary: 'Resend OTP to delivery person phone number' })
  @ApiResponse({ status: 200, description: 'OTP resent successfully' })
  @ApiBody({ type: DeliveryLoginDto })
  resendOtp(@Body() body: DeliveryLoginDto) {
    return this.deliveryService.resendOtp(body.phoneNumber);
  }

  @Post('verify-otp')
  @ApiOperation({
    summary: 'Verify OTP and complete delivery person authentication',
  })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiBody({ type: DeliveryVerifyOtpDto })
  verifyOtp(@Body() body: DeliveryVerifyOtpDto) {
    return this.deliveryService.verifyOtp(
      body.phoneNumber,
      body.otp,
      body.fcm_token,
    );
  }

  // ===== DISABLED: All non-OTP rider routes commented out =====

  // @UseGuards(DeliveryAuthGuard)
  // @Get('me')
  // @ApiBearerAuth('JWT-auth')
  // @ApiOperation({ summary: 'Get delivery person profile' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Delivery person details retrieved',
  // })
  // me(@Req() req: any) {
  //   return this.deliveryService.getMeByPhoneNumber(req.delivery?.phone);
  // }

  // @UseGuards(DeliveryAuthGuard)
  // @Post('update-location')
  // @ApiBearerAuth('JWT-auth')
  // @ApiOperation({ summary: 'Update delivery person location' })
  // @ApiResponse({ status: 200, description: 'Location updated successfully' })
  // @ApiBody({ type: UpdateLocationDto })
  // updateLocation(@Req() req: any, @Body() body: UpdateLocationDto) {
  //   return this.deliveryService.updateLocation(
  //     req.delivery?.phone,
  //     body.latitude,
  //     body.longitude,
  //   );
  // }

  // @UseGuards(DeliveryAuthGuard)
  // @Post('update-availability')
  // @ApiBearerAuth('JWT-auth')
  // @ApiOperation({ summary: 'Update delivery person availability status' })
  // @ApiResponse({ status: 200, description: 'Availability status updated' })
  // @ApiBody({ type: UpdateAvailabilityDto })
  // updateAvailability(@Req() req: any, @Body() body: UpdateAvailabilityDto) {
  //   return this.deliveryService.updateAvailability(
  //     req.delivery?.phone,
  //     body.status,
  //   );
  // }

  // @UseGuards(DeliveryAuthGuard)
  // @Patch('order/:orderId/status')
  // @ApiBearerAuth('JWT-auth')
  // @ApiOperation({ summary: 'Update order status' })
  // @ApiParam({
  //   name: 'orderId',
  //   description: 'Order ID',
  //   example: '507f1f77bcf86cd799439011',
  // })
  // @ApiQuery({
  //   name: 'status',
  //   required: true,
  //   type: Number,
  //   description: 'Order status number',
  //   example: 1,
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Order status updated successfully',
  // })
  // @ApiBody({
  //   schema: { properties: { otp: { type: 'number', example: 123456 } } },
  //   required: false,
  // })
  // updateOrderStatus(
  //   @Req() req: any,
  //   @Param('orderId') orderId: string,
  //   @Query('status') status: number,
  //   @Body('otp') otp?: number,
  //   @Body('weight') weight?: number,
  //   @Body('amount') amount?: number,
  // ) {
  //   return this.deliveryService.updateOrderStatus(
  //     req.delivery?.phone,
  //     orderId,
  //     status,
  //     otp,
  //     weight,
  //     amount,
  //   );
  // }

  // @UseGuards(DeliveryAuthGuard)
  // @Post('accept-order/:orderId')
  // @ApiBearerAuth('JWT-auth')
  // @ApiOperation({ summary: 'Accept an order' })
  // @ApiParam({
  //   name: 'orderId',
  //   description: 'Order ID',
  //   example: '507f1f77bcf86cd799439011',
  // })
  // @ApiResponse({ status: 200, description: 'Order accepted successfully' })
  // acceptOrder(@Req() req: any, @Param('orderId') orderId: string) {
  //   return this.deliveryService.acceptOrder(req.delivery?.phone, orderId);
  // }

  // // Endpoint: GET /delivery/order?status=...
  // @UseGuards(DeliveryAuthGuard)
  // @Get('order')
  // @ApiBearerAuth('JWT-auth')
  // @ApiOperation({ summary: 'Get filtered orders by status' })
  // @ApiQuery({
  //   name: 'status',
  //   required: false,
  //   type: String,
  //   description: 'Filter orders by status',
  //   example: 'completed',
  // })
  // @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  // getOrders(@Req() req: any, @Query('status') status?: string) {
  //   return this.deliveryService.getOrderDetails(
  //     req.delivery?.phone,
  //     undefined,
  //     status,
  //   );
  // }

  // // Endpoint: GET /delivery/order/:orderId
  // @UseGuards(DeliveryAuthGuard)
  // @Get('order/:orderId')
  // @ApiBearerAuth('JWT-auth')
  // @ApiOperation({ summary: 'Get specific order details' })
  // @ApiParam({
  //   name: 'orderId',
  //   description: 'Order ID',
  //   example: '507f1f77bcf86cd799439011',
  // })
  // @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  // getOrderById(@Req() req: any, @Param('orderId') orderId: string) {
  //   return this.deliveryService.getOrderDetails(
  //     req.delivery?.phone,
  //     orderId,
  //     undefined,
  //   );
  // }

  // @UseGuards(DeliveryAuthGuard)
  // @Get('notifications')
  // @ApiBearerAuth('JWT-auth')
  // @ApiOperation({ summary: 'Get delivery person notifications' })
  // @ApiQuery({
  //   name: 'page',
  //   required: false,
  //   type: Number,
  //   description: 'Page number for pagination',
  //   example: 1,
  // })
  // @ApiQuery({
  //   name: 'limit',
  //   required: false,
  //   type: Number,
  //   description: 'Number of items per page',
  //   example: 20,
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Notifications retrieved successfully',
  // })
  // getNotifications(
  //   @Req() req: any,
  //   @Query('page') page = 1,
  //   @Query('limit') limit = 20,
  // ) {
  //   return this.deliveryService.getNotifications(
  //     req.delivery?.phone,
  //     page,
  //     limit,
  //   );
  // }

  // @UseGuards(DeliveryAuthGuard)
  // @Post('logout')
  // @ApiBearerAuth('JWT-auth')
  // @ApiOperation({ summary: 'Logout delivery person' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Delivery person logged out successfully',
  // })
  // logout(@Req() req: any) {
  //   return this.deliveryService.logout(req.delivery?.phone);
  // }

  // @UseGuards(DeliveryAuthGuard)
  // @Post('test-home')
  // testHome(@Req() req: any, @Body() body: any) {
  //   return this.deliveryService.testHome(req.delivery?.phone, body);
  // }
}
