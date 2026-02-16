import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ObjectId } from 'mongoose';
import * as crypto from 'crypto';
import {
  CASH_FREE_PAYMENT,
  CASH_FREE_PAYMENT_PROD,
} from '../config/cashfree.config';
import { User, UserDocument } from '../schemas/user.schema';
import { AppVersion, AppVersionDocument } from '../schemas/app-version.schema';
import { OtpHelper } from '../auth/otp.helper';
import { JwtHelper } from '../auth/jwt.helper';
import googleHelper from '../helper/google.helper';
import { ResponseHelper } from '../helper/response.helper';
import { InvoiceHelper } from '../helper/invoice.helper';
import { Vendor, VendorDocument } from 'src/schemas/vendor.schema';
import {
  calculateLatLong,
  calculateDistance,
} from 'src/helper/lat-long.helper';
import { BannersDocument, Banners } from 'src/schemas/app-banners.schema';
import { VendorHelper } from 'src/helper/vendor.helper';
import { AppConfig, AppConfigDocument } from 'src/schemas/app-config.schema';
import { TrackingGateway } from 'src/delivery/tracking.gateway';
import { ServicesDocument, Services } from 'src/schemas/services.schema';
import { FilterVendorsDto, SortOption, FilterOption } from './dto';
import { Review, ReviewDocument } from 'src/schemas/reviews.schema';
import { Order, OrderDocument } from 'src/schemas/order.schema';
import {
  Notification,
  NotificationDocument,
} from 'src/schemas/notification.schema';
import { NotificationService } from 'src/notification-module/notification-service.service';
import { makePaymentLink } from '../utils/cashFree.util';
import { EXP_CONFIG } from 'src/config/otp.config';
import {
  TransactionLog,
  TransactionLogDocument,
} from 'src/schemas/transaction-log.schema';
import { OfferService } from '../offer/offer.service';

const statusAbr = {
  str: {
    processing_at: 'processing',
    processed_at: 'processed',
    cancelled_at: 'cancelled',
    delivered_at: 'delivered',
    picked_up_at: 'picked_up',
    accepted_at: 'accepted',
    rejected_at: 'rejected',
    unaccepted_at: 'unaccepted',
    out_for_delivery_at: 'out_for_delivery',
    verified_at: 'verified',
    driver_assigned_at: 'driver_assigned',
    paid_at: 'paid',
  },
  num: {
    driver_assigned_at: 3,
    processing_at: 10,
    processed_at: 11,
    cancelled_at: 12,
    delivered_at: 9,
    picked_up_at: 6,
    accepted_at: 2,
    rejected_at: 13,
    unaccepted_at: 14,
    out_for_delivery_at: 15,
    verified_at: 5,
    paid_at: 7,
  },
};

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Vendor.name)
    private readonly vendorModel: Model<VendorDocument>,
    @InjectModel(AppVersion.name)
    private readonly appVersionModel: Model<AppVersionDocument>,
    @InjectModel(Banners.name)
    private readonly bannerModel: Model<BannersDocument>,
    @InjectModel(Services.name)
    private readonly serviceModel: Model<ServicesDocument>,
    @InjectModel(AppConfig.name)
    private readonly appconfigModel: Model<AppConfigDocument>,
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(TransactionLog.name)
    private readonly transactionLogModel: Model<TransactionLogDocument>,
    private readonly otpHelper: OtpHelper,
    private readonly invoiceHelper: InvoiceHelper,
    private readonly jwtHelper: JwtHelper,
    private readonly vendorHelper: VendorHelper,
    private readonly trackingGateway: TrackingGateway,
    private readonly offerService: OfferService,
    private readonly notificationService: NotificationService,
  ) { }

  async auth(phoneNumber: string) {
    const user = await this.userModel.findOne({ phone: phoneNumber });
    if (user) {
      if (user.status !== 'active') {
        return ResponseHelper.error('User account is blocked.');
      }
    }
    await this.otpHelper.sendOtp(phoneNumber);
    return ResponseHelper.success('OTP sent');
  }

  async resendOtp(phoneNumber: string) {
    const user = await this.userModel.findOne({ phone: phoneNumber });
    if (user) {
      if (user.status !== 'active') {
        return ResponseHelper.error('User account is blocked.');
      }
    }
    await this.otpHelper.sendOtp(phoneNumber);
    return ResponseHelper.success('OTP resent successfully');
  }

  async verifyOtp(phoneNumber: string, otp: string, fcm_token: string) {
    const response = await this.otpHelper.verifyOTP(phoneNumber, otp);
    if (!response || response.type !== 'success') {
      return ResponseHelper.error('Invalid OTP');
    }
    let user = await this.userModel.findOne({ phone: phoneNumber });
    const token = this.jwtHelper.sign({ phoneNumber }, 'user', {
      expiresIn: EXP_CONFIG.EXPIRY_DAYS as any,
    });
    if (!user) {
      try {
        user = await this.userModel.create({
          phone: phoneNumber,
          fcm_token,
          session_token: token,
        });
      } catch (error) {
        if (error.code === 11000) {
          return ResponseHelper.error('Phone number already exists.');
        }
        throw error;
      }
    } else {
      if (user.status !== 'active') {
        return ResponseHelper.error('User account is blocked.');
      }
      user.fcm_token = fcm_token;
      user.session_token = token;
      await user.save();
    }

    this.trackingGateway.joinUserToGroup(
      user._id.toString(),
      user._id.toString(),
    );
    return ResponseHelper.success('Login successful', {
      token,
      is_new: user.name ? false : true,
    });
  }

  async getMeByPhoneNumber(phoneNumber: string) {
    const user = await this.userModel.findOne({ phone: phoneNumber }).lean();
    if (!user) return ResponseHelper.error('User not found');

    const appVersions = await this.appVersionModel
      .find({
        app_type: { $in: ['user_android', 'user_ios'] },
      })
      .lean();

    const appConfig = await this.appconfigModel
      .findOne({ is_active: true })
      .select(['support_phone_number', 'privacy_policy_url', 'terms_url'])
      .lean();

    return ResponseHelper.success('User details retrieved', {
      user: {
        ...user,
        app_version: appVersions,
        is_new: user.name ? false : true,
        support_phone_number: appConfig?.support_phone_number,
        privacy_policy_url: appConfig?.privacy_policy_url,
        terms_url: appConfig?.terms_url,
      },
    });
  }

  async updateProfile(
    phoneNumber: string,
    updateData: Partial<{
      name?: string;
      email?: string;
      gender?: string;
      dob?: Date;
    }>,
  ) {
    const user = await this.userModel
      .findOneAndUpdate(
        { phone: phoneNumber },
        { $set: updateData },
        { new: true },
      )
      .select('-password_hash')
      .lean();
    if (!user) return ResponseHelper.error('User not found');
    return ResponseHelper.success('Profile updated successfully');
  }

  async addAddress(
    phoneNumber: string,
    addressData: {
      label: string;
      address_line1: string;
      address_line2?: string;
      latitude: number;
      longitude: number;
    },
  ) {
    const user = await this.userModel.findOne({ phone: phoneNumber });
    if (!user) return ResponseHelper.error('User not found');

    if (user.addresses.length >= 5) {
      return ResponseHelper.error('Maximum 5 addresses allowed.');
    }

    // Check for duplicate label (case-insensitive)
    const labelExists = user.addresses.some(
      (addr) => addr.label.toLowerCase() === addressData.label.toLowerCase(),
    );
    if (labelExists) {
      return ResponseHelper.error(
        'An address with this label already exists. Please use a different label.',
      );
    }

    const addressComponents = await googleHelper.getAddress(
      addressData.latitude,
      addressData.longitude,
    );

    const components = addressComponents.components as any;
    if (!components || !components.city) {
      return ResponseHelper.error('Unable to decode address from coordinates.');
    }

    const isDefault = user.addresses.length === 0;

    const newAddress = {
      label: addressData.label,
      address_line1: addressData.address_line1,
      address_line2: addressData.address_line2,
      city: components.city,
      state: components.state,
      pincode: components.pincode,
      latitude: addressData.latitude,
      longitude: addressData.longitude,
      is_default: isDefault,
    };

    user.addresses.push(newAddress);
    await user.save();

    const addedAddress = user.addresses[user.addresses.length - 1];
    return ResponseHelper.success('Address added successfully', {
      addressId: (addedAddress as any).id,
    });
  }

  async removeAddress(phoneNumber: string, addressId: string) {
    const user = await this.userModel.findOne({ phone: phoneNumber });
    if (!user) return ResponseHelper.error('User not found');

    const addressIndex = user.addresses.findIndex(
      (addr) => (addr as any).id === addressId,
    );
    if (addressIndex === -1) return ResponseHelper.error('Address not found');

    // Prevent removal of default address
    if (user.addresses[addressIndex].is_default) {
      return ResponseHelper.error(
        'Cannot remove default address. Please set another address as default first.',
      );
    }

    user.addresses.splice(addressIndex, 1);
    await user.save();

    return ResponseHelper.success('Address removed successfully');
  }

  async editAddress(
    phoneNumber: string,
    addressId: string,
    updateData: Partial<{
      label?: string;
      address_line1?: string;
      address_line2?: string;
      latitude?: number;
      longitude?: number;
      is_default?: boolean;
    }>,
  ) {
    const user = await this.userModel.findOne({ phone: phoneNumber });
    if (!user) return ResponseHelper.error('User not found');

    const addressIndex = user.addresses.findIndex(
      (addr) => (addr as any).id === addressId,
    );
    if (addressIndex === -1) return ResponseHelper.error('Address not found');

    const address = user.addresses[addressIndex];

    // Check for duplicate label if label is being updated
    if (updateData.label !== undefined) {
      const labelExists = user.addresses.some(
        (addr, index) =>
          index !== addressIndex &&
          addr.label.toLowerCase() === updateData.label.toLowerCase(),
      );
      if (labelExists) {
        return ResponseHelper.error(
          'An address with this label already exists. Please use a different label.',
        );
      }
      address.label = updateData.label;
    }

    // Handle is_default change
    if (updateData.is_default !== undefined) {
      // If setting this address as default, unset all other addresses
      if (updateData.is_default === true) {
        user.addresses.forEach((addr) => {
          addr.is_default = false;
        });
        address.is_default = true;
      } else {
        // If unsetting default, ensure at least one address remains default
        // Only allow unsetting if there are other addresses
        if (user.addresses.length > 1) {
          const hasOtherDefault = user.addresses.some(
            (addr, index) => index !== addressIndex && addr.is_default,
          );
          if (!hasOtherDefault) {
            return ResponseHelper.error(
              'Cannot unset default address. At least one address must be set as default.',
            );
          }
          address.is_default = false;
        } else {
          // If only one address, it must remain default
          return ResponseHelper.error(
            'Cannot unset default address. This is the only address.',
          );
        }
      }
    }

    if (updateData.address_line1) {
      address.address_line1 = updateData.address_line1;
    }
    if (updateData.address_line2 !== undefined) {
      address.address_line2 = updateData.address_line2;
    }

    // Update coordinates and location details if latitude/longitude changed
    if (
      updateData.latitude !== undefined &&
      updateData.longitude !== undefined
    ) {
      address.latitude = updateData.latitude;
      address.longitude = updateData.longitude;
      const addressComponents = await googleHelper.getAddress(
        updateData.latitude,
        updateData.longitude,
      );
      const components = addressComponents.components as any;
      if (components && components.city) {
        address.city = components.city;
        address.state = components.state;
        address.pincode = components.pincode;
      } else {
        return ResponseHelper.error(
          'Unable to decode address from coordinates.',
        );
      }
    }

    await user.save();

    return ResponseHelper.success('Address updated successfully');
  }

  async getAddresses(phoneNumber: string) {
    const user = await this.userModel.findOne({ phone: phoneNumber }).lean();
    if (!user) return ResponseHelper.error('User not found');
    return ResponseHelper.success('Addresses retrieved', {
      addresses: user.addresses,
    });
  }

  async listVendors(
    phoneNumber: string,
    page: number,
    limit: number,
    payload: FilterVendorsDto,
  ) {
    const user = await this.userModel.findOne({ phone: phoneNumber }).lean();
    if (!user) return ResponseHelper.error('User not found');

    const userAddress = user.addresses.find((addr) => addr.is_default);
    if (!userAddress)
      return ResponseHelper.error(
        'Please set a home address to see nearby vendors.',
      );

    // Fetch app config to get max vendor distance
    const appConfig = await this.appconfigModel.findOne({ is_active: true }).lean();
    if (!appConfig) {
      return ResponseHelper.error('App configuration not found');
    }

    const maxDistance = appConfig.delivery_config?.order_distance || 10; // Default to 10km if not configured

    const { latitude: userLat, longitude: userLong } = userAddress;
    const { minLat, maxLat, minLong, maxLong } = calculateLatLong(
      maxDistance,
      userLat,
      userLong,
    );

    // Build aggregation pipeline
    const pipeline: any[] = [
      {
        $match: {
          status: 'active',
          'address.latitude': { $gte: minLat, $lte: maxLat },
          'address.longitude': { $gte: minLong, $lte: maxLong },
          'shop_status.status': 'open',
          $or: [
            { 'shop_status.close_time': null },
            { 'shop_status.close_time': { $gte: new Date() } },
          ],
        },
      },
    ];


    // Add vendor name search filter if provided
    if (payload.search && payload.search.trim().length > 0) {
      pipeline.push({
        $match: {
          shop_name: {
            $regex: payload.search.trim(),
            $options: 'i', // Case-insensitive search
          },
        },
      });
    }

    // Filter services_offered to only include services where is_approved=true
    // is_active will be handled by frontend, only is_approved is checked here
    // Also filter items within each service to only include active items
    // Services with no active items will be excluded
    // This is done at database level for better performance
    pipeline.push({
      $addFields: {
        services_offered: {
          $map: {
            input: {
              $filter: {
                input: '$services_offered',
                as: 'service',
                cond: {
                  $and: [
                    { $eq: ['$$service.is_approved', true] },
                    { $eq: ['$$service.is_active', true] },
                  ],
                },
              },
            },
            as: 'service',
            in: {
              $mergeObjects: [
                '$$service',
                {
                  items: {
                    $filter: {
                      input: '$$service.items',
                      as: 'item',
                      cond: { $eq: ['$$item.is_active', true] },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    });

    // Filter out services that have no active items
    pipeline.push({
      $addFields: {
        services_offered: {
          $filter: {
            input: '$services_offered',
            as: 'service',
            cond: {
              $gt: [{ $size: '$$service.items' }, 0], // At least one active item exists
            },
          },
        },
      },
    });

    // Exclude vendors that have no valid services after filtering
    pipeline.push({
      $match: {
        'services_offered.0': { $exists: true }, // At least one service exists
      },
    });

    // Service type filters - normalize service names (handles both "and" and "&")
    // Fix: Check if serviceFilters exists and is an array
    if (
      payload.serviceFilters &&
      Array.isArray(payload.serviceFilters) &&
      payload.serviceFilters.length > 0
    ) {
      const serviceFilters = payload.serviceFilters.map(
        (e) => new Types.ObjectId(e),
      );
      pipeline.push({
        $match: {
          'services_offered.service_id': { $in: serviceFilters },
        },
      });
    }

    // Add item-level filtering for express and offer using proper MongoDB array queries
    if (payload.isExpress !== undefined || payload.isOffer !== undefined) {
      // For express filtering, check if any service has any active item with express_price > 0
      if (payload.isExpress !== undefined && payload.isExpress) {
        pipeline.push({
          $match: {
            services_offered: {
              $elemMatch: {
                is_express_available: true,
                items: {
                  $elemMatch: {
                    is_active: true,
                    express_price: { $gt: 0 },
                  },
                },
              },
            },
          },
        });
      }

      // Bug #7 FIX: For offer filtering, check at service level (offer_percentage or is_offer)
      // When service filters are applied, only check offers on THOSE specific services
      if (payload.isOffer !== undefined && payload.isOffer) {
        if (
          payload.serviceFilters &&
          Array.isArray(payload.serviceFilters) &&
          payload.serviceFilters.length > 0
        ) {
          // When service filter is present, use $elemMatch to ensure
          // the offer exists on one of the FILTERED services
          const serviceFilters = payload.serviceFilters.map(
            (e) => new Types.ObjectId(e),
          );
          pipeline.push({
            $match: {
              services_offered: {
                $elemMatch: {
                  service_id: { $in: serviceFilters },
                  is_offer: true,
                  offer_percentage: { $gt: 0 },
                },
              },
            },
          });
        } else {
          // When no service filter, check if ANY service has an offer using strict elemMatch
          pipeline.push({
            $match: {
              services_offered: {
                $elemMatch: {
                  is_offer: true,
                  offer_percentage: { $gt: 0 },
                },
              },
            },
          });
        }
      }
    }

    // Add projection to exclude sensitive fields
    pipeline.push({
      $project: {
        password_hash: 0,
        documents: 0,
        bank_details: 0,
      },
    });

    // Execute aggregation
    let vendors = await this.vendorModel.aggregate(pipeline);

    // Add distance calculation to each vendor (filter out vendors without valid coordinates)
    // Note: services_offered is already filtered at database level (is_approved=true)
    const vendorsWithValidCoords = vendors.filter(
      (vendor) =>
        vendor.address?.latitude != null && vendor.address?.longitude != null,
    );

    vendors = await Promise.all(
      vendorsWithValidCoords.map(async (vendor) => {
        const distance = await calculateDistance(
          userLat,
          userLong,
          vendor.address.latitude,
          vendor.address.longitude,
        );
        return {
          ...vendor,
          distance: Number(distance.toFixed(2)),
        };
      }),
    );

    // Apply sorting
    if (payload.sort && payload.sort.length > 0) {
      vendors = this.applySorting(
        vendors,
        payload.sort,
        payload.serviceFilters as string[] | undefined,
      );
    }

    // Apply pagination
    const totalVendors = vendors.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const serviceFilterIds =
      payload.serviceFilters?.map((id) => id?.toString()) ?? [];
    const hasSelectedService = serviceFilterIds.length > 0;
    const paginatedVendors = vendors.slice(startIndex, endIndex).map((e) => {
      e.distance = `${e.distance} km`;

      const services = Array.isArray(e.services_offered)
        ? e.services_offered
        : [];
      const applicableServices = hasSelectedService
        ? services.filter((service: any) =>
          serviceFilterIds.includes(service?.service_id?.toString()),
        )
        : services;

      // Strict check for Express availability
      e.is_express = applicableServices.some(
        (service: any) =>
          service?.is_express_available === true &&
          service?.items?.some((item: any) => item?.express_price > 0 && item?.is_active),
      );

      if (hasSelectedService && applicableServices.length > 0) {
        const fastestExpressService = [...applicableServices]
          .filter(
            (service: any) =>
              service?.is_express_available === true &&  // Must be available
              service?.items?.some((item: any) => item?.is_active && item?.express_price > 0) &&
              service?.express_time !== undefined &&
              service?.express_time !== null &&
              !Number.isNaN(service.express_time),
          )
          .sort(
            (a: any, b: any) =>
              (a?.express_time ?? Number.POSITIVE_INFINITY) -
              (b?.express_time ?? Number.POSITIVE_INFINITY),
          )[0];

        const fastestStandardService = [...applicableServices]
          .filter(
            (service: any) =>
              service?.standard_time !== undefined &&
              service?.standard_time !== null &&
              !Number.isNaN(service.standard_time),
          )
          .sort(
            (a: any, b: any) =>
              (a?.standard_time ?? Number.POSITIVE_INFINITY) -
              (b?.standard_time ?? Number.POSITIVE_INFINITY),
          )[0];

        e.min_express_time = fastestExpressService
          ? `${fastestExpressService.express_time} hrs`
          : null;
        e.min_standard_time = fastestStandardService
          ? `${fastestStandardService.standard_time} hrs`
          : null;

        const startsAt = applicableServices.reduce(
          (min: number, service: any) => {
            if (
              service?.pricing_type === 'per_kg' &&
              typeof service.standard_price_per_kg === 'number' &&
              service.standard_price_per_kg > 0
            ) {
              min = Math.min(min, service.standard_price_per_kg);
            }
            service?.items?.forEach((item: any) => {
              if (item?.is_active && typeof item.item_price === 'number' && item.item_price > 0) {
                min = Math.min(min, item.item_price);
              }
            });
            return min;
          },
          Number.POSITIVE_INFINITY,
        );
        e.startsAt = startsAt === Number.POSITIVE_INFINITY ? null : startsAt;
      } else {
        // Bug #1 FIX: When no service is selected, do NOT show times or prices
        // Previously this was calculating times from ALL services which was misleading
        e.min_express_time = null;
        e.min_standard_time = null;
        e.startsAt = null;
      }


      const offerAgg = applicableServices.reduce(
        (acc, service) => {
          // Use is_offer as the absolute master switch
          const hasOffer = service?.is_offer === true;
          const offerPercentage =
            hasOffer && service?.offer_percentage
              ? service.offer_percentage
              : 0;
          const offerCap =
            hasOffer && service?.offer_max_cap
              ? service.offer_max_cap
              : 0;
          return {
            total_percentage: Math.max(acc.total_percentage, offerPercentage),
            max_cap: Math.max(acc.max_cap, offerCap),
          };
        },
        { total_percentage: 0, max_cap: 0 },
      );
      e.max_offer_percentage = offerAgg;
      e.is_offer = offerAgg.total_percentage > 0;

      // services_offered is already filtered at database level (is_approved=true)
      // Return full service objects with active items
      e.services_offered = services.map(
        (service: any) => service?.service_name,
      );

      return e;
    });

    return ResponseHelper.success('Vendors retrieved', {
      vendors: paginatedVendors,
      total: totalVendors,
      page,
      limit,
      totalPages: Math.ceil(totalVendors / limit),
    });
  }

  async listVendorsPublic(
    page: number,
    limit: number,
    payload: FilterVendorsDto,
  ) {
    return this.getVendorsInternal(page, limit, payload);
  }

  private async getVendorsInternal(
    page: number,
    limit: number,
    payload: FilterVendorsDto,
    userLat?: number,
    userLong?: number,
  ) {
    // Build initial match criteria
    const initialMatch: any = {
      status: 'active',
      'shop_status.status': 'open',
      $or: [
        { 'shop_status.close_time': null },
        { 'shop_status.close_time': { $gte: new Date() } },
      ],
    };

    // Apply location filter only if coordinates are provided
    if (userLat != null && userLong != null) {
      // Fetch app config to get max vendor distance
      const appConfig = await this.appconfigModel
        .findOne({ is_active: true })
        .lean();
      if (!appConfig) {
        return ResponseHelper.error('App configuration not found');
      }

      const maxDistance = appConfig.delivery_config?.order_distance || 10;
      const { minLat, maxLat, minLong, maxLong } = calculateLatLong(
        maxDistance,
        userLat,
        userLong,
      );

      initialMatch['address.latitude'] = { $gte: minLat, $lte: maxLat };
      initialMatch['address.longitude'] = { $gte: minLong, $lte: maxLong };
    }

    // Build aggregation pipeline
    const pipeline: any[] = [
      {
        $match: initialMatch,
      },
    ];

    // Add vendor name search filter if provided
    if (payload.search && payload.search.trim().length > 0) {
      pipeline.push({
        $match: {
          shop_name: {
            $regex: payload.search.trim(),
            $options: 'i', // Case-insensitive search
          },
        },
      });
    }

    // Filter services_offered to only include services where is_approved=true
    pipeline.push({
      $addFields: {
        services_offered: {
          $map: {
            input: {
              $filter: {
                input: '$services_offered',
                as: 'service',
                cond: {
                  $and: [
                    { $eq: ['$$service.is_approved', true] },
                    { $eq: ['$$service.is_active', true] },
                  ],
                },
              },
            },
            as: 'service',
            in: {
              $mergeObjects: [
                '$$service',
                {
                  items: {
                    $filter: {
                      input: '$$service.items',
                      as: 'item',
                      cond: { $eq: ['$$item.is_active', true] },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    });

    // Filter out services that have no active items
    pipeline.push({
      $addFields: {
        services_offered: {
          $filter: {
            input: '$services_offered',
            as: 'service',
            cond: {
              $gt: [{ $size: '$$service.items' }, 0], // At least one active item exists
            },
          },
        },
      },
    });

    // Exclude vendors that have no valid services after filtering
    pipeline.push({
      $match: {
        'services_offered.0': { $exists: true }, // At least one service exists
      },
    });

    // Service type filters
    if (
      payload.serviceFilters &&
      Array.isArray(payload.serviceFilters) &&
      payload.serviceFilters.length > 0
    ) {
      const serviceFilters = payload.serviceFilters.map(
        (e) => new Types.ObjectId(e),
      );
      pipeline.push({
        $match: {
          'services_offered.service_id': { $in: serviceFilters },
        },
      });
    }

    // Add item-level filtering for express and offer
    if (payload.isExpress !== undefined || payload.isOffer !== undefined) {
      if (payload.isExpress !== undefined && payload.isExpress) {
        pipeline.push({
          $match: {
            services_offered: {
              $elemMatch: {
                is_express_available: true,
                items: {
                  $elemMatch: {
                    is_active: true,
                    express_price: { $gt: 0 },
                  },
                },
              },
            },
          },
        });
      }

      if (payload.isOffer !== undefined && payload.isOffer) {
        if (
          payload.serviceFilters &&
          Array.isArray(payload.serviceFilters) &&
          payload.serviceFilters.length > 0
        ) {
          const serviceFilters = payload.serviceFilters.map(
            (e) => new Types.ObjectId(e),
          );
          pipeline.push({
            $match: {
              services_offered: {
                $elemMatch: {
                  service_id: { $in: serviceFilters },
                  is_offer: true,
                  offer_percentage: { $gt: 0 },
                },
              },
            },
          });
        } else {
          pipeline.push({
            $match: {
              services_offered: {
                $elemMatch: {
                  is_offer: true,
                  offer_percentage: { $gt: 0 },
                },
              },
            },
          });
        }
      }
    }

    // Add projection to exclude sensitive fields
    pipeline.push({
      $project: {
        password_hash: 0,
        documents: 0,
        bank_details: 0,
      },
    });

    // Execute aggregation
    let vendors = await this.vendorModel.aggregate(pipeline);

    // Filter vendors with valid coordinates if distance calculation is needed
    let processedVendors = vendors;
    if (userLat != null && userLong != null) {
      const vendorsWithValidCoords = vendors.filter(
        (vendor) =>
          vendor.address?.latitude != null && vendor.address?.longitude != null,
      );

      processedVendors = await Promise.all(
        vendorsWithValidCoords.map(async (vendor) => {
          const distance = await calculateDistance(
            userLat,
            userLong,
            vendor.address.latitude,
            vendor.address.longitude,
          );
          return {
            ...vendor,
            distance: Number(distance.toFixed(2)),
          };
        }),
      );
    } else {
      // For public list without location, sets distance to null
      processedVendors = vendors.map((vendor) => ({
        ...vendor,
        distance: null,
      }));
    }

    // Apply sorting
    if (payload.sort && payload.sort.length > 0) {
      processedVendors = this.applySorting(
        processedVendors,
        payload.sort,
        payload.serviceFilters as string[] | undefined,
      );
    }

    // Apply pagination
    const totalVendors = processedVendors.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const serviceFilterIds =
      payload.serviceFilters?.map((id) => id?.toString()) ?? [];
    const hasSelectedService = serviceFilterIds.length > 0;

    const paginatedVendors = processedVendors
      .slice(startIndex, endIndex)
      .map((e) => {
        if (e.distance != null) {
          e.distance = `${e.distance} km`;
        } else {
          e.distance = null;
        }

        const services = Array.isArray(e.services_offered)
          ? e.services_offered
          : [];
        const applicableServices = hasSelectedService
          ? services.filter((service: any) =>
            serviceFilterIds.includes(service?.service_id?.toString()),
          )
          : services;

        // Strict check for Express availability
        e.is_express = applicableServices.some(
          (service: any) =>
            service?.is_express_available === true &&
            service?.items?.some(
              (item: any) => item?.express_price > 0 && item?.is_active,
            ),
        );

        if (hasSelectedService && applicableServices.length > 0) {
          const fastestExpressService = [...applicableServices]
            .filter(
              (service: any) =>
                service?.is_express_available === true &&
                service?.items?.some(
                  (item: any) => item?.is_active && item?.express_price > 0,
                ) &&
                service?.express_time !== undefined &&
                service?.express_time !== null &&
                !Number.isNaN(service.express_time),
            )
            .sort(
              (a: any, b: any) =>
                (a?.express_time ?? Number.POSITIVE_INFINITY) -
                (b?.express_time ?? Number.POSITIVE_INFINITY),
            )[0];

          const fastestStandardService = [...applicableServices]
            .filter(
              (service: any) =>
                service?.standard_time !== undefined &&
                service?.standard_time !== null &&
                !Number.isNaN(service.standard_time),
            )
            .sort(
              (a: any, b: any) =>
                (a?.standard_time ?? Number.POSITIVE_INFINITY) -
                (b?.standard_time ?? Number.POSITIVE_INFINITY),
            )[0];

          e.min_express_time = fastestExpressService
            ? `${fastestExpressService.express_time} hrs`
            : null;
          e.min_standard_time = fastestStandardService
            ? `${fastestStandardService.standard_time} hrs`
            : null;

          const startsAt = applicableServices.reduce(
            (min: number, service: any) => {
              if (
                service?.pricing_type === 'per_kg' &&
                typeof service.standard_price_per_kg === 'number' &&
                service.standard_price_per_kg > 0
              ) {
                min = Math.min(min, service.standard_price_per_kg);
              }
              service?.items?.forEach((item: any) => {
                if (
                  item?.is_active &&
                  typeof item.item_price === 'number' &&
                  item.item_price > 0
                ) {
                  min = Math.min(min, item.item_price);
                }
              });
              return min;
            },
            Number.POSITIVE_INFINITY,
          );
          e.startsAt = startsAt === Number.POSITIVE_INFINITY ? null : startsAt;
        } else {
          e.min_express_time = null;
          e.min_standard_time = null;
          e.startsAt = null;
        }

        const offerAgg = applicableServices.reduce(
          (acc, service) => {
            const hasOffer = service?.is_offer === true;
            const offerPercentage =
              hasOffer && service?.offer_percentage
                ? service.offer_percentage
                : 0;
            const offerCap =
              hasOffer && service?.offer_max_cap ? service.offer_max_cap : 0;
            return {
              total_percentage: Math.max(acc.total_percentage, offerPercentage),
              max_cap: Math.max(acc.max_cap, offerCap),
            };
          },
          { total_percentage: 0, max_cap: 0 },
        );
        e.max_offer_percentage = offerAgg;
        e.is_offer = offerAgg.total_percentage > 0;

        e.services_offered = services.map(
          (service: any) => service?.service_name,
        );

        return e;
      });

    return ResponseHelper.success('Vendors retrieved', {
      vendors: paginatedVendors,
      total: totalVendors,
      page,
      limit,
      totalPages: Math.ceil(totalVendors / limit),
    });
  }

  private applySorting(
    vendors: any[],
    sortOptions: SortOption[],
    serviceFilterIds?: string[],
  ): any[] {
    return vendors.sort((a, b) => {
      for (const sortOption of sortOptions) {
        let comparison = 0;

        switch (sortOption) {
          case SortOption.DISTANCE_LOW_TO_HIGH:
            comparison = (a.distance || 0) - (b.distance || 0);
            break;
          case SortOption.DISTANCE_HIGH_TO_LOW:
            comparison = (b.distance || 0) - (a.distance || 0);
            break;
          case SortOption.RATING_LOW_TO_HIGH:
            comparison = (a.rating?.average || 0) - (b.rating?.average || 0);
            break;
          case SortOption.RATING_HIGH_TO_LOW:
            comparison = (b.rating?.average || 0) - (a.rating?.average || 0);
            break;
          case SortOption.COST_LOW_TO_HIGH:
            {
              const priceA = this.getMinPrice(a, serviceFilterIds);
              const priceB = this.getMinPrice(b, serviceFilterIds);
              const safeA = Number.isFinite(priceA)
                ? priceA
                : Number.MAX_SAFE_INTEGER;
              const safeB = Number.isFinite(priceB)
                ? priceB
                : Number.MAX_SAFE_INTEGER;
              comparison = safeA - safeB;
            }
            break;

          case SortOption.COST_HIGH_TO_LOW:
            {
              const priceA = this.getMinPrice(a, serviceFilterIds);
              const priceB = this.getMinPrice(b, serviceFilterIds);
              const safeA = Number.isFinite(priceA)
                ? priceA
                : Number.MAX_SAFE_INTEGER;
              const safeB = Number.isFinite(priceB)
                ? priceB
                : Number.MAX_SAFE_INTEGER;
              comparison = safeB - safeA;
            }
            break;
          case SortOption.OFFER_LOW_TO_HIGH:
            comparison =
              this.getMaxDiscount(a, serviceFilterIds) -
              this.getMaxDiscount(b, serviceFilterIds);
            break;
          case SortOption.OFFER_HIGH_TO_LOW:
            comparison =
              this.getMaxDiscount(b, serviceFilterIds) -
              this.getMaxDiscount(a, serviceFilterIds);
            break;
          case SortOption.DELIVERY_LOW_TO_HIGH:
            {
              const timeA = this.getMinDeliveryTime(a, serviceFilterIds);
              const timeB = this.getMinDeliveryTime(b, serviceFilterIds);
              const safeA = Number.isFinite(timeA)
                ? timeA
                : Number.MAX_SAFE_INTEGER;
              const safeB = Number.isFinite(timeB)
                ? timeB
                : Number.MAX_SAFE_INTEGER;
              comparison = safeA - safeB;
            }
            break;
          case SortOption.DELIVERY_HIGH_TO_LOW:
            {
              const timeA = this.getMinDeliveryTime(a, serviceFilterIds);
              const timeB = this.getMinDeliveryTime(b, serviceFilterIds);
              const safeA = Number.isFinite(timeA)
                ? timeA
                : Number.MAX_SAFE_INTEGER;
              const safeB = Number.isFinite(timeB)
                ? timeB
                : Number.MAX_SAFE_INTEGER;
              comparison = safeB - safeA;
            }
            break;
        }

        if (comparison !== 0) {
          return comparison;
        }
      }
      return 0;
    });
  }

  private getApplicableServices(
    vendor: any,
    serviceFilterIds?: string[],
  ): any[] {
    const services = Array.isArray(vendor?.services_offered)
      ? vendor.services_offered
      : [];
    if (serviceFilterIds?.length) {
      const ids = serviceFilterIds.map((id) => id?.toString());
      return services.filter((service: any) =>
        ids.includes(service?.service_id?.toString()),
      );
    }
    return services;
  }

  private getMinPrice(vendor: any, serviceFilterIds?: string[]): number {
    let minPrice = Number.POSITIVE_INFINITY;
    this.getApplicableServices(vendor, serviceFilterIds).forEach(
      (service: any) => {
        service?.items?.forEach((item: any) => {
          if (item?.is_active && typeof item.item_price === 'number') {
            minPrice = Math.min(minPrice, item.item_price);
          }
        });
      },
    );
    return minPrice === Number.POSITIVE_INFINITY
      ? Number.POSITIVE_INFINITY
      : minPrice;
  }

  private getMinDeliveryTime(vendor: any, serviceFilterIds?: string[]): number {
    let minTime = Number.POSITIVE_INFINITY;
    this.getApplicableServices(vendor, serviceFilterIds).forEach(
      (service: any) => {
        if (
          service?.standard_time !== undefined &&
          service?.standard_time !== null &&
          !Number.isNaN(service.standard_time)
        ) {
          minTime = Math.min(minTime, service.standard_time);
        }
      },
    );
    return minTime;
  }

  private getMaxDiscount(vendor: any, serviceFilterIds?: string[]): number {
    let maxDiscount = 0;
    this.getApplicableServices(vendor, serviceFilterIds).forEach(
      (service: any) => {
        if (service?.is_offer && typeof service.offer_percentage === 'number') {
          maxDiscount = Math.max(maxDiscount, service.offer_percentage);
        }
      },
    );
    return maxDiscount;
  }

  async getServicesList() {
    try {
      let banners = this.bannerModel.find({ isactive: true }).lean();
      let services = this.serviceModel.find({}, { items: 0 }).lean();
      let [bannersData, servicesData] = await Promise.all([banners, services]);
      return ResponseHelper.success('Services & Banners retrieved', {
        banners: bannersData,
        services: servicesData,
      });
    } catch (error) {
      return ResponseHelper.error('Something went wrong');
    }
  }

  async previewOrder(userData: UserDocument, orderBody: any) {
    try {
      const {
        pickup_address_id,
        vendor_id,
        service_items,
        is_express,
        order_notes,
      } = orderBody;

      // Validate Service Items
      if (!Array.isArray(service_items) || service_items.length === 0) {
        return ResponseHelper.error(
          'Service items are required to preview order',
        );
      }

      // Check if all items belong to the same service
      const firstServiceId = service_items[0].service_id;
      const allSameService = service_items.every(
        (item: any) => item.service_id === firstServiceId,
      );
      if (!allSameService) {
        return ResponseHelper.error(
          'All items must belong to the same service. Please place separate orders for different services.',
        );
      }

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      // Fetch vendor data, vendor orders, and app config
      let vendor = this.vendorModel.findById(vendor_id).lean();
      let orders = this.orderModel
        .find({
          vendor_id: new Types.ObjectId(vendor_id),
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        })
        .lean();
      let appConfig = this.appconfigModel.findOne({ is_active: true }).lean();

      const [vendorData, vendorOrders, appConfigData] = await Promise.all([
        vendor,
        orders,
        appConfig,
      ]);

      if (!vendorData) {
        return ResponseHelper.error('Vendor not found');
      }

      if (vendorData?.shop_status?.close_time > new Date()) {
        return ResponseHelper.error('Vendor is closed currently');
      }

      // Validate order data
      const validationResult = this.vendorHelper.validateOrderData(
        vendorData,
        vendorOrders,
        service_items,
        appConfigData,
        is_express,
      );
      if (!validationResult.success) {
        return ResponseHelper.error(validationResult.message);
      }

      // Validate pickup address
      const addressRes = userData.addresses.find(
        (addr) => (addr as any).id === pickup_address_id,
      );
      if (!addressRes) {
        return ResponseHelper.error('Pickup address not found');
      }

      // Calculate distance between vendor and user address
      const vendorLat = vendorData.address.latitude;
      const vendorLong = vendorData.address.longitude;
      const userLat = addressRes.latitude;
      const userLong = addressRes.longitude;
      let distanceKm = await calculateDistance(
        userLat,
        userLong,
        vendorLat,
        vendorLong,
      );
      let allAddressDist = await Promise.all(
        (userData?.addresses as any)?.map(async (data) => {
          let dist = await calculateDistance(
            data?.latitude,
            data?.longitude,
            vendorLat,
            vendorLong,
          );
          return {
            address_id: data.id.toString(),
            distance: dist,
            is_deliverable:
              dist <= appConfigData.delivery_config.order_distance,
          };
        }),
      );
      if (distanceKm > appConfigData.delivery_config.order_distance)
        return ResponseHelper.error('Vendor out of range');

      // Create order items with prices from vendor services_offered
      let orderItems;
      try {
        orderItems = service_items.map((item: any) => {
          // Find the service in vendor's services_offered
          const vendorService = vendorData.services_offered.find(
            (service: any) =>
              service.service_id.equals(new Types.ObjectId(item.service_id)),
          );

          if (!vendorService) {
            throw new Error(
              `Service not found in vendor's offerings: ${item.service_name}`,
            );
          }

          // Find the specific item in the service
          const vendorItem = vendorService.items.find((serviceItem: any) =>
            serviceItem.item_id.equals(new Types.ObjectId(item.item_id)),
          );

          if (!vendorItem) {
            throw new Error(
              `Item not found in vendor's service: ${item.item_name}`,
            );
          }

          if (!vendorItem.is_active) {
            throw new Error(`Item is not active: ${item.item_name}`);
          }

          // Use vendor's pricing
          const pricePerItem = is_express
            ? vendorItem?.express_price
            : vendorItem.item_price;
          const totalPrice = item.quantity * pricePerItem;

          return {
            service_id: item.service_id,
            service_name: item.service_name,
            item_id: item.item_id,
            item_name: item.item_name,
            quantity: item.quantity,
            price_per_item: pricePerItem,
            total_price: totalPrice,
            type: vendorService?.pricing_type,
            normal_price_per_item: vendorService?.standard_price_per_kg || 0,
            express_price_per_item: vendorService?.express_price_per_kg || 0,
          };
        });
      } catch (error) {
        return ResponseHelper.error(error.message);
      }

      // Calculate pricing breakdown
      const subtotal = orderItems.reduce(
        (sum, item) => sum + item.total_price,
        0,
      );

      const platformFeeAmount =
        appConfigData?.payment_config?.platform_fee || 5;
      const gstPercentage = appConfigData?.payment_config?.gst || 18;
      const deliveryFee = appConfigData?.payment_config?.delivery_fee || 0;

      const vendorService = vendorData.services_offered.find((service: any) =>
        service.service_id.equals(new Types.ObjectId(firstServiceId)),
      );

      let offerDiscountAmount = 0;
      let isOfferApplied = false;
      let offerPercentage = 0;
      let offerMaxCap = 0;

      if (vendorService && vendorService.offer_percentage > 0) {
        offerPercentage = vendorService.offer_percentage;
        offerMaxCap = vendorService.offer_max_cap || 0;

        if (offerMaxCap > 0 && subtotal >= offerMaxCap) {
          offerDiscountAmount = (subtotal * offerPercentage) / 100;
          isOfferApplied = true;
        } else if (
          offerMaxCap === 0 ||
          offerMaxCap === null ||
          offerMaxCap === undefined
        ) {
          offerDiscountAmount = (subtotal * offerPercentage) / 100;
          isOfferApplied = true;
        }
      }

      const afterOfferAmount = subtotal - offerDiscountAmount;

      const amountToVendor = afterOfferAmount;
      const amountToPlatform = platformFeeAmount;

      const gstAmount = (afterOfferAmount * gstPercentage) / 100;

      const totalPayableAmount =
        afterOfferAmount + deliveryFee + gstAmount + platformFeeAmount;

      // Return preview without creating order
      return ResponseHelper.success('Order preview generated successfully', {
        order_preview: {
          vendor: {
            vendor_id: vendorData._id,
            shop_name: vendorData.shop_name,
            address: vendorData.address,
            is_express_available: vendorService.is_express_available,
            express_delivery_time: vendorService.express_time + ' Hrs',
            standard_delivery_time: vendorService.standard_time + ' Hrs',
            pickup_address: addressRes,
            items: orderItems,
            is_express: is_express || false,
            order_notes: order_notes || '',
            pricing: {
              subtotal: Math.round(subtotal * 100) / 100,
              offer_discount: Math.round(offerDiscountAmount * 100) / 100,
              is_offer_applied: isOfferApplied,
              offer_percentage: isOfferApplied ? offerPercentage : 0,
              offer_max_cap: isOfferApplied ? offerMaxCap : 0,
              after_offer_amount: Math.round(afterOfferAmount * 100) / 100,
              delivery_fee: deliveryFee,
              platform_fee: Math.round(platformFeeAmount * 100) / 100,
              gst: Math.round(gstAmount * 100) / 100,
              total_payable_amount: Math.round(totalPayableAmount * 100) / 100,
            },
            payment_breakdown: {
              item_total: Math.round(subtotal * 100) / 100,
              grand_total: Math.round((subtotal + deliveryFee + gstAmount + platformFeeAmount) * 100) / 100,
              is_payment_eligible: false,
              amount_to_vendor: Math.round(amountToVendor * 100) / 100,
              amount_to_vendor_after_commission:
                amountToVendor - (amountToVendor * appConfigData?.payment_config?.vendor_commission) / 100,
              amount_to_platform: Math.round(amountToPlatform * 100) / 100,
              delivery_fee: deliveryFee,
              gst: Math.round(gstAmount * 100) / 100,
              isOfferApplied: isOfferApplied,
              offerDiscountAmount: Math.round(offerDiscountAmount * 100) / 100,
              totalPayableAmount: Math.round(totalPayableAmount * 100) / 100,
            },
            currency: 'INR',
            distance_map: allAddressDist,
            type: orderItems[0]?.type,
            normal_price_per_item: orderItems[0]?.normal_price_per_item || 0,
            express_price_per_item: orderItems[0]?.express_price_per_item || 0,
          },
        },
      });
    } catch (error) {
      console.log(error);
      return ResponseHelper.error('Something went wrong');
    }
  }

  async makeOrder(userData: UserDocument, orderBody: any) {
    try {
      /* Structure of service items
      service_items: [
        {
          service_id: string;
          service_name: string;
          item_id: string;
          item_name: string;
          quantity: number;
        }
      */
      const {
        pickup_address_id,
        vendor_id,
        service_items,
        is_express,
        order_notes,
        offer_code,
      } = orderBody;

      // Validate Service Items
      if (!Array.isArray(service_items) || service_items.length === 0) {
        return ResponseHelper.error(
          'Service items are required to place an order',
        );
      }

      // Check if all items belong to the same service
      const firstServiceId = service_items[0].service_id;
      const allSameService = service_items.every(
        (item: any) => item.service_id === firstServiceId,
      );
      if (!allSameService) {
        return ResponseHelper.error(
          'All items must belong to the same service. Please place separate orders for different services.',
        );
      }

      const vendor = this.vendorModel.findById(vendor_id).lean();

      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setUTCHours(23, 59, 59, 999);
      const orders = this.orderModel.find({
        vendor_id: new Types.ObjectId(vendor_id),
        created_at: { $gte: startOfDay, $lte: endOfDay },
        // status:{$nin: ['unaccepted', 'cancelled','rejected']}
      }).lean();

      let appConfig = this.appconfigModel.findOne({ is_active: true }).lean();
      const serviceData = this.serviceModel.findById(firstServiceId).lean();

      const [vendorData, vendorOrders, appConfigData, serviceDataResult] = await Promise.all([
        vendor,
        orders,
        appConfig, serviceData
      ]);
      let maxWeight = 0;
      let typePricing: any = serviceDataResult.items.filter((item: any) => item._id.toString() == service_items[0].item_id)[0];
      if (typePricing?.category == "weight") {
        maxWeight = Math.max(...(typePricing?.weight || []));
      }

      // Add weight to service_items for validation
      const itemsForValidation = service_items.map((item: any) => ({
        ...item,
        weight: vendorData.services_offered.find((s: any) => s.service_id.equals(new Types.ObjectId(item.service_id)))?.pricing_type === 'per_kg' ? maxWeight : 0
      }));

      const validationResult = this.vendorHelper.validateOrderData(
        vendorData,
        vendorOrders,
        itemsForValidation,
        appConfigData,
        is_express,
      );
      if (!validationResult.success) {
        return ResponseHelper.error(validationResult.message);
      }

      // Validate user has addresses
      if (!userData.addresses || userData.addresses.length === 0) {
        return ResponseHelper.error(
          'You have no saved addresses. Please add an address first.',
        );
      }

      // Find user address
      const addressRes = userData.addresses.find(
        (addr: any) => addr._id?.toString() === pickup_address_id,
      );
      if (!addressRes) {
        return ResponseHelper.error('Pickup address not found');
      }
      console.log(validationResult, "validationResult")
      // return ResponseHelper.success('Order placed successfully', {
      //   order: validationResult,
      // });

      // Calculate distance between vendor and user address
      const vendorLat = vendorData.address.latitude;
      const vendorLong = vendorData.address.longitude;
      const userLat = addressRes.latitude;
      const userLong = addressRes.longitude;
      let distanceKm = await calculateDistance(
        userLat,
        userLong,
        vendorLat,
        vendorLong,
      );
      if (distanceKm > appConfigData.delivery_config.order_distance)
        return ResponseHelper.error('Vendor out of range');

      // Create order items with prices from vendor services_offered
      let orderItems;
      try {
        orderItems = service_items.map((item: any) => {
          // Find the service in vendor's services_offered
          const vendorService = vendorData.services_offered.find(
            (service: any) =>
              service.service_id.equals(new Types.ObjectId(item.service_id)),
          );

          if (!vendorService) {
            throw new Error(
              `Service not found in vendor's offerings: ${item.service_name}`,
            );
          }

          // Find the specific item in the service
          const vendorItem = vendorService.items.find((serviceItem: any) =>
            serviceItem.item_id.equals(new Types.ObjectId(item.item_id)),
          );

          if (!vendorItem) {
            throw new Error(
              `Item not found in vendor's service: ${item.item_name}`,
            );
          }

          if (!vendorItem.is_active) {
            throw new Error(`Item is not active: ${item.item_name}`);
          }

          // Use vendor's pricing
          const pricePerItem = is_express
            ? vendorItem?.express_price
            : vendorItem.item_price;

          const pricingType = vendorService?.pricing_type;
          const totalPrice = pricingType === 'per_kg'
            ? maxWeight * (is_express ? (vendorService?.express_price_per_kg || 0) : (vendorService?.standard_price_per_kg || 0))
            : item.quantity * pricePerItem;

          return {
            service_id: new Types.ObjectId(item.service_id),
            service_name: item.service_name,
            item_id: new Types.ObjectId(item.item_id),
            item_name: item.item_name,
            quantity: item.quantity,
            item_category: vendorItem.category,
            weight: pricingType === 'per_kg' ? maxWeight : 0,
            price_per_item:
              pricingType === 'per_kg'
                ? is_express
                  ? vendorService?.express_price_per_kg
                  : vendorService?.standard_price_per_kg
                : pricePerItem,
            total_price: totalPrice,
          };
        });
      } catch (error) {
        return ResponseHelper.error(error.message);
      }

      const vendorService = vendorData.services_offered.find(
        (service: any) =>
          service.service_id.equals(new Types.ObjectId(firstServiceId)),
      );

      const subtotal = orderItems.reduce(
        (sum, item) => sum + item.total_price,
        0,
      );

      let offerDiscountAmount = 0;
      let isOfferApplied = false;

      // Coupon Check (Prioritized)
      if (offer_code) {
        // Validate coupon
        const couponValidation = await this.offerService.validateCoupon(
          userData._id.toString(),
          {
            code: offer_code,
            order_total: subtotal,
            service_ids: service_items.map((i) => i.service_id),
          },
        );

        if (couponValidation.valid) {
          offerDiscountAmount = couponValidation.discount_amount;
          isOfferApplied = true;
          // Increment usage count
          await this.offerService.recordCouponUsage(
            offer_code,
            userData._id.toString(),
          );
        } else {
          // If coupon is invalid, throw error
          return ResponseHelper.error(couponValidation.message);
        }
      } else if (vendorService.offer_percentage > 0 && vendorService.is_offer) {
        // Existing Vendor Offer Logic (Fallback)
        if (subtotal > vendorService?.offer_max_cap) {
          offerDiscountAmount = vendorService?.offer_max_cap;
          isOfferApplied = true;
        } else {
          offerDiscountAmount = 0;
        }
      }


      const platformFeeAmount =
        appConfigData?.payment_config?.platform_fee || 5;
      const gstPercentage = appConfigData?.payment_config?.gst || 18;
      const deliveryFee = appConfigData?.payment_config?.delivery_fee || 0;

      // const offerDiscountAmount = validationResult.offerDiscountAmount || 0;
      const afterOfferAmount = subtotal - offerDiscountAmount;

      const amountToVendor = afterOfferAmount;
      const amountToPlatform = platformFeeAmount;

      const gstAmount = (afterOfferAmount * gstPercentage) / 100;

      const totalPayableAmount =
        afterOfferAmount + deliveryFee + gstAmount + platformFeeAmount;
      const lastOrder = await this.orderModel
        .findOne({})
        .sort({ order_number: -1 })
        .lean();
      const orderNumber = lastOrder ? lastOrder.order_number + 1 : 1;

      const order = await this.orderModel.create({
        order_number: orderNumber,
        user_id: userData._id,
        vendor_id: new Types.ObjectId(vendor_id),
        user_address: addressRes,
        vendor_address: vendorData.address,
        items: orderItems,
        is_express: is_express || false,
        order_notes: order_notes || '',
        invoice_url: '',
        payment: 2, //Payment by Gateway
        payment_details: {
          item_total: Math.round(subtotal * 100) / 100,
          grand_total: Math.round((subtotal + deliveryFee + gstAmount + platformFeeAmount) * 100) / 100,
          is_payment_eligible: false,
          amount_to_vendor: Math.round(amountToVendor * 100) / 100,
          amount_to_vendor_after_commission:
            amountToVendor - (amountToVendor * appConfigData?.payment_config?.vendor_commission) / 100,
          amount_to_platform: Math.round(amountToPlatform * 100) / 100,
          delivery_fee: deliveryFee,
          gst: Math.round(gstAmount * 100) / 100,
          isOfferApplied: isOfferApplied,
          offerDiscountAmount: Math.round(offerDiscountAmount * 100) / 100,
          totalPayableAmount: Math.round(totalPayableAmount * 100) / 100,
        },
        total_amount: Math.round(totalPayableAmount * 100) / 100,
        currency: 'INR',
        status: 'pending',
        status_type: 1,
        trip_type: 1,
        payment_status: 'pending',
      });

      if (vendorData.shop_status.status === 'open') {
        this.trackingGateway.publishEventToGroup(
          vendor_id.toString(),
          {},
          'vendor-order',
        );

        if (vendorData.fcm_token) {
          const payload = {
            title: 'New Order Received! 🛍️',
            body: `Order #${orderNumber} has been placed. Tap to view details.`,
          };
          this.notificationService.sendNotification([vendorData.fcm_token], payload);
        }
      }

      this.trackingGateway.joinUserToGroup(
        userData?._id.toString(),
        order._id.toString(),
      );

      return ResponseHelper.success('Order placed successfully', {
        order_id: order._id,
        order_number: orderNumber,
      });
    } catch (error) {
      console.log(error);
      return ResponseHelper.error('Something went wrong');
    }
  }

  async createReview(
    phoneNumber: string,
    orderId: string,
    rating: number,
    comment?: string,
  ) {
    try {
      // Find user
      const user = await this.userModel.findOne({ phone: phoneNumber });
      if (!user) return ResponseHelper.error('User not found');

      // Find order and verify it belongs to user
      const order = await this.orderModel.findById(orderId);
      if (!order) return ResponseHelper.error('Order not found');
      if (order.user_id.toString() !== user._id.toString()) {
        return ResponseHelper.error('Order does not belong to user');
      }
      if (order.status !== 'delivered') {
        return ResponseHelper.error('Can only review delivered orders');
      }
      if (order.rating_given) {
        return ResponseHelper.error('Review already given for this order');
      }

      // Check if review already exists
      const existingReview = await this.reviewModel.findOne({
        order_id: orderId,
      });
      if (existingReview) {
        return ResponseHelper.error('Review already exists for this order');
      }

      // Create review
      const review = await this.reviewModel.create({
        user_id: user._id,
        vendor_id: order.vendor_id,
        order_id: orderId,
        serviceName: order.items[0].service_name,
        rating,
        comment,
        is_verified: true,
      });

      // Update order to mark rating as given
      await this.orderModel.findByIdAndUpdate(orderId, {
        rating_given: true,
      });

      // Update vendor rating
      await this.updateVendorRating(order.vendor_id.toString());

      return ResponseHelper.success('Review submitted successfully', {
        reviewId: review._id,
      });
    } catch (error) {
      console.error('Error creating review:', error);
      return ResponseHelper.error('Failed to create review');
    }
  }

  async getVendorReviews(
    vendorId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const skip = (page - 1) * limit;

      const reviews = await this.reviewModel
        .find({ vendor_id: new Types.ObjectId(vendorId), is_verified: true })
        .populate('user_id', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const vendorRatings = await this.vendorModel
        .findById(vendorId)
        .select('rating')
        .lean();

      return ResponseHelper.success('Reviews retrieved', {
        reviews,
        average: vendorRatings.rating.average,
        totalReviews: vendorRatings.rating.total_reviews,
        page,
        limit,
        totalPages: Math.ceil(vendorRatings.rating.total_reviews / limit) || 1,
      });
    } catch (error) {
      console.error('Error getting vendor reviews:', error);
      return ResponseHelper.error('Failed to get reviews');
    }
  }

  // Convert hours → days + hours
  formatHours(hours: number) {
    if (!hours && hours !== 0) return null;

    // If below 24 hours → return like "8 hours"
    if (hours < 24) {
      return hours === 0 ? null : `${hours} Hours`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    // If no remaining hours → "2 days"
    if (remainingHours === 0) {
      return `${days} Days`;
    }

    // Otherwise → "2 days 5 hours"
    return `${days} Days ${remainingHours} Hours`;
  }

  async getVendorDetails(vendorId: string, phone: string) {
    try {
      let vendor: any = await this.vendorModel.aggregate([
        { $match: { _id: new Types.ObjectId(vendorId) } },
        {
          $addFields: {
            services_offered: {
              $map: {
                input: {
                  $filter: {
                    input: '$services_offered',
                    as: 'service',
                    cond: { $eq: ['$$service.is_approved', true] },
                  },
                },
                as: 'service',
                in: {
                  $mergeObjects: [
                    '$$service',
                    {
                      items: {
                        $filter: {
                          input: '$$service.items',
                          as: 'item',
                          cond: { $eq: ['$$item.is_active', true] },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        // Filter out services that have no active items
        {
          $addFields: {
            services_offered: {
              $filter: {
                input: '$services_offered',
                as: 'service',
                cond: {
                  $gt: [{ $size: '$$service.items' }, 0], // At least one active item exists
                },
              },
            },
          },
        },
      ]);

      const user = await this.userModel.findOne({ phone }).lean();

      const userDefaultAddress = user?.addresses?.[0] || null;

      let distance = await googleHelper.getDistance(
        userDefaultAddress?.latitude,
        userDefaultAddress?.longitude,
        vendor[0]?.address?.latitude,
        vendor[0]?.address?.longitude,
      );
      let destiny = distance?.destination_address?.split(',') || [];

      // Dynamically generate categories from items
      const servicesWithCategories =
        vendor[0]?.services_offered
          ?.filter((service) => service && service.pricing_type == 'per_pc')
          ?.map((service) => {
            const uniqueCategories = [
              ...new Set(
                (service.items || [])
                  .filter((item) => item)
                  .map((item) => item.category)
                  .filter(Boolean),
              ),
            ];

            return {
              category: {
                [service.service_name]: uniqueCategories,
              },
            };
          }) || [];
      let category = {};
      let offerDetails = {};
      let expressDetails = {
        is_express_available: false,
        fastest_express_time_hours: 0,
      };

      if (vendor[0] && servicesWithCategories) {
        const formattedCategories = servicesWithCategories.map((service) => {
          const categoryName = Object.keys(service.category)[0];
          return {
            category: { [categoryName]: service.category[categoryName] },
          };
        });
        formattedCategories.forEach((service) => {
          category = { ...category, ...service.category };
        });

        offerDetails['max_offer_percentage'] =
          vendor[0].services_offered.reduce(
            (total, value) => {
              if (total.total_percentage < value?.offer_percentage)
                total = {
                  total_percentage: value?.offer_percentage,
                  max_cap: value?.offer_max_cap,
                };

              return total;
            },
            { total_percentage: 0, max_cap: 0 },
          );
        offerDetails['is_offer'] =
          offerDetails['max_offer_percentage']?.total_percentage > 0;

        const expressServices =
          vendor[0].services_offered?.filter(
            (service) => service?.is_express_available,
          ) || [];
        const fastestExpress = expressServices.reduce(
          (min, service) =>
            min === null
              ? (service?.express_time ?? null)
              : Math.min(min, service?.express_time ?? min),
          null,
        );
        const normalizedFastestExpress = fastestExpress ?? 0;
        expressDetails = {
          is_express_available: expressServices.length > 0,
          fastest_express_time_hours: normalizedFastestExpress,
        };
      }

      // 🔹 Convert hours → days & hours
      vendor[0].services_offered = vendor[0].services_offered.map(
        (service) => {
          // Deduplicate items based on item_id
          const uniqueItems: any[] = [];
          const seenItemIds = new Set();
          if (service.items && Array.isArray(service.items)) {
            service.items.forEach((item) => {
              const id = item.item_id?.toString();
              if (id && !seenItemIds.has(id)) {
                seenItemIds.add(id);
                uniqueItems.push(item);
              }
            });
          }

          return {
            ...service,
            items: uniqueItems,
            express_delivery_time_minutes: this.formatHours(service.express_time),
            normal_delivery_time_minutes: this.formatHours(service.standard_time),
          }
        },
      );
      if (!vendor) return ResponseHelper.error('Vendor not found');
      return ResponseHelper.success('Vendor details retrieved', {
        vendor: vendor[0],
        category,
        distance: { ...distance, distance_val: destiny[destiny.length - 4] },
        offerDetails,
        expressDetails,
      });
    } catch (error) {
      console.error('Error getting vendor details:', error);
      return ResponseHelper.error('Failed to get vendor details');
    }
  }

  async getUserReviews(
    phoneNumber: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const user = await this.userModel.findOne({ phone: phoneNumber });
      if (!user) return ResponseHelper.error('User not found');

      const skip = (page - 1) * limit;

      const reviews = await this.reviewModel
        .find({ user_id: user._id })
        .populate('vendor_id', 'shop_name')
        .populate('order_id', 'order_number')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const totalReviews = await this.reviewModel.countDocuments({
        user_id: user._id,
      });

      return ResponseHelper.success('User reviews retrieved', {
        reviews,
        total: totalReviews,
        page,
        limit,
        totalPages: Math.ceil(totalReviews / limit),
      });
    } catch (error) {
      console.error('Error getting user reviews:', error);
      return ResponseHelper.error('Failed to get user reviews');
    }
  }

  private async updateVendorRating(vendorId: string) {
    try {
      // Get all verified reviews for the vendor
      const reviews = await this.reviewModel.find({
        vendor_id: new Types.ObjectId(vendorId),
        is_verified: true,
      });

      if (reviews.length === 0) return;

      // Calculate average rating
      const totalRating = reviews.reduce(
        (sum, review) => sum + review.rating,
        0,
      );
      const averageRating = totalRating / reviews.length;

      // Update vendor rating
      await this.vendorModel.findByIdAndUpdate(vendorId, {
        'rating.average': Math.round(averageRating * 10) / 10, // Round to 1 decimal
        'rating.total_reviews': reviews.length,
      });

      // Update vendor reviews array (keep only last 10 reviews for performance)
      const recentReviews = reviews
        .sort(
          (a, b) =>
            (b as any).createdAt.getTime() - (a as any).createdAt.getTime(),
        )
        .slice(0, 10)
        .map((review) => ({
          user_id: review.user_id,
          name: '', // Will be populated when needed
          rating: review.rating,
          serviceName: review.serviceName,
          comment: review.comment,
          date: (review as any).createdAt,
        }));

      await this.vendorModel.findByIdAndUpdate(vendorId, {
        'rating.reviews': recentReviews,
      });
    } catch (error) {
      console.error('Error updating vendor rating:', error);
    }
  }

  async getFilterLists() {
    try {
      let services = await this.serviceModel.find({}, { items: 0 }).lean();
      let serviceFilt = services.map((service) => ({
        [service.service_name]: service._id.toString(),
      }));
      serviceFilt.push({ is_offer: 'is_offer' });

      return ResponseHelper.success('Filter lists retrieved', {
        services: Object.values(SortOption),
        filter_options: serviceFilt,
      });
    } catch (error) {
      console.error('Error getting filter lists:', error);
      return ResponseHelper.error('Failed to get filter lists');
    }
  }

  async getOrderHistory(
    phoneNumber: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const user = await this.userModel.findOne({ phone: phoneNumber });
      if (!user) return ResponseHelper.error('User not found');

      // Ensure page and limit are numbers (safety check)
      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;
      const skip = (pageNum - 1) * limitNum;
      const userIdObject = new Types.ObjectId(user._id.toString());

      const [orders, total] = await Promise.all([
        this.orderModel.aggregate([
          {
            $match: {
              user_id: userIdObject,
            },
          },
          // Derive a sort group so we can prioritize active orders, then delivered, then rejected/unaccepted.
          {
            $addFields: {
              sortGroup: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ['$status', 'delivered'] },
                      then: 1, // second priority
                    },
                    {
                      case: {
                        $in: [
                          '$status',
                          ['rejected', 'unaccepted', 'cancelled'],
                        ],
                      },
                      then: 2, // lowest priority
                    },
                  ],
                  default: 0, // highest priority: everything else
                },
              },
            },
          },
          {
            $lookup: {
              from: 'vendors',
              localField: 'vendor_id',
              foreignField: '_id',
              as: 'vendor',
            },
          },
          {
            $unwind: {
              path: '$vendor',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'reviews',
              let: {
                orderId: { $toString: '$_id' },
                userId: userIdObject.toString(),
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: [{ $toString: '$order_id' }, '$$orderId'] },
                        { $eq: [{ $toString: '$user_id' }, '$$userId'] },
                      ],
                    },
                  },
                },
                {
                  $project: {
                    rating: 1,
                    comment: 1,
                  },
                },
              ],
              as: 'review',
            },
          },
          {
            $unwind: {
              path: '$review',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            // Sort by priority group first, then by _id (newest first) within each group.
            // Using _id instead of created_at for reliability since ObjectId contains timestamp
            $sort: { sortGroup: 1, _id: -1 },
          },
          {
            $skip: skip,
          },
          {
            $limit: limitNum,
          },
          {
            $project: {
              vendor_id: 1,
              shop_name: '$vendor.shop_name',
              order_number: 1,
              status_type: 1,
              status: 1,
              is_express: 1,
              is_verified: 1,
              pickup_scheduled_at: 1,
              picked_up_at: 1,
              delivered_to_vendor_at: 1,
              expected_delivery_date: 1,
              delivered_to_user_at: 1,
              payment_status: 1,
              payment_id: 1,
              payment_details: 1,
              total_amount: 1,
              currency: 1,
              order_notes: 1,
              rating_given: 1,
              items: 1,
              user_otp: 1,
              vendor_otp: 1,
              invoice_url: 1,
              trip_type: 1,
              is_settled_to_vendor: 1,
              status_timestamps: 1,
              vendor_address: 1,
              user_address: 1,
              rider: 1,
              driver_id_1: 1,
              driver_id_2: 1,
              created_at: 1,
              updated_at: 1,
              user_rating: { $ifNull: ['$review.rating', null] },
              user_rating_comment: { $ifNull: ['$review.comment', null] },
            },
          },
        ]),
        this.orderModel.countDocuments({ user_id: user._id }),
      ]);

      return ResponseHelper.success('Orders retrieved', {
        orders,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      });
    } catch (error) {
      console.error('Error getting order history:', error);
      return ResponseHelper.error('Failed to get order history');
    }
  }

  async getOrderById(phoneNumber: string, orderId: string) {
    try {
      const user = await this.userModel.findOne({ phone: phoneNumber });
      if (!user) return ResponseHelper.error('User not found');

      let order: any = await this.orderModel.aggregate([
        {
          $match: {
            _id: new Types.ObjectId(orderId),
            user_id: new Types.ObjectId(user._id),
          },
        },
        {
          $lookup: {
            from: 'vendors',
            localField: 'vendor_id',
            foreignField: '_id',
            as: 'vendor',
          },
        },
        { $unwind: '$vendor' },
        {
          $project: {
            __v: 0,
            updatedAt: 0,
            'vendor.createdAt': 0,
            'vendor.services_offered': 0,
            'vendor.address': 0,
            'vendor.rating': 0,
            'vendor.session_token': 0,
          },
        },
      ]);

      order = order[0];
      // Fetch user's rating for this order, if any
      const review = await this.reviewModel
        .findOne({
          order_id: orderId,
          user_id: user._id,
        })
        .select(['rating', 'comment'])
        .lean();

      if (review) {
        order.user_rating = review.rating;
        order.user_rating_comment = review.comment;
      }
      order.updateLogs = [];
      for (const status in order.status_timestamps) {
        console.log(status, 'status');
        if (
          order.trip_type == 2 &&
          [
            'driver_assigned',
            'accepted',
            'picked_up',
            'out_for_delivery',
          ].includes(statusAbr.str[status])
        ) {
          continue;
        }
        const timestamp = order.status_timestamps[status];
        order.updateLogs.push({
          statusStr: statusAbr.str[status],
          status: statusAbr.num[status],
          timestamp,
        });
      }

      if (order.updateLogs.length == 1 && order.updateLogs[0].status == 2)
        order.updateLogs.push({
          statusStr: 'Pending rider',
          status: 17,
          timestamp: order?.updateLogs[0]?.timestamp || null,
        });

      if (order.updateLogs.length == 0)
        order.updateLogs.push({
          statusStr: 'Pending confirmation',
          status: 16,
          timestamp: null,
        });

      if (order.updateLogs.length == 2 && order.updateLogs[1].status != 17) {
        order.updateLogs.push({
          statusStr: 'PHONE',
          status: 18,
          timestamp: order.updateLogs[1]?.timestamp,
        });
        order.updateLogs.push({
          statusStr: 'OTP',
          status: 19,
          timestamp: order.updateLogs[1]?.timestamp,
        });
      }

      if (order.status_type == 8 && order.trip_type == 1) {
        order.updateLogs = [order.updateLogs[order.updateLogs.length - 1]];
      }

      if (order.status_type == 2 && order.trip_type == 2) {
        order.updateLogs = [order.updateLogs[order.updateLogs.length - 1]];
      }

      if (order.status_type == 3 && order.trip_type == 1) {
        order.updateLogs = order.updateLogs.filter(
          (log: any) => log.statusStr != 'driver_assigned',
        );
      }

      if ((order.status_type == 4 && order.trip_type == 1) || (order.status_type == 5 && order.trip_type == 1)) {
        order.updateLogs = order.updateLogs.filter(
          (log: any) => log.statusStr != 'driver_assigned',
        );
      }

      if (order.status_type == 2 && order.trip_type == 2) {
        order.updateLogs = [
          {
            statusStr: 'processing',
            status: 10,
            timestamp: order.status_timestamps.processing_at,
          },
        ];
      }

      if (order.status_type == 3 && order.trip_type == 2) {
        order.updateLogs = order.updateLogs.slice(0, 1);
      }
      if (order.status_type == 5 && order.trip_type == 2) {
        order.updateLogs = order.updateLogs.filter(
          (log: any) =>
            ![
              'accepted',
              'picked_up',
              'processing',
              'processed',
              'driver_assigned',
            ].includes(log.statusStr),
        );

        order.updateLogs.unshift({
          statusStr: 'out_for_delivery',
          status: 15,
          timestamp: order.updateLogs[0]?.timestamp,
        });
        // order.updateLogs.push({
        //   statusStr: 'OTP',
        //   status: 19,
        //   timestamp: order.updateLogs[0]?.timestamp,
        // });
      }

      if (order.status_type == 6 && order.trip_type == 1) {
        order.updateLogs.forEach((log: any) => {
          if (log.statusStr == 'driver_assigned') {
            log.statusStr = 'PHONE';
            log.status = 18;
          }
        });

        order.updateLogs.push({
          statusStr: 'OTP',
          status: 19,
          timestamp: order.updateLogs[1]?.timestamp,
        });

        order.updateLogs.sort((a: any, b: any) => a.timestamp - b.timestamp);
      }

      if (order.status_type == 7 && order.trip_type == 1) {
        order.updateLogs.forEach((log: any) => {
          if (log.statusStr == 'driver_assigned') {
            log.statusStr = 'PHONE';
            log.status = 18;
          }
        });

        order.updateLogs.push({
          statusStr: 'OTP',
          status: 19,
          timestamp: order.updateLogs[1]?.timestamp,
        });

        order.updateLogs.sort((a: any, b: any) => a.timestamp - b.timestamp);
      }

      if (!order) return ResponseHelper.error('Order not found');

      return ResponseHelper.success('Order retrieved', { order });
    } catch (error) {
      console.error('Error getting order by id:', error);
      return ResponseHelper.error('Failed to get order');
    }
  }

  async invoiceGeneration(orderId?: string) {
    try {
      let order;

      order = await this.orderModel.findOne({
        _id: new Types.ObjectId(orderId),
      });

      if (!order) {
        return ResponseHelper.error('Delivered order not found for user');
      }

      const result = await this.invoiceHelper.generateInvoice(
        order._id.toString(),
        this.orderModel,
        this.userModel,
        this.vendorModel,
      );

      if (!result.success) {
        return ResponseHelper.error(
          result.error || 'Invoice generation failed',
        );
      }

      return ResponseHelper.success('Invoice generated successfully', {
        invoiceUrl: result.invoiceUrl,
      });
    } catch (error) {
      console.error('Error testing invoice generation:', error);
      return ResponseHelper.error('Failed to generate invoice');
    }
  }

  async getNotifications(
    phoneNumber: string,
    page: number = 1,
    limit: number = 20,
  ) {
    try {
      const user = await this.userModel.findOne({ phone: phoneNumber });
      if (!user) return ResponseHelper.error('User not found');

      const skip = (page - 1) * limit;

      const [notifications, total, unreadCount] = await Promise.all([
        this.notificationModel
          .find({
            recipient_id: user._id,
            recipient_role: 'user',
          })
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        this.notificationModel.countDocuments({
          recipient_id: user._id,
          recipient_role: 'user',
        }),
        this.notificationModel.countDocuments({
          recipient_id: user._id,
          recipient_role: 'user',
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

  async logout(phone: string) {
    try {
      const user = await this.userModel.findOneAndUpdate(
        { phone },
        { session_token: null, fcm_token: null },
      );
      if (user) {
        this.trackingGateway.deleteGroup(user._id.toString());
      }
      return ResponseHelper.success('Logout successful');
    } catch (error) {
      console.error('Error during logout:', error);
      return ResponseHelper.error('Failed to logout');
    }
  }

  async cancelOrder(userId: string, orderId: string) {
    try {
      const order: any = await this.orderModel.findById(orderId);
      if (!order) return ResponseHelper.error('Order not found');
      if (order.user_id.toString() !== userId) {
        return ResponseHelper.error('Order does not belong to user');
      }
      if (order.status != 'pending') {
        return ResponseHelper.error(
          'Order is acepeted and cannot be cancelled',
        );
      }
      if (order.status === 'cancelled') {
        return ResponseHelper.error('Order is already pending cancellation');
      }

      order.status = 'cancelled';
      order.status_timestamps.cancelled_at = new Date();
      await order.save();

      this.trackingGateway.publishEventToGroup(
        order.vendor_id.toString(),
        {},
        'vendor-order',
      );

      return ResponseHelper.success('Order cancelled successfully');
    } catch (error) {
      console.error('Error cancelling order:', error);
      return ResponseHelper.error('Failed to cancel order');
    }
  }

  async webhookCashfree(reqBody: any, headers: any = {}) {
    try {
      const signature =
        headers['x-cf-signature'] || headers['x-cashfree-signature'];
      if (signature) {
        const env =
          process.env.NODE_ENV === 'production'
            ? CASH_FREE_PAYMENT_PROD
            : CASH_FREE_PAYMENT;

        const payload = JSON.stringify(reqBody);
        // const expectedSignature = crypto
        //   .createHmac('sha256', env.client_secret)
        //   .update(payload)
        //   .digest('hex');

        // // Compare signatures (use timing-safe comparison in production)
        // if (signature !== expectedSignature) {
        //   console.error('Webhook signature verification failed');
        //   return ResponseHelper.error('Invalid webhook signature');
        // }
      }

      const { type, data } = reqBody;

      const appConfigData = await this.appconfigModel.findOne().lean();
      const vendorComissionPercentage =
        appConfigData?.payment_config?.vendor_commission || 10;

      if (!type || !data) {
        return ResponseHelper.error('Invalid webhook payload');
      }

      let orderId: string | null = null;
      let linkId: string | null = null;
      let paymentStatus: string | null = null;
      let linkStatus: string | null = null;

      // Handle PAYMENT_SUCCESS_WEBHOOK
      if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
        paymentStatus = data.payment?.payment_status || null;

        // Extract link_id from order_tags (Cashfree includes it in PAYMENT_SUCCESS_WEBHOOK)
        linkId = data.order?.order_tags?.link_id || null;

        // If link_id found, find transaction log by link_id
        if (linkId) {
          const transactionLog = await this.transactionLogModel.findOne({
            link_id: linkId,
          });
          if (transactionLog) {
            orderId = transactionLog.order_id.toString();
          }
        }

        // Fallback: Try to find by cashfree_order_id in metadata
        if (!orderId) {
          const cashfreeOrderId = data.order?.order_id || null;
          if (cashfreeOrderId) {
            const transactionLog = await this.transactionLogModel.findOne({
              'metadata.cashfree_order_id': cashfreeOrderId,
            });
            if (transactionLog) {
              orderId = transactionLog.order_id.toString();
              linkId = transactionLog.link_id;
            }
          }
        }
      }

      // Handle PAYMENT_LINK_EVENT
      if (type === 'PAYMENT_LINK_EVENT') {
        linkStatus = data.link_status || null;
        linkId = data.link_id || null;

        // Extract order_id from link_purpose (format: "Making Payment for Order {orderId}")
        if (data.link_purpose) {
          const match = data.link_purpose.match(/Order\s+([a-f0-9]{24})/i);
          if (match && match[1]) {
            orderId = match[1];
          }
        }

        // If order_id not found in link_purpose, try to find from transaction log by link_id
        if (!orderId && linkId) {
          const transactionLog = await this.transactionLogModel.findOne({
            link_id: linkId,
          });
          if (transactionLog) {
            orderId = transactionLog.order_id.toString();
          }
        }
      }

      if (!orderId) {
        console.error('Order ID not found in webhook payload', {
          type,
          linkId: linkId || 'not found',
          orderTags: data.order?.order_tags,
          linkPurpose: data.link_purpose,
        });
        // Return success to prevent webhook retries, but log the issue
        // This can happen if webhook arrives before transaction log is created
        return ResponseHelper.success(
          'Webhook received but order not found in system',
          {
            warning: 'Order ID not found in webhook payload',
            webhook_type: type,
          },
        );
      }

      // Find the order
      const order = await this.orderModel.findById(orderId);
      let amountToVendor = order.payment_details.amount_to_vendor || 0;
      const amount_after_commission =
        amountToVendor - (vendorComissionPercentage / 100) * amountToVendor;
      if (!order) {
        console.error(`Order not found: ${orderId}`);
        return ResponseHelper.error('Order not found');
      }

      // Find transaction log by link_id
      let transactionLog = null;
      if (linkId) {
        transactionLog = await this.transactionLogModel.findOne({
          link_id: linkId,
          order_id: order._id,
        });
      }

      // Determine status based on webhook type
      let transactionLogStatus: 'completed' | 'failed' | 'cancelled' | null =
        null;
      let orderPaymentStatus: 'paid' | 'pending' | 'initiated' | null = null;

      if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
        if (paymentStatus === 'SUCCESS') {
          transactionLogStatus = 'completed';
          orderPaymentStatus = 'paid';
          this.invoiceHelper.generateInvoiceForOrder(order._id.toString());
        } else if (paymentStatus === 'FAILED') {
          transactionLogStatus = 'failed';
          orderPaymentStatus = 'pending';
        }
      } else if (type === 'PAYMENT_LINK_EVENT') {
        if (linkStatus === 'PAID') {
          transactionLogStatus = 'completed';
          orderPaymentStatus = 'paid';
        } else if (linkStatus === 'EXPIRED') {
          transactionLogStatus = 'cancelled';
          // Keep order payment_status as is (don't change to pending if it was initiated)
        }
      }

      // Idempotency check: Skip if already processed with same status
      if (transactionLog && transactionLogStatus) {
        // Check if transaction log already has the target status
        if (transactionLog.status === transactionLogStatus) {
          console.log(
            `Transaction log already has status ${transactionLogStatus}, skipping update (idempotency)`,
          );
          // Still return success to prevent webhook retries
          return ResponseHelper.success('Webhook already processed', {
            order_id: orderId,
            transaction_log_status: transactionLog.status,
            already_processed: true,
          });
        }

        // Check if order already has the target payment_status
        if (orderPaymentStatus && order.payment_status === orderPaymentStatus) {
          console.log(
            `Order already has payment_status ${orderPaymentStatus}, skipping update (idempotency)`,
          );
          // Still return success to prevent webhook retries
          return ResponseHelper.success('Webhook already processed', {
            order_id: orderId,
            order_payment_status: order.payment_status,
            already_processed: true,
          });
        }

        // Update transaction log
        await this.transactionLogModel.findByIdAndUpdate(
          transactionLog._id,
          {
            status: transactionLogStatus,
            description: transactionLog.description
              ? `${transactionLog.description} - Updated via webhook: ${type}`
              : `Updated via webhook: ${type}`,
            metadata: {
              ...transactionLog.metadata,
              webhook_type: type,
              webhook_event_time: reqBody.event_time,
              payment_status: paymentStatus || linkStatus,
              last_webhook_processed_at: new Date().toISOString(),
            },
          },
          { new: true },
        );
        console.log(
          `Transaction log updated: ${transactionLog._id} -> ${transactionLogStatus}`,
        );
      }

      // Update order payment_status
      if (orderPaymentStatus && order.payment_status !== orderPaymentStatus) {
        if (orderPaymentStatus === 'paid') {
          await this.vendorModel.findByIdAndUpdate(order.vendor_id, {
            $inc: { amount_due: amount_after_commission },
            $push: { orders_to_be_settled: order._id.toString() },
          });

          await this.orderModel.findByIdAndUpdate(
            order._id,
            {
              payment_status: orderPaymentStatus,
              'payment_details.is_payment_eligible': false,
              payment: 2, // Mark payment method as Cashfree
            },
            { new: false },
          );
        } else {
          await this.orderModel.findByIdAndUpdate(
            order._id,
            { payment_status: orderPaymentStatus },
            { new: false },
          );
        }

        console.log(
          `Order payment_status updated: ${order._id} -> ${orderPaymentStatus}`,
        );
      } else if (
        orderPaymentStatus &&
        order.payment_status === orderPaymentStatus
      ) {
        console.log(
          `Order already has payment_status ${orderPaymentStatus}, skipping update (idempotency)`,
        );
      }

      this.trackingGateway.publishEventToGroup(
        order._id.toString(),
        {},
        'order-update-payment',
      );

      return ResponseHelper.success('Webhook processed successfully', {
        order_id: orderId,
        transaction_log_updated: !!transactionLog,
        order_updated: !!orderPaymentStatus,
      });
    } catch (error) {
      console.error('Error in webhookCashfree:', error);
      return ResponseHelper.error(
        error instanceof Error
          ? `Failed to process webhook: ${error.message}`
          : 'Failed to process webhook',
      );
    }
  }

  async makePayment(phoneNumber: string, reqBody: any) {
    try {
      const { order_id } = reqBody;
      if (!order_id) {
        return ResponseHelper.error('Order ID is required');
      }

      let user = await this.userModel.findOne({ phone: phoneNumber }).lean();
      if (!user) {
        return ResponseHelper.error('User not found');
      }

      let orderData = await this.orderModel
        .findOne({
          _id: order_id,
          user_id: user._id,
        })
        .lean();
      if (orderData.payment_status === 'paid') {
        return ResponseHelper.success('Order already paid', {
          order_id: order_id,
        });
      }
      if (orderData.payment_details.is_payment_eligible === false) {
        return ResponseHelper.error('Order is not eligible for payment');
      }
      if (!orderData) {
        return ResponseHelper.error('Order not found');
      }

      // Update payment status directly in database
      await this.orderModel.findByIdAndUpdate(
        order_id,
        { payment_status: 'initiated' },
        { new: false },
      );

      const paymentLinkResponse = await makePaymentLink(
        user._id.toString(),
        orderData.payment_details.totalPayableAmount,
        orderData._id.toString(),
        user.phone,
        user.name || 'User',
      );

      if (!paymentLinkResponse.status) {
        return ResponseHelper.error(
          paymentLinkResponse.message || 'Payment link creation failed',
        );
      }

      // Create transaction log entry for each payment link request
      await this.transactionLogModel.create({
        order_id: orderData._id,
        user_id: user._id,
        link_id: paymentLinkResponse.data.linkId,
        status: 'initiated',
        amount: orderData.payment_details.totalPayableAmount,
        currency: orderData.currency || 'INR',
        payment_link_url: paymentLinkResponse.data.link,
        payment_gateway: 'Cashfree',
        description: `Payment link created for order ${orderData._id.toString()}`,
        metadata: {
          order_number: orderData.order_number,
          user_phone: user.phone,
          user_name: user.name || 'User',
          cashfree_order_id: paymentLinkResponse.data.orderId,
        },
      });

      return ResponseHelper.success(
        paymentLinkResponse.message || 'Payment link created successfully',
        { paymentLink: paymentLinkResponse.data.link },
      );
    } catch (error) {
      console.error('Error in makePayment:', error);
      return ResponseHelper.error(
        error instanceof Error
          ? `Failed to make payment: ${error.message}`
          : 'Failed to make payment',
      );
    }
  }

  async changePaymentMethod(phoneNumber: string, reqBody: any) {
    try {
      const { order_id, payment_method } = reqBody;
      if (!order_id || !payment_method) {
        return ResponseHelper.error('Order ID and payment method are required');
      }

      let user = await this.userModel.findOne({ phone: phoneNumber }).lean();
      if (!user) {
        return ResponseHelper.error('User not found');
      }

      let orderData = await this.orderModel
        .findOne({
          _id: order_id,
          user_id: user._id,
        })
        .lean();
      if (!orderData) {
        return ResponseHelper.error('Order not found');
      }

      if (orderData.payment_status === 'paid') {
        return ResponseHelper.error(
          'Cannot change payment method for paid order',
        );
      }

      await this.orderModel.findByIdAndUpdate(
        order_id,
        { payment: payment_method },
        { new: false },
      );
      return ResponseHelper.success('Payment method changed successfully', {
        order_id: order_id,
        payment_method: payment_method,
      });
    } catch (error) {
      console.error('Error in changePaymentMethod:', error);
      return ResponseHelper.error(
        error instanceof Error
          ? `Failed to change payment method: ${error.message}`
          : 'Failed to change payment method',
      );
    }
  }
}
