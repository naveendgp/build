import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OtpHelper } from '../auth/otp.helper';
import { JwtHelper } from '../auth/jwt.helper';
import { uploadToS3 } from '../utils/s3.util';
import { EXP_CONFIG } from 'src/config/otp.config';
import {
  UpdateServicesOfferedDto,
  ToggleServiceActiveDto,
  VendorUserUpdateDto,
  UpdateShopDetailsDto,
  UpdateBankDetailsDto,
  ToggleVendorSettingsDto,
  UpdateOrderItemsDto,
} from './dto';
import { TrackingGateway } from 'src/delivery/tracking.gateway';
import { ResponseHelper } from '../helper/response.helper';
import { DeliveryService } from 'src/delivery/delivery.service';
import { PrismaCacheService } from 'src/store/prisma-cache.service';

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
export class VendorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpHelper: OtpHelper,
    private readonly jwtHelper: JwtHelper,
    private readonly trackingGateway: TrackingGateway,
    private readonly deliveryService: DeliveryService,
    private readonly prismaCache: PrismaCacheService,
  ) {}

  /** Reconstruct a vendor address object from flattened Prisma fields */
  private buildVendorAddress(vendor: any) {
    return {
      address_line1: vendor.addressLine1,
      address_line2: vendor.addressLine2,
      city: vendor.city,
      state: vendor.state,
      pincode: vendor.pincode,
      latitude: vendor.latitude,
      longitude: vendor.longitude,
      landmark: vendor.landmark,
    };
  }

  /** Reconstruct an order's user-address object from flattened Prisma fields */
  private buildOrderUserAddress(order: any) {
    return {
      label: order.userAddressLabel,
      address_line1: order.userAddressLine1,
      address_line2: order.userAddressLine2,
      city: order.userCity,
      state: order.userState,
      pincode: order.userPincode,
      latitude: order.userLatitude,
      longitude: order.userLongitude,
      is_default: order.userIsDefault,
    };
  }

  private async createPendingVendor(phone: string) {
    return this.prisma.vendor.create({
      data: {
        phone,
        shopName: '',
        status: 'pending',
        walletBalance: 0,
        walletCurrency: 'INR',
        ratingAverage: 0,
        ratingTotalReviews: 0,
        totalOrders: 0,
        shopOpenStatus: 'close',
        shopCloseTime: null,
      },
    });
  }

  /**
   * Create VendorService + VendorServiceItem rows from the master Service catalog.
   */
  private async mapServicesFromMasterAndCreate(
    vendorId: string,
    masterServices: any[],
  ) {
    for (const service of masterServices) {
      const vendorService = await this.prisma.vendorService.create({
        data: {
          vendorId,
          serviceId: service.id,
          serviceName: service.serviceName,
          imageUrl: service.imageUrl,
          pricingType: service.pricingType,
          serviceDescription: service.serviceDescription,
          maxCountPerDay: 0,
          isExpressAvailable: false,
          isOffer: false,
          offerPercentage: 0,
          offerMaxCap: 0,
          expressDeliveryTimeMinutes: 0,
          normalDeliveryTimeMinutes: 0,
          expressTime: 8,
          standardTime: 48,
          isActive: false,
          isApproved: false,
          standardPricePerKg: 0,
          expressPricePerKg: 0,
        },
      });

      for (const item of service.items || []) {
        await this.prisma.vendorServiceItem.create({
          data: {
            vendorServiceId: vendorService.id,
            itemId: item.id,
            itemName: item.itemName,
            imageUrl: item.imageUrl || '',
            itemPrice: 0,
            minWeight: 0,
            maxWeight: 0,
            expressPrice: 0,
            itemDescription: item.itemDescription || '',
            category: item.category || '',
            isActive: service.pricingType === 'per_kg',
          },
        });
      }
    }
  }

  private async ensureVendorServicesMapped(vendorId: string) {
    const existingCount = await this.prisma.vendorService.count({
      where: { vendorId },
    });
    if (existingCount > 0) return;

    const services = await this.prisma.service.findMany({
      include: { items: true },
    });
    if (!services || services.length === 0) return;

    await this.mapServicesFromMasterAndCreate(vendorId, services);
  }

  /**
   * Sync new items from master Services to vendor's VendorServiceItem rows.
   * Runs when vendor fetches profile so new items added via admin panel
   * are automatically available to the vendor.
   */
  private async syncNewItemsToVendor(vendorId: string): Promise<boolean> {
    try {
      const vendorServices = await this.prisma.vendorService.findMany({
        where: { vendorId },
        include: { items: true },
      });
      if (!vendorServices || vendorServices.length === 0) return false;

      const masterServices = await this.prisma.service.findMany({
        include: { items: true },
      });
      if (!masterServices || masterServices.length === 0) return false;

      let updated = false;

      for (const masterService of masterServices) {
        const vendorService = vendorServices.find(
          (vs) => vs.serviceId === masterService.id,
        );
        if (!vendorService) continue;

        const existingItemIds = new Set(
          vendorService.items.map((item) => item.itemId),
        );

        const missingItems = (masterService.items || []).filter(
          (masterItem) => !existingItemIds.has(masterItem.id),
        );

        if (missingItems.length > 0) {
          for (const masterItem of missingItems) {
            await this.prisma.vendorServiceItem.create({
              data: {
                vendorServiceId: vendorService.id,
                itemId: masterItem.id,
                itemName: masterItem.itemName,
                imageUrl: masterItem.imageUrl || '',
                itemPrice: 0,
                minWeight: 0,
                maxWeight: 0,
                expressPrice: 0,
                itemDescription: masterItem.itemDescription || '',
                category: masterItem.category || '',
                isActive: masterService.pricingType === 'per_kg',
              },
            });
          }
          updated = true;
        }
      }

      return updated;
    } catch (error) {
      console.error('Error syncing items to vendor:', error);
      return false;
    }
  }

  async sendOtp(phone: string, purpose?: 'register' | 'login') {
    let vendor = await this.prisma.vendor.findFirst({ where: { phone } });
    const resolvedPurpose = vendor ? 'login' : 'register';

    if (!vendor) {
      if (resolvedPurpose === 'login') {
        return ResponseHelper.error('Vendor not found');
      }
      vendor = await this.createPendingVendor(phone);
    } else if (resolvedPurpose === 'register') {
      return ResponseHelper.error('Vendor already registered');
    }

    await this.otpHelper.sendOtp(phone);
    const message =
      resolvedPurpose === 'register'
        ? 'OTP sent for registration'
        : 'OTP sent for login';
    return ResponseHelper.success(message);
  }

  async register(registerData: any) {
    const { phone } = registerData;
    return this.sendOtp(phone, 'register');
  }

  async registerComplete(
    registerData: any,
    phone: string,
    files?: {
      aadhaar_card?: any;
      gst_certificate?: any;
      pan_card?: any;
      cancelled_cheque?: any;
      shop_image?: any;
      profile_pic?: any;
    },
  ) {
    const {
      shop_name,
      owner_name,
      email,
      gst_number,
      pan_number,
      shop_license_number,
      address_line1,
      address_line2,
      city,
      aadhaar_number,
      state,
      pincode,
      landmark,
      latitude,
      longitude,
      contactNum,
      account_holder_name,
      account_number,
      ifsc_code,
      bank_name,
      branch,
      upi_id,
      operating_hours,
    } = registerData;

    let vendor = await this.prisma.vendor.findFirst({ where: { phone } });
    if (!vendor) return ResponseHelper.error('Vendor not found');
    if (vendor.status != 'pending' && vendor.status != 'retry')
      return ResponseHelper.error(
        'Cannot update registration at current state',
      );

    // Build flattened update data
    const updateData: any = {
      shopName: shop_name,
      ownerName: owner_name,
      ...(email && { email }),
      phone,
      status: 'upload' as const,
      ...(gst_number && { gstNumber: gst_number }),
      ...(pan_number && { panNumber: pan_number }),
      ...(shop_license_number && { shopLicenseNumber: shop_license_number }),
      ...(aadhaar_number && { aadhaarNumber: aadhaar_number }),
      ...(contactNum && { contactNum }),
      walletBalance: 0,
      walletCurrency: 'INR',
      ratingAverage: 0,
      ratingTotalReviews: 0,
      totalOrders: 0,
      shopOpenStatus: 'close' as const,
      shopCloseTime: null,
    };

    // Flatten address fields
    if (address_line1) {
      updateData.addressLine1 = address_line1;
      if (address_line2) updateData.addressLine2 = address_line2;
      if (city) updateData.city = city;
      if (state) updateData.state = state;
      if (pincode) updateData.pincode = pincode;
      if (latitude) updateData.latitude = parseFloat(latitude);
      if (longitude) updateData.longitude = parseFloat(longitude);
      if (landmark) updateData.landmark = landmark;
    }

    // Flatten bank details
    if (account_holder_name !== undefined)
      updateData.bankAccountHolderName = account_holder_name;
    if (account_number !== undefined)
      updateData.bankAccountNumber = account_number;
    if (ifsc_code !== undefined) updateData.bankIfscCode = ifsc_code;
    if (bank_name !== undefined) updateData.bankName = bank_name;
    if (branch !== undefined) updateData.bankBranch = branch;
    if (upi_id !== undefined) updateData.bankUpiId = upi_id;

    // Upload documents if provided
    if (files?.aadhaar_card?.[0]) {
      const f = files.aadhaar_card[0];
      const { url } = await this.uploadVendorDocument(
        f.buffer,
        f.mimetype,
        `vendors/${vendor.id}/aadhaar_card`,
      );
      updateData.docAadhaarCard = url;
    }
    if (files?.gst_certificate?.[0]) {
      const f = files.gst_certificate[0];
      const { url } = await this.uploadVendorDocument(
        f.buffer,
        f.mimetype,
        `vendors/${vendor.id}/gst_certificate`,
      );
      updateData.docGstCertificate = url;
    }
    if (files?.pan_card?.[0]) {
      const f = files.pan_card[0];
      const { url } = await this.uploadVendorDocument(
        f.buffer,
        f.mimetype,
        `vendors/${vendor.id}/pan_card`,
      );
      updateData.docPanCard = url;
    }
    if (files?.cancelled_cheque?.[0]) {
      const f = files.cancelled_cheque[0];
      const { url } = await this.uploadVendorDocument(
        f.buffer,
        f.mimetype,
        `vendors/${vendor.id}/cancelled_cheque`,
      );
      updateData.bankCancelledCheque = url;
    }

    // Handle shop image upload if provided
    if (files?.shop_image?.[0]) {
      const f = files.shop_image[0];
      const { url } = await this.uploadVendorDocument(
        f.buffer,
        f.mimetype,
        `vendors/${vendor.id}/shop_image`,
      );
      updateData.shopImageUrl = url;
    }

    // Handle profile picture upload if provided
    if (files?.profile_pic?.[0]) {
      const f = files.profile_pic[0];
      const { url } = await this.uploadVendorDocument(
        f.buffer,
        f.mimetype,
        `vendors/${vendor.id}/profile_pic`,
      );
      updateData.profilePic = url;
    }

    // Determine status based on whether documents were uploaded
    const finalStatus = 'upload';
    updateData.status = finalStatus;

    await this.prisma.vendor.update({
      where: { id: vendor.id },
      data: updateData,
    });

    // Handle operating hours (separate table)
    if (operating_hours) {
      for (const day of Object.keys(operating_hours)) {
        if (operating_hours[day]) {
          await this.prisma.vendorOperatingHours.upsert({
            where: {
              vendorId_dayOfWeek: { vendorId: vendor.id, dayOfWeek: day },
            },
            update: {
              open: operating_hours[day].open || operating_hours[day].from || '',
              close: operating_hours[day].close || operating_hours[day].to || '',
            },
            create: {
              vendorId: vendor.id,
              dayOfWeek: day,
              open: operating_hours[day].open || operating_hours[day].from || '',
              close: operating_hours[day].close || operating_hours[day].to || '',
            },
          });
        }
      }
    }

    return ResponseHelper.success('Shop details submitted successfully', {
      status: finalStatus,
    });
  }

  async login(phone: string) {
    return this.sendOtp(phone, 'login');
  }

  async resendOtp(phone: string) {
    const vendor = await this.prisma.vendor.findFirst({ where: { phone } });
    if (!vendor) return ResponseHelper.error('Vendor not found');
    await this.otpHelper.sendOtp(phone);
    return ResponseHelper.success('OTP resent successfully');
  }

  async verifyOtp(phone: string, otp: string, fcm_token: string) {
    const ok = await this.otpHelper.verifyOTP(phone, otp);
    console.log(ok);
    if (ok.type == 'error') return ResponseHelper.error('Incorrect OTP');
    const token = this.jwtHelper.sign({ phone }, 'vendor', {
      expiresIn: EXP_CONFIG.EXPIRY_DAYS as any,
    });
    const updateData: any = { sessionToken: token };

    // Only update FCM token if it's not a dummy/test token
    if (fcm_token && !fcm_token.startsWith('dummy_token')) {
      updateData.fcmToken = fcm_token;
    }

    let vendor = await this.prisma.vendor.findFirst({ where: { phone } });
    if (!vendor) return ResponseHelper.error('Vendor not found');

    vendor = await this.prisma.vendor.update({
      where: { id: vendor.id },
      data: updateData,
    });

    this.trackingGateway.joinUserToGroup(vendor.id, vendor.id);
    return ResponseHelper.success('OTP verified', {
      token,
      status: vendor.status,
    });
  }

  async getMeByPhoneNumber(phone: string) {
    let vendor: any = await this.prisma.vendor.findFirst({
      where: { phone },
      include: {
        servicesOffered: {
          include: { items: true },
        },
        operatingHours: true,
        pickupZones: true,
      },
    });
    if (!vendor) return ResponseHelper.error('Vendor not found');

    // Auto-sync new items from master Services to this vendor
    await this.syncNewItemsToVendor(vendor.id);

    // Refetch vendor after sync to get updated services_offered
    vendor = await this.prisma.vendor.findFirst({
      where: { phone },
      include: {
        servicesOffered: {
          include: { items: true },
        },
        operatingHours: true,
        pickupZones: true,
      },
    });

    const appVersion = await this.prisma.appVersion.findFirst({
      where: { appType: 'vendor_android' },
    });

    const appConfig = await this.prisma.appConfig.findFirst({
      where: { isActive: true },
      select: {
        supportPhoneNumber: true,
        privacyPolicyUrl: true,
        termsUrl: true,
        gst: true,
        deliveryFee: true,
        platformFee: true,
        vendorCommission: true,
      },
    });

    // Get total orders and total accepted orders
    const [totalOrders, totalAcceptedOrders] = await Promise.all([
      this.prisma.order.count({ where: { vendorId: vendor.id } }),
      this.prisma.order.count({
        where: {
          vendorId: vendor.id,
          status: { notIn: ['unaccepted', 'rejected', 'cancelled'] },
        },
      }),
    ]);

    const pendingSettlementAmount = vendor.amountDue;

    // Map services for response (preserving original response field names)
    const servicesOffered = (vendor.servicesOffered || []).map(
      (service: any) => {
        return {
          service_id: service.serviceId,
          service_name: service.serviceName,
          image_url: service.imageUrl,
          pricing_type: service.pricingType,
          is_offer: service.isOffer,
          offer_percentage: service.offerPercentage,
          standard_price_per_kg: service.standardPricePerKg,
          express_price_per_kg: service.expressPricePerKg,
          is_active: service.isActive,
          is_approved: service.isApproved,
          items: [],
          service_description: service.serviceDescription,
          max_count_per_day: service.maxCountPerDay,
          is_express_available: service.isExpressAvailable,
          express_delivery_time_minutes: service.expressDeliveryTimeMinutes,
          normal_delivery_time_minutes: service.normalDeliveryTimeMinutes,
          express_time: service.expressTime ?? 8,
          standard_time: service.standardTime ?? 48,
          pricing_tiers: {
            regular: service.pricingTierRegular,
            standard: service.pricingTierStandard,
            max: service.pricingTierMax,
          },
          items_by_category: (service.items || []).reduce(
            (acc: any, item: any) => {
              const cat = item.category || 'uncategorized';
              if (!acc[cat]) {
                acc[cat] = [];
              }
              acc[cat].push({
                item_id: item.itemId,
                item_name: item.itemName,
                image_url: item.imageUrl,
                item_price: item.itemPrice,
                min_weight: item.minWeight,
                max_weight: item.maxWeight,
                express_price: item.expressPrice,
                item_description: item.itemDescription,
                category: item.category,
                is_active: item.isActive,
              });
              return acc;
            },
            {},
          ),
        };
      },
    );

    const shopStatus = vendor.shopOpenStatus === 'open';

    // Remove passwordHash from response
    const { passwordHash, servicesOffered: _so, ...vendorData } = vendor;

    return ResponseHelper.success('Profile retrieved successfully', {
      ...vendorData,
      services_offered: servicesOffered,
      shop_status: shopStatus,
      app_version: appVersion,
      total_orders: totalOrders,
      total_accepted_orders: totalAcceptedOrders,
      pending_settlement_amount: pendingSettlementAmount,
      support_phone_number: appConfig?.supportPhoneNumber,
      privacy_policy_url: appConfig?.privacyPolicyUrl,
      terms_url: appConfig?.termsUrl,
      payment_config: {
        gst_percentage: appConfig?.gst,
        delivery_fee: appConfig?.deliveryFee,
        platform_fee: appConfig?.platformFee,
        vendor_comission_percentage: appConfig?.vendorCommission,
      },
    });
  }

  async uploadVendorDocument(buffer: Buffer, mimeType: string, key?: string) {
    const url = await uploadToS3({ buffer, mimeType, key, folder: 'vendors' });
    return { url };
  }

  async uploadShopImage(
    phone: string,
    files: {
      shop_image: any;
    },
  ) {
    const vendor = await this.prisma.vendor.findFirst({ where: { phone } });
    if (!vendor) return ResponseHelper.error('Vendor not found');

    const updates: any = {};

    if (files?.shop_image?.[0]) {
      const f = files.shop_image[0];
      const { url } = await this.uploadVendorDocument(
        f.buffer,
        f.mimetype,
        `vendors/${vendor.id}/shop_image`,
      );
      updates.shopImageUrl = url;
    }

    await this.prisma.vendor.update({
      where: { id: vendor.id },
      data: updates,
    });
    return {
      status: true,
      message: 'Shop image uploaded successfully',
    };
  }

  async uploadDocuments(
    phone: string,
    files: {
      aadhaar_card?: any;
      gst_certificate?: any;
      pan_card?: any;
    },
  ) {
    const vendor = await this.prisma.vendor.findFirst({ where: { phone } });
    if (!vendor) return ResponseHelper.error('Vendor not found');

    const updates: any = {};

    if (files?.aadhaar_card?.[0]) {
      const f = files.aadhaar_card[0];
      const { url } = await this.uploadVendorDocument(
        f.buffer,
        f.mimetype,
        `vendors/${vendor.id}/aadhaar_card`,
      );
      updates.docAadhaarCard = url;
    }
    if (files?.gst_certificate?.[0]) {
      const f = files.gst_certificate[0];
      const { url } = await this.uploadVendorDocument(
        f.buffer,
        f.mimetype,
        `vendors/${vendor.id}/gst_certificate`,
      );
      updates.docGstCertificate = url;
    }
    if (files?.pan_card?.[0]) {
      const f = files.pan_card[0];
      const { url } = await this.uploadVendorDocument(
        f.buffer,
        f.mimetype,
        `vendors/${vendor.id}/pan_card`,
      );
      updates.docPanCard = url;
    }

    if (Object.keys(updates).length === 0) {
      return { status: false, message: 'No files uploaded' };
    }

    // NOTE: 'docs' status is not in the VendorStatus enum – keep logic but cast
    updates.status = 'upload' as any;
    await this.prisma.vendor.update({
      where: { id: vendor.id },
      data: updates,
    });
    return {
      status: true,
      message: 'Documents uploaded for verification',
    };
  }

  async updateVendorUserProfile(
    phone: string,
    payload: VendorUserUpdateDto,
    files?: {
      profile_pic?: any;
      aadhaar_card?: any;
      pan_card?: any;
    },
  ) {
    const vendor = await this.prisma.vendor.findFirst({ where: { phone } });
    if (!vendor) return ResponseHelper.error('Vendor not found');

    const updates: Record<string, any> = {};
    const data = payload || {};

    if (data.vendor !== undefined) {
      updates.shopName = data.vendor;
    }
    if (data.contactNum !== undefined) {
      updates.contactNum = data.contactNum;
    }
    if (data.email !== undefined) {
      updates.email = data.email.toLowerCase();
    }
    if (data.owner_name !== undefined) {
      updates.ownerName = data.owner_name;
    }

    if (files?.profile_pic?.[0]) {
      const f = files.profile_pic[0];
      const { url } = await this.uploadVendorDocument(
        f.buffer,
        f.mimetype,
        `vendors/${vendor.id}/profile_pic`,
      );
      updates.profilePic = url;
    }
    if (files?.aadhaar_card?.[0]) {
      const f = files.aadhaar_card[0];
      const { url } = await this.uploadVendorDocument(
        f.buffer,
        f.mimetype,
        `vendors/${vendor.id}/aadhaar_card`,
      );
      updates.docAadhaarCard = url;
    }
    if (files?.pan_card?.[0]) {
      const f = files.pan_card[0];
      const { url } = await this.uploadVendorDocument(
        f.buffer,
        f.mimetype,
        `vendors/${vendor.id}/pan_card`,
      );
      updates.docPanCard = url;
    }

    if (Object.keys(updates).length === 0) {
      return ResponseHelper.error('No updates provided');
    }

    await this.prisma.vendor.update({
      where: { id: vendor.id },
      data: updates,
    });

    const updatedVendor = await this.prisma.vendor.findUnique({
      where: { id: vendor.id },
      select: {
        shopName: true,
        contactNum: true,
        email: true,
        ownerName: true,
        profilePic: true,
        docAadhaarCard: true,
        docGstCertificate: true,
        docPanCard: true,
      },
    });

    return ResponseHelper.success(
      'Vendor profile updated successfully',
      updatedVendor,
    );
  }

  async updateOperatingHours(phone: string, payload: any) {
    const vendor = await this.prisma.vendor.findFirst({ where: { phone } });
    if (!vendor) return ResponseHelper.error('Vendor not found');
    if (vendor.status !== 'active')
      throw new NotFoundException(
        'Only active vendors can update operating hours',
      );

    // Upsert each day in the separate operatingHours table
    for (const day of Object.keys(payload)) {
      if (payload[day]) {
        await this.prisma.vendorOperatingHours.upsert({
          where: {
            vendorId_dayOfWeek: { vendorId: vendor.id, dayOfWeek: day },
          },
          update: {
            open: payload[day].open || payload[day].from || '',
            close: payload[day].close || payload[day].to || '',
          },
          create: {
            vendorId: vendor.id,
            dayOfWeek: day,
            open: payload[day].open || payload[day].from || '',
            close: payload[day].close || payload[day].to || '',
          },
        });
      }
    }

    return { status: true, message: 'Operating hours updated' };
  }

  async updateBankDetails(
    phone: string,
    payload: UpdateBankDetailsDto,
    files?: {
      cancelled_cheque?: any;
    },
  ) {
    try {
      const vendor = await this.prisma.vendor.findFirst({ where: { phone } });
      if (!vendor) return ResponseHelper.error('Vendor not found');
      if (vendor.status !== 'active')
        throw new NotFoundException(
          'Only active vendors can update bank details',
        );

      const updates: Record<string, any> = {};

      if (payload.account_holder_name !== undefined) {
        updates.bankAccountHolderName = payload.account_holder_name;
      }
      if (payload.account_number !== undefined) {
        updates.bankAccountNumber = payload.account_number;
      }
      if (payload.ifsc_code !== undefined) {
        updates.bankIfscCode = payload.ifsc_code;
      }
      if (payload.bank_name !== undefined) {
        updates.bankName = payload.bank_name;
      }
      if (payload.branch !== undefined) {
        updates.bankBranch = payload.branch;
      }
      if (payload.upi_id !== undefined) {
        updates.bankUpiId = payload.upi_id;
      }

      if (files?.cancelled_cheque?.[0]) {
        const f = files.cancelled_cheque[0];
        const { url } = await this.uploadVendorDocument(
          f.buffer,
          f.mimetype,
          `vendors/${vendor.id}/cancelled_cheque`,
        );
        updates.bankCancelledCheque = url;
      }

      if (Object.keys(updates).length === 0) {
        return ResponseHelper.error('No bank details provided to update');
      }

      await this.prisma.vendor.update({
        where: { id: vendor.id },
        data: updates,
      });

      // Fetch updated vendor bank details
      const updatedVendor = await this.prisma.vendor.findUnique({
        where: { id: vendor.id },
        select: {
          bankAccountHolderName: true,
          bankAccountNumber: true,
          bankIfscCode: true,
          bankName: true,
          bankBranch: true,
          bankUpiId: true,
          bankCancelledCheque: true,
        },
      });

      return ResponseHelper.success(
        'Bank details updated successfully',
        updatedVendor,
      );
    } catch (error) {
      console.error('Error updating bank details:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      return ResponseHelper.error('Failed to update bank details');
    }
  }

  async updateServicesOffered(
    phone: string,
    payload: UpdateServicesOfferedDto,
  ) {
    const vendor = await this.prisma.vendor.findFirst({ where: { phone } });
    if (!vendor) return ResponseHelper.error('Vendor not found');
    if (vendor.status !== 'active')
      throw new NotFoundException('Only active vendors can update services');

    // Find the VendorService row for the given service
    const vendorService = await this.prisma.vendorService.findFirst({
      where: {
        vendorId: vendor.id,
        serviceId: payload.service.service_id,
      },
      include: { items: true },
    });

    if (!vendorService) {
      return ResponseHelper.error('Service not found for vendor');
    }

    // Build update data for VendorService
    const serviceUpdateData: any = {};
    if (payload.service.max_count_per_day !== undefined) {
      serviceUpdateData.maxCountPerDay = payload.service.max_count_per_day;
    }
    if (payload.service.is_express !== undefined) {
      serviceUpdateData.isExpressAvailable = payload.service.is_express;
    }
    if (payload.service.is_offer !== undefined) {
      serviceUpdateData.isOffer = payload.service.is_offer;
    }
    if (payload.service.offer_max_cap !== undefined) {
      serviceUpdateData.offerMaxCap = payload.service.offer_max_cap;
    }
    if (payload.service.offer_percentage !== undefined) {
      serviceUpdateData.offerPercentage = payload.service.offer_percentage;
    }
    if (payload.service.express_time !== undefined) {
      serviceUpdateData.expressTime = payload.service.express_time;
    }
    if (payload.service.standard_time !== undefined) {
      serviceUpdateData.standardTime = payload.service.standard_time;
    }
    // Update standard_price_per_kg if pricing_type is 'per_kg'
    if (
      payload.service.standard_price_per_kg !== undefined &&
      vendorService.pricingType === 'per_kg'
    ) {
      serviceUpdateData.standardPricePerKg =
        payload.service.standard_price_per_kg;
    }
    // Update express_price_per_kg if pricing_type is 'per_kg'
    if (
      payload.service.express_price_per_kg !== undefined &&
      vendorService.pricingType === 'per_kg'
    ) {
      serviceUpdateData.expressPricePerKg =
        payload.service.express_price_per_kg;
    }

    if (payload.service.pricing_tiers) {
      serviceUpdateData.pricingTierRegular =
        payload.service.pricing_tiers.regular;
      serviceUpdateData.pricingTierStandard =
        payload.service.pricing_tiers.standard;
      serviceUpdateData.pricingTierMax = payload.service.pricing_tiers.max;
    }

    await this.prisma.vendorService.update({
      where: { id: vendorService.id },
      data: serviceUpdateData,
    });

    // Update items
    const updatedIteams = payload.service.items.reduce(
      (total: any, value: any) => {
        total[`${value.item_name}${value.item_category}`] = value;
        return total;
      },
      {},
    );

    for (const item of vendorService.items) {
      const itemFind = updatedIteams[`${item.itemName}${item.category}`];
      if (itemFind) {
        await this.prisma.vendorServiceItem.update({
          where: { id: item.id },
          data: {
            itemPrice: itemFind.item_price,
            expressPrice: itemFind.express_price,
            isActive: itemFind.is_active,
          },
        });
      }
    }

    return {
      status: true,
      message: 'Services and items updated successfully',
    };
  }

  async updateStoreStatus(phone: string) {
    const vendor = await this.prisma.vendor.findFirst({ where: { phone } });
    if (!vendor) return ResponseHelper.error('Vendor not found');
    if (vendor.status !== 'active')
      throw new NotFoundException('Only active vendors can update status');

    const newStatus =
      vendor.shopOpenStatus === 'close' ? ('open' as const) : ('close' as const);
    const newCloseTime =
      newStatus === 'close'
        ? new Date(Date.now() + 2 * 60 * 60 * 1000)
        : null;

    await this.prisma.vendor.update({
      where: { id: vendor.id },
      data: {
        shopOpenStatus: newStatus,
        shopCloseTime: newCloseTime,
      },
    });

    return { status: true, message: 'Status updated' };
  }

  async updateOrderItems(phone: string, payload: UpdateOrderItemsDto) {
    const vendor = await this.prisma.vendor.findFirst({ where: { phone } });
    if (!vendor) return ResponseHelper.error('Vendor not found');
    if (vendor.status !== 'active')
      throw new NotFoundException(
        'Only active vendors can update order items',
      );

    const order = await this.prisma.order.findFirst({
      where: {
        id: payload.order_id,
        vendorId: vendor.id,
      },
      include: { items: true },
    });

    if (!order) throw new NotFoundException('Order not found');

    if (!['pending', 'accepted', 'processing'].includes(order.status)) {
      throw new NotFoundException(
        'Order items cannot be updated in current status',
      );
    }

    let itemsUpdated = false;
    const isWeightBased = order.serviceType === 2;
    const updatesMap = new Map(payload.items.map((i) => [i.item_id, i]));

    // Get vendor's service config for pricing tiers
    const vendorServices = await this.prisma.vendorService.findMany({
      where: { vendorId: vendor.id },
    });

    const itemUpdateOps: { id: string; data: any }[] = [];

    const updatedItems = order.items.map((item) => {
      const update = updatesMap.get(item.itemId);
      if (update) {
        itemsUpdated = true;
        const newData: any = {};

        let quantity = item.quantity;
        let weight = item.weight;
        let pricingTier: string = item.pricingTier;
        let pricePerItem = item.pricePerItem || 0;

        if (update.quantity !== undefined) {
          quantity = update.quantity;
          newData.quantity = update.quantity;
        }
        if (update.weight !== undefined) {
          weight = update.weight;
          newData.weight = update.weight;
        }
        if (update.pricing_tier !== undefined) {
          pricingTier = update.pricing_tier;
          newData.pricingTier = update.pricing_tier;
        }

        let totalPrice: number;

        if (isWeightBased) {
          // Find the service config for this item to get pricing tiers
          const serviceConfig = vendorServices.find(
            (s) => s.serviceId === item.serviceId,
          );

          // Default to pricePerItem if tier not found or not setup
          let pricePerUnit = pricePerItem;

          if (serviceConfig && pricingTier) {
            const tierMap: Record<string, number> = {
              regular: serviceConfig.pricingTierRegular,
              standard: serviceConfig.pricingTierStandard,
              max: serviceConfig.pricingTierMax,
            };
            const tierPrice = tierMap[pricingTier];
            if (tierPrice !== undefined) {
              pricePerUnit = tierPrice;
              // Update the item's unit price to reflect the tier price
              newData.pricePerItem = pricePerUnit;
            }
          }

          totalPrice = (weight || 0) * pricePerUnit;
        } else {
          totalPrice = quantity * pricePerItem;
        }

        newData.totalPrice = totalPrice;
        itemUpdateOps.push({ id: item.id, data: newData });

        return { ...item, ...newData };
      }
      return item;
    });

    if (!itemsUpdated) {
      return { status: true, message: 'No items matched for update' };
    }

    // Execute item updates
    for (const op of itemUpdateOps) {
      await this.prisma.orderItem.update({
        where: { id: op.id },
        data: op.data,
      });
    }

    // Recalculate Financials
    const itemTotal = updatedItems.reduce(
      (sum, item) => sum + (item.totalPrice || 0),
      0,
    );

    const appConfig = await this.prisma.appConfig.findFirst({
      where: { isActive: true },
    });

    const gstRate = (appConfig?.gst || 18) / 100;
    const vendorCommissionRate =
      (appConfig?.vendorCommission || 10) / 100;

    const newItemTotal = itemTotal;
    const newGstValue = newItemTotal * gstRate;
    const commission = newItemTotal * vendorCommissionRate;
    const amountToVendor = newItemTotal;
    const amountToVendorAfterCommission = amountToVendor - commission;

    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        pdItemTotal: newItemTotal,
        pdGst: newGstValue,
        amountToVendor: amountToVendor,
        amountToVendorAfterCommission: amountToVendorAfterCommission,
        pdVendorCommission: commission,
      },
      include: { items: true },
    });

    return {
      status: true,
      message: 'Order items updated successfully',
      data: updatedOrder,
    };
  }

  async updateOrderStatus(phone: string, orderId: string, status: string) {
    const vendor = await this.prisma.vendor.findFirst({ where: { phone } });
    if (!vendor) return ResponseHelper.error('Vendor not found');
    if (vendor.status !== 'active')
      throw new NotFoundException(
        'Only active vendors can update order status',
      );
    if (!['processing', 'processed'].includes(status)) {
      throw new NotFoundException('Invalid status');
    }
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        vendorId: vendor.id,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status != 'picked_up' && order.status != 'processing')
      throw new NotFoundException('Order cannot be updated for the status');

    const updateData: any = {};
    if (status === 'processed') {
      updateData.status = 'processed';
    } else {
      updateData.status = 'processing';
      updateData.deliveredToVendorAt = new Date();
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: updateData,
    });
    return { status: true, message: 'Order status updated' };
  }

  /**
   * Normalise a single cached-order entry so that the structure
   * is always { order_id, type, details: { _id, driver_name, … } }.
   */
  private normalizeCachedOrder(cachedOrder: any): any | null {
    if (!cachedOrder || !cachedOrder.order_id) {
      console.warn(
        'Skipping invalid cached order: missing order_id',
        cachedOrder,
      );
      return null;
    }

    if (
      !cachedOrder.details ||
      typeof cachedOrder.details !== 'object'
    ) {
      console.warn(
        'Skipping invalid cached order: missing or invalid details',
        cachedOrder.order_id,
      );
      return null;
    }

    if (cachedOrder.details?.order) {
      // Old format - normalize it
      const deliveryData = cachedOrder.details;
      return {
        order_id: cachedOrder.order_id,
        type: cachedOrder.type || 'order-list',
        details: {
          _id: deliveryData._id,
          driver_name: deliveryData.driver_name,
          phone: deliveryData.phone,
          current_location: deliveryData.current_location,
          from_location: deliveryData.from_location,
          to_location: deliveryData.to_location,
          from_eta: deliveryData.from_eta,
          to_eta: deliveryData.to_eta,
          order_duration: deliveryData.order_duration,
          order_accept_endtime:
            deliveryData.order_accept_endtime ||
            cachedOrder.order_accept_endtime ||
            cachedOrder.details.order_accept_endtime,
        },
      };
    }

    // Validate required fields exist
    if (
      !cachedOrder.details._id ||
      !cachedOrder.details.driver_name ||
      !cachedOrder.details.phone ||
      !cachedOrder.details.current_location
    ) {
      console.warn(
        'Skipping invalid cached order: missing required fields',
        cachedOrder.order_id,
      );
      return null;
    }

    // Already normalized, but ensure structure is clean
    return {
      order_id: cachedOrder.order_id,
      type: cachedOrder.type || 'order-list',
      details: {
        _id: cachedOrder.details._id,
        driver_name: cachedOrder.details.driver_name,
        phone: cachedOrder.details.phone,
        current_location: cachedOrder.details.current_location,
        from_location: cachedOrder.details.from_location,
        to_location: cachedOrder.details.to_location,
        from_eta: cachedOrder.details.from_eta,
        to_eta: cachedOrder.details.to_eta,
        order_duration: cachedOrder.details.order_duration,
        order_accept_endtime:
          cachedOrder.details.order_accept_endtime ||
          cachedOrder.order_accept_endtime,
      },
    };
  }

  /**
   * Build the updated delivery-person cache array:
   *  – normalise existing entries
   *  – de-duplicate against the new order
   *  – append the new cache object
   */
  private buildUpdatedCacheArray(
    existingCache: any,
    newCacheObject: any,
    orderId: string,
  ): any[] {
    if (
      !existingCache ||
      (Array.isArray(existingCache) && existingCache.length === 0)
    ) {
      return [newCacheObject];
    }

    const existingArray = Array.isArray(existingCache)
      ? existingCache
      : [existingCache];

    const normalizedExistingArray = existingArray
      .map((cachedOrder: any) => this.normalizeCachedOrder(cachedOrder))
      .filter((order: any) => order !== null);

    const isDuplicate = normalizedExistingArray.some(
      (cachedOrder: any) =>
        cachedOrder.order_id?.toString() === orderId,
    );

    if (!isDuplicate) {
      return [...normalizedExistingArray, newCacheObject];
    }
    return normalizedExistingArray;
  }

  async acceptOrder(phone: string, orderId: string, isRejected?: string) {
    const vendor = await this.prisma.vendor.findFirst({ where: { phone } });
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    if (!vendor) return ResponseHelper.error('Vendor not found');
    if (vendor.status !== 'active')
      throw new NotFoundException(
        'Only active vendors can update order status',
      );

    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        vendorId: vendor.id,
      },
    });
    const appConfig = await this.prisma.appConfig.findFirst({
      where: { isActive: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status != 'pending') {
      throw new NotFoundException('Invalid status');
    }

    if (isRejected && isRejected === 'true') {
      const timestamps =
        (order.statusTimestamps as Record<string, any>) || {};
      timestamps.rejected_at = new Date();
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'rejected',
          statusType: 12,
          statusTimestamps: timestamps,
        },
      });
      await this.trackingGateway.publishEventToGroup(
        orderId,
        {},
        'order-status',
      );
      return { status: true, message: 'Order rejected' };
    }

    const timestamps =
      (order.statusTimestamps as Record<string, any>) || {};
    timestamps.accepted_at = new Date();
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'accepted',
        statusType: 2,
        statusTimestamps: timestamps,
      },
    });

    let vendorOrders_Curr = await this.prisma.order.findMany({
      where: {
        vendorId: vendor.id,
        createdAt: { gte: startOfDay, lte: endOfDay },
        status: 'pending',
      },
    });
    if (vendor.shopOpenStatus === 'open') {
      this.trackingGateway.publishEventToGroup(
        vendor.id,
        vendorOrders_Curr,
        'vendor-order',
      );
    }

    const vendorAddress = this.buildVendorAddress(vendor);
    const orderUserAddress = this.buildOrderUserAddress(order);

    let firstNotify: any =
      await this.deliveryService.getDeliveryPersonByDistance(
        orderUserAddress,
        vendorAddress,
        appConfig?.initialDistanceKm || 2,
        new Date(
          order.createdAt.getTime() +
          (appConfig?.deliveryOrderAcceptTime || 0) * 60 * 1000,
        ),
      );
    if (firstNotify.length > 0) {
      // Calculate order_accept_endtime
      const orderAcceptEndTime = new Date(
        order.createdAt.getTime() +
        (appConfig?.deliveryOrderAcceptTime || 0) * 60 * 1000,
      );

      // Cache each delivery person with their id as key
      for (const deliveryPerson of firstNotify) {
        const deliveryPersonId =
          deliveryPerson._id?.toString?.() || deliveryPerson.id;
        // Ensure only correct fields are stored in details
        const newCacheObject = {
          order_id: order.id,
          type: 'order-list',
          details: {
            _id: deliveryPerson._id || deliveryPerson.id,
            driver_name:
              deliveryPerson.driver_name || deliveryPerson.name,
            phone: deliveryPerson.phone,
            current_location:
              deliveryPerson.current_location ||
              deliveryPerson.currentLocation,
            from_location:
              deliveryPerson.from_location ||
              deliveryPerson.fromLocation,
            to_location:
              deliveryPerson.to_location ||
              deliveryPerson.toLocation,
            from_eta:
              deliveryPerson.from_eta || deliveryPerson.fromEta,
            to_eta:
              deliveryPerson.to_eta || deliveryPerson.toEta,
            order_duration:
              deliveryPerson.order_duration ||
              deliveryPerson.orderDuration,
            order_accept_endtime: orderAcceptEndTime,
          },
        };

        const existingCache =
          await this.prismaCache.get(deliveryPersonId);

        const updatedCacheArray = this.buildUpdatedCacheArray(
          existingCache,
          newCacheObject,
          order.id,
        );

        // set will automatically calculate:
        // - check_time: minimum order_accept_endtime among all orders
        // - expires_at: maximum order_duration among all orders
        await this.prismaCache.set(deliveryPersonId, updatedCacheArray);

        // Publish all cached objects for this delivery person
        await this.trackingGateway.publishEventToGroup(
          deliveryPersonId,
          updatedCacheArray,
          'order-list',
        );
        await this.trackingGateway.publishEventToGroup(
          orderId,
          {},
          'order-status',
        );
      }
    }
    return { status: true, message: 'Order accepted', data: { orderId } };
  }

  async updateOrderTime(phone: string, orderId: string, time: string) {
    const vendor = await this.prisma.vendor.findFirst({ where: { phone } });
    if (!vendor) return ResponseHelper.error('Vendor not found');
    if (vendor.status !== 'active')
      throw new NotFoundException(
        'Only active vendors can update order status',
      );

    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        vendorId: vendor.id,
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.status != 'processing') {
      throw new NotFoundException('Invalid status');
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: { expectedDeliveryDate: new Date(time) },
    });
    return { status: true, message: 'Order time updated' };
  }

  async markOrderComplete(phone: string, orderId: string) {
    const appConfig = await this.prisma.appConfig.findFirst({
      where: { isActive: true },
    });
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const vendor = await this.prisma.vendor.findFirst({ where: { phone } });
    if (!vendor) return ResponseHelper.error('Vendor not found');
    if (vendor.status !== 'active')
      throw new NotFoundException(
        'Only active vendors can mark orders as complete',
      );

    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        vendorId: vendor.id,
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'processing') {
      throw new NotFoundException(
        'Order can only be marked as complete when status is processing',
      );
    }

    const timestamps =
      (order.statusTimestamps as Record<string, any>) || {};
    timestamps.processed_at = new Date();
    timestamps.out_for_delivery_at = new Date();

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'processed',
        statusType: 2,
        tripType: 2,
        isPaymentEligible: true,
        statusTimestamps: timestamps,
      },
    });

    const vendorAddress = this.buildVendorAddress(vendor);
    const orderUserAddress = this.buildOrderUserAddress(order);

    let firstNotify: any =
      await this.deliveryService.getDeliveryPersonByDistance(
        vendorAddress,
        orderUserAddress,
        appConfig?.initialDistanceKm || 2,
        new Date(
          order.createdAt.getTime() +
          (appConfig?.deliveryOrderAcceptTime || 0) * 60 * 1000,
        ),
      );
    if (firstNotify.length > 0) {
      const maxOrderDuration = firstNotify.reduce(
        (max: Date, deliveryPerson: any) => {
          const orderDuration = deliveryPerson.order_duration
            ? new Date(deliveryPerson.order_duration)
            : new Date();
          return orderDuration > max ? orderDuration : max;
        },
        firstNotify[0]?.order_duration
          ? new Date(firstNotify[0].order_duration)
          : new Date(),
      );

      const currentTime = new Date();
      const ttlMs = Math.max(
        0,
        maxOrderDuration.getTime() - currentTime.getTime(),
      );

      // Calculate order_accept_endtime
      const orderAcceptEndTime = new Date(
        Date.now() +
        (appConfig?.deliveryOrderAcceptTime ?? 0) * 60 * 1000,
      );

      // Cache each delivery person with their id as key
      for (const deliveryPerson of firstNotify) {
        const deliveryPersonId =
          deliveryPerson._id?.toString?.() || deliveryPerson.id;
        // Ensure only correct fields are stored in details
        const newCacheObject = {
          order_id: order.id,
          type: 'order-list',
          details: {
            _id: deliveryPerson._id || deliveryPerson.id,
            driver_name:
              deliveryPerson.driver_name || deliveryPerson.name,
            phone: deliveryPerson.phone,
            current_location:
              deliveryPerson.current_location ||
              deliveryPerson.currentLocation,
            from_location:
              deliveryPerson.from_location ||
              deliveryPerson.fromLocation,
            to_location:
              deliveryPerson.to_location ||
              deliveryPerson.toLocation,
            from_eta:
              deliveryPerson.from_eta || deliveryPerson.fromEta,
            to_eta:
              deliveryPerson.to_eta || deliveryPerson.toEta,
            order_duration:
              deliveryPerson.order_duration ||
              deliveryPerson.orderDuration,
            order_accept_endtime: orderAcceptEndTime,
          },
        };

        const existingCache =
          await this.prismaCache.get(deliveryPersonId);

        const updatedCacheArray = this.buildUpdatedCacheArray(
          existingCache,
          newCacheObject,
          order.id,
        );

        // Store updated array in cache with TTL
        await this.prismaCache.set(
          deliveryPersonId,
          updatedCacheArray,
          ttlMs,
        );

        // Publish all cached objects for this delivery person
        await this.trackingGateway.publishEventToGroup(
          deliveryPersonId,
          updatedCacheArray,
          'order-list',
        );
      }
    }

    return {
      status: true,
      message: 'Order marked as complete successfully',
      data: {},
    };
  }

  async viewOrders(
    phone: string,
    orderId?: string,
    status?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const vendor = await this.prisma.vendor.findFirst({ where: { phone } });
    if (!vendor) return ResponseHelper.error('Vendor not found');
    if (vendor.status !== 'active')
      throw new NotFoundException('Only active vendors can view orders');

    const where: any = { vendorId: vendor.id };

    // Add order_id to query if provided
    if (orderId) {
      try {
        where.id = orderId;
      } catch (error) { }
    }

    // Add status filter if provided
    if (status) {
      // Map numeric status to string status
      const statusMapping: { [key: string]: string | string[] } = {
        '1': 'pending',
        '2': [
          'accepted',
          'picked_up',
          'processing',
          'reached_to_user',
          'reached_to_vendor',
          'verified',
        ], // Status 2 includes accepted, picked_up, and processing
        '3': 'processed',
        '4': ['delivered', 'out_for_delivery', 'delivery_OTP_verified'],
      };

      // If status is a number or numeric string, map
      if (status === '2') {
        const s2 = statusMapping['2'] as string[];
        where.OR = [
          {
            status: {
              in: s2.filter(
                (s) =>
                  s !== 'accepted' &&
                  s !== 'reached_to_user' &&
                  s !== 'reached_to_vendor',
              ),
            },
          },
          { status: 'accepted', NOT: { tripType: 2 } },
          { status: 'reached_to_user', NOT: { tripType: 2 } },
          { status: 'reached_to_vendor', NOT: { tripType: 2 } },
        ];
      } else if (status === '3') {
        where.OR = [
          { status: 'processed' },
          { status: 'accepted', tripType: 2 },
          { status: 'reached_to_vendor', tripType: 2 },
        ];
      } else if (status === '4') {
        const s4 = statusMapping['4'] as string[];
        where.OR = [
          { status: { in: s4 } },
          { status: 'reached_to_user', tripType: 2 },
        ];
      } else {
        const mappedStatus = statusMapping[status];
        if (mappedStatus !== undefined) {
          // If mapped status is an array, use in operator
          if (Array.isArray(mappedStatus)) {
            where.status = { in: mappedStatus };
          } else {
            where.status = mappedStatus;
          }
        } else {
          where.status = status;
        }
      }
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    let [orders, total]: any = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          user: {
            select: {
              name: true,
              phone: true,
              email: true,
            },
          },
          items: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    // Helper function to build updateLogs for a single order
    const buildUpdateLogs = (order: any, statusFilter?: string) => {
      const updateLogs: any[] = [];

      // statusTimestamps is a JSON object in Prisma
      const statusTimestamps =
        (order.statusTimestamps as Record<string, any>) || {};
      const timestampEntries = Object.entries(statusTimestamps);

      // Convert to object for easier access
      const timestampsObj: any = {};
      for (const [key, value] of timestampEntries) {
        timestampsObj[key] = value;
      }

      // Special handling for status 2 (accepted orders: accepted, processing, picked_up)
      if (statusFilter === '2' || statusFilter === 'accepted') {
        if (timestampsObj.picked_up_at) {
          updateLogs.push({
            statusStr: 'PHONE',
            status: 18,
            timestamp: timestampsObj.picked_up_at,
          });
          updateLogs.push({
            statusStr: 'OTP',
            status: 19,
            timestamp: timestampsObj.picked_up_at,
          });
        } else {
          updateLogs.push({
            statusStr: 'Pending rider',
            status: 17,
            timestamp: null,
          });
        }
      }
      // Special handling for status 3 (processed orders)
      else if (statusFilter === '3' || statusFilter === 'processed') {
        if (timestampsObj.out_for_delivery_at && order.driverId2) {
          updateLogs.push({
            statusStr: 'PHONE',
            status: 18,
            timestamp: timestampsObj.out_for_delivery_at,
          });
          updateLogs.push({
            statusStr: 'OTP',
            status: 19,
            timestamp: timestampsObj.out_for_delivery_at,
          });
        } else {
          updateLogs.push({
            statusStr: 'Pending rider',
            status: 17,
            timestamp: null,
          });
        }
      }
      // Default behavior for other statuses or when no status filter
      else {
        // Build logs from all timestamps (original logic)
        for (const [statusKey, timestamp] of timestampEntries) {
          if (statusAbr.str[statusKey] && statusAbr.num[statusKey]) {
            updateLogs.push({
              statusStr: statusAbr.str[statusKey],
              status: statusAbr.num[statusKey],
              timestamp,
            });
          }
        }

        // Apply conditional logic for default case
        if (updateLogs.length == 1 && updateLogs[0].status == 2) {
          updateLogs.push({
            statusStr: 'Pending rider',
            status: 17,
            timestamp: null,
          });
        }

        if (updateLogs.length == 0) {
          updateLogs.push({
            statusStr: 'Pending confirmation',
            status: 16,
            timestamp: null,
          });
        }

        if (updateLogs.length == 2 && updateLogs[1].status != 17) {
          updateLogs.push({
            statusStr: 'PHONE',
            status: 18,
            timestamp: updateLogs[1]?.timestamp,
          });
          updateLogs.push({
            statusStr: 'OTP',
            status: 19,
            timestamp: updateLogs[1]?.timestamp,
          });
        }
      }

      return updateLogs;
    };

    // Apply updateLogs to each order
    const addExpiryAt = (order: any) => {
      const createdAt = order.createdAt;
      let expiryAt: Date | null = null;
      if (createdAt) {
        const created = new Date(createdAt);
        expiryAt = new Date(created.getTime() + 5 * 60 * 1000);
      }
      return expiryAt;
    };

    // Batch-load all services for service type mapping
    const serviceIds = Array.from(
      new Set(
        orders
          .map((o: any) => o.items?.[0]?.serviceId)
          .filter((id: any) => !!id),
      ),
    );

    const services = await this.prisma.service.findMany({
      where: { id: { in: serviceIds as string[] } },
      select: { id: true, pricingType: true },
    });

    const serviceMap = new Map(
      services.map((s: any) => [s.id, s.pricingType]),
    );

    const ordersWithLogs = Array.isArray(orders)
      ? orders.map((order: any) => {
        const serviceId = order.items?.[0]?.serviceId;
        const pricingType = serviceMap.get(serviceId);
        return {
          ...order,
          updateLogs: buildUpdateLogs(order, status),
          expiry_at: addExpiryAt(order),
          service_type: pricingType == 'per_pc' ? 1 : 2,
          service_type_str: pricingType || null,
        };
      })
      : [
        {
          ...orders,
          updateLogs: buildUpdateLogs(orders, status),
          expiry_at: addExpiryAt(orders),
          service_type:
            serviceMap.get(orders.items?.[0]?.serviceId) ==
              'per_pc'
              ? 1
              : 2,
          service_type_str:
            serviceMap.get(orders.items?.[0]?.serviceId) || null,
        },
      ];

    return ResponseHelper.success('Orders fetched successfully', {
      orders: ordersWithLogs,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  }

  async servicesMaster() {
    const servicesRaw = await this.prisma.service.findMany({
      include: { items: true },
    });
    const services = servicesRaw.map((service) => {
      return {
        service_name: service.serviceName,
        image_url: service.imageUrl,
        pricing_type: service.pricingType,
        service_description: service.serviceDescription,
        items_by_category: (service.items || []).reduce(
          (acc: any, item: any) => {
            const cat = item.category || 'uncategorized';
            if (!acc[cat]) {
              acc[cat] = [];
            }
            acc[cat].push({
              item_id: item.id,
              item_name: item.itemName,
              image_url: item.imageUrl,
              item_description: item.itemDescription,
              category: item.category,
            });
            return acc;
          },
          {},
        ),
      };
    });

    return {
      status: true,
      message: 'Services fetched successfully',
      data: services,
    };
  }

  async listServices() {
    try {
      const services = await this.prisma.service.findMany({
        select: {
          id: true,
          serviceName: true,
          imageUrl: true,
          pricingType: true,
          serviceDescription: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return {
        status: true,
        message: 'Services retrieved successfully',
        data: services,
      };
    } catch (error) {
      return {
        status: false,
        message: 'Something went wrong',
        data: null,
      };
    }
  }

  async toggleServiceActive(phone: string, payload: ToggleServiceActiveDto) {
    try {
      const vendor = await this.prisma.vendor.findFirst({ where: { phone } });
      if (!vendor) return ResponseHelper.error('Vendor not found');

      await this.ensureVendorServicesMapped(vendor.id);

      const vendorServices = await this.prisma.vendorService.findMany({
        where: { vendorId: vendor.id },
      });

      if (!vendorServices || vendorServices.length === 0) {
        return ResponseHelper.error(
          'No master services available to map for vendor',
        );
      }

      const results = [];
      const errors = [];

      for (let serviceToggle of payload.services) {
        try {
          const service = vendorServices.find(
            (s) => s.serviceId === serviceToggle.service_id,
          );

          if (!service) {
            errors.push({
              service_id: serviceToggle.service_id,
              error: 'Service not found',
            });
            continue;
          }

          await this.prisma.vendorService.update({
            where: { id: service.id },
            data: { isActive: serviceToggle.is_active },
          });

          results.push({
            service_id: serviceToggle.service_id,
            service_name: service.serviceName,
            is_active: serviceToggle.is_active,
            status: 'success',
          });
        } catch (error) {
          errors.push({
            service_id: serviceToggle.service_id,
            error: error.message || 'Failed to update service',
          });
        }
      }

      const successCount = results.length;
      const errorCount = errors.length;
      const totalCount = payload.services.length;

      return ResponseHelper.success(
        `Updated ${successCount} of ${totalCount} service(s) successfully`,
        {
          updated: results,
          failed: errors.length > 0 ? errors : undefined,
          summary: {
            total: totalCount,
            successful: successCount,
            failed: errorCount,
          },
        },
      );
    } catch (error) {
      return ResponseHelper.error(error.message || 'Something went wrong');
    }
  }

  async getNotifications(
    phoneNumber: string,
    page: number = 1,
    limit: number = 20,
  ) {
    try {
      const vendor = await this.prisma.vendor.findFirst({
        where: { phone: phoneNumber },
      });
      if (!vendor) return ResponseHelper.error('Vendor not found');

      const skip = (page - 1) * limit;

      const [notifications, total, unreadCount] = await Promise.all([
        this.prisma.notification.findMany({
          where: {
            vendorId: vendor.id,
            recipientRole: 'vendor',
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.notification.count({
          where: {
            vendorId: vendor.id,
            recipientRole: 'vendor',
          },
        }),
        this.prisma.notification.count({
          where: {
            vendorId: vendor.id,
            recipientRole: 'vendor',
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

  async getMyReviews(
    phoneNumber: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const vendor = await this.prisma.vendor.findFirst({
        where: { phone: phoneNumber },
      });
      if (!vendor) return ResponseHelper.error('Vendor not found');

      const skip = (page - 1) * limit;

      const [reviews, totalReviews] = await Promise.all([
        this.prisma.review.findMany({
          where: { vendorId: vendor.id },
          include: {
            user: { select: { name: true } },
            order: { select: { orderNumber: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.review.count({
          where: { vendorId: vendor.id },
        }),
      ]);

      return ResponseHelper.success('Reviews retrieved successfully', {
        reviews,
        total: totalReviews,
        average_reviews: vendor.ratingAverage,
        reviews_count: vendor.ratingTotalReviews,
        page,
        limit,
        totalPages: Math.ceil(totalReviews / limit),
      });
    } catch (error) {
      console.error('Error getting vendor reviews:', error);
      return ResponseHelper.error('Failed to get reviews');
    }
  }

  async logout(phone: string) {
    try {
      const vendor = await this.prisma.vendor.findFirst({ where: { phone } });
      if (!vendor) {
        return ResponseHelper.error('Vendor not found');
      }

      await this.prisma.vendor.update({
        where: { id: vendor.id },
        data: { sessionToken: '', fcmToken: null },
      });

      this.trackingGateway.deleteGroup(vendor.id);
      return ResponseHelper.success('Logout successful');
    } catch (error) {
      console.error('Error during logout:', error);
      return ResponseHelper.error('Failed to logout');
    }
  }

  async getServicesByState(phone: string) {
    try {
      const vendor = await this.prisma.vendor.findFirst({ where: { phone } });
      if (!vendor) return ResponseHelper.error('Vendor not found');

      await this.ensureVendorServicesMapped(vendor.id);

      const vendorServices = await this.prisma.vendorService.findMany({
        where: { vendorId: vendor.id },
        include: { items: true },
      });

      // Helper function to format service (without items)
      const formatService = (service: any) => {
        const items = service.items || [];
        const activeItemsCount = items.filter(
          (item: any) => item.isActive === true,
        ).length;
        const totalItemsCount = items.length;

        return {
          service_id: service.serviceId,
          service_name: service.serviceName,
          image_url: service.imageUrl,
          pricing_type: service.pricingType,
          service_description: service.serviceDescription,
          max_count_per_day: service.maxCountPerDay,
          is_offer: service.isOffer,
          offer_percentage: service.offerPercentage,
          offer_max_cap: service.offerMaxCap,
          is_active: service.isActive,
          is_approved: service.isApproved,
          is_express_available: service.isExpressAvailable,
          express_delivery_time_minutes: service.expressDeliveryTimeMinutes,
          normal_delivery_time_minutes: service.normalDeliveryTimeMinutes,
          express_time: service.expressTime ?? 8,
          standard_time: service.standardTime ?? 48,
          active_items_count: activeItemsCount,
          total_items_count: totalItemsCount,
        };
      };

      // Group services by verified/unverified
      const verified: any[] = [];
      const unverified: any[] = [];

      vendorServices.forEach((service) => {
        const formattedService = formatService(service);
        if (service.isApproved) {
          verified.push(formattedService);
        } else {
          unverified.push(formattedService);
        }
      });

      const result = {
        verified,
        unverified,
      };

      return ResponseHelper.success(
        'Services retrieved by state successfully',
        result,
      );
    } catch (error) {
      console.error('Error getting services by state:', error);
      return ResponseHelper.error('Failed to get services by state');
    }
  }

  async updateShopDetails(
    phone: string,
    payload: UpdateShopDetailsDto,
    files?: {
      shop_image?: any;
    },
  ) {
    try {
      const vendor = await this.prisma.vendor.findFirst({ where: { phone } });
      if (!vendor) return ResponseHelper.error('Vendor not found');

      const updates: Record<string, any> = {};

      // Update shop_name if provided
      if (payload.shop_name !== undefined) {
        updates.shopName = payload.shop_name;
      }

      // Update contactNum if provided
      if (payload.contactNum !== undefined) {
        updates.contactNum = payload.contactNum;
      }

      // Handle shop image upload if provided
      if (files?.shop_image?.[0]) {
        const f = files.shop_image[0];
        const { url } = await this.uploadVendorDocument(
          f.buffer,
          f.mimetype,
          `vendors/${vendor.id}/shop_image`,
        );
        updates.shopImageUrl = url;
      }

      // Update address if provided (flattened fields)
      if (payload.address !== undefined) {
        if (payload.address.address_line1 !== undefined) {
          updates.addressLine1 = payload.address.address_line1;
        }
        if (payload.address.address_line2 !== undefined) {
          updates.addressLine2 = payload.address.address_line2;
        }
        if (payload.address.city !== undefined) {
          updates.city = payload.address.city;
        }
        if (payload.address.state !== undefined) {
          updates.state = payload.address.state;
        }
        if (payload.address.pincode !== undefined) {
          updates.pincode = payload.address.pincode;
        }
        if (payload.address.latitude !== undefined) {
          updates.latitude = payload.address.latitude;
        }
        if (payload.address.longitude !== undefined) {
          updates.longitude = payload.address.longitude;
        }
        if (payload.address.landmark !== undefined) {
          updates.landmark = payload.address.landmark;
        }
      }

      // Update operating_hours if provided (separate table)
      let operatingHoursUpdated = false;
      if (payload.operating_hours !== undefined) {
        for (const day of Object.keys(payload.operating_hours)) {
          if (payload.operating_hours[day]) {
            await this.prisma.vendorOperatingHours.upsert({
              where: {
                vendorId_dayOfWeek: {
                  vendorId: vendor.id,
                  dayOfWeek: day,
                },
              },
              update: {
                open:
                  payload.operating_hours[day].open ||
                  payload.operating_hours[day].from ||
                  '',
                close:
                  payload.operating_hours[day].close ||
                  payload.operating_hours[day].to ||
                  '',
              },
              create: {
                vendorId: vendor.id,
                dayOfWeek: day,
                open:
                  payload.operating_hours[day].open ||
                  payload.operating_hours[day].from ||
                  '',
                close:
                  payload.operating_hours[day].close ||
                  payload.operating_hours[day].to ||
                  '',
              },
            });
            operatingHoursUpdated = true;
          }
        }
      }

      // Check if there are any updates
      if (Object.keys(updates).length === 0 && !operatingHoursUpdated) {
        return ResponseHelper.error('No shop details provided to update');
      }

      // Update the vendor
      if (Object.keys(updates).length > 0) {
        await this.prisma.vendor.update({
          where: { id: vendor.id },
          data: updates,
        });
      }

      // Fetch updated vendor
      const updatedVendor = await this.prisma.vendor.findUnique({
        where: { id: vendor.id },
        select: {
          shopName: true,
          contactNum: true,
          shopImageUrl: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          pincode: true,
          latitude: true,
          longitude: true,
          landmark: true,
          operatingHours: true,
        },
      });

      return ResponseHelper.success(
        'Shop details updated successfully',
        updatedVendor,
      );
    } catch (error) {
      console.error('Error updating shop details:', error);
      return ResponseHelper.error('Failed to update shop details');
    }
  }

  async toggleVendorSettings(phone: string, payload: ToggleVendorSettingsDto) {
    try {
      const vendor = await this.prisma.vendor.findFirst({ where: { phone } });
      if (!vendor) return ResponseHelper.error('Vendor not found');
      if (vendor.status !== 'active')
        throw new NotFoundException('Only active vendors can toggle settings');

      const results: any = {};
      const updateData: any = {};

      // Handle express status toggle
      if (payload.express_status !== undefined) {
        updateData.expressStatus = payload.express_status;
        results.express_status = payload.express_status;
      }

      // Handle shop status toggle
      if (payload.shop_status !== undefined) {
        updateData.shopOpenStatus = payload.shop_status
          ? ('open' as const)
          : ('close' as const);
        updateData.shopCloseTime =
          updateData.shopOpenStatus == 'close' ? new Date() : null;
        results.shop_status = {
          status: updateData.shopOpenStatus,
          close_time: updateData.shopCloseTime,
        };
      } else if (payload.express_status === undefined) {
        // If no shop_status provided and no express_status, toggle current shop status
        if (vendor.shopOpenStatus === 'close') {
          updateData.shopOpenStatus = 'open' as const;
          updateData.shopCloseTime = null;
        } else {
          updateData.shopOpenStatus = 'close' as const;
          updateData.shopCloseTime = new Date();
        }
        results.shop_status = {
          status: updateData.shopOpenStatus,
          close_time: updateData.shopCloseTime,
        };
      }

      await this.prisma.vendor.update({
        where: { id: vendor.id },
        data: updateData,
      });

      const message =
        Object.keys(results).length > 1
          ? 'Settings updated successfully'
          : payload.express_status !== undefined
            ? 'Express status updated successfully'
            : 'Shop status updated successfully';

      return ResponseHelper.success(message, results);
    } catch (error) {
      console.error('Error toggling vendor settings:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      return ResponseHelper.error('Failed to toggle settings');
    }
  }
}
