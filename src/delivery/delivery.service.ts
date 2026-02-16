import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OtpHelper } from '../auth/otp.helper';
import { JwtHelper } from '../auth/jwt.helper';
import googleHelper from '../helper/google.helper';
import { ResponseHelper } from '../helper/response.helper';
import { TrackingGateway } from './tracking.gateway';
import { calculateLatLong, calculateDistance } from '../helper/lat-long.helper';
import { PrismaCacheService } from '../store/prisma-cache.service';
import { InvoiceHelper } from '../helper/invoice.helper';
import { EXP_CONFIG } from '../config/otp.config';

@Injectable()
export class DeliveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpHelper: OtpHelper,
    private readonly jwtHelper: JwtHelper,
    private readonly trackingGateway: TrackingGateway,
    private readonly prismaCache: PrismaCacheService,
    private readonly invoiceHelper: InvoiceHelper,
  ) {}

  async login(phoneNumber: string) {
    const person = await this.prisma.deliveryPerson.findUnique({
      where: { phone: phoneNumber },
    });
    if (!person) throw new NotFoundException('Delivery person not found');
    await this.otpHelper.sendOtp(phoneNumber);
    return ResponseHelper.success('OTP sent');
  }

  async resendOtp(phoneNumber: string) {
    const person = await this.prisma.deliveryPerson.findUnique({
      where: { phone: phoneNumber },
    });
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

    let person;
    try {
      person = await this.prisma.deliveryPerson.update({
        where: { phone: phoneNumber },
        data: { fcmToken: fcm_token, sessionToken: token },
      });
    } catch (e) {
      throw new NotFoundException('Delivery person not found');
    }

    this.trackingGateway.joinUserToGroup(person.id, person.id);

    return {
      status: true,
      data: { valid: true, token },
      message: 'OTP verified',
    };
  }

  async getMeByPhoneNumber(phoneNumber: string) {
    const person = await this.prisma.deliveryPerson.findUnique({
      where: { phone: phoneNumber },
      include: { assignedOrders: true },
    });
    if (!person) return ResponseHelper.error('Delivery person not found');

    const appVersion = await this.prisma.appVersion.findFirst({
      where: { appType: 'delivery_android' },
    });
    const appConfig = await this.prisma.appConfig.findFirst({
      where: { isActive: true },
      select: { supportPhoneNumber: true, privacyPolicyUrl: true, termsUrl: true },
    });

    return ResponseHelper.success('Delivery person details retrieved', {
      person: {
        ...person,
        app_version: appVersion,
        is_in_trip: person.assignedOrders.length > 0,
        order_id: person.assignedOrders[0]?.orderId || null,
        support_phone_number: appConfig?.supportPhoneNumber,
        privacy_policy_url: appConfig?.privacyPolicyUrl,
        terms_url: appConfig?.termsUrl,
      },
    });
  }

  async updateLocation(
    phoneNumber: string,
    latitude: number,
    longitude: number,
  ) {
    const addressData = await googleHelper.getAddress(latitude, longitude);
    const updateData: any = {
      currentLatitude: latitude,
      currentLongitude: longitude,
      locationLastUpdated: new Date(),
    };

    const components = addressData.components as any;
    if (components && components.area && components.city) {
      updateData.addressArea = components.area;
      updateData.addressLocality = components.locality;
      updateData.addressCity = components.city;
      updateData.addressState = components.state;
      updateData.addressPincode = components.pincode;
      updateData.addressCountry = components.country;
      updateData.addressLatitude = latitude;
      updateData.addressLongitude = longitude;
    }

    const person = await this.prisma.deliveryPerson.update({
      where: { phone: phoneNumber },
      data: updateData,
    }).catch(() => null);
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
      const person = await this.prisma.deliveryPerson.findUnique({
        where: { phone: phoneNumber },
      });
      if (!person) throw new NotFoundException('Delivery person not found');

      if (person.availabilityStatus === mappedStatus) {
        return ResponseHelper.error(
          'Status is already set to the requested value.',
        );
      }

      await this.prisma.deliveryPerson.update({
        where: { id: person.id },
        data: { availabilityStatus: mappedStatus },
      });

      await this.prisma.deliveryLog.create({
        data: {
          deliveryPersonId: person.id,
          type: 'changeavailability status',
          details: {
            old_status: person.availabilityStatus,
            new_status: mappedStatus,
          },
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
    let appConfig = await this.prisma.appConfig.findFirst();
    let deliveryPeople = await this.prisma.deliveryPerson.findMany({
      where: {
        currentLatitude: { gte: minLat, lte: maxLat, not: null },
        currentLongitude: { gte: minLong, lte: maxLong, not: null },
        assignedOrders: { none: {} }, // Only delivery persons with no assigned orders
        availabilityStatus: 1, // Only available delivery persons
      },
    });

    // Filter delivery people by distance using async calculateDistance
    const deliveryPeopleWithDistance = await Promise.all(
      deliveryPeople.map(async (person) => {
        const personLat = person.currentLatitude;
        const personLng = person.currentLongitude;

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
        const deliveryPersonLat = deliveryPerson.currentLatitude || 0;
        const deliveryPersonLng = deliveryPerson.currentLongitude || 0;

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

        // Convert to plain objects to remove internal properties
        const cleanToAddress = toAdress
          ? JSON.parse(JSON.stringify(toAdress))
          : {};
        const cleanTargetAddress = targetAddress
          ? JSON.parse(JSON.stringify(targetAddress))
          : {};

        return {
          _id: deliveryPerson.id,
          driver_name: deliveryPerson.name,
          phone: deliveryPerson.phone,
          current_location: {
            latitude: deliveryPerson.currentLatitude,
            longitude: deliveryPerson.currentLongitude,
          },
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
    const deliveryPerson = await this.prisma.deliveryPerson.findUnique({
      where: { phone },
      include: { assignedOrders: true },
    });
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    const serviceId = order?.items[0]?.serviceId;
    if (!deliveryPerson) throw new NotFoundException('User not found');

    // Switch the status based on the provided value
    switch (status) {
      case 4: // Reached to user or reached to vendor when return
        if (order.status !== 'accepted')
          throw new NotFoundException('Incorrect order status');

        if (order.tripType === 2) {
          if (
            deliveryPerson.id !== order.driverId2 ||
            order.id !== deliveryPerson.assignedOrders[0]?.orderId
          )
            throw new NotFoundException('Order does not belong to rider');

          await this.prisma.order.update({
            where: { id: order.id },
            data: { status: 'reached_to_vendor', statusType: 4 },
          });
        } else {
          if (
            deliveryPerson.id !== order.driverId1 ||
            order.id !== deliveryPerson.assignedOrders[0]?.orderId
          )
            throw new NotFoundException('Order does not belong to rider');

          await this.prisma.order.update({
            where: { id: order.id },
            data: { status: 'reached_to_user', statusType: 4 },
          });
        }

        break;
      case 5: // OTP confirm to user or OTP confirmation from vendor while return
        if (order.tripType === 2) {
          if (order.status !== 'reached_to_vendor')
            throw new NotFoundException('Incorrect order status');
          if (
            deliveryPerson.id !== order.driverId2 ||
            order.id !== deliveryPerson.assignedOrders[0]?.orderId
          )
            throw new NotFoundException('Order does not belong to rider');

          if (+order.vendorOtp !== otp)
            throw new NotFoundException('Incorrect OTP');

          await this.prisma.order.update({
            where: { id: order.id },
            data: { status: 'out_for_delivery', statusType: 5 },
          });
        } else {
          if (order.status !== 'reached_to_user')
            throw new NotFoundException('Incorrect order status');
          if (
            deliveryPerson.id !== order.driverId1 ||
            order.id !== deliveryPerson.assignedOrders[0]?.orderId
          )
            throw new NotFoundException('Order does not belong to rider');

          if (order.userOtp !== otp)
            throw new NotFoundException('Incorrect OTP');

          await this.prisma.order.update({
            where: { id: order.id },
            data: { status: 'verified', statusType: 5 },
          });
        }

        break;
      case 6: // Order pickup from user and confirmed or reached to user in case of return
        if (order.tripType === 2) {
          if (order.status !== 'out_for_delivery')
            throw new NotFoundException('Incorrect order status');
          if (
            deliveryPerson.id !== order.driverId2 ||
            order.id !== deliveryPerson.assignedOrders[0]?.orderId
          )
            throw new NotFoundException('Order does not belong to rider');

          await this.prisma.order.update({
            where: { id: order.id },
            data: { status: 'reached_to_user', statusType: 6 },
          });
        } else {
          if (order.status !== 'verified')
            throw new NotFoundException('Incorrect order status');
          if (
            deliveryPerson.id !== order.driverId1 ||
            order.id !== deliveryPerson.assignedOrders[0]?.orderId
          )
            throw new NotFoundException('Order does not belong to rider');

          const orderUpdateData: any = {};

          if (weight && weight > 0) {
            // Fetch app config and vendor data concurrently for pricing calculations
            const [appConfigData, vendorData] = await Promise.all([
              this.prisma.appConfig.findFirst({ where: { isActive: true } }),
              this.prisma.vendor.findUnique({
                where: { id: order.vendorId },
                include: { servicesOffered: true },
              }),
            ]);
            const service = vendorData.servicesOffered.find(
              (vs) => vs.serviceId === serviceId,
            );
            const servicePrice = order.isExpress
              ? service?.expressPricePerKg
              : service?.standardPricePerKg;

            // Update item quantity and calculate new subtotal
            const newTotalPrice = weight * servicePrice;
            await this.prisma.orderItem.update({
              where: { id: order.items[0].id },
              data: { totalPrice: newTotalPrice, weight },
            });

            const subtotal = newTotalPrice;

            // Get pricing configuration
            const platformFeeAmount = appConfigData?.platformFee || 5;
            const gstPercentage = appConfigData?.gst || 18;
            const deliveryFee = appConfigData?.deliveryFee || 0;

            // Get offer discount from existing payment details (if any)
            const offerDiscountAmount = order.pdOfferDiscountAmount || 0;
            const isOfferApplied = order.pdIsOfferApplied || false;
            const afterOfferAmount = subtotal - offerDiscountAmount;

            const amountToVendor = afterOfferAmount;
            const amountToPlatform = platformFeeAmount;

            const gstAmount = (afterOfferAmount * gstPercentage) / 100;

            const totalPayableAmount =
              afterOfferAmount + deliveryFee + gstAmount + platformFeeAmount;

            // Update payment details (flattened on Order)
            orderUpdateData.pdItemTotal = Math.round(subtotal * 100) / 100;
            orderUpdateData.pdGrandTotal =
              Math.round(
                (subtotal + deliveryFee + gstAmount + platformFeeAmount) * 100,
              ) / 100;
            orderUpdateData.isPaymentEligible =
              order.isPaymentEligible || false;
            orderUpdateData.amountToVendor =
              Math.round(amountToVendor * 100) / 100;
            orderUpdateData.amountToPlatform =
              Math.round(amountToPlatform * 100) / 100;
            orderUpdateData.amountToVendorAfterCommission =
              amountToVendor -
              (amountToVendor * (appConfigData?.vendorCommission || 0)) / 100;
            orderUpdateData.pdDeliveryFee = deliveryFee;
            orderUpdateData.pdGst = Math.round(gstAmount * 100) / 100;
            orderUpdateData.pdIsOfferApplied = isOfferApplied;
            orderUpdateData.pdOfferDiscountAmount =
              Math.round(offerDiscountAmount * 100) / 100;
            orderUpdateData.pdTotalPayableAmount =
              Math.round(totalPayableAmount * 100) / 100;

            // Update total amount
            orderUpdateData.totalAmount =
              Math.round(totalPayableAmount * 100) / 100;
          }

          const currentTimestamps6 =
            (order.statusTimestamps as Record<string, any>) || {};
          await this.prisma.order.update({
            where: { id: order.id },
            data: {
              ...orderUpdateData,
              status: 'picked_up',
              statusTimestamps: {
                ...currentTimestamps6,
                picked_up_at: new Date(),
              },
              statusType: 6,
              isVerified: true,
            },
          });
        }

        break;
      case 7: // Reached to vendor or user OTP in case of return
        if (order.tripType === 2) {
          if (order.status !== 'reached_to_user')
            throw new NotFoundException('Incorrect order status');
          if (
            deliveryPerson.id !== order.driverId2 ||
            order.id !== deliveryPerson.assignedOrders[0]?.orderId
          )
            throw new NotFoundException('Order does not belong to rider');

          if (order.userOtp !== otp)
            throw new NotFoundException('Incorrect OTP');

          await this.prisma.order.update({
            where: { id: order.id },
            data: { status: 'delivery_OTP_verified', statusType: 7 },
          });
        } else {
          if (order.status !== 'picked_up')
            throw new NotFoundException('Incorrect order status');
          if (
            deliveryPerson.id !== order.driverId1 ||
            order.id !== deliveryPerson.assignedOrders[0]?.orderId
          )
            throw new NotFoundException('Order does not belong to rider');

          await this.prisma.order.update({
            where: { id: order.id },
            data: { status: 'reached_to_vendor', statusType: 7 },
          });
          this.trackingGateway.removeFromGroup(
            deliveryPerson.id,
            order.id,
          );
        }

        break;
      case 8: {
        // Drop off to vendor and verify OTP
        if (order.status !== 'reached_to_vendor')
          throw new NotFoundException('Incorrect order status');
        if (
          deliveryPerson.id !== order.driverId1 ||
          order.id !== deliveryPerson.assignedOrders[0]?.orderId
        )
          throw new NotFoundException('Order does not belong to rider');

        if (+order.vendorOtp !== otp)
          throw new NotFoundException('Incorrect OTP');

        // Clear assigned orders
        await this.prisma.deliveryAssignedOrder.deleteMany({
          where: { deliveryPersonId: deliveryPerson.id },
        });

        const currentTimestamps8 =
          (order.statusTimestamps as Record<string, any>) || {};

        // Capture processing ETA window once clothes reach vendor
        const etaStartTime = new Date();

        let totalProcessingMinutes = 0;
        const vendor = await this.prisma.vendor.findUnique({
          where: { id: order.vendorId },
          include: { servicesOffered: true },
        });

        if (vendor?.servicesOffered?.length && order.items?.length) {
          for (const item of order.items) {
            const serviceDetails = vendor.servicesOffered.find(
              (vs: any) => vs.serviceId === item.serviceId,
            );
            if (!serviceDetails) continue;

            const perItemMinutes = (() => {
              const expressMinutes =
                serviceDetails.expressDeliveryTimeMinutes ||
                (serviceDetails.expressTime
                  ? serviceDetails.expressTime * 60
                  : 0);
              const normalMinutes =
                serviceDetails.normalDeliveryTimeMinutes ||
                (serviceDetails.standardTime
                  ? serviceDetails.standardTime * 60
                  : 0);
              return order.isExpress ? expressMinutes : normalMinutes;
            })();

            totalProcessingMinutes += perItemMinutes * (item.quantity || 0);
          }
        }

        const etaEndTime =
          totalProcessingMinutes > 0
            ? new Date(
                etaStartTime.getTime() + totalProcessingMinutes * 60 * 1000,
              )
            : etaStartTime;

        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'processing',
            statusType: 8,
            statusTimestamps: {
              ...currentTimestamps8,
              processing_at: new Date(),
            },
            etaStartTime,
            etaEndTime,
          },
        });

        // Push pending orders to newly available rider
        this.pushPendingOrdersToRider(deliveryPerson.id);
        break;
      }
      case 10: // Vendor pickup after processing order
        if (order.status !== 'processed')
          throw new NotFoundException('Incorrect order status');
        if (
          deliveryPerson.id !== order.driverId2 ||
          order.id !== deliveryPerson.assignedOrders[0]?.orderId
        )
          throw new NotFoundException('Order does not belong to rider');

        {
          const currentTimestamps10 =
            (order.statusTimestamps as Record<string, any>) || {};
          await this.prisma.order.update({
            where: { id: order.id },
            data: {
              status: 'out_for_delivery',
              statusTimestamps: {
                ...currentTimestamps10,
                processed_at: new Date(),
              },
            },
          });
        }
        break;
      case 9: // Payment completed and delivery order when return
        if (order.status !== 'delivery_OTP_verified')
          throw new NotFoundException('Incorrect order status');
        if (
          deliveryPerson.id !== order.driverId2 ||
          order.id !== deliveryPerson.assignedOrders[0]?.orderId
        )
          throw new NotFoundException('Order does not belong to rider');
        if (order.payment === 2 && order.paymentStatus !== 'paid') {
          throw new NotFoundException('Payment not completed');
        }

        {
          const currentTimestamps9 =
            (order.statusTimestamps as Record<string, any>) || {};

          // Clear assigned orders
          await this.prisma.deliveryAssignedOrder.deleteMany({
            where: { deliveryPersonId: deliveryPerson.id },
          });

          if (order.payment === 1 && !amount) {
            throw new NotFoundException('Enter cash amount');
          }
          if (
            order.payment === 1 &&
            Math.floor(amount) !== Math.floor(order.totalAmount)
          ) {
            throw new NotFoundException(
              `Enter correct cash amount, amount to be recived is : ${Math.floor(order.totalAmount)}`,
            );
          }

          await this.prisma.order.update({
            where: { id: order.id },
            data: {
              statusTimestamps: {
                ...currentTimestamps9,
                paid_at: new Date(),
                delivered_at: new Date(),
              },
              status: 'delivered',
              cashPaidAmount: amount || 0,
              paymentStatus: 'paid',
              isPaymentEligible: false,
            },
          });

          this.invoiceHelper.generateInvoiceForOrder(order.id);

          await this.prisma.vendor.update({
            where: { id: order.vendorId },
            data: {
              amountDue: { increment: order.amountToVendorAfterCommission },
            },
          });
          await this.prisma.vendorSettlementOrder.create({
            data: { vendorId: order.vendorId, orderId: order.id },
          });

          // Push pending orders to newly available rider
          this.pushPendingOrdersToRider(deliveryPerson.id);
        }
        break;
      case 11: // Delivered to user
        if (
          order.status !== 'out_for_delivery' &&
          order.paymentStatus === 'paid'
        )
          throw new NotFoundException('Incorrect order status');
        if (
          deliveryPerson.id !== order.driverId2 ||
          order.id !== deliveryPerson.assignedOrders[0]?.orderId
        )
          throw new NotFoundException('Order does not belong to rider');

        {
          // Clear assigned orders
          await this.prisma.deliveryAssignedOrder.deleteMany({
            where: { deliveryPersonId: deliveryPerson.id },
          });

          const currentTimestamps11 =
            (order.statusTimestamps as Record<string, any>) || {};
          await this.prisma.order.update({
            where: { id: order.id },
            data: {
              status: 'delivered',
              statusTimestamps: {
                ...currentTimestamps11,
                delivered_at: new Date(),
              },
            },
          });
        }

        break;
      default:
        throw new NotFoundException('Invalid status update');
    }

    return { status: true, message: 'Status update successful' };
  }

  async acceptOrder(phone: string, orderId: string) {
    try {
      const deliveryPerson = await this.prisma.deliveryPerson.findUnique({
        where: { phone },
        include: { assignedOrders: true },
      });
      // Fetch the order first to get details like trip_type
      const orderCheck = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!deliveryPerson) throw new NotFoundException('User not found');
      if (!orderCheck) throw new NotFoundException('Order not found');

      // Optimistic check
      if (
        orderCheck.status !== 'accepted' &&
        orderCheck.status !== 'processed'
      ) {
        console.log(orderCheck.status);
        throw new NotFoundException('Order is not available for acceptance');
      }

      // Build update data
      const updateData: any = {
        status: 'accepted' as any,
        riderName: deliveryPerson.name,
        riderPhone: deliveryPerson.phone,
        statusType: 3,
        statusTimestamps: {
          ...((orderCheck.statusTimestamps as any) || {}),
          driver_assigned_at: new Date(),
        },
      };

      if (orderCheck.tripType === 1) {
        updateData.driverId1 = deliveryPerson.id;
      } else {
        updateData.driverId2 = deliveryPerson.id;
      }

      // Update the order atomically
      const order: any = await this.prisma.order.update({
        where: { id: orderId },
        data: updateData,
        include: { items: true },
      });

      if (!order) {
        throw new NotFoundException('Order is not available for acceptance');
      }

      // Assign order to delivery person — clear existing, then create new
      await this.prisma.deliveryAssignedOrder.deleteMany({
        where: { deliveryPersonId: deliveryPerson.id },
      });
      await this.prisma.deliveryAssignedOrder.create({
        data: {
          deliveryPersonId: deliveryPerson.id,
          orderId: order.id,
          pickupFromUserId: order.userId,
          deliverToVendorId: order.vendorId,
          status: 'accepted',
          expectedDeliveryTime: order.expectedDeliveryDate,
        },
      });

      this.trackingGateway.publishEventToGroup(
        orderId,
        {},
        'order-status',
      );

      // Find all cache entries that contain this orderId
      const cacheEntriesWithOrder =
        await this.prismaCache.findEntriesWithOrder(orderId.toString());

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
            .filter(
              (duration: Date | null) => duration !== null,
            ) as Date[];

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
            await this.prismaCache.set(deliveryPersonId, updatedOrders, ttlMs);
          } else {
            // Fallback: if no valid order durations, use default TTL
            await this.prismaCache.set(deliveryPersonId, updatedOrders);
          }
        } else {
          // No orders left, remove from cache
          await this.prismaCache.delete(deliveryPersonId);
        }

        // Publish updated list to this delivery person
        const ordersToPublish =
          updatedOrders.length > 0 ? updatedOrders : [];
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
    const deliveryPerson = await this.prisma.deliveryPerson.findUnique({
      where: { phone },
    });
    if (!deliveryPerson)
      throw new NotFoundException('Delivery person not found');

    // Default status = 'completed'
    let orderStatus = status || 'completed';
    if (orderStatus === 'completed') orderStatus = 'delivered';

    // Case 1: specific order ID
    if (orderId) {
      const order: any = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!order) throw new NotFoundException('Order not found');
      const vendor = await this.prisma.vendor.findUnique({
        where: { id: order.vendorId },
        select: {
          shopName: true,
          ownerName: true,
          contactNum: true,
          phone: true,
        },
      });

      // Ensure the order belongs to this delivery person
      if (
        order.driverId1 !== deliveryPerson.id &&
        order.driverId2 !== deliveryPerson.id
      ) {
        throw new NotFoundException('Order does not belong to this rider');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: order.userId },
        select: { name: true, phone: true },
      });
      const service = order.items[0]?.serviceId
        ? await this.prisma.service.findUnique({
            where: { id: order.items[0].serviceId },
            select: { pricingType: true },
          })
        : null;

      const orderWithUserDetails = {
        ...order,
        user_details: user || {},
        service_type: service?.pricingType === 'per_pc' ? 1 : 2,
        service_type_str: service?.pricingType,
        shop_name: vendor?.shopName || '',
        owner_name: vendor?.ownerName || '',
        contact_num: vendor?.contactNum || '',
        phone: vendor?.phone || '',
      };

      return { status: true, data: orderWithUserDetails };
    }

    // Case 2: filter orders by status
    const orders: any[] = await this.prisma.order.findMany({
      where: {
        OR: [
          { driverId1: deliveryPerson.id },
          { driverId2: deliveryPerson.id },
        ],
        status: orderStatus as any,
      },
      include: { items: true },
    });

    // Batch-load all users for these orders
    const userIds = Array.from(
      new Set(
        orders.map((o) => o.userId?.toString()).filter((id) => !!id),
      ),
    );

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, phone: true },
    });

    const userMap = new Map(users.map((u: any) => [u.id, u]));

    // Batch-load all vendors for these orders
    const vendorIds = Array.from(
      new Set(
        orders.map((o) => o.vendorId?.toString()).filter((id) => !!id),
      ),
    );

    const vendors = await this.prisma.vendor.findMany({
      where: { id: { in: vendorIds } },
      select: { id: true, ownerName: true, shopName: true },
    });

    const vendorMap = new Map(
      vendors.map((v: any) => [v.id, v.ownerName]),
    );

    const vendorMapShop = new Map(
      vendors.map((v: any) => [v.id, v.shopName]),
    );
    const ordersWithUserDetails = orders.map((order: any) => ({
      ...order,
      user_details: userMap.get(order.userId) || {},
      vendor_name: vendorMap.get(order.vendorId) || '',
      shop_name: vendorMapShop.get(order.vendorId) || '',
    }));

    return { status: true, data: ordersWithUserDetails };
  }

  async getNotifications(
    phoneNumber: string,
    page: number = 1,
    limit: number = 20,
  ) {
    try {
      const deliveryPerson = await this.prisma.deliveryPerson.findUnique({
        where: { phone: phoneNumber },
      });
      if (!deliveryPerson)
        return ResponseHelper.error('Delivery person not found');

      const skip = (page - 1) * limit;

      const [notifications, total, unreadCount] = await Promise.all([
        this.prisma.notification.findMany({
          where: {
            deliveryPersonId: deliveryPerson.id,
            recipientRole: 'delivery',
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.notification.count({
          where: {
            deliveryPersonId: deliveryPerson.id,
            recipientRole: 'delivery',
          },
        }),
        this.prisma.notification.count({
          where: {
            deliveryPersonId: deliveryPerson.id,
            recipientRole: 'delivery',
            isRead: false,
          },
        }),
      ]);

      // Mark fetched notifications as read
      const notificationIds = notifications
        .filter((n) => !n.isRead)
        .map((n) => n.id);

      if (notificationIds.length > 0) {
        await this.prisma.notification.updateMany({
          where: { id: { in: notificationIds } },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        });
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
      await this.invoiceHelper.generateInvoiceForOrder(orderId);
      console.log(`Invoice generated successfully for order ${orderId}`);
    } catch (error) {
      console.error(
        `Error in generateInvoiceForOrder for order ${orderId}:`,
        error,
      );
    }
  }

  async logout(phone: string) {
    try {
      const deliveryPeople = await this.prisma.deliveryPerson.findUnique({
        where: { phone },
      });
      if (!deliveryPeople) {
        return ResponseHelper.error('Delivery People not found');
      }
      await this.prisma.deliveryPerson.update({
        where: { phone },
        data: { sessionToken: '', fcmToken: null },
      });
      this.trackingGateway.deleteGroup(deliveryPeople.id);
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
      const existingCache = await this.prismaCache.get(deliveryPersonId);
      if (
        existingCache &&
        Array.isArray(existingCache) &&
        existingCache.length > 0
      ) {
        // Rider has pending orders in cache, push them immediately
        await this.trackingGateway.publishEventToGroup(
          deliveryPersonId,
          existingCache,
          'order-list',
        );
        console.log(
          `Pushed ${existingCache.length} pending orders to rider ${deliveryPersonId}`,
        );
      }
    } catch (error) {
      console.error('Error pushing pending orders to rider:', error);
    }
  }

  async testHome(phone: string, body: any) {
    try {
      const deliveryPeople = await this.prisma.deliveryPerson.findUnique({
        where: { phone },
      });
      if (!deliveryPeople) {
        return ResponseHelper.error('Delivery People not found');
      }

      let orders = await this.prisma.order.findMany({ take: 2 });

      this.trackingGateway.publishEventToGroup(
        deliveryPeople.id,
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
