import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DeliveryPerson,
  DeliveryPersonDocument,
} from '../schemas/delivery-person.schema';
import {
  DeliveryLog,
  DeliveryLogDocument,
} from '../schemas/delivery-log.schema';
import { OtpHelper } from '../auth/otp.helper';
import { JwtHelper } from '../auth/jwt.helper';
import googleHelper from '../helper/google.helper';
import { ResponseHelper } from '../helper/response.helper';
import { AppVersionDocument, AppVersion } from 'src/schemas/app-version.schema';
import { TrackingGateway } from './tracking.gateway';
import { Order, OrderDocument } from '../schemas/order.schema';
import { calculateLatLong, calculateDistance } from '../helper/lat-long.helper';
import { MongoCacheService } from 'src/store/mongo-cache.service';
import {
  Notification,
  NotificationDocument,
} from 'src/schemas/notification.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { Vendor, VendorDocument } from '../schemas/vendor.schema';
import { invoiceHelper } from '../helper/invoice.helper';
import { InvoiceHelper } from '../helper/invoice.helper';
import { AppConfig, AppConfigDocument } from 'src/schemas/app-config.schema';
import { EXP_CONFIG } from 'src/config/otp.config';
import { Services, ServicesDocument } from '../schemas/services.schema';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectModel(DeliveryPerson.name)
    private readonly deliveryModel: Model<DeliveryPersonDocument>,
    @InjectModel(DeliveryLog.name)
    private readonly logModel: Model<DeliveryLogDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Vendor.name)
    private readonly vendorModel: Model<VendorDocument>,
    private readonly otpHelper: OtpHelper,
    private readonly jwtHelper: JwtHelper,
    @InjectModel(AppVersion.name)
    private readonly appVersionModel: Model<AppVersionDocument>,
    @InjectModel(AppConfig.name)
    private readonly appconfigModel: Model<AppConfigDocument>,
    @InjectModel(Services.name)
    private readonly servicesModel: Model<ServicesDocument>,
    private readonly trackingGateway: TrackingGateway,
    private readonly mongoCache: MongoCacheService,
    private readonly invoiceHelper: InvoiceHelper,
  ) { }

  async login(phoneNumber: string) {
    const person = await this.deliveryModel.findOne({ phone: phoneNumber });
    if (!person) throw new NotFoundException('Delivery person not found');
    await this.otpHelper.sendOtp(phoneNumber);
    return ResponseHelper.success('OTP sent');
  }

  async resendOtp(phoneNumber: string) {
    const person = await this.deliveryModel.findOne({ phone: phoneNumber });
    if (!person) throw new NotFoundException('Delivery person not found');
    await this.otpHelper.sendOtp(phoneNumber);
    return ResponseHelper.success('OTP resent successfully');
  }

  async verifyOtp(phoneNumber: string, otp: string, fcm_token: string) {
    const ok = await this.otpHelper.verifyOTP(phoneNumber, otp);
    if (ok.type == 'error') return ResponseHelper.error('Incorrect OTP');
    const token = this.jwtHelper.sign({ phoneNumber }, 'delivery', {
      expiresIn: EXP_CONFIG.EXPIRY_DAYS as any,
    });
    const person = await this.deliveryModel
      .findOneAndUpdate(
        { phone: phoneNumber },
        { $set: { fcm_token, last_login: new Date(), session_token: token } },
        { new: true },
      )
      .lean();
    if (!person) throw new NotFoundException('Delivery person not found');

    this.trackingGateway.joinUserToGroup(
      person._id.toString(),
      person._id.toString(),
    );

    return {
      status: true,
      data: { valid: true, token },
      message: 'OTP verified',
    };
  }

  async getMeByPhoneNumber(phoneNumber: string) {
    const person = await this.deliveryModel
      .findOne({ phone: phoneNumber })
      .lean();
    if (!person) return ResponseHelper.error('Delivery person not found');

    const appVersion = await this.appVersionModel
      .findOne({ app_type: 'delivery_android' })
      .lean();
    const appConfig = await this.appconfigModel
      .findOne({ is_active: true })
      .select(['support_phone_number', 'privacy_policy_url', 'terms_url'])
      .lean();

    return ResponseHelper.success('Delivery person details retrieved', {
      person: {
        ...person,
        app_version: appVersion,
        is_in_trip: person.assigned_orders.length > 0,
        order_id: person.assigned_orders[0]?.order_id || null,
        support_phone_number: appConfig?.support_phone_number,
        privacy_policy_url: appConfig?.privacy_policy_url,
        terms_url: appConfig?.terms_url,
      },
    });
  }

  async updateLocation(
    phoneNumber: string,
    latitude: number,
    longitude: number,
  ) {
    const addressData = await googleHelper.getAddress(latitude, longitude);
    let update: any = {
      current_location: {
        latitude,
        longitude,
        last_updated: new Date(),
      },
    };

    const components = addressData.components as any;
    if (
      components &&
      components.area &&
      components.city
    ) {
      update.address = {
        ...components,
        latitude,
        longitude,
      };
    }

    const person = await this.deliveryModel
      .findOneAndUpdate({ phone: phoneNumber }, { $set: update }, { new: true })
      .lean();
    if (!person) throw new NotFoundException('Delivery person not found');
    return { status: true, data: { message: 'Location and address updated' } };
  }

  async updateAvailability(phoneNumber: string, status: number) {
    try {
      // '1-available', '2-unavailable', '3-busy', '0-offline'
      if (![1, 2].includes(status)) {
        return ResponseHelper.error(
          'Invalid status. Only available or unavailable allowed.',
        );
      }
      const mappedStatus: any = status;
      const person = await this.deliveryModel.findOne({ phone: phoneNumber });
      if (!person) throw new NotFoundException('Delivery person not found');

      if (person.availability_status === mappedStatus) {
        return ResponseHelper.error(
          'Status is already set to the requested value.',
        );
      }

      // Use updateOne to avoid full validation of correct address fields which might be missing/invalid
      await this.deliveryModel.updateOne(
        { _id: person._id },
        { $set: { availability_status: mappedStatus } }
      );
      // person.availability_status = mappedStatus;
      // await person.save();

      await this.logModel.create({
        delivery_person_id: person._id,
        type: 'changeavailability status',
        details: {
          old_status: person.availability_status,
          new_status: mappedStatus,
        },
      });

      return ResponseHelper.success('Availability status updated');
    } catch (error) {
      console.log(error);
      throw error;
    }
  }



  async getDeliveryPersonByDistance(
    toAdress,
    targetAddress,
    distanceInKm: number,
    orderCreatedAt: Date,
  ) {
    const { minLat, maxLat, minLong, maxLong } = calculateLatLong(
      distanceInKm,
      toAdress?.latitude,
      toAdress?.longitude,
    );

    // Get all available delivery persons within the bounding box
    // Removed assigned_orders filter to return all available delivery persons, not just those with zero orders
    let appConfig = await this.appconfigModel.findOne().lean();
    let deliveryPeople = await this.deliveryModel
      .find({
        'current_location.latitude': {
          $gte: minLat,
          $lte: maxLat,
          $exists: true,
          $ne: null,
        },
        'current_location.longitude': {
          $gte: minLong,
          $lte: maxLong,
          $exists: true,
          $ne: null,
        },
        assigned_orders: { $size: 0 }, // Only delivery persons with no assigned orders
        availability_status: 1, // Only available delivery persons
      })
      .lean();

    // Filter delivery people by distance using async calculateDistance
    const deliveryPeopleWithDistance = await Promise.all(
      deliveryPeople.map(async (person) => {
        const personLat = person.current_location?.latitude;
        const personLng = person.current_location?.longitude;

        if (!personLat || !personLng) return null;

        const distance = await calculateDistance(
          toAdress?.latitude,
          toAdress?.longitude,
          personLat,
          personLng,
        );

        return distance <= distanceInKm ? { person, distance } : null;
      }),
    );

    deliveryPeople = deliveryPeopleWithDistance
      .filter((item) => item !== null)
      .map((item) => item.person);

    const deliveryPeopleWithDetails = await Promise.all(
      deliveryPeople.map(async (deliveryPerson) => {
        const deliveryPersonLat =
          deliveryPerson.current_location?.latitude || 0;
        const deliveryPersonLng =
          deliveryPerson.current_location?.longitude || 0;

        let fromDistanceInfo = {
          distance_value: 0,
          distance_text: '0 km',
          duration_text: 'Unknown',
          duration_value: 0, // Duration in seconds
        };

        try {
          if (
            deliveryPersonLat &&
            deliveryPersonLng &&
            toAdress?.latitude &&
            toAdress?.longitude
          ) {
            fromDistanceInfo = await googleHelper.getDistance(
              deliveryPersonLat,
              deliveryPersonLng,
              toAdress.latitude,
              toAdress.longitude,
            );
          }
        } catch (error) {
          console.error(
            'Error calculating distance/ETA from delivery person to pickup:',
            error,
          );
        }

        let toDistanceInfo = {
          distance_value: 0,
          distance_text: '0 km',
          duration_text: 'Unknown',
          duration_value: 0, // Duration in seconds
        };

        try {
          if (
            toAdress?.latitude &&
            toAdress?.longitude &&
            targetAddress?.latitude &&
            targetAddress?.longitude
          ) {
            toDistanceInfo = await googleHelper.getDistance(
              toAdress.latitude,
              toAdress.longitude,
              targetAddress.latitude,
              targetAddress.longitude,
            );
          }
        } catch (error) {
          console.error(
            'Error calculating distance/ETA from pickup to delivery:',
            error,
          );
        }

        const fromDistanceKm = fromDistanceInfo.distance_value / 1000;
        const fromDistanceValue =
          fromDistanceKm < 1
            ? Math.round(fromDistanceInfo.distance_value) // meters
            : Number(fromDistanceKm.toFixed(2)); // km
        const fromDistanceUnit = fromDistanceKm < 1 ? 'm' : 'km';
        const fromDistanceFormatted = `${fromDistanceValue} ${fromDistanceUnit}`;

        const toDistanceKm = toDistanceInfo.distance_value / 1000;
        const toDistanceValue =
          toDistanceKm < 1
            ? Math.round(toDistanceInfo.distance_value) // meters
            : Number(toDistanceKm.toFixed(2)); // km
        const toDistanceUnit = toDistanceKm < 1 ? 'm' : 'km';
        const toDistanceFormatted = `${toDistanceValue} ${toDistanceUnit}`;

        // Convert Mongoose documents to plain objects to remove internal properties
        const cleanToAddress = toAdress
          ? JSON.parse(JSON.stringify(toAdress))
          : {};
        const cleanTargetAddress = targetAddress
          ? JSON.parse(JSON.stringify(targetAddress))
          : {};

        return {
          _id: deliveryPerson._id,
          driver_name: deliveryPerson.name,
          phone: deliveryPerson.phone,
          current_location: deliveryPerson.current_location,
          from_location: {
            ...cleanToAddress,
            distance: fromDistanceValue,
            distanceUnit: fromDistanceUnit,
            distanceFormatted: fromDistanceFormatted,
          },
          to_location: {
            ...cleanTargetAddress,
            distance: toDistanceValue,
            distanceUnit: toDistanceUnit,
            distanceFormatted: toDistanceFormatted,
          },
          from_eta: fromDistanceInfo.duration_text || 'Unknown',
          to_eta: toDistanceInfo.duration_text || 'Unknown',
          order_duration: orderCreatedAt,
          order_accept_endtime: new Date(orderCreatedAt.getTime()),
        };
      }),
    );

    return deliveryPeopleWithDetails;
  }

  async updateOrderStatus(
    phone: string,
    orderId: string,
    status: number,
    otp?: number,
    weight?: number,
    amount?: number,
  ) {
    const deliveryPerson = await this.deliveryModel.findOne({ phone });
    const order = await this.orderModel.findById(orderId);
    const serviceId = order?.items[0].service_id;
    if (!deliveryPerson) throw new NotFoundException('User not found');

    // Switch the status based on the provided value
    switch (status) {
      case 4: //Reached to user or reached to vendor when return
        if (order.status != 'accepted')
          throw new NotFoundException('Incorrect order status');

        if (order.trip_type == 2) {
          if (
            deliveryPerson._id.toString() != order.driver_id_2.toString() ||
            order._id.toString() !=
            deliveryPerson.assigned_orders[0]?.order_id.toString()
          )
            throw new NotFoundException('Order does not belong to rider');

          order.status = 'reached_to_vendor';
          order.status_type = 4;
          await order.save();
        } else {
          if (
            deliveryPerson._id.toString() != order.driver_id_1.toString() ||
            order._id.toString() !=
            deliveryPerson.assigned_orders[0]?.order_id.toString()
          )
            throw new NotFoundException('Order does not belong to rider');

          order.status = 'reached_to_user';
          order.status_type = 4;
          await order.save();
        }

        break;
      case 5: //OTP confirm to user or OTP confirmation from vendor while return
        if (order.trip_type == 2) {
          if (order.status != 'reached_to_vendor')
            throw new NotFoundException('Incorrect order status');
          if (
            deliveryPerson._id.toString() != order.driver_id_2.toString() ||
            order._id.toString() !=
            deliveryPerson.assigned_orders[0]?.order_id.toString()
          )
            throw new NotFoundException('Order does not belong to rider');

          if (order.vendor_otp != otp)
            throw new NotFoundException('Incorrect OTP');

          order.status = 'out_for_delivery';
          order.status_type = 5;
          await order.save();
        } else {
          if (order.status != 'reached_to_user')
            throw new NotFoundException('Incorrect order status');
          if (
            deliveryPerson._id.toString() != order.driver_id_1.toString() ||
            order._id.toString() !=
            deliveryPerson.assigned_orders[0]?.order_id.toString()
          )
            throw new NotFoundException('Order does not belong to rider');

          if (order.user_otp != otp)
            throw new NotFoundException('Incorrect OTP');

          order.status = 'verified';
          order.status_type = 5;
          await order.save();
        }

        break;
      case 6: //Order pickup from user and confirmed or reached to user in case of return
        if (order.trip_type == 2) {
          if (order.status != 'out_for_delivery')
            throw new NotFoundException('Incorrect order status');
          if (
            deliveryPerson._id.toString() != order.driver_id_2.toString() ||
            order._id.toString() !=
            deliveryPerson.assigned_orders[0]?.order_id.toString()
          )
            throw new NotFoundException('Order does not belong to rider');

          order.status = 'reached_to_user';
          order.status_type = 6;
          await order.save();
        } else {
          if (order.status != 'verified')
            throw new NotFoundException('Incorrect order status');
          if (
            deliveryPerson._id.toString() != order.driver_id_1.toString() ||
            order._id.toString() !=
            deliveryPerson.assigned_orders[0]?.order_id.toString()
          )
            throw new NotFoundException('Order does not belong to rider');

          if (weight && weight > 0) {
            // Fetch app config and vendor data concurrently for pricing calculations
            const [appConfigData, vendorData] = await Promise.all([
              this.appconfigModel.findOne({ is_active: true }).lean(),
              this.vendorModel.findById(order.vendor_id).lean(),
            ]);
            const service = vendorData.services_offered.find((service) => service.service_id.toString() == serviceId.toString())
            const servicePrice = order?.is_express ? service?.express_price_per_kg : service?.standard_price_per_kg;

            // Update item quantity and calculate new subtotal
            order.items[0].total_price = weight * servicePrice;
            order.items[0].weight = weight;

            const subtotal = order.items[0].total_price;

            // Get pricing configuration
            const platformFeeAmount = appConfigData?.payment_config?.platform_fee || 5;
            const gstPercentage = appConfigData?.payment_config?.gst || 18;
            const deliveryFee = appConfigData?.payment_config?.delivery_fee || 0;

            // Get offer discount from existing payment details (if any)
            const offerDiscountAmount = order.payment_details?.offerDiscountAmount || 0;
            const isOfferApplied = order.payment_details?.isOfferApplied || false;
            const afterOfferAmount = subtotal - offerDiscountAmount;

            const amountToVendor = afterOfferAmount;
            const amountToPlatform = platformFeeAmount;

            const gstAmount = (afterOfferAmount * gstPercentage) / 100;

            const totalPayableAmount = afterOfferAmount + deliveryFee + gstAmount + platformFeeAmount;

            // Update payment details
            order.payment_details = {
              item_total: Math.round(subtotal * 100) / 100,
              grand_total: Math.round((subtotal + deliveryFee + gstAmount + platformFeeAmount) * 100) / 100,
              is_payment_eligible: order.payment_details?.is_payment_eligible || false,
              amount_to_vendor: Math.round(amountToVendor * 100) / 100,
              amount_to_platform: Math.round(amountToPlatform * 100) / 100,
              amount_to_vendor_after_commission:
                amountToVendor - (amountToVendor * appConfigData?.payment_config?.vendor_commission) / 100,
              delivery_fee: deliveryFee,
              gst: Math.round(gstAmount * 100) / 100,
              isOfferApplied: isOfferApplied,
              offerDiscountAmount: Math.round(offerDiscountAmount * 100) / 100,
              totalPayableAmount: Math.round(totalPayableAmount * 100) / 100,
            };

            // Update total amount
            order.total_amount = Math.round(totalPayableAmount * 100) / 100;
          }
          order.status = 'picked_up';
          order.status_timestamps.set('picked_up_at', new Date());
          order.status_type = 6;
          order.is_verified = true;
          await order.save();
          await deliveryPerson.save();
        }

        break;
      case 7: //Reached to vendor or user OTP in case of return
        if (order.trip_type == 2) {
          if (order.status != 'reached_to_user')
            throw new NotFoundException('Incorrect order status');
          if (
            deliveryPerson._id.toString() != order.driver_id_2.toString() ||
            order._id.toString() !=
            deliveryPerson.assigned_orders[0]?.order_id.toString()
          )
            throw new NotFoundException('Order does not belong to rider');

          if (order.user_otp != otp)
            throw new NotFoundException('Incorrect OTP');

          order.status = 'delivery_OTP_verified';
          order.status_type = 7;
          await order.save();
        } else {
          if (order.status != 'picked_up')
            throw new NotFoundException('Incorrect order status');
          if (
            deliveryPerson._id.toString() != order.driver_id_1.toString() ||
            order._id.toString() !=
            deliveryPerson.assigned_orders[0]?.order_id.toString()
          )
            throw new NotFoundException('Order does not belong to rider');

          order.status = 'reached_to_vendor';
          order.status_type = 7;
          await order.save();
          this.trackingGateway.removeFromGroup(
            deliveryPerson._id.toString(),
            order._id.toString(),
          );
        }

        break;
      case 8: {
        //Drop off to vendor and verify OTP
        if (order.status != 'reached_to_vendor')
          throw new NotFoundException('Incorrect order status');
        if (
          deliveryPerson._id.toString() != order.driver_id_1.toString() ||
          order._id.toString() !=
          deliveryPerson.assigned_orders[0]?.order_id.toString()
        )
          throw new NotFoundException('Order does not belong to rider');

        if (+order.vendor_otp != otp)
          throw new NotFoundException('Incorrect OTP');

        deliveryPerson.assigned_orders = [];
        order.status = 'processing';
        order.status_type = 8;
        order.status_timestamps.set('processing_at', new Date());

        // Capture processing ETA window once clothes reach vendor
        const etaStartTime = new Date();
        order.eta_start_time = etaStartTime;

        let totalProcessingMinutes = 0;
        const vendor = await this.vendorModel
          .findById(order.vendor_id)
          .select('services_offered')
          .lean();

        if (vendor?.services_offered?.length && order.items?.length) {
          for (const item of order.items) {
            const serviceDetails = vendor.services_offered.find(
              (service: any) =>
                service.service_id?.toString() === item.service_id?.toString(),
            );
            if (!serviceDetails) continue;

            const perItemMinutes = (() => {
              const expressMinutes =
                serviceDetails.express_delivery_time_minutes ||
                (serviceDetails.express_time
                  ? serviceDetails.express_time * 60
                  : 0);
              const normalMinutes =
                serviceDetails.normal_delivery_time_minutes ||
                (serviceDetails.standard_time
                  ? serviceDetails.standard_time * 60
                  : 0);
              return order.is_express ? expressMinutes : normalMinutes;
            })();

            totalProcessingMinutes += perItemMinutes * (item.quantity || 0);
          }
        }

        order.eta_end_time =
          totalProcessingMinutes > 0
            ? new Date(
              etaStartTime.getTime() + totalProcessingMinutes * 60 * 1000,
            )
            : etaStartTime;

        await deliveryPerson.save();
        await order.save();

        // Push pending orders to newly available rider
        this.pushPendingOrdersToRider(deliveryPerson._id.toString());
        break;
      }
      case 10: //Vendor pickup after processing order
        if (order.status != 'processed')
          throw new NotFoundException('Incorrect order status');
        if (
          deliveryPerson._id.toString() != order.driver_id_2.toString() ||
          order._id.toString() !=
          deliveryPerson.assigned_orders[0]?.order_id.toString()
        )
          throw new NotFoundException('Order does not belong to rider');

        order.status = 'out_for_delivery';
        order.status_timestamps.set('processed_at', new Date());
        await order.save();
        break;
      case 9: //Payment completed and delivery order when return
        if (order.status != 'delivery_OTP_verified')
          throw new NotFoundException('Incorrect order status');
        if (
          deliveryPerson._id.toString() != order.driver_id_2.toString() ||
          order._id.toString() !=
          deliveryPerson.assigned_orders[0]?.order_id.toString()
        )
          throw new NotFoundException('Order does not belong to rider');
        if (order.payment == 2 && order.payment_status != 'paid') {
          throw new NotFoundException('Payment not completed');
        }

        order.status_timestamps.set('paid_at', new Date());
        deliveryPerson.assigned_orders = [];
        order.status = 'delivered';
        order.status_timestamps.set('delivered_at', new Date());
        if (order.payment == 1 && !amount) {
          throw new NotFoundException('Enter cash amount');
        }
        if (order.payment == 1 && (Math.floor(amount) != Math.floor(order.total_amount))) {
          throw new NotFoundException(`Enter correct cash amount, amount to be recived is : ${Math.floor(order.total_amount)}`);
        }

        order.cash_paid_amount = amount;
        order.payment_status = 'paid';
        order.payment_details.is_payment_eligible = false;
        this.invoiceHelper.generateInvoiceForOrder(order._id.toString());
        await this.vendorModel.findByIdAndUpdate(order.vendor_id, {
          $inc: { amount_due: order.payment_details.amount_to_vendor_after_commission },
          $push: { orders_to_be_settled: order._id.toString() },
        });

        await deliveryPerson.save();
        await order.save();

        // Push pending orders to newly available rider
        this.pushPendingOrdersToRider(deliveryPerson._id.toString());
        break;
      case 11: //Delivered to user
        if (
          order.status != 'out_for_delivery' &&
          order.payment_status == 'paid'
        )
          throw new NotFoundException('Incorrect order status');
        if (
          deliveryPerson._id.toString() != order.driver_id_2.toString() ||
          order._id.toString() !=
          deliveryPerson.assigned_orders[0]?.order_id.toString()
        )
          throw new NotFoundException('Order does not belong to rider');


        deliveryPerson.assigned_orders = [];
        order.status = 'delivered';
        order.status_timestamps.set('delivered_at', new Date());

        await deliveryPerson.save();
        await order.save();

        // // Generate invoice asynchronously (don't block the response)
        // await this.generateInvoiceForOrder(order._id.toString()).catch((error) => {
        //   console.error(
        //     'Error generating invoice for order:',
        //     order._id,
        //     error,
        //   );
        // });

        break;
      default:
        throw new NotFoundException('Invalid status update');
    }

    return { status: true, message: 'Status update successful' };
  }

  async acceptOrder(phone: string, orderId: string) {
    try {
      const deliveryPerson = await this.deliveryModel.findOne({ phone });
      // Fetch the order first to get details like trip_type
      const orderCheck = await this.orderModel.findById(orderId);

      if (!deliveryPerson) throw new NotFoundException('User not found');
      if (!orderCheck) throw new NotFoundException('Order not found');

      // Optimistic check
      if (orderCheck.status != 'accepted' && orderCheck.status != 'processed') {
        console.log(orderCheck.status);
        throw new NotFoundException('Order is not available for acceptance');
      }

      // Atomic update to prevent race conditions
      const updateOp: any = {
        $set: {
          status: 'accepted',
          rider: {
            name: deliveryPerson.name,
            phone: deliveryPerson.phone,
          },
          status_type: 3,
          'status_timestamps.driver_assigned_at': new Date(),
        },
      };

      if (orderCheck.trip_type == 1) {
        updateOp.$set.driver_id_1 = deliveryPerson._id;
      } else {
        updateOp.$set.driver_id_2 = deliveryPerson._id;
      }

      // Finds the order and updates it only if status is NOT 'accepted' or 'processed'
      // effectively locking it for this request.
      const order: any = await this.orderModel.findOneAndUpdate(
        {
          _id: orderId,
        },
        updateOp,
        { new: true },
      );

      if (!order) {
        throw new NotFoundException('Order is not available for acceptance');
      }

      // Assign order to delivery person
      deliveryPerson.assigned_orders = [
        {
          order_id: order._id,
          pickup_from_user_id: order.user_id,
          deliver_to_vendor_id: order.vendor_id,
          status: 'accepted',
          expected_delivery_time: order.expected_delivery_date,
        },
      ];

      await deliveryPerson.save();

      this.trackingGateway.publishEventToGroup(
        orderId,
        {},
        'order-status',
      );

      // Find all cache entries that contain this orderId
      const cacheEntriesWithOrder = await this.mongoCache.findEntriesWithOrder(
        orderId.toString(),
      );

      // For each delivery person who has this orderId in cache, remove it
      for (const cacheEntry of cacheEntriesWithOrder) {
        const deliveryPersonId = cacheEntry.delivery_person_id.toString();
        const cachedOrders = cacheEntry.cached_orders;

        if (!Array.isArray(cachedOrders) || cachedOrders.length === 0) {
          continue;
        }

        // Remove the order from cache
        const updatedOrders = cachedOrders.filter(
          (cachedOrder: any) =>
            cachedOrder.order_id?.toString() !== orderId.toString(),
        );

        // Get the TTL for this key by checking minimum order_duration
        // If no orders remain, we can just delete the key or set empty array
        if (updatedOrders.length > 0) {
          // Recalculate TTL based on MINIMUM expiry time among remaining orders
          // This ensures expired orders don't keep the cache alive
          const allOrderDurations = updatedOrders
            .map((cachedOrder: any) => {
              const orderDuration = cachedOrder.details?.order_duration
                ? new Date(cachedOrder.details.order_duration)
                : null;
              return orderDuration;
            })
            .filter((duration: Date | null) => duration !== null) as Date[];

          if (allOrderDurations.length > 0) {
            const minOrderDuration = allOrderDurations.reduce(
              (min: Date, orderDuration: Date) => {
                return orderDuration < min ? orderDuration : min;
              },
              allOrderDurations[0],
            );

            const currentTime = new Date();
            const ttlMs = Math.max(
              0,
              minOrderDuration.getTime() - currentTime.getTime(),
            );

            // Update cache with filtered orders and TTL based on minimum expiry
            await this.mongoCache.set(deliveryPersonId, updatedOrders, ttlMs);
          } else {
            // Fallback: if no valid order durations, use default TTL
            await this.mongoCache.set(deliveryPersonId, updatedOrders);
          }
        } else {
          // No orders left, remove from cache
          await this.mongoCache.delete(deliveryPersonId);
        }

        // Publish updated list to this delivery person
        const ordersToPublish = updatedOrders.length > 0 ? updatedOrders : [];
        await this.trackingGateway.publishEventToGroup(
          deliveryPersonId,
          ordersToPublish,
          'order-list',
        );
      }

      return { status: true, message: 'Order accepted by delivery person' };
    } catch (error) {
      throw error;
    }
  }

  async getOrderDetails(phone: string, orderId?: string, status?: string) {
    const deliveryPerson = await this.deliveryModel.findOne({ phone });
    if (!deliveryPerson)
      throw new NotFoundException('Delivery person not found');

    // Default status = 'completed'
    let orderStatus = status || 'completed';
    if (orderStatus == 'completed') orderStatus = 'delivered';

    // Case 1: specific order ID
    if (orderId) {
      const order: any = await this.orderModel.findById(orderId).lean();
      if (!order) throw new NotFoundException('Order not found');
      const vendor = await this.vendorModel
        .findById(order.vendor_id)
        .select(['shop_name', 'owner_name', 'contactNum', 'phone'])
        .lean();

      // Ensure the order belongs to this delivery person
      if (
        order.driver_id_1?.toString() !== deliveryPerson._id.toString() &&
        order.driver_id_2?.toString() !== deliveryPerson._id.toString()
      ) {
        throw new NotFoundException('Order does not belong to this rider');
      }

      const user = await this.userModel
        .findById(order.user_id)
        .select(['name', 'phone'])
        .lean();
      const service = await this.servicesModel
        .findById(order.items[0].service_id)
        .select('pricing_type')
        .lean();

      const orderWithUserDetails = {
        ...order,
        user_details: user || {},
        service_type: service.pricing_type == 'per_pc' ? 1 : 2,
        service_type_str: service.pricing_type,
        shop_name: vendor?.shop_name || '',
        owner_name: vendor?.owner_name || '',
        contact_num: vendor?.contactNum || '',
        phone: vendor?.phone || '',
      };

      return { status: true, data: orderWithUserDetails };
    }

    // Case 2: filter orders by status
    const orders: any[] = await this.orderModel
      .find({
        $or: [
          { driver_id_1: deliveryPerson._id },
          { driver_id_2: deliveryPerson._id },
        ],
        status: orderStatus,
      })
      .lean();

    // Batch-load all users for these orders
    const userIds = Array.from(
      new Set(orders.map((o) => o.user_id?.toString()).filter((id) => !!id)),
    );

    const users = await this.userModel
      .find({ _id: { $in: userIds } })
      .select(['name', 'phone'])
      .lean();

    const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

    // Batch-load all vendors for these orders
    const vendorIds = Array.from(
      new Set(orders.map((o) => o.vendor_id?.toString()).filter((id) => !!id)),
    );

    const vendors = await this.vendorModel
      .find({ _id: { $in: vendorIds } })
      .select(['owner_name', 'shop_name'])
      .lean();

    const vendorMap = new Map(vendors.map((v: any) => [v._id.toString(), v.owner_name]));

    const vendorMapShop = new Map(vendors.map((v: any) => [v._id.toString(), v.shop_name]));
    const ordersWithUserDetails = orders.map((order: any) => ({
      ...order,
      user_details: userMap.get(order.user_id?.toString()) || {},
      vendor_name: vendorMap.get(order.vendor_id?.toString()) || '',
      shop_name: vendorMapShop.get(order.vendor_id?.toString()) || '',
    }));

    return { status: true, data: ordersWithUserDetails };
  }

  async getNotifications(
    phoneNumber: string,
    page: number = 1,
    limit: number = 20,
  ) {
    try {
      const deliveryPerson = await this.deliveryModel.findOne({
        phone: phoneNumber,
      });
      if (!deliveryPerson)
        return ResponseHelper.error('Delivery person not found');

      const skip = (page - 1) * limit;

      const [notifications, total, unreadCount] = await Promise.all([
        this.notificationModel
          .find({
            recipient_id: deliveryPerson._id,
            recipient_role: 'delivery',
          })
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        this.notificationModel.countDocuments({
          recipient_id: deliveryPerson._id,
          recipient_role: 'delivery',
        }),
        this.notificationModel.countDocuments({
          recipient_id: deliveryPerson._id,
          recipient_role: 'delivery',
          is_read: false,
        }),
      ]);

      // Mark fetched notifications as read
      const notificationIds = notifications
        .filter((n) => !n.is_read)
        .map((n) => n._id);

      if (notificationIds.length > 0) {
        await this.notificationModel.updateMany(
          { _id: { $in: notificationIds } },
          {
            is_read: true,
            read_at: new Date(),
          },
        );
      }

      return ResponseHelper.success('Notifications retrieved', {
        notifications: notifications,
        total,
        unreadCount,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error('Error getting notifications:', error);
      return ResponseHelper.error('Failed to get notifications');
    }
  }

  /**
   * Generate invoice for a delivered order
   * This method is called asynchronously when an order is marked as delivered
   */
  private async generateInvoiceForOrder(orderId: string): Promise<void> {
    try {
      const result = await invoiceHelper.generateInvoice(
        orderId,
        this.orderModel,
        this.userModel,
        this.vendorModel,
      );

      if (result.success && result.invoiceUrl) {
        // Update order with invoice URL
        await this.orderModel.findByIdAndUpdate(orderId, {
          invoice_url: result.invoiceUrl,
        });
        console.log(
          `Invoice generated successfully for order ${orderId}: ${result.invoiceUrl}`,
        );
      } else {
        console.error(
          `Failed to generate invoice for order ${orderId}:`,
          result.error,
        );
      }
    } catch (error) {
      console.error(
        `Error in generateInvoiceForOrder for order ${orderId}:`,
        error,
      );
    }
  }

  async logout(phone: string) {
    try {
      const deliveryPeople = await this.deliveryModel.findOneAndUpdate(
        { phone },
        { session_token: null, fcm_token: null },
      );
      this.trackingGateway.deleteGroup(deliveryPeople?._id.toString());
      if (!deliveryPeople) {
        return ResponseHelper.error('Delivery People not found');
      }
      return ResponseHelper.success('Logout successful');
    } catch (error) {
      console.error('Error during logout:', error);
      return ResponseHelper.error('Failed to logout');
    }
  }

  /**
   * Push pending orders to a newly available rider
   * Called when a rider completes a trip to immediately notify them of pending orders
   */
  private async pushPendingOrdersToRider(deliveryPersonId: string) {
    try {
      const existingCache = await this.mongoCache.get<any>(deliveryPersonId);
      if (existingCache && Array.isArray(existingCache) && existingCache.length > 0) {
        // Rider has pending orders in cache, push them immediately
        await this.trackingGateway.publishEventToGroup(
          deliveryPersonId,
          existingCache,
          'order-list',
        );
        console.log(`Pushed ${existingCache.length} pending orders to rider ${deliveryPersonId}`);
      }
    } catch (error) {
      console.error('Error pushing pending orders to rider:', error);
    }
  }

  async testHome(phone: string, body: any) {
    try {
      const deliveryPeople = await this.deliveryModel.findOne({ phone: phone });
      if (!deliveryPeople) {
        return ResponseHelper.error('Delivery People not found');
      }

      let orders = await this.orderModel.find().limit(2);

      this.trackingGateway.publishEventToGroup(
        deliveryPeople._id.toString(),
        orders,
        'order-list',
      );

      return ResponseHelper.success('Test home event sent');
    } catch (error) {
      console.error('Error during logout:', error);
      return ResponseHelper.error('Failed to logout');
    }
  }
}
