import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  CASH_FREE_PAYMENT,
  CASH_FREE_PAYMENT_PROD,
} from '../config/cashfree.config';
import { PrismaService } from '../prisma/prisma.service';
import { OtpHelper } from '../auth/otp.helper';
import { JwtHelper } from '../auth/jwt.helper';
import googleHelper from '../helper/google.helper';
import { ResponseHelper } from '../helper/response.helper';
import { InvoiceHelper } from '../helper/invoice.helper';
import {
  calculateLatLong,
  calculateDistance,
} from 'src/helper/lat-long.helper';
import { VendorHelper } from 'src/helper/vendor.helper';
import { TrackingGateway } from 'src/delivery/tracking.gateway';
import { FilterVendorsDto, SortOption, FilterOption } from './dto';
import { NotificationService } from 'src/notification-module/notification-service.service';
import { makePaymentLink } from '../utils/cashFree.util';
import { EXP_CONFIG } from 'src/config/otp.config';
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
    private readonly prisma: PrismaService,
    private readonly otpHelper: OtpHelper,
    private readonly invoiceHelper: InvoiceHelper,
    private readonly jwtHelper: JwtHelper,
    private readonly vendorHelper: VendorHelper,
    private readonly trackingGateway: TrackingGateway,
    private readonly offerService: OfferService,
    private readonly notificationService: NotificationService,
  ) {}

  async auth(phoneNumber: string) {
    const user = await this.prisma.user.findFirst({ where: { phone: phoneNumber } });
    if (user) {
      if (user.status !== 'active') {
        return ResponseHelper.error('User account is blocked.');
      }
    }
    await this.otpHelper.sendOtp(phoneNumber);
    return ResponseHelper.success('OTP sent');
  }

  async resendOtp(phoneNumber: string) {
    const user = await this.prisma.user.findFirst({ where: { phone: phoneNumber } });
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
    let user = await this.prisma.user.findFirst({ where: { phone: phoneNumber } });
    const token = this.jwtHelper.sign({ phoneNumber }, 'user', {
      expiresIn: EXP_CONFIG.EXPIRY_DAYS as any,
    });
    if (!user) {
      try {
        user = await this.prisma.user.create({
          data: {
            phone: phoneNumber,
            fcmToken: fcm_token,
            sessionToken: token,
          },
        });
      } catch (error) {
        if (error.code === 'P2002') {
          return ResponseHelper.error('Phone number already exists.');
        }
        throw error;
      }
    } else {
      if (user.status !== 'active') {
        return ResponseHelper.error('User account is blocked.');
      }
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          fcmToken: fcm_token,
          sessionToken: token,
        },
      });
    }

    this.trackingGateway.joinUserToGroup(user.id, user.id);
    return ResponseHelper.success('Login successful', {
      token,
      is_new: user.name ? false : true,
    });
  }

  async getMeByPhoneNumber(phoneNumber: string) {
    const user = await this.prisma.user.findFirst({
      where: { phone: phoneNumber },
      include: { addresses: true },
    });
    if (!user) return ResponseHelper.error('User not found');

    const appVersions = await this.prisma.appVersion.findMany({
      where: {
        appType: { in: ['user_android', 'user_ios'] },
      },
    });

    const appConfig = await this.prisma.appConfig.findFirst({
      where: { isActive: true },
      select: {
        supportPhoneNumber: true,
        privacyPolicyUrl: true,
        termsUrl: true,
      },
    });

    return ResponseHelper.success('User details retrieved', {
      user: {
        ...user,
        app_version: appVersions,
        is_new: user.name ? false : true,
        support_phone_number: appConfig?.supportPhoneNumber,
        privacy_policy_url: appConfig?.privacyPolicyUrl,
        terms_url: appConfig?.termsUrl,
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
    const user = await this.prisma.user.findFirst({ where: { phone: phoneNumber } });
    if (!user) return ResponseHelper.error('User not found');

    await this.prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

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
    const user = await this.prisma.user.findFirst({
      where: { phone: phoneNumber },
      include: { addresses: true },
    });
    if (!user) return ResponseHelper.error('User not found');

    if (user.addresses.length >= 5) {
      return ResponseHelper.error('Maximum 5 addresses allowed.');
    }

    // Check for duplicate label (case-insensitive)
    const labelExists = user.addresses.some(
      (addr) => addr.label?.toLowerCase() === addressData.label.toLowerCase(),
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

    const addedAddress = await this.prisma.userAddress.create({
      data: {
        userId: user.id,
        label: addressData.label,
        addressLine1: addressData.address_line1,
        addressLine2: addressData.address_line2,
        city: components.city,
        state: components.state,
        pincode: components.pincode,
        latitude: addressData.latitude,
        longitude: addressData.longitude,
        isDefault: isDefault,
      },
    });

    return ResponseHelper.success('Address added successfully', {
      addressId: addedAddress.id,
    });
  }

  async removeAddress(phoneNumber: string, addressId: string) {
    const user = await this.prisma.user.findFirst({
      where: { phone: phoneNumber },
      include: { addresses: true },
    });
    if (!user) return ResponseHelper.error('User not found');

    const address = user.addresses.find((addr) => addr.id === addressId);
    if (!address) return ResponseHelper.error('Address not found');

    // Prevent removal of default address
    if (address.isDefault) {
      return ResponseHelper.error(
        'Cannot remove default address. Please set another address as default first.',
      );
    }

    await this.prisma.userAddress.delete({ where: { id: addressId } });

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
    const user = await this.prisma.user.findFirst({
      where: { phone: phoneNumber },
      include: { addresses: true },
    });
    if (!user) return ResponseHelper.error('User not found');

    const addressIndex = user.addresses.findIndex(
      (addr) => addr.id === addressId,
    );
    if (addressIndex === -1) return ResponseHelper.error('Address not found');

    const address = user.addresses[addressIndex];
    const dataToUpdate: any = {};

    // Check for duplicate label if label is being updated
    if (updateData.label !== undefined) {
      const labelExists = user.addresses.some(
        (addr, index) =>
          index !== addressIndex &&
          addr.label?.toLowerCase() === updateData.label!.toLowerCase(),
      );
      if (labelExists) {
        return ResponseHelper.error(
          'An address with this label already exists. Please use a different label.',
        );
      }
      dataToUpdate.label = updateData.label;
    }

    // Handle is_default change
    if (updateData.is_default !== undefined) {
      if (updateData.is_default === true) {
        // Unset all other addresses' default
        await this.prisma.userAddress.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        });
        dataToUpdate.isDefault = true;
      } else {
        if (user.addresses.length > 1) {
          const hasOtherDefault = user.addresses.some(
            (addr, index) => index !== addressIndex && addr.isDefault,
          );
          if (!hasOtherDefault) {
            return ResponseHelper.error(
              'Cannot unset default address. At least one address must be set as default.',
            );
          }
          dataToUpdate.isDefault = false;
        } else {
          return ResponseHelper.error(
            'Cannot unset default address. This is the only address.',
          );
        }
      }
    }

    if (updateData.address_line1) {
      dataToUpdate.addressLine1 = updateData.address_line1;
    }
    if (updateData.address_line2 !== undefined) {
      dataToUpdate.addressLine2 = updateData.address_line2;
    }

    // Update coordinates and location details if latitude/longitude changed
    if (
      updateData.latitude !== undefined &&
      updateData.longitude !== undefined
    ) {
      dataToUpdate.latitude = updateData.latitude;
      dataToUpdate.longitude = updateData.longitude;
      const addressComponents = await googleHelper.getAddress(
        updateData.latitude,
        updateData.longitude,
      );
      const components = addressComponents.components as any;
      if (components && components.city) {
        dataToUpdate.city = components.city;
        dataToUpdate.state = components.state;
        dataToUpdate.pincode = components.pincode;
      } else {
        return ResponseHelper.error(
          'Unable to decode address from coordinates.',
        );
      }
    }

    await this.prisma.userAddress.update({
      where: { id: addressId },
      data: dataToUpdate,
    });

    return ResponseHelper.success('Address updated successfully');
  }

  async getAddresses(phoneNumber: string) {
    const user = await this.prisma.user.findFirst({
      where: { phone: phoneNumber },
      include: { addresses: true },
    });
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
    const user = await this.prisma.user.findFirst({
      where: { phone: phoneNumber },
      include: { addresses: true },
    });
    if (!user) return ResponseHelper.error('User not found');

    const userAddress = user.addresses.find((addr) => addr.isDefault);
    if (!userAddress)
      return ResponseHelper.error(
        'Please set a home address to see nearby vendors.',
      );

    // Fetch app config to get max vendor distance
    const appConfig = await this.prisma.appConfig.findFirst({ where: { isActive: true } });
    if (!appConfig) {
      return ResponseHelper.error('App configuration not found');
    }

    const maxDistance = appConfig.orderDistance || 10;

    const { latitude: userLat, longitude: userLong } = userAddress;
    const { minLat, maxLat, minLong, maxLong } = calculateLatLong(
      maxDistance,
      userLat,
      userLong,
    );

    // Build Prisma where clause
    const vendorWhere: any = {
      status: 'active',
      shopOpenStatus: 'open',
      latitude: { gte: minLat, lte: maxLat },
      longitude: { gte: minLong, lte: maxLong },
      OR: [
        { shopCloseTime: null },
        { shopCloseTime: { gte: new Date() } },
      ],
    };

    // Add vendor name search filter if provided
    if (payload.search && payload.search.trim().length > 0) {
      vendorWhere.shopName = {
        contains: payload.search.trim(),
        mode: 'insensitive',
      };
    }

    // Fetch vendors with their services and items
    let vendors = await this.prisma.vendor.findMany({
      where: vendorWhere,
      include: {
        servicesOffered: {
          where: {
            isApproved: true,
            isActive: true,
          },
          include: {
            items: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    // Filter out vendors with no services that have active items
    vendors = vendors.filter(
      (v) => v.servicesOffered.some((s) => s.items.length > 0),
    );

    // Filter out services with no active items
    vendors = vendors.map((v) => ({
      ...v,
      servicesOffered: v.servicesOffered.filter((s) => s.items.length > 0),
    })) as any;

    // Service type filters
    if (
      payload.serviceFilters &&
      Array.isArray(payload.serviceFilters) &&
      payload.serviceFilters.length > 0
    ) {
      vendors = vendors.filter((v) =>
        v.servicesOffered.some((s) =>
          payload.serviceFilters!.includes(s.serviceId),
        ),
      );
    }

    // Express filter
    if (payload.isExpress !== undefined && payload.isExpress) {
      vendors = vendors.filter((v) =>
        v.servicesOffered.some(
          (s) =>
            s.isExpressAvailable &&
            s.items.some((item) => item.isActive && item.expressPrice > 0),
        ),
      );
    }

    // Offer filter
    if (payload.isOffer !== undefined && payload.isOffer) {
      if (
        payload.serviceFilters &&
        Array.isArray(payload.serviceFilters) &&
        payload.serviceFilters.length > 0
      ) {
        vendors = vendors.filter((v) =>
          v.servicesOffered.some(
            (s) =>
              payload.serviceFilters!.includes(s.serviceId) &&
              s.isOffer &&
              (s.offerPercentage ?? 0) > 0,
          ),
        );
      } else {
        vendors = vendors.filter((v) =>
          v.servicesOffered.some(
            (s) => s.isOffer && (s.offerPercentage ?? 0) > 0,
          ),
        );
      }
    }

    // Add distance calculation to each vendor
    const vendorsWithValidCoords = vendors.filter(
      (vendor) => vendor.latitude != null && vendor.longitude != null,
    );

    let processedVendors: any[] = await Promise.all(
      vendorsWithValidCoords.map(async (vendor) => {
        const distance = await calculateDistance(
          userLat,
          userLong,
          vendor.latitude!,
          vendor.longitude!,
        );
        return {
          ...vendor,
          // Map services_offered for compatibility with applySorting
          services_offered: vendor.servicesOffered.map((s) => ({
            service_id: s.serviceId,
            service_name: s.serviceName,
            is_approved: s.isApproved,
            is_active: s.isActive,
            is_express_available: s.isExpressAvailable,
            express_time: s.expressTime,
            standard_time: s.standardTime,
            pricing_type: s.pricingType,
            standard_price_per_kg: s.standardPricePerKg,
            express_price_per_kg: s.expressPricePerKg,
            is_offer: s.isOffer,
            offer_percentage: s.offerPercentage,
            offer_max_cap: s.offerMaxCap,
            items: s.items.map((i) => ({
              item_id: i.itemId,
              item_name: i.itemName,
              item_price: i.itemPrice,
              express_price: i.expressPrice,
              is_active: i.isActive,
              category: i.category,
            })),
          })),
          rating: {
            average: vendor.ratingAverage,
            total_reviews: vendor.ratingTotalReviews,
          },
          distance: Number(distance.toFixed(2)),
        };
      }),
    );

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
    const paginatedVendors = processedVendors.slice(startIndex, endIndex).map((e) => {
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
              service?.is_express_available === true &&
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
    // Build initial where criteria
    const vendorWhere: any = {
      status: 'active',
      shopOpenStatus: 'open',
      OR: [
        { shopCloseTime: null },
        { shopCloseTime: { gte: new Date() } },
      ],
    };

    // Apply location filter only if coordinates are provided
    if (userLat != null && userLong != null) {
      const appConfig = await this.prisma.appConfig.findFirst({
        where: { isActive: true },
      });
      if (!appConfig) {
        return ResponseHelper.error('App configuration not found');
      }

      const maxDistance = appConfig.orderDistance || 10;
      const { minLat, maxLat, minLong, maxLong } = calculateLatLong(
        maxDistance,
        userLat,
        userLong,
      );

      vendorWhere.latitude = { gte: minLat, lte: maxLat };
      vendorWhere.longitude = { gte: minLong, lte: maxLong };
    }

    // Add vendor name search filter if provided
    if (payload.search && payload.search.trim().length > 0) {
      vendorWhere.shopName = {
        contains: payload.search.trim(),
        mode: 'insensitive',
      };
    }

    // Fetch vendors with their services and items
    let vendors = await this.prisma.vendor.findMany({
      where: vendorWhere,
      include: {
        servicesOffered: {
          where: {
            isApproved: true,
            isActive: true,
          },
          include: {
            items: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    // Filter out vendors with no services that have active items
    vendors = vendors.filter(
      (v) => v.servicesOffered.some((s) => s.items.length > 0),
    );

    // Filter out services with no active items
    vendors = vendors.map((v) => ({
      ...v,
      servicesOffered: v.servicesOffered.filter((s) => s.items.length > 0),
    })) as any;

    // Service type filters
    if (
      payload.serviceFilters &&
      Array.isArray(payload.serviceFilters) &&
      payload.serviceFilters.length > 0
    ) {
      vendors = vendors.filter((v) =>
        v.servicesOffered.some((s) =>
          payload.serviceFilters!.includes(s.serviceId),
        ),
      );
    }

    // Express filter
    if (payload.isExpress !== undefined && payload.isExpress) {
      vendors = vendors.filter((v) =>
        v.servicesOffered.some(
          (s) =>
            s.isExpressAvailable &&
            s.items.some((item) => item.isActive && item.expressPrice > 0),
        ),
      );
    }

    // Offer filter
    if (payload.isOffer !== undefined && payload.isOffer) {
      if (
        payload.serviceFilters &&
        Array.isArray(payload.serviceFilters) &&
        payload.serviceFilters.length > 0
      ) {
        vendors = vendors.filter((v) =>
          v.servicesOffered.some(
            (s) =>
              payload.serviceFilters!.includes(s.serviceId) &&
              s.isOffer &&
              (s.offerPercentage ?? 0) > 0,
          ),
        );
      } else {
        vendors = vendors.filter((v) =>
          v.servicesOffered.some(
            (s) => s.isOffer && (s.offerPercentage ?? 0) > 0,
          ),
        );
      }
    }

    // Transform vendors and calculate distances
    let processedVendors: any[];
    if (userLat != null && userLong != null) {
      const vendorsWithValidCoords = vendors.filter(
        (vendor) => vendor.latitude != null && vendor.longitude != null,
      );

      processedVendors = await Promise.all(
        vendorsWithValidCoords.map(async (vendor) => {
          const distance = await calculateDistance(
            userLat,
            userLong,
            vendor.latitude!,
            vendor.longitude!,
          );
          return {
            ...vendor,
            services_offered: vendor.servicesOffered.map((s) => ({
              service_id: s.serviceId,
              service_name: s.serviceName,
              is_approved: s.isApproved,
              is_active: s.isActive,
              is_express_available: s.isExpressAvailable,
              express_time: s.expressTime,
              standard_time: s.standardTime,
              pricing_type: s.pricingType,
              standard_price_per_kg: s.standardPricePerKg,
              express_price_per_kg: s.expressPricePerKg,
              is_offer: s.isOffer,
              offer_percentage: s.offerPercentage,
              offer_max_cap: s.offerMaxCap,
              items: s.items.map((i) => ({
                item_id: i.itemId,
                item_name: i.itemName,
                item_price: i.itemPrice,
                express_price: i.expressPrice,
                is_active: i.isActive,
                category: i.category,
              })),
            })),
            rating: {
              average: vendor.ratingAverage,
              total_reviews: vendor.ratingTotalReviews,
            },
            distance: Number(distance.toFixed(2)),
          };
        }),
      );
    } else {
      processedVendors = vendors.map((vendor) => ({
        ...vendor,
        services_offered: vendor.servicesOffered.map((s) => ({
          service_id: s.serviceId,
          service_name: s.serviceName,
          is_approved: s.isApproved,
          is_active: s.isActive,
          is_express_available: s.isExpressAvailable,
          express_time: s.expressTime,
          standard_time: s.standardTime,
          pricing_type: s.pricingType,
          standard_price_per_kg: s.standardPricePerKg,
          express_price_per_kg: s.expressPricePerKg,
          is_offer: s.isOffer,
          offer_percentage: s.offerPercentage,
          offer_max_cap: s.offerMaxCap,
          items: s.items.map((i) => ({
            item_id: i.itemId,
            item_name: i.itemName,
            item_price: i.itemPrice,
            express_price: i.expressPrice,
            is_active: i.isActive,
            category: i.category,
          })),
        })),
        rating: {
          average: vendor.ratingAverage,
          total_reviews: vendor.ratingTotalReviews,
        },
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
      const [bannersData, servicesData] = await Promise.all([
        this.prisma.banner.findMany({ where: { isActive: true } }),
        this.prisma.service.findMany({
          select: {
            id: true,
            serviceName: true,
            imageUrl: true,
            pricingType: true,
            serviceDescription: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
      ]);
      return ResponseHelper.success('Services & Banners retrieved', {
        banners: bannersData,
        services: servicesData,
      });
    } catch (error) {
      return ResponseHelper.error('Something went wrong');
    }
  }

  async previewOrder(userData: any, orderBody: any) {
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
      const [vendorData, vendorOrders, appConfigData] = await Promise.all([
        this.prisma.vendor.findUnique({
          where: { id: vendor_id },
          include: {
            servicesOffered: {
              include: { items: true },
            },
          },
        }),
        this.prisma.order.findMany({
          where: {
            vendorId: vendor_id,
            createdAt: { gte: startOfDay, lte: endOfDay },
          },
        }),
        this.prisma.appConfig.findFirst({ where: { isActive: true } }),
      ]);

      if (!vendorData) {
        return ResponseHelper.error('Vendor not found');
      }

      if (vendorData.shopCloseTime && vendorData.shopCloseTime > new Date()) {
        return ResponseHelper.error('Vendor is closed currently');
      }

      // Transform vendor data for validation helper (expects Mongoose-like shape)
      const vendorForValidation = {
        ...vendorData,
        shop_status: {
          status: vendorData.shopOpenStatus,
          close_time: vendorData.shopCloseTime,
        },
        services_offered: vendorData.servicesOffered.map((s) => ({
          service_id: s.serviceId,
          service_name: s.serviceName,
          pricing_type: s.pricingType,
          max_count_per_day: s.maxCountPerDay,
          standard_price_per_kg: s.standardPricePerKg,
          express_price_per_kg: s.expressPricePerKg,
          is_offer: s.isOffer,
          offer_percentage: s.offerPercentage,
          offer_max_cap: s.offerMaxCap,
          is_active: s.isActive,
          is_approved: s.isApproved,
          is_express_available: s.isExpressAvailable,
          express_time: s.expressTime,
          standard_time: s.standardTime,
          items: s.items.map((i) => ({
            item_id: i.itemId,
            item_name: i.itemName,
            item_price: i.itemPrice,
            express_price: i.expressPrice,
            is_active: i.isActive,
            category: i.category,
          })),
          equals: (otherId: string) => s.serviceId === otherId,
        })),
        address: {
          latitude: vendorData.latitude,
          longitude: vendorData.longitude,
          address_line1: vendorData.addressLine1,
          address_line2: vendorData.addressLine2,
          city: vendorData.city,
          state: vendorData.state,
          pincode: vendorData.pincode,
        },
      };

      // Transform appConfig for validation helper
      const appConfigForValidation = {
        ...appConfigData,
        delivery_config: {
          order_distance: appConfigData?.orderDistance,
          initial_distance_km: appConfigData?.initialDistanceKm,
          total_distance_km: appConfigData?.totalDistanceKm,
        },
        payment_config: {
          platform_fee: appConfigData?.platformFee,
          gst: appConfigData?.gst,
          delivery_fee: appConfigData?.deliveryFee,
          vendor_commission: appConfigData?.vendorCommission,
        },
      };

      // Validate order data
      const validationResult = this.vendorHelper.validateOrderData(
        vendorForValidation,
        vendorOrders,
        service_items,
        appConfigForValidation,
        is_express,
      );
      if (!validationResult.success) {
        return ResponseHelper.error(validationResult.message);
      }

      // Get user with addresses
      const userWithAddresses = await this.prisma.user.findUnique({
        where: { id: userData.id },
        include: { addresses: true },
      });

      // Validate pickup address
      const addressRes = userWithAddresses?.addresses.find(
        (addr) => addr.id === pickup_address_id,
      );
      if (!addressRes) {
        return ResponseHelper.error('Pickup address not found');
      }

      // Calculate distance between vendor and user address
      const vendorLat = vendorData.latitude!;
      const vendorLong = vendorData.longitude!;
      const userLat = addressRes.latitude!;
      const userLong = addressRes.longitude!;
      let distanceKm = await calculateDistance(
        userLat,
        userLong,
        vendorLat,
        vendorLong,
      );
      let allAddressDist = await Promise.all(
        (userWithAddresses?.addresses as any)?.map(async (data) => {
          let dist = await calculateDistance(
            data?.latitude,
            data?.longitude,
            vendorLat,
            vendorLong,
          );
          return {
            address_id: data.id,
            distance: dist,
            is_deliverable:
              dist <= appConfigForValidation.delivery_config.order_distance,
          };
        }),
      );
      if (distanceKm > appConfigForValidation.delivery_config.order_distance)
        return ResponseHelper.error('Vendor out of range');

      // Create order items with prices from vendor services_offered
      let orderItems;
      try {
        orderItems = service_items.map((item: any) => {
          const vendorService = vendorForValidation.services_offered.find(
            (service: any) => service.service_id === item.service_id,
          );

          if (!vendorService) {
            throw new Error(
              `Service not found in vendor's offerings: ${item.service_name}`,
            );
          }

          const vendorItem = vendorService.items.find(
            (serviceItem: any) => serviceItem.item_id === item.item_id,
          );

          if (!vendorItem) {
            throw new Error(
              `Item not found in vendor's service: ${item.item_name}`,
            );
          }

          if (!vendorItem.is_active) {
            throw new Error(`Item is not active: ${item.item_name}`);
          }

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

      const platformFeeAmount = appConfigData?.platformFee || 5;
      const gstPercentage = appConfigData?.gst || 18;
      const deliveryFee = appConfigData?.deliveryFee || 0;

      const vendorService = vendorForValidation.services_offered.find(
        (service: any) => service.service_id === firstServiceId,
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
            vendor_id: vendorData.id,
            shop_name: vendorData.shopName,
            address: {
              latitude: vendorData.latitude,
              longitude: vendorData.longitude,
              address_line1: vendorData.addressLine1,
              address_line2: vendorData.addressLine2,
              city: vendorData.city,
              state: vendorData.state,
              pincode: vendorData.pincode,
            },
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
                amountToVendor - (amountToVendor * (appConfigData?.vendorCommission ?? 0)) / 100,
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

  async makeOrder(userData: any, orderBody: any) {
    try {
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

      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setUTCHours(23, 59, 59, 999);

      const [vendorData, vendorOrders, appConfigData, serviceDataResult] = await Promise.all([
        this.prisma.vendor.findUnique({
          where: { id: vendor_id },
          include: {
            servicesOffered: {
              include: { items: true },
            },
          },
        }),
        this.prisma.order.findMany({
          where: {
            vendorId: vendor_id,
            createdAt: { gte: startOfDay, lte: endOfDay },
          },
        }),
        this.prisma.appConfig.findFirst({ where: { isActive: true } }),
        this.prisma.service.findUnique({
          where: { id: firstServiceId },
          include: { items: true },
        }),
      ]);

      if (!vendorData) {
        return ResponseHelper.error('Vendor not found');
      }

      // Transform vendor data for validation helper
      const vendorForValidation = {
        ...vendorData,
        shop_status: {
          status: vendorData.shopOpenStatus,
          close_time: vendorData.shopCloseTime,
        },
        services_offered: vendorData.servicesOffered.map((s) => ({
          service_id: s.serviceId,
          service_name: s.serviceName,
          pricing_type: s.pricingType,
          max_count_per_day: s.maxCountPerDay,
          standard_price_per_kg: s.standardPricePerKg,
          express_price_per_kg: s.expressPricePerKg,
          is_offer: s.isOffer,
          offer_percentage: s.offerPercentage,
          offer_max_cap: s.offerMaxCap,
          is_active: s.isActive,
          is_approved: s.isApproved,
          is_express_available: s.isExpressAvailable,
          express_time: s.expressTime,
          standard_time: s.standardTime,
          items: s.items.map((i) => ({
            item_id: i.itemId,
            item_name: i.itemName,
            item_price: i.itemPrice,
            express_price: i.expressPrice,
            is_active: i.isActive,
            category: i.category,
          })),
          equals: (otherId: string) => s.serviceId === otherId,
        })),
        address: {
          latitude: vendorData.latitude,
          longitude: vendorData.longitude,
        },
      };

      const appConfigForValidation = {
        ...appConfigData,
        delivery_config: {
          order_distance: appConfigData?.orderDistance,
        },
        payment_config: {
          platform_fee: appConfigData?.platformFee,
          gst: appConfigData?.gst,
          delivery_fee: appConfigData?.deliveryFee,
          vendor_commission: appConfigData?.vendorCommission,
        },
      };

      let maxWeight = 0;
      let typePricing: any = serviceDataResult?.items?.filter(
        (item: any) => item.id === service_items[0].item_id,
      )[0];
      if (typePricing?.category == 'weight') {
        // For weight items, find from vendorServiceItem
        const vendorSvc = vendorData.servicesOffered.find(
          (s) => s.serviceId === firstServiceId,
        );
        const vendorItem = vendorSvc?.items?.find(
          (i) => i.itemId === service_items[0].item_id,
        );
        maxWeight = vendorItem?.maxWeight || 0;
      }

      // Add weight to service_items for validation
      const itemsForValidation = service_items.map((item: any) => ({
        ...item,
        weight:
          vendorForValidation.services_offered.find(
            (s: any) => s.service_id === item.service_id,
          )?.pricing_type === 'per_kg'
            ? maxWeight
            : 0,
      }));

      const validationResult = this.vendorHelper.validateOrderData(
        vendorForValidation,
        vendorOrders,
        itemsForValidation,
        appConfigForValidation,
        is_express,
      );
      if (!validationResult.success) {
        return ResponseHelper.error(validationResult.message);
      }

      // Get user with addresses
      const userWithAddresses = await this.prisma.user.findUnique({
        where: { id: userData.id },
        include: { addresses: true },
      });

      // Validate user has addresses
      if (!userWithAddresses?.addresses || userWithAddresses.addresses.length === 0) {
        return ResponseHelper.error(
          'You have no saved addresses. Please add an address first.',
        );
      }

      // Find user address
      const addressRes = userWithAddresses.addresses.find(
        (addr: any) => addr.id === pickup_address_id,
      );
      if (!addressRes) {
        return ResponseHelper.error('Pickup address not found');
      }
      console.log(validationResult, 'validationResult');

      // Calculate distance between vendor and user address
      const vendorLat = vendorData.latitude!;
      const vendorLong = vendorData.longitude!;
      const userLat = addressRes.latitude!;
      const userLong = addressRes.longitude!;
      let distanceKm = await calculateDistance(
        userLat,
        userLong,
        vendorLat,
        vendorLong,
      );
      if (distanceKm > appConfigForValidation.delivery_config.order_distance)
        return ResponseHelper.error('Vendor out of range');

      // Create order items with prices from vendor services_offered
      let orderItems;
      try {
        orderItems = service_items.map((item: any) => {
          const vendorService = vendorForValidation.services_offered.find(
            (service: any) => service.service_id === item.service_id,
          );

          if (!vendorService) {
            throw new Error(
              `Service not found in vendor's offerings: ${item.service_name}`,
            );
          }

          const vendorItem = vendorService.items.find(
            (serviceItem: any) => serviceItem.item_id === item.item_id,
          );

          if (!vendorItem) {
            throw new Error(
              `Item not found in vendor's service: ${item.item_name}`,
            );
          }

          if (!vendorItem.is_active) {
            throw new Error(`Item is not active: ${item.item_name}`);
          }

          const pricePerItem = is_express
            ? vendorItem?.express_price
            : vendorItem.item_price;

          const pricingType = vendorService?.pricing_type;
          const totalPrice =
            pricingType === 'per_kg'
              ? maxWeight *
                (is_express
                  ? vendorService?.express_price_per_kg || 0
                  : vendorService?.standard_price_per_kg || 0)
              : item.quantity * pricePerItem;

          return {
            service_id: item.service_id,
            service_name: item.service_name,
            item_id: item.item_id,
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

      const vendorService = vendorForValidation.services_offered.find(
        (service: any) => service.service_id === firstServiceId,
      );

      const subtotal = orderItems.reduce(
        (sum, item) => sum + item.total_price,
        0,
      );

      let offerDiscountAmount = 0;
      let isOfferApplied = false;

      // Coupon Check (Prioritized)
      if (offer_code) {
        const couponValidation = await this.offerService.validateCoupon(
          userData.id,
          {
            code: offer_code,
            order_total: subtotal,
            service_ids: service_items.map((i) => i.service_id),
          },
        );

        if (couponValidation.valid) {
          offerDiscountAmount = couponValidation.discount_amount;
          isOfferApplied = true;
          await this.offerService.recordCouponUsage(offer_code, userData.id);
        } else {
          return ResponseHelper.error(couponValidation.message);
        }
      } else if (vendorService.offer_percentage > 0 && vendorService.is_offer) {
        if (subtotal > vendorService?.offer_max_cap) {
          offerDiscountAmount = vendorService?.offer_max_cap;
          isOfferApplied = true;
        } else {
          offerDiscountAmount = 0;
        }
      }

      const platformFeeAmount = appConfigData?.platformFee || 5;
      const gstPercentage = appConfigData?.gst || 18;
      const deliveryFee = appConfigData?.deliveryFee || 0;

      const afterOfferAmount = subtotal - offerDiscountAmount;

      const amountToVendor = afterOfferAmount;
      const amountToPlatform = platformFeeAmount;

      const gstAmount = (afterOfferAmount * gstPercentage) / 100;

      const totalPayableAmount =
        afterOfferAmount + deliveryFee + gstAmount + platformFeeAmount;

      // Get next order number
      const lastOrder = await this.prisma.order.findFirst({
        orderBy: { orderNumber: 'desc' },
        select: { orderNumber: true },
      });
      const orderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1;

      const order = await this.prisma.order.create({
        data: {
          orderNumber: orderNumber,
          userId: userData.id,
          vendorId: vendor_id,
          // User address snapshot
          userAddressLabel: addressRes.label,
          userAddressLine1: addressRes.addressLine1,
          userAddressLine2: addressRes.addressLine2,
          userCity: addressRes.city,
          userState: addressRes.state,
          userPincode: addressRes.pincode,
          userLatitude: addressRes.latitude,
          userLongitude: addressRes.longitude,
          userIsDefault: addressRes.isDefault,
          // Vendor address snapshot
          vendorAddressLine1: vendorData.addressLine1,
          vendorAddressLine2: vendorData.addressLine2,
          vendorCity: vendorData.city,
          vendorState: vendorData.state,
          vendorPincode: vendorData.pincode,
          vendorLatitude: vendorData.latitude,
          vendorLongitude: vendorData.longitude,
          // Order items
          items: {
            create: orderItems.map((item) => ({
              serviceId: item.service_id,
              serviceName: item.service_name,
              itemId: item.item_id,
              itemName: item.item_name,
              quantity: item.quantity,
              itemCategory: item.item_category,
              weight: item.weight || 0,
              pricePerItem: item.price_per_item,
              totalPrice: item.total_price,
            })),
          },
          isExpress: is_express || false,
          orderNotes: order_notes || '',
          invoiceUrl: '',
          payment: 2,
          // Payment details (flattened)
          pdItemTotal: Math.round(subtotal * 100) / 100,
          pdGrandTotal: Math.round((subtotal + deliveryFee + gstAmount + platformFeeAmount) * 100) / 100,
          isPaymentEligible: false,
          amountToVendor: Math.round(amountToVendor * 100) / 100,
          amountToVendorAfterCommission:
            amountToVendor - (amountToVendor * (appConfigData?.vendorCommission ?? 0)) / 100,
          amountToPlatform: Math.round(amountToPlatform * 100) / 100,
          pdDeliveryFee: deliveryFee,
          pdGst: Math.round(gstAmount * 100) / 100,
          pdIsOfferApplied: isOfferApplied,
          pdOfferDiscountAmount: Math.round(offerDiscountAmount * 100) / 100,
          pdTotalPayableAmount: Math.round(totalPayableAmount * 100) / 100,
          totalAmount: Math.round(totalPayableAmount * 100) / 100,
          currency: 'INR',
          status: 'pending',
          statusType: 1,
          tripType: 1,
          paymentStatus: 'pending',
        },
      });

      if (vendorData.shopOpenStatus === 'open') {
        this.trackingGateway.publishEventToGroup(
          vendor_id.toString(),
          {},
          'vendor-order',
        );

        if (vendorData.fcmToken) {
          const payload = {
            title: 'New Order Received! \uD83D\uDECD\uFE0F',
            body: `Order #${orderNumber} has been placed. Tap to view details.`,
          };
          this.notificationService.sendNotification([vendorData.fcmToken], payload);
        }
      }

      this.trackingGateway.joinUserToGroup(userData.id, order.id);

      return ResponseHelper.success('Order placed successfully', {
        order_id: order.id,
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
      const user = await this.prisma.user.findFirst({ where: { phone: phoneNumber } });
      if (!user) return ResponseHelper.error('User not found');

      const order = await this.prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return ResponseHelper.error('Order not found');
      if (order.userId !== user.id) {
        return ResponseHelper.error('Order does not belong to user');
      }
      if (order.status !== 'delivered') {
        return ResponseHelper.error('Can only review delivered orders');
      }
      if (order.ratingGiven) {
        return ResponseHelper.error('Review already given for this order');
      }

      const existingReview = await this.prisma.review.findFirst({
        where: { orderId: orderId },
      });
      if (existingReview) {
        return ResponseHelper.error('Review already exists for this order');
      }

      // Get order items for service name
      const orderItems = await this.prisma.orderItem.findMany({
        where: { orderId: orderId },
        take: 1,
      });

      const review = await this.prisma.review.create({
        data: {
          userId: user.id,
          vendorId: order.vendorId,
          orderId: orderId,
          serviceName: orderItems[0]?.serviceName || null,
          rating,
          comment,
          isVerified: true,
        },
      });

      await this.prisma.order.update({
        where: { id: orderId },
        data: { ratingGiven: true },
      });

      await this.updateVendorRating(order.vendorId);

      return ResponseHelper.success('Review submitted successfully', {
        reviewId: review.id,
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

      const reviews = await this.prisma.review.findMany({
        where: { vendorId: vendorId, isVerified: true },
        include: {
          user: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      const vendor = await this.prisma.vendor.findUnique({
        where: { id: vendorId },
        select: { ratingAverage: true, ratingTotalReviews: true },
      });

      return ResponseHelper.success('Reviews retrieved', {
        reviews,
        average: vendor?.ratingAverage ?? 0,
        totalReviews: vendor?.ratingTotalReviews ?? 0,
        page,
        limit,
        totalPages: Math.ceil((vendor?.ratingTotalReviews ?? 0) / limit) || 1,
      });
    } catch (error) {
      console.error('Error getting vendor reviews:', error);
      return ResponseHelper.error('Failed to get reviews');
    }
  }

  // Convert hours -> days + hours
  formatHours(hours: number) {
    if (!hours && hours !== 0) return null;

    if (hours < 24) {
      return hours === 0 ? null : `${hours} Hours`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (remainingHours === 0) {
      return `${days} Days`;
    }

    return `${days} Days ${remainingHours} Hours`;
  }

  async getVendorDetails(vendorId: string, phone: string) {
    try {
      const vendorRaw = await this.prisma.vendor.findUnique({
        where: { id: vendorId },
        include: {
          servicesOffered: {
            where: { isApproved: true },
            include: {
              items: {
                where: { isActive: true },
              },
            },
          },
        },
      });

      if (!vendorRaw) return ResponseHelper.error('Vendor not found');

      // Filter out services that have no active items
      const filteredServices = vendorRaw.servicesOffered.filter(
        (s) => s.items.length > 0,
      );

      const user = await this.prisma.user.findFirst({
        where: { phone },
        include: { addresses: true },
      });

      const userDefaultAddress = user?.addresses?.[0] || null;

      let distance = await googleHelper.getDistance(
        userDefaultAddress?.latitude,
        userDefaultAddress?.longitude,
        vendorRaw.latitude,
        vendorRaw.longitude,
      );
      let destiny = distance?.destination_address?.split(',') || [];

      // Build vendor object in expected response shape
      const vendor: any = {
        _id: vendorRaw.id,
        id: vendorRaw.id,
        shop_name: vendorRaw.shopName,
        shop_image_url: vendorRaw.shopImageUrl,
        owner_name: vendorRaw.ownerName,
        email: vendorRaw.email,
        phone: vendorRaw.phone,
        status: vendorRaw.status,
        shop_status: {
          status: vendorRaw.shopOpenStatus,
          close_time: vendorRaw.shopCloseTime,
        },
        address: {
          address_line1: vendorRaw.addressLine1,
          address_line2: vendorRaw.addressLine2,
          city: vendorRaw.city,
          state: vendorRaw.state,
          pincode: vendorRaw.pincode,
          latitude: vendorRaw.latitude,
          longitude: vendorRaw.longitude,
        },
        rating: {
          average: vendorRaw.ratingAverage,
          total_reviews: vendorRaw.ratingTotalReviews,
        },
        services_offered: filteredServices.map((s) => {
          // Deduplicate items based on item_id
          const uniqueItems: any[] = [];
          const seenItemIds = new Set();
          s.items.forEach((item) => {
            const iid = item.itemId;
            if (!seenItemIds.has(iid)) {
              seenItemIds.add(iid);
              uniqueItems.push({
                item_id: item.itemId,
                item_name: item.itemName,
                image_url: item.imageUrl,
                item_price: item.itemPrice,
                express_price: item.expressPrice,
                is_active: item.isActive,
                category: item.category,
                min_weight: item.minWeight,
                max_weight: item.maxWeight,
              });
            }
          });

          return {
            service_id: s.serviceId,
            service_name: s.serviceName,
            image_url: s.imageUrl,
            pricing_type: s.pricingType,
            is_offer: s.isOffer,
            offer_percentage: s.offerPercentage,
            offer_max_cap: s.offerMaxCap,
            is_active: s.isActive,
            is_approved: s.isApproved,
            is_express_available: s.isExpressAvailable,
            express_time: s.expressTime,
            standard_time: s.standardTime,
            standard_price_per_kg: s.standardPricePerKg,
            express_price_per_kg: s.expressPricePerKg,
            items: uniqueItems,
            express_delivery_time_minutes: this.formatHours(s.expressTime),
            normal_delivery_time_minutes: this.formatHours(s.standardTime),
          };
        }),
      };

      // Dynamically generate categories from items
      const servicesWithCategories =
        vendor.services_offered
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
      let offerDetails: any = {};
      let expressDetails = {
        is_express_available: false,
        fastest_express_time_hours: 0,
      };

      if (vendor && servicesWithCategories) {
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
          vendor.services_offered.reduce(
            (total, value) => {
              if (total.total_percentage < (value?.offer_percentage ?? 0))
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
          vendor.services_offered?.filter(
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

      return ResponseHelper.success('Vendor details retrieved', {
        vendor,
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
      const user = await this.prisma.user.findFirst({ where: { phone: phoneNumber } });
      if (!user) return ResponseHelper.error('User not found');

      const skip = (page - 1) * limit;

      const [reviews, totalReviews] = await Promise.all([
        this.prisma.review.findMany({
          where: { userId: user.id },
          include: {
            vendor: { select: { shopName: true } },
            order: { select: { orderNumber: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.review.count({ where: { userId: user.id } }),
      ]);

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
      const reviews = await this.prisma.review.findMany({
        where: { vendorId: vendorId, isVerified: true },
      });

      if (reviews.length === 0) return;

      const totalRating = reviews.reduce(
        (sum, review) => sum + review.rating,
        0,
      );
      const averageRating = totalRating / reviews.length;

      await this.prisma.vendor.update({
        where: { id: vendorId },
        data: {
          ratingAverage: Math.round(averageRating * 10) / 10,
          ratingTotalReviews: reviews.length,
        },
      });

      // Update vendor rating reviews (keep last 10)
      const recentReviews = reviews
        .sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        )
        .slice(0, 10);

      // Delete existing rating reviews for this vendor
      await this.prisma.vendorRatingReview.deleteMany({
        where: { vendorId: vendorId },
      });

      // Insert recent reviews
      if (recentReviews.length > 0) {
        await this.prisma.vendorRatingReview.createMany({
          data: recentReviews.map((review) => ({
            vendorId: vendorId,
            userId: review.userId,
            name: '',
            rating: review.rating,
            comment: review.comment,
            date: review.createdAt,
          })),
        });
      }
    } catch (error) {
      console.error('Error updating vendor rating:', error);
    }
  }

  async getFilterLists() {
    try {
      const services = await this.prisma.service.findMany({
        select: {
          id: true,
          serviceName: true,
        },
      });
      let serviceFilt = services.map((service) => ({
        [service.serviceName]: service.id,
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
      const user = await this.prisma.user.findFirst({ where: { phone: phoneNumber } });
      if (!user) return ResponseHelper.error('User not found');

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;
      const skip = (pageNum - 1) * limitNum;

      // Fetch all orders for this user with vendor and items
      const allOrders = await this.prisma.order.findMany({
        where: { userId: user.id },
        include: {
          vendor: {
            select: { shopName: true },
          },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Application-level sort: active orders first, then delivered, then rejected/unaccepted
      const sortedOrders = allOrders.sort((a, b) => {
        const getSortGroup = (status: string) => {
          if (status === 'delivered') return 1;
          if (['rejected', 'unaccepted', 'cancelled'].includes(status)) return 2;
          return 0;
        };
        const groupDiff = getSortGroup(a.status) - getSortGroup(b.status);
        if (groupDiff !== 0) return groupDiff;
        // Within same group, newest first
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      const total = sortedOrders.length;
      const paginatedOrders = sortedOrders.slice(skip, skip + limitNum);

      // Fetch reviews for these orders to get user ratings
      const orderIds = paginatedOrders.map((o) => o.id);
      const reviews = await this.prisma.review.findMany({
        where: {
          orderId: { in: orderIds },
          userId: user.id,
        },
        select: { orderId: true, rating: true, comment: true },
      });
      const reviewMap = new Map(reviews.map((r) => [r.orderId, r]));

      const orders = paginatedOrders.map((o) => {
        const review = reviewMap.get(o.id);
        return {
          _id: o.id,
          id: o.id,
          vendor_id: o.vendorId,
          shop_name: o.vendor?.shopName,
          order_number: o.orderNumber,
          status_type: o.statusType,
          status: o.status,
          is_express: o.isExpress,
          is_verified: o.isVerified,
          pickup_scheduled_at: o.pickupScheduledAt,
          picked_up_at: o.pickedUpAt,
          delivered_to_vendor_at: o.deliveredToVendorAt,
          expected_delivery_date: o.expectedDeliveryDate,
          delivered_to_user_at: o.deliveredToUserAt,
          payment_status: o.paymentStatus,
          payment_id: o.paymentId,
          payment_details: {
            item_total: o.pdItemTotal,
            grand_total: o.pdGrandTotal,
            is_payment_eligible: o.isPaymentEligible,
            amount_to_vendor: o.amountToVendor,
            amount_to_vendor_after_commission: o.amountToVendorAfterCommission,
            amount_to_platform: o.amountToPlatform,
            delivery_fee: o.pdDeliveryFee,
            gst: o.pdGst,
            isOfferApplied: o.pdIsOfferApplied,
            offerDiscountAmount: o.pdOfferDiscountAmount,
            totalPayableAmount: o.pdTotalPayableAmount,
          },
          total_amount: o.totalAmount,
          currency: o.currency,
          order_notes: o.orderNotes,
          rating_given: o.ratingGiven,
          items: o.items.map((item) => ({
            service_id: item.serviceId,
            service_name: item.serviceName,
            item_id: item.itemId,
            item_name: item.itemName,
            quantity: item.quantity,
            price_per_item: item.pricePerItem,
            total_price: item.totalPrice,
            item_category: item.itemCategory,
            weight: item.weight,
          })),
          user_otp: o.userOtp,
          vendor_otp: o.vendorOtp,
          invoice_url: o.invoiceUrl,
          trip_type: o.tripType,
          is_settled_to_vendor: o.isSettledToVendor,
          status_timestamps: o.statusTimestamps,
          vendor_address: {
            address_line1: o.vendorAddressLine1,
            address_line2: o.vendorAddressLine2,
            city: o.vendorCity,
            state: o.vendorState,
            pincode: o.vendorPincode,
            latitude: o.vendorLatitude,
            longitude: o.vendorLongitude,
          },
          user_address: {
            label: o.userAddressLabel,
            address_line1: o.userAddressLine1,
            address_line2: o.userAddressLine2,
            city: o.userCity,
            state: o.userState,
            pincode: o.userPincode,
            latitude: o.userLatitude,
            longitude: o.userLongitude,
            is_default: o.userIsDefault,
          },
          rider: {
            name: o.riderName,
            phone: o.riderPhone,
          },
          driver_id_1: o.driverId1,
          driver_id_2: o.driverId2,
          created_at: o.createdAt,
          updated_at: o.updatedAt,
          user_rating: review?.rating ?? null,
          user_rating_comment: review?.comment ?? null,
        };
      });

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
      const user = await this.prisma.user.findFirst({ where: { phone: phoneNumber } });
      if (!user) return ResponseHelper.error('User not found');

      const orderRaw = await this.prisma.order.findFirst({
        where: {
          id: orderId,
          userId: user.id,
        },
        include: {
          vendor: {
            select: {
              id: true,
              shopName: true,
              phone: true,
              email: true,
              ownerName: true,
              shopImageUrl: true,
              shopOpenStatus: true,
              shopCloseTime: true,
              fcmToken: true,
              status: true,
            },
          },
          items: true,
        },
      });

      if (!orderRaw) return ResponseHelper.error('Order not found');

      // Fetch user's rating for this order, if any
      const review = await this.prisma.review.findFirst({
        where: {
          orderId: orderId,
          userId: user.id,
        },
        select: { rating: true, comment: true },
      });

      // Build order object  compatible with original response
      const order: any = {
        _id: orderRaw.id,
        id: orderRaw.id,
        vendor_id: orderRaw.vendorId,
        order_number: orderRaw.orderNumber,
        status_type: orderRaw.statusType,
        status: orderRaw.status,
        is_express: orderRaw.isExpress,
        is_verified: orderRaw.isVerified,
        pickup_scheduled_at: orderRaw.pickupScheduledAt,
        picked_up_at: orderRaw.pickedUpAt,
        delivered_to_vendor_at: orderRaw.deliveredToVendorAt,
        expected_delivery_date: orderRaw.expectedDeliveryDate,
        delivered_to_user_at: orderRaw.deliveredToUserAt,
        payment_status: orderRaw.paymentStatus,
        payment_id: orderRaw.paymentId,
        payment_details: {
          item_total: orderRaw.pdItemTotal,
          grand_total: orderRaw.pdGrandTotal,
          is_payment_eligible: orderRaw.isPaymentEligible,
          amount_to_vendor: orderRaw.amountToVendor,
          amount_to_vendor_after_commission: orderRaw.amountToVendorAfterCommission,
          amount_to_platform: orderRaw.amountToPlatform,
          delivery_fee: orderRaw.pdDeliveryFee,
          gst: orderRaw.pdGst,
          isOfferApplied: orderRaw.pdIsOfferApplied,
          offerDiscountAmount: orderRaw.pdOfferDiscountAmount,
          totalPayableAmount: orderRaw.pdTotalPayableAmount,
        },
        total_amount: orderRaw.totalAmount,
        currency: orderRaw.currency,
        order_notes: orderRaw.orderNotes,
        rating_given: orderRaw.ratingGiven,
        items: orderRaw.items.map((item) => ({
          service_id: item.serviceId,
          service_name: item.serviceName,
          item_id: item.itemId,
          item_name: item.itemName,
          quantity: item.quantity,
          price_per_item: item.pricePerItem,
          total_price: item.totalPrice,
          item_category: item.itemCategory,
          weight: item.weight,
        })),
        user_otp: orderRaw.userOtp,
        vendor_otp: orderRaw.vendorOtp,
        invoice_url: orderRaw.invoiceUrl,
        trip_type: orderRaw.tripType,
        is_settled_to_vendor: orderRaw.isSettledToVendor,
        status_timestamps: orderRaw.statusTimestamps || {},
        vendor_address: {
          address_line1: orderRaw.vendorAddressLine1,
          address_line2: orderRaw.vendorAddressLine2,
          city: orderRaw.vendorCity,
          state: orderRaw.vendorState,
          pincode: orderRaw.vendorPincode,
          latitude: orderRaw.vendorLatitude,
          longitude: orderRaw.vendorLongitude,
        },
        user_address: {
          label: orderRaw.userAddressLabel,
          address_line1: orderRaw.userAddressLine1,
          address_line2: orderRaw.userAddressLine2,
          city: orderRaw.userCity,
          state: orderRaw.userState,
          pincode: orderRaw.userPincode,
          latitude: orderRaw.userLatitude,
          longitude: orderRaw.userLongitude,
          is_default: orderRaw.userIsDefault,
        },
        rider: {
          name: orderRaw.riderName,
          phone: orderRaw.riderPhone,
        },
        driver_id_1: orderRaw.driverId1,
        driver_id_2: orderRaw.driverId2,
        created_at: orderRaw.createdAt,
        updated_at: orderRaw.updatedAt,
        vendor: orderRaw.vendor,
      };

      if (review) {
        order.user_rating = review.rating;
        order.user_rating_comment = review.comment;
      }

      order.updateLogs = [];
      const timestamps = (order.status_timestamps || {}) as Record<string, any>;
      for (const status in timestamps) {
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
        const timestamp = timestamps[status];
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
            timestamp: timestamps.processing_at,
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

      return ResponseHelper.success('Order retrieved', { order });
    } catch (error) {
      console.error('Error getting order by id:', error);
      return ResponseHelper.error('Failed to get order');
    }
  }

  async invoiceGeneration(orderId?: string) {
    try {
      if (!orderId) {
        return ResponseHelper.error('Delivered order not found for user');
      }

      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        return ResponseHelper.error('Delivered order not found for user');
      }

      const result = await this.invoiceHelper.generateInvoice(
        order.id,
        this.prisma,
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
      const user = await this.prisma.user.findFirst({ where: { phone: phoneNumber } });
      if (!user) return ResponseHelper.error('User not found');

      const skip = (page - 1) * limit;

      const [notifications, total, unreadCount] = await Promise.all([
        this.prisma.notification.findMany({
          where: {
            userId: user.id,
            recipientRole: 'user',
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.notification.count({
          where: {
            userId: user.id,
            recipientRole: 'user',
          },
        }),
        this.prisma.notification.count({
          where: {
            userId: user.id,
            recipientRole: 'user',
            isRead: false,
          },
        }),
      ]);

      // Mark fetched notifications as read
      const unreadNotificationIds = notifications
        .filter((n) => !n.isRead)
        .map((n) => n.id);

      if (unreadNotificationIds.length > 0) {
        await this.prisma.notification.updateMany({
          where: { id: { in: unreadNotificationIds } },
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

  async logout(phone: string) {
    try {
      const user = await this.prisma.user.findFirst({ where: { phone } });
      if (user) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { sessionToken: '', fcmToken: null },
        });
        this.trackingGateway.deleteGroup(user.id);
      }
      return ResponseHelper.success('Logout successful');
    } catch (error) {
      console.error('Error during logout:', error);
      return ResponseHelper.error('Failed to logout');
    }
  }

  async cancelOrder(userId: string, orderId: string) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });
      if (!order) return ResponseHelper.error('Order not found');
      if (order.userId !== userId) {
        return ResponseHelper.error('Order does not belong to user');
      }
      if (order.status !== 'pending') {
        return ResponseHelper.error(
          'Order is acepeted and cannot be cancelled',
        );
      }
      if ((order.status as string) === 'cancelled') {
        return ResponseHelper.error('Order is already pending cancellation');
      }

      const currentTimestamps = (order.statusTimestamps || {}) as Record<string, any>;

      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'cancelled',
          statusTimestamps: {
            ...currentTimestamps,
            cancelled_at: new Date(),
          },
        },
      });

      this.trackingGateway.publishEventToGroup(
        order.vendorId,
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
      }

      const { type, data } = reqBody;

      const appConfigData = await this.prisma.appConfig.findFirst();
      const vendorComissionPercentage =
        appConfigData?.vendorCommission || 10;

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

        linkId = data.order?.order_tags?.link_id || null;

        if (linkId) {
          const transactionLog = await this.prisma.transactionLog.findFirst({
            where: { linkId: linkId },
          });
          if (transactionLog) {
            orderId = transactionLog.orderId;
          }
        }

        if (!orderId) {
          const cashfreeOrderId = data.order?.order_id || null;
          if (cashfreeOrderId) {
            // Search in metadata JSON for cashfree_order_id
            const transactionLog = await this.prisma.transactionLog.findFirst({
              where: {
                metadata: {
                  path: ['cashfree_order_id'],
                  equals: cashfreeOrderId,
                },
              },
            });
            if (transactionLog) {
              orderId = transactionLog.orderId;
              linkId = transactionLog.linkId;
            }
          }
        }
      }

      // Handle PAYMENT_LINK_EVENT
      if (type === 'PAYMENT_LINK_EVENT') {
        linkStatus = data.link_status || null;
        linkId = data.link_id || null;

        if (data.link_purpose) {
          const match = data.link_purpose.match(/Order\s+([a-f0-9\-]+)/i);
          if (match && match[1]) {
            orderId = match[1];
          }
        }

        if (!orderId && linkId) {
          const transactionLog = await this.prisma.transactionLog.findFirst({
            where: { linkId: linkId },
          });
          if (transactionLog) {
            orderId = transactionLog.orderId;
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
        return ResponseHelper.success(
          'Webhook received but order not found in system',
          {
            warning: 'Order ID not found in webhook payload',
            webhook_type: type,
          },
        );
      }

      // Find the order
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });
      if (!order) {
        console.error(`Order not found: ${orderId}`);
        return ResponseHelper.error('Order not found');
      }

      let amountToVendor = order.amountToVendor || 0;
      const amount_after_commission =
        amountToVendor - (vendorComissionPercentage / 100) * amountToVendor;

      // Find transaction log by link_id
      let transactionLog = null;
      if (linkId) {
        transactionLog = await this.prisma.transactionLog.findFirst({
          where: {
            linkId: linkId,
            orderId: order.id,
          },
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
          this.invoiceHelper.generateInvoiceForOrder(order.id);
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
        }
      }

      // Idempotency check
      if (transactionLog && transactionLogStatus) {
        if (transactionLog.status === transactionLogStatus) {
          console.log(
            `Transaction log already has status ${transactionLogStatus}, skipping update (idempotency)`,
          );
          return ResponseHelper.success('Webhook already processed', {
            order_id: orderId,
            transaction_log_status: transactionLog.status,
            already_processed: true,
          });
        }

        if (orderPaymentStatus && order.paymentStatus === orderPaymentStatus) {
          console.log(
            `Order already has payment_status ${orderPaymentStatus}, skipping update (idempotency)`,
          );
          return ResponseHelper.success('Webhook already processed', {
            order_id: orderId,
            order_payment_status: order.paymentStatus,
            already_processed: true,
          });
        }

        // Update transaction log
        const existingMetadata = (transactionLog.metadata || {}) as Record<string, any>;
        await this.prisma.transactionLog.update({
          where: { id: transactionLog.id },
          data: {
            status: transactionLogStatus,
            description: transactionLog.description
              ? `${transactionLog.description} - Updated via webhook: ${type}`
              : `Updated via webhook: ${type}`,
            metadata: {
              ...existingMetadata,
              webhook_type: type,
              webhook_event_time: reqBody.event_time,
              payment_status: paymentStatus || linkStatus,
              last_webhook_processed_at: new Date().toISOString(),
            },
          },
        });
        console.log(
          `Transaction log updated: ${transactionLog.id} -> ${transactionLogStatus}`,
        );
      }

      // Update order payment_status using prisma.$transaction for atomicity
      if (orderPaymentStatus && order.paymentStatus !== orderPaymentStatus) {
        await this.prisma.$transaction(async (tx) => {
          if (orderPaymentStatus === 'paid') {
            // Update vendor amount_due and add to settlement orders
            await tx.vendor.update({
              where: { id: order.vendorId },
              data: {
                amountDue: { increment: amount_after_commission },
              },
            });

            // Add to vendor settlement orders
            await tx.vendorSettlementOrder.create({
              data: {
                vendorId: order.vendorId,
                orderId: order.id,
              },
            }).catch(() => {
              // Ignore duplicate
            });

            await tx.order.update({
              where: { id: order.id },
              data: {
                paymentStatus: orderPaymentStatus,
                isPaymentEligible: false,
                payment: 2,
              },
            });
          } else {
            await tx.order.update({
              where: { id: order.id },
              data: { paymentStatus: orderPaymentStatus },
            });
          }
        });

        console.log(
          `Order payment_status updated: ${order.id} -> ${orderPaymentStatus}`,
        );
      } else if (
        orderPaymentStatus &&
        order.paymentStatus === orderPaymentStatus
      ) {
        console.log(
          `Order already has payment_status ${orderPaymentStatus}, skipping update (idempotency)`,
        );
      }

      this.trackingGateway.publishEventToGroup(
        order.id,
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

      const user = await this.prisma.user.findFirst({ where: { phone: phoneNumber } });
      if (!user) {
        return ResponseHelper.error('User not found');
      }

      const orderData = await this.prisma.order.findFirst({
        where: {
          id: order_id,
          userId: user.id,
        },
      });
      if (!orderData) {
        return ResponseHelper.error('Order not found');
      }
      if (orderData.paymentStatus === 'paid') {
        return ResponseHelper.success('Order already paid', {
          order_id: order_id,
        });
      }
      if (orderData.isPaymentEligible === false) {
        return ResponseHelper.error('Order is not eligible for payment');
      }

      // Update payment status directly in database
      await this.prisma.order.update({
        where: { id: order_id },
        data: { paymentStatus: 'initiated' },
      });

      const paymentLinkResponse = await makePaymentLink(
        user.id,
        orderData.pdTotalPayableAmount,
        orderData.id,
        user.phone,
        user.name || 'User',
      );

      if (!paymentLinkResponse.status) {
        return ResponseHelper.error(
          paymentLinkResponse.message || 'Payment link creation failed',
        );
      }

      // Create transaction log entry
      await this.prisma.transactionLog.create({
        data: {
          orderId: orderData.id,
          userId: user.id,
          linkId: paymentLinkResponse.data.linkId,
          status: 'initiated',
          amount: orderData.pdTotalPayableAmount,
          currency: orderData.currency || 'INR',
          paymentLinkUrl: paymentLinkResponse.data.link,
          paymentGateway: 'Cashfree',
          description: `Payment link created for order ${orderData.id}`,
          metadata: {
            order_number: orderData.orderNumber,
            user_phone: user.phone,
            user_name: user.name || 'User',
            cashfree_order_id: paymentLinkResponse.data.orderId,
          },
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

      const user = await this.prisma.user.findFirst({ where: { phone: phoneNumber } });
      if (!user) {
        return ResponseHelper.error('User not found');
      }

      const orderData = await this.prisma.order.findFirst({
        where: {
          id: order_id,
          userId: user.id,
        },
      });
      if (!orderData) {
        return ResponseHelper.error('Order not found');
      }

      if (orderData.paymentStatus === 'paid') {
        return ResponseHelper.error(
          'Cannot change payment method for paid order',
        );
      }

      await this.prisma.order.update({
        where: { id: order_id },
        data: { payment: payment_method },
      });
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
