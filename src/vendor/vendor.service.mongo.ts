import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vendor, VendorDocument } from '../schemas/vendor.schema';
import { AppVersion, AppVersionDocument } from '../schemas/app-version.schema';
import { OtpHelper } from '../auth/otp.helper';
import { JwtHelper } from '../auth/jwt.helper';
import { uploadToS3 } from '../utils/s3.util';
import { Types } from 'mongoose';
import { Order, OrderDocument } from 'src/schemas/order.schema';
import { Services, ServicesDocument } from 'src/schemas/services.schema';
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
import { AppConfig, AppConfigDocument } from 'src/schemas/app-config.schema';
import { DeliveryService } from 'src/delivery/delivery.service';
import { MongoCacheService } from 'src/store/mongo-cache.service';
import {
  Notification,
  NotificationDocument,
} from 'src/schemas/notification.schema';
import { Review, ReviewDocument } from 'src/schemas/reviews.schema';
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
    @InjectModel(Vendor.name)
    private readonly vendorModel: Model<VendorDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(AppVersion.name)
    private readonly appVersionModel: Model<AppVersionDocument>,
    @InjectModel(Services.name)
    private readonly servicesModel: Model<ServicesDocument>,
    @InjectModel(AppConfig.name)
    private readonly appconfigModel: Model<AppConfigDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    private readonly otpHelper: OtpHelper,
    private readonly jwtHelper: JwtHelper,
    private readonly trackingGateway: TrackingGateway,
    private readonly deliveryService: DeliveryService,
    private readonly mongoCache: MongoCacheService,
  ) { }

  private async createPendingVendor(phone: string) {
    return this.vendorModel.create({
      phone,
      status: 'pending',
      wallet: { balance: 0, currency: 'INR' },
      rating: { average: 0, total_reviews: 0, reviews: [] },
      total_orders: 0,
      shop_status: {
        status: 'close',
        close_time: null,
      },
      pickup_zones: [],
      services_offered: [],
    });
  }

  private mapServicesFromMaster(services: any[]) {
    return services.map((service) => ({
      service_id: service._id,
      service_name: service.service_name,
      image_url: service.image_url,
      pricing_type: service.pricing_type,
      service_description: service.service_description,
      last_service_updated_at: null,
      max_count_per_day: 0,
      is_express_available: false,
      is_offer: false,
      offer_percentage: 0,
      offer_max_cap: 0,
      express_delivery_time_minutes: 0,
      normal_delivery_time_minutes: 0,
      express_time: 8,
      standard_time: 48,
      is_active: false,
      is_approved: false,
      items: (service.items || []).map((item: any) => ({
        item_id: item._id,
        item_name: item.item_name,
        image_url: item.image_url,
        // Use default prices from master service items (tiered pricing)
        item_price: item.item_price || 0,
        min_weight: item.min_weight || item?.weight?.[0] || 0,
        max_weight: item.max_weight || item?.weight?.[1] || 0,
        express_price: item.express_price || 0,
        item_description: item.item_description,
        category: item.category,
        is_active: service.pricing_type == 'per_kg',
      })),
    }));
  }

  private async ensureVendorServicesMapped(vendor: VendorDocument) {
    if (vendor.services_offered && vendor.services_offered.length > 0) return;
    const services = await this.servicesModel.find().lean();
    if (!services || services.length === 0) {
      vendor.services_offered = [];
      return;
    }
    vendor.services_offered = this.mapServicesFromMaster(services);
    vendor.markModified('services_offered');
    await vendor.save();
  }

  /**
   * Sync new items from master Services to vendor's services_offered
   * This runs when vendor fetches profile to ensure new items added via admin panel
   * are automatically available to the vendor
   */
  private async syncNewItemsToVendor(vendorId: any): Promise<boolean> {
    try {
      const vendor = await this.vendorModel.findById(vendorId);
      if (!vendor || !vendor.services_offered || vendor.services_offered.length === 0) {
        return false;
      }

      const masterServices = await this.servicesModel.find().lean();
      if (!masterServices || masterServices.length === 0) {
        return false;
      }

      let updated = false;

      for (const masterService of masterServices) {
        // Find the corresponding service in vendor's services_offered
        const vendorService = vendor.services_offered.find(
          (vs: any) => vs.service_id.toString() === masterService._id.toString()
        );

        if (!vendorService) continue;

        // Check for missing items
        const existingItemIds = new Set(
          (vendorService.items || []).map((item: any) => item.item_id.toString())
        );

        const missingItems = (masterService.items || []).filter(
          (masterItem: any) => !existingItemIds.has(masterItem._id.toString())
        );

        if (missingItems.length > 0) {
          // Add missing items with default values
          for (const masterItem of missingItems as any[]) {
            vendorService.items.push({
              item_id: masterItem._id,
              item_name: masterItem.item_name,
              image_url: masterItem.image_url || '',
              item_price: masterItem.item_price || 0,
              min_weight: masterItem.min_weight || masterItem.weight?.[0] || 0,
              max_weight: masterItem.max_weight || masterItem.weight?.[1] || 0,
              express_price: masterItem.express_price || 0,
              item_description: masterItem.item_description || '',
              category: masterItem.category || '',
              is_active: masterService.pricing_type === 'per_kg',
            });
          }
          updated = true;
        }
      }

      if (updated) {
        vendor.markModified('services_offered');
        await vendor.save();
      }

      return updated;
    } catch (error) {
      console.error('Error syncing items to vendor:', error);
      return false;
    }
  }

  async sendOtp(phone: string, purpose?: 'register' | 'login') {
    let vendor = await this.vendorModel.findOne({ phone });
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

    let vendor = await this.vendorModel.findOne({ phone });
    if (!vendor) return ResponseHelper.error('Vendor not found');
    if (vendor.status != 'pending' && vendor.status != 'retry')
      return ResponseHelper.error(
        'Cannot update registration at current state',
      );

    const address = address_line1
      ? {
        address_line1,
        ...(address_line2 && { address_line2 }),
        ...(city && { city }),
        ...(state && { state }),
        pincode,
        latitude,
        longitude,
        ...(landmark && { landmark }),
      }
      : undefined;

    // Prepare bank details if provided
    const bankDetails: any = {};
    if (account_holder_name !== undefined)
      bankDetails.account_holder_name = account_holder_name;
    if (account_number !== undefined)
      bankDetails.account_number = account_number;
    if (ifsc_code !== undefined) bankDetails.ifsc_code = ifsc_code;
    if (bank_name !== undefined) bankDetails.bank_name = bank_name;
    if (branch !== undefined) bankDetails.branch = branch;
    if (upi_id !== undefined) bankDetails.upi_id = upi_id;

    // Prepare documents updates
    const documentUpdates: any = {};

    // Upload documents if provided
    if (files?.aadhaar_card?.[0]) {
      const f = files.aadhaar_card[0];
      const { url } = await this.uploadVendorDocument(
        f.buffer,
        f.mimetype,
        `vendors/${vendor._id.toString()}/aadhaar_card`,
      );
      documentUpdates['documents.aadhaar_card'] = url;
    }
    if (files?.gst_certificate?.[0]) {
      const f = files.gst_certificate[0];
      const { url } = await this.uploadVendorDocument(
        f.buffer,
        f.mimetype,
        `vendors/${vendor._id.toString()}/gst_certificate`,
      );
      documentUpdates['documents.gst_certificate'] = url;
    }
    if (files?.pan_card?.[0]) {
      const f = files.pan_card[0];
      const { url } = await this.uploadVendorDocument(
        f.buffer,
        f.mimetype,
        `vendors/${vendor._id.toString()}/pan_card`,
      );
      documentUpdates['documents.pan_card'] = url;
    }
    if (files?.cancelled_cheque?.[0]) {
      const f = files.cancelled_cheque[0];
      const { url } = await this.uploadVendorDocument(
        f.buffer,
        f.mimetype,
        `vendors/${vendor._id.toString()}/cancelled_cheque`,
      );
      bankDetails.cancelled_cheque = url;
    }

    // Handle shop image upload if provided
    if (files?.shop_image?.[0]) {
      const f = files.shop_image[0];
      const { url } = await this.uploadVendorDocument(
        f.buffer,
        f.mimetype,
        `vendors/${vendor._id.toString()}/shop_image`,
      );
      documentUpdates['shop_image_url'] = url;
    }

    // Handle profile picture upload if provided
    if (files?.profile_pic?.[0]) {
      const f = files.profile_pic[0];
      const { url } = await this.uploadVendorDocument(
        f.buffer,
        f.mimetype,
        `vendors/${vendor._id.toString()}/profile_pic`,
      );
      documentUpdates['profile_pic'] = url;
    }

    // Determine status based on whether documents were uploaded
    const finalStatus =
      Object.keys(documentUpdates).length > 0 ? 'upload' : 'upload';

    // Prepare update object
    const updateData: any = {
      shop_name,
      owner_name,
      ...(email && { email }),
      phone,
      status: finalStatus,
      gst_number,
      ...(pan_number && { pan_number }),
      ...(shop_license_number && { shop_license_number }),
      ...(aadhaar_number && { aadhaar_number }),
      ...(contactNum && { contactNum }),
      ...(address && { address }),
      wallet: { balance: 0, currency: 'INR' },
      rating: { average: 0, total_reviews: 0, reviews: [] },
      total_orders: 0,
      shop_status: {
        status: 'close',
        close_time: null,
      },
      pickup_zones: [],
    };

    // Prepare update object
    const $set: any = {
      ...updateData,
      ...documentUpdates,
    };

    // Add operating hours if provided
    if (operating_hours) {
      Object.keys(operating_hours).forEach((day) => {
        if (operating_hours[day]) {
          $set[`operating_hours.${day}`] = operating_hours[day];
        }
      });
    }

    // Add bank details if provided (handle nested structure)
    if (Object.keys(bankDetails).length > 0) {
      Object.keys(bankDetails).forEach((key) => {
        $set[`bank_details.${key}`] = bankDetails[key];
      });
    }

    await this.vendorModel.updateOne({ phone }, { $set });

    return ResponseHelper.success('Shop details submitted successfully', {
      status: finalStatus,
    });
  }

  async login(phone: string) {
    return this.sendOtp(phone, 'login');
  }

  async resendOtp(phone: string) {
    const vendor = await this.vendorModel.findOne({ phone });
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
    const updateData: any = { session_token: token };

    // Only update FCM token if it's not a dummy/test token
    if (fcm_token && !fcm_token.startsWith('dummy_token')) {
      updateData.fcm_token = fcm_token;
    }

    let vendor = await this.vendorModel
      .findOneAndUpdate(
        { phone },
        updateData,
        { new: true },
      )
      .select('-password_hash');
    if (!vendor) return ResponseHelper.error('Vendor not found');
    this.trackingGateway.joinUserToGroup(
      vendor._id.toString(),
      vendor._id.toString(),
    );
    return ResponseHelper.success('OTP verified', {
      token,
      status: vendor.status,
    });
  }

  async getMeByPhoneNumber(phone: string) {
    let vendor: any = await this.vendorModel
      .findOne({ phone })
      .select('-password_hash')
      .lean();
    if (!vendor) return ResponseHelper.error('Vendor not found');

    // Auto-sync new items from master Services to this vendor
    // This ensures vendors always have the latest items added from admin panel
    await this.syncNewItemsToVendor(vendor._id);

    // Refetch vendor after sync to get updated services_offered
    vendor = await this.vendorModel
      .findOne({ phone })
      .select('-password_hash')
      .lean();

    const appVersion = await this.appVersionModel
      .findOne({ app_type: 'vendor_android' })
      .lean();

    const appConfig = await this.appconfigModel
      .findOne({ is_active: true })
      .select(['support_phone_number', 'privacy_policy_url', 'terms_url', 'payment_config'])
      .lean();

    // Get total orders, total accepted orders, and pending settlement amount
    const [totalOrders, totalAcceptedOrders] =
      await Promise.all([
        this.orderModel.countDocuments({ vendor_id: vendor._id }),
        this.orderModel.countDocuments({
          vendor_id: vendor._id,
          status: { $nin: ['unaccepted', 'rejected', 'cancelled'] },
        })
      ]);

    const pendingSettlementAmount = vendor.amount_due

    vendor.services_offered = (vendor.services_offered || []).map((service) => {
      return {
        service_id: service.service_id,
        service_name: service.service_name,
        image_url: service.image_url,
        pricing_type: service.pricing_type,
        is_offer: service.is_offer,
        offer_percentage: service.offer_percentage,
        standard_price_per_kg: service.standard_price_per_kg,
        express_price_per_kg: service.express_price_per_kg,
        is_active: service.is_active,
        is_approved: service.is_approved,
        items: [],
        service_description: service.service_description,
        max_count_per_day: service.max_count_per_day,
        is_express_available: service.is_express_available,
        express_delivery_time_minutes: service.express_delivery_time_minutes,
        normal_delivery_time_minutes: service.normal_delivery_time_minutes,
        express_time: service.express_time ?? 8,
        standard_time: service.standard_time ?? 48,
        pricing_tiers: service.pricing_tiers,
        items_by_category: (service.items || []).reduce((acc, item) => {
          if (!acc[item.category]) {
            acc[item.category] = [];
          }
          acc[item.category].push(item);
          return acc;
        }, {}),
      };
    });
    vendor.shop_status = vendor.shop_status.status == 'open';

    return ResponseHelper.success('Profile retrieved successfully', {
      ...vendor,
      app_version: appVersion,
      total_orders: totalOrders,
      total_accepted_orders: totalAcceptedOrders,
      pending_settlement_amount: pendingSettlementAmount,
      support_phone_number: appConfig?.support_phone_number,
      privacy_policy_url: appConfig?.privacy_policy_url,
      terms_url: appConfig?.terms_url,
      payment_config: {
        gst_percentage: appConfig?.payment_config?.gst, delivery_fee: appConfig?.payment_config?.delivery_fee
        , platform_fee: appConfig?.payment_config?.platform_fee, vendor_comission_percentage: appConfig?.payment_config?.vendor_commission
      }
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
    const vendor = await this.vendorModel.findOne({ phone });
    if (!vendor) return ResponseHelper.error('Vendor not found');

    const updates: any = {};

    if (files?.shop_image?.[0]) {
      const f = files.shop_image[0];
      const { url } = await this.uploadVendorDocument(
        f.buffer,
        f.mimetype,
        `vendors/${vendor._id.toString()}/shop_image`,
      );
      updates['shop_image_url'] = url;
    }

    await this.vendorModel.updateOne({ _id: vendor._id }, { $set: updates });
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
    const vendor = await this.vendorModel.findOne({ phone });
    if (!vendor) return ResponseHelper.error('Vendor not found');
    // if (vendor.status != 'upload' && vendor.status != 'retry')
    //   throw new NotFoundException('Cannot upload docs');

    const updates: any = {};

    if (files?.aadhaar_card?.[0]) {
      const f = files.aadhaar_card[0];
      const { url } = await this.uploadVendorDocument(
        f.buffer,
        f.mimetype,
        `vendors/${vendor._id.toString()}/aadhaar_card`,
      );
      updates['documents.aadhaar_card'] = url;
    }
    if (files?.gst_certificate?.[0]) {
      const f = files.gst_certificate[0];
      const { url } = await this.uploadVendorDocument(
        f.buffer,
        f.mimetype,
        `vendors/${vendor._id.toString()}/gst_certificate`,
      );
      updates['documents.gst_certificate'] = url;
    }
    if (files?.pan_card?.[0]) {
      const f = files.pan_card[0];
      const { url } = await this.uploadVendorDocument(
        f.buffer,
        f.mimetype,
        `vendors/${vendor._id.toString()}/pan_card`,
      );
      updates['documents.pan_card'] = url;
    }

    if (Object.keys(updates).length === 0) {
      return { status: false, message: 'No files uploaded' };
    }

    updates.status = 'docs';
    await this.vendorModel.updateOne({ _id: vendor._id }, { $set: updates });
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
    const vendor = await this.vendorModel.findOne({ phone });
    if (!vendor) return ResponseHelper.error('Vendor not found');

    const updates: Record<string, any> = {};
    const data = payload || {};

    if (data.vendor !== undefined) {
      updates['shop_name'] = data.vendor;
    }
    if (data.contactNum !== undefined) {
      updates['contactNum'] = data.contactNum;
    }
    if (data.email !== undefined) {
      updates['email'] = data.email.toLowerCase();
    }
    if (data.owner_name !== undefined) {
      updates['owner_name'] = data.owner_name;
    }

    if (files?.profile_pic?.[0]) {
      const f = files.profile_pic[0];
      const { url } = await this.uploadVendorDocument(
        f.buffer,
        f.mimetype,
        `vendors/${vendor._id.toString()}/profile_pic`,
      );
      updates['profile_pic'] = url;
    }
    if (files?.aadhaar_card?.[0]) {
      const f = files.aadhaar_card[0];
      const { url } = await this.uploadVendorDocument(
        f.buffer,
        f.mimetype,
        `vendors/${vendor._id.toString()}/aadhaar_card`,
      );
      updates['documents.aadhaar_card'] = url;
    }
    if (files?.pan_card?.[0]) {
      const f = files.pan_card[0];
      const { url } = await this.uploadVendorDocument(
        f.buffer,
        f.mimetype,
        `vendors/${vendor._id.toString()}/pan_card`,
      );
      updates['documents.pan_card'] = url;
    }

    if (Object.keys(updates).length === 0) {
      return ResponseHelper.error('No updates provided');
    }

    await this.vendorModel.updateOne({ _id: vendor._id }, { $set: updates });

    const updatedVendor = await this.vendorModel
      .findById(vendor._id)
      .select('shop_name contactNum email owner_name profile_pic documents')
      .lean();

    return ResponseHelper.success(
      'Vendor profile updated successfully',
      updatedVendor,
    );
  }

  async updateOperatingHours(phone: string, payload: any) {
    const vendor = await this.vendorModel.findOne({ phone });
    if (!vendor) return ResponseHelper.error('Vendor not found');
    if (vendor.status !== 'active')
      throw new NotFoundException(
        'Only active vendors can update operating hours',
      );

    await this.vendorModel.updateOne(
      { _id: vendor._id },
      { $set: { operating_hours: payload } },
    );
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
      const vendor = await this.vendorModel.findOne({ phone });
      if (!vendor) return ResponseHelper.error('Vendor not found');
      if (vendor.status !== 'active')
        throw new NotFoundException(
          'Only active vendors can update bank details',
        );

      const updates: Record<string, any> = {};

      if (payload.account_holder_name !== undefined) {
        updates['bank_details.account_holder_name'] =
          payload.account_holder_name;
      }
      if (payload.account_number !== undefined) {
        updates['bank_details.account_number'] = payload.account_number;
      }
      if (payload.ifsc_code !== undefined) {
        updates['bank_details.ifsc_code'] = payload.ifsc_code;
      }
      if (payload.bank_name !== undefined) {
        updates['bank_details.bank_name'] = payload.bank_name;
      }
      if (payload.branch !== undefined) {
        updates['bank_details.branch'] = payload.branch;
      }
      if (payload.upi_id !== undefined) {
        updates['bank_details.upi_id'] = payload.upi_id;
      }

      if (files?.cancelled_cheque?.[0]) {
        const f = files.cancelled_cheque[0];
        const { url } = await this.uploadVendorDocument(
          f.buffer,
          f.mimetype,
          `vendors/${vendor._id.toString()}/cancelled_cheque`,
        );
        updates['bank_details.cancelled_cheque'] = url;
      }

      if (Object.keys(updates).length === 0) {
        return ResponseHelper.error('No bank details provided to update');
      }

      await this.vendorModel.updateOne({ _id: vendor._id }, { $set: updates });

      // Fetch updated vendor bank details
      const updatedVendor = await this.vendorModel
        .findById(vendor._id)
        .select('bank_details')
        .lean();

      return ResponseHelper.success(
        'Bank details updated successfully',
        updatedVendor?.bank_details,
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
    const vendor = await this.vendorModel.findOne({ phone });
    if (!vendor) return ResponseHelper.error('Vendor not found');
    if (vendor.status !== 'active')
      throw new NotFoundException('Only active vendors can update services');

    vendor.services_offered.forEach((service) => {
      if (
        service.service_id.equals(
          new Types.ObjectId(payload.service.service_id),
        )
      ) {
        service.max_count_per_day = payload.service.max_count_per_day;
        service.is_express_available = payload.service.is_express;
        if (payload.service.is_offer !== undefined) {
          service.is_offer = payload.service.is_offer;
        }
        if (payload.service.offer_max_cap !== undefined) {
          service.offer_max_cap = payload.service.offer_max_cap;
        }
        if (payload.service.offer_percentage !== undefined) {
          service.offer_percentage = payload.service.offer_percentage;
        }
        if (payload.service.express_time !== undefined) {
          service.express_time = payload.service.express_time;
        }
        if (payload.service.standard_time !== undefined) {
          service.standard_time = payload.service.standard_time;
        }
        // Update standard_price_per_kg if pricing_type is 'per_kg'
        if (
          payload.service.standard_price_per_kg !== undefined &&
          service.pricing_type === 'per_kg'
        ) {
          service.standard_price_per_kg = payload.service.standard_price_per_kg;
        }
        // Update express_price_per_kg if pricing_type is 'per_kg'
        if (
          payload.service.express_price_per_kg !== undefined &&
          service.pricing_type === 'per_kg'
        ) {
          service.express_price_per_kg = payload.service.express_price_per_kg;
        }

        if (payload.service.pricing_tiers) {
          service.pricing_tiers = {
            regular: payload.service.pricing_tiers.regular,
            standard: payload.service.pricing_tiers.standard,
            max: payload.service.pricing_tiers.max,
          };
        }
        const updatedIteams = payload.service.items.reduce((total, value) => {
          total[`${value.item_name}${value.item_category}`] = value;
          return total;
        }, {});
        service.items.forEach((item) => {
          const itemFind = updatedIteams[`${item.item_name}${item.category}`];
          if (itemFind) {
            item.item_price = itemFind.item_price;
            item.express_price = itemFind.express_price;
            item.is_active = itemFind.is_active;
          }
        });
      }
    });

    vendor.markModified('services_offered');
    await vendor.save();

    return {
      status: true,
      message: 'Services and items updated successfully',
    };
  }

  async updateStoreStatus(phone: string) {
    const vendor = await this.vendorModel.findOne({ phone });
    if (!vendor) return ResponseHelper.error('Vendor not found');
    if (vendor.status !== 'active')
      throw new NotFoundException('Only active vendors can update status');

    if (vendor.shop_status.status == 'close') {
      vendor.shop_status.status = 'open';
      vendor.shop_status.close_time = null;
    } else {
      vendor.shop_status.status = 'close';
      vendor.shop_status.close_time = new Date(Date.now() + 2 * 60 * 60 * 1000);
    }

    await vendor.save();
    return { status: true, message: 'Status updated' };
  }

  async updateOrderItems(phone: string, payload: UpdateOrderItemsDto) {
    const vendor = await this.vendorModel.findOne({ phone });
    if (!vendor) return ResponseHelper.error('Vendor not found');
    if (vendor.status !== 'active')
      throw new NotFoundException(
        'Only active vendors can update order items',
      );

    const order = await this.orderModel.findOne({
      _id: new Types.ObjectId(payload.order_id),
      vendor_id: vendor._id,
    });

    if (!order) throw new NotFoundException('Order not found');

    if (!['pending', 'accepted', 'processing'].includes(order.status)) {
      throw new NotFoundException(
        'Order items cannot be updated in current status',
      );
    }

    let itemsUpdated = false;
    const isWeightBased = order.service_type === 2;
    const updatesMap = new Map(payload.items.map((i) => [i.item_id, i]));

    const updatedItems = order.items.map((item) => {
      const update = updatesMap.get(item.item_id.toString());
      if (update) {
        itemsUpdated = true;
        if (update.quantity !== undefined) item.quantity = update.quantity;
        if (update.weight !== undefined) item.weight = update.weight;
        if (update.pricing_tier !== undefined) item.pricing_tier = update.pricing_tier;

        if (isWeightBased) {
          // Find the service config for this item to get pricing tiers
          const serviceConfig = vendor.services_offered.find(s => s.service_id.toString() === item.service_id.toString());

          // Default to price_per_item if tier not found or not setup
          let pricePerUnit = item.price_per_item || 0;

          if (serviceConfig && serviceConfig.pricing_tiers && item.pricing_tier) {
            const tierPrice = serviceConfig.pricing_tiers[item.pricing_tier];
            if (tierPrice !== undefined) {
              pricePerUnit = tierPrice;
              // Update the item's unit price to reflect the tier price
              item.price_per_item = pricePerUnit;
            }
          }

          item.total_price = (item.weight || 0) * pricePerUnit;
        } else {
          item.total_price = item.quantity * (item.price_per_item || 0);
        }
      }
      return item;
    });

    if (!itemsUpdated) {
      return { status: true, message: 'No items matched for update' };
    }

    order.items = updatedItems;

    // Recalculate Financials
    const itemTotal = order.items.reduce(
      (sum, item) => sum + (item.total_price || 0),
      0,
    );

    let appConfig = await this.appconfigModel
      .findOne({ is_active: true })
      .lean();

    const gstRate = (appConfig?.payment_config?.gst || 18) / 100;
    const vendorCommissionRate =
      (appConfig?.payment_config?.vendor_commission || 10) / 100;

    const newItemTotal = itemTotal;
    const newGstValue = newItemTotal * gstRate;
    const commission = newItemTotal * vendorCommissionRate;
    const amountToVendor = newItemTotal;
    const amountToVendorAfterCommission = amountToVendor - commission;

    order.payment_details.item_total = newItemTotal;
    order.payment_details.gst = newGstValue;
    order.payment_details.amount_to_vendor = amountToVendor;
    order.payment_details.amount_to_vendor_after_commission =
      amountToVendorAfterCommission;
    order.payment_details.vendor_commission = commission;

    order.markModified('items');
    order.markModified('payment_details');
    await order.save();

    return {
      status: true,
      message: 'Order items updated successfully',
      data: order,
    };
  }

  async updateOrderStatus(phone: string, orderId: string, status: string) {
    const vendor = await this.vendorModel.findOne({ phone });
    if (!vendor) return ResponseHelper.error('Vendor not found');
    if (vendor.status !== 'active')
      throw new NotFoundException(
        'Only active vendors can update order status',
      );
    if (!['processing', 'processed'].includes(status)) {
      throw new NotFoundException('Invalid status');
    }
    const order = await this.orderModel.findOne({
      _id: new Types.ObjectId(orderId),
      vendor_id: vendor._id,
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status != 'picked_up' && order.status != 'processing')
      throw new NotFoundException('Order cannot be updated for the status');

    if (status === 'processed') {
      order.status = 'processed';
    } else {
      order.status = 'processing';
      order.delivered_to_vendor_at = new Date();
    }

    await order.save();
    return { status: true, message: 'Order status updated' };
  }

  async acceptOrder(phone: string, orderId: string, isRejected?: string) {
    const vendor = await this.vendorModel.findOne({ phone });
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    if (!vendor) return ResponseHelper.error('Vendor not found');
    if (vendor.status !== 'active')
      throw new NotFoundException(
        'Only active vendors can update order status',
      );

    const order = await this.orderModel.findOne({
      _id: new Types.ObjectId(orderId),
      vendor_id: vendor._id,
    });
    let appConfig = await this.appconfigModel
      .findOne({ is_active: true })
      .lean();
    if (!order) throw new NotFoundException('Order not found');
    if (order.status != 'pending') {
      throw new NotFoundException('Invalid status');
    }
    if (isRejected && isRejected === 'true') {
      order.status = 'rejected';
      order.status_type = 12;
      order.status_timestamps.set('rejected_at', new Date());
      await order.save();
      await this.trackingGateway.publishEventToGroup(
        orderId,
        {},
        'order-status',
      );
      return { status: true, message: 'Order rejected' };
    }

    order.status = 'accepted';
    order.status_type = 2;
    order.status_timestamps.set('accepted_at', new Date());
    await order.save();
    let vendorOrders_Curr = await this.orderModel
      .find({
        vendor_id: new Types.ObjectId(vendor._id),
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: 'pending',
      })
      .lean();
    if (vendor.shop_status.status === 'open') {
      this.trackingGateway.publishEventToGroup(
        vendor._id.toString(),
        vendorOrders_Curr,
        'vendor-order',
      );
    }
    let firstNotify: any =
      await this.deliveryService.getDeliveryPersonByDistance(
        order.user_address,
        vendor?.address,
        appConfig?.delivery_config?.initial_distance_km || 2,
        new Date(
          order.created_at.getTime() +
          appConfig?.delivery_config?.delivery_order_accept_time * 60 * 1000,
        ),
      );
    if (firstNotify.length > 0) {
      // Calculate order_accept_endtime
      const orderAcceptEndTime = new Date(
        order.created_at.getTime() +
        appConfig?.delivery_config?.delivery_order_accept_time * 60 * 1000,
      );

      // Cache each delivery person with their _id as key
      for (const deliveryPerson of firstNotify) {
        const deliveryPersonId = deliveryPerson._id.toString();
        // Ensure only correct fields are stored in details
        const newCacheObject = {
          order_id: order._id,
          type: 'order-list',
          details: {
            _id: deliveryPerson._id,
            driver_name: deliveryPerson.driver_name,
            phone: deliveryPerson.phone,
            current_location: deliveryPerson.current_location,
            from_location: deliveryPerson.from_location,
            to_location: deliveryPerson.to_location,
            from_eta: deliveryPerson.from_eta,
            to_eta: deliveryPerson.to_eta,
            order_duration: deliveryPerson.order_duration,
            order_accept_endtime: orderAcceptEndTime,
          },
        };

        const existingCache = await this.mongoCache.get<any>(deliveryPersonId);

        let updatedCacheArray: any[];

        if (
          !existingCache ||
          (Array.isArray(existingCache) && existingCache.length === 0)
        ) {
          // Cache is empty, create new array with this order
          updatedCacheArray = [newCacheObject];
        } else {
          // Cache exists, convert to array if it's a single object
          const existingArray = Array.isArray(existingCache)
            ? existingCache
            : [existingCache];

          // Normalize existing entries to ensure correct structure (get() should normalize, but double-check)
          const normalizedExistingArray = existingArray
            .map((cachedOrder: any) => {
              // Validate order structure
              if (!cachedOrder || !cachedOrder.order_id) {
                console.warn(
                  'Skipping invalid cached order: missing order_id',
                  cachedOrder,
                );
                return null;
              }

              // Validate details exists and is an object
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
            })
            .filter((order: any) => order !== null);

          // Check for duplicate order_id within the cached array
          const isDuplicate = normalizedExistingArray.some(
            (cachedOrder: any) =>
              cachedOrder.order_id?.toString() === order._id.toString(),
          );

          if (!isDuplicate) {
            updatedCacheArray = [...normalizedExistingArray, newCacheObject];
          } else {
            updatedCacheArray = normalizedExistingArray;
          }
        }

        // Set will automatically calculate:
        // - check_time: minimum order_accept_endtime among all orders
        // - expires_at: maximum order_duration among all orders
        await this.mongoCache.set(deliveryPersonId, updatedCacheArray);

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
    const vendor = await this.vendorModel.findOne({ phone });
    if (!vendor) return ResponseHelper.error('Vendor not found');
    if (vendor.status !== 'active')
      throw new NotFoundException(
        'Only active vendors can update order status',
      );

    const order = await this.orderModel.findOne({
      _id: new Types.ObjectId(orderId),
      vendor_id: vendor._id,
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.status != 'processing') {
      throw new NotFoundException('Invalid status');
    }

    order.expected_delivery_date = new Date(time);
    await order.save();
    return { status: true, message: 'Order time updated' };
  }

  async markOrderComplete(phone: string, orderId: string) {
    let appConfig = await this.appconfigModel
      .findOne({ is_active: true })
      .lean();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const vendor = await this.vendorModel.findOne({ phone });
    if (!vendor) return ResponseHelper.error('Vendor not found');
    if (vendor.status !== 'active')
      throw new NotFoundException(
        'Only active vendors can mark orders as complete',
      );

    const order = await this.orderModel.findOne({
      _id: new Types.ObjectId(orderId),
      vendor_id: vendor._id,
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'processing') {
      throw new NotFoundException(
        'Order can only be marked as complete when status is processing',
      );
    }

    await this.orderModel.findByIdAndUpdate(order._id, {
      status: 'processed',
      status_type: 2,
      trip_type: 2,
      'payment_details.is_payment_eligible': true,
      $set: {
        'status_timestamps.processed_at': new Date(),
        'status_timestamps.out_for_delivery_at': new Date(),
      },
    });

    // let vendorOrders_Curr = await this.orderModel
    //   .find({
    //     vendor_id: new Types.ObjectId(vendor._id),
    //     createdAt: { $gte: startOfDay, $lte: endOfDay },
    //     status: 'pending',
    //   })
    //   .lean();
    // this.trackingGateway.publishEventToGroup(
    //   vendor._id.toString(),
    //   vendorOrders_Curr,
    //   'vendor-order',
    // );

    let firstNotify: any =
      await this.deliveryService.getDeliveryPersonByDistance(
        vendor?.address,
        order.user_address,
        appConfig?.delivery_config?.initial_distance_km || 2,
        new Date(
          order.created_at.getTime() +
          appConfig?.delivery_config?.delivery_order_accept_time * 60 * 1000,
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
        (appConfig?.delivery_config?.delivery_order_accept_time ?? 0) * 60 * 1000
      );

      // Cache each delivery person with their _id as key
      for (const deliveryPerson of firstNotify) {
        const deliveryPersonId = deliveryPerson._id.toString();
        // Ensure only correct fields are stored in details
        const newCacheObject = {
          order_id: order._id,
          type: 'order-list',
          details: {
            _id: deliveryPerson._id,
            driver_name: deliveryPerson.driver_name,
            phone: deliveryPerson.phone,
            current_location: deliveryPerson.current_location,
            from_location: deliveryPerson.from_location,
            to_location: deliveryPerson.to_location,
            from_eta: deliveryPerson.from_eta,
            to_eta: deliveryPerson.to_eta,
            order_duration: deliveryPerson.order_duration,
            order_accept_endtime: orderAcceptEndTime,
          },
        };

        const existingCache = await this.mongoCache.get<any>(deliveryPersonId);

        let updatedCacheArray: any[];

        if (
          !existingCache ||
          (Array.isArray(existingCache) && existingCache.length === 0)
        ) {
          // Cache is empty, create new array with this order
          updatedCacheArray = [newCacheObject];
        } else {
          // Cache exists, convert to array if it's a single object
          const existingArray = Array.isArray(existingCache)
            ? existingCache
            : [existingCache];

          // Normalize existing entries to ensure correct structure (get() should normalize, but double-check)
          const normalizedExistingArray = existingArray
            .map((cachedOrder: any) => {
              // Validate order structure
              if (!cachedOrder || !cachedOrder.order_id) {
                console.warn(
                  'Skipping invalid cached order: missing order_id',
                  cachedOrder,
                );
                return null;
              }

              // Validate details exists and is an object
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
            })
            .filter((order: any) => order !== null);

          // Check for duplicate order_id within the cached array
          const isDuplicate = normalizedExistingArray.some(
            (cachedOrder: any) =>
              cachedOrder.order_id?.toString() === order._id.toString(),
          );

          if (!isDuplicate) {
            updatedCacheArray = [...normalizedExistingArray, newCacheObject];
          } else {
            updatedCacheArray = normalizedExistingArray;
          }
        }

        // Store updated array in cache with TTL
        await this.mongoCache.set(deliveryPersonId, updatedCacheArray, ttlMs);

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
    const vendor = await this.vendorModel.findOne({ phone });
    if (!vendor) return ResponseHelper.error('Vendor not found');
    if (vendor.status !== 'active')
      throw new NotFoundException('Only active vendors can view orders');

    const query: any = { vendor_id: vendor._id };

    // Add order_id to query if provided
    if (orderId) {
      try {
        query._id = new Types.ObjectId(orderId);
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
          'verified',
          'reached_to_vendor',
        ], // Status 2 includes accepted, picked_up, and processing
        '3': 'processed',
        '4': ['delivered', 'out_for_delivery', 'delivery_OTP_verified'],
      };

      // If status is a number or numeric string, map
      if (status === '2') {
        const s2 = statusMapping['2'] as string[];
        query.$or = [
          {
            status: {
              $in: s2.filter(
                (s) =>
                  s !== 'accepted' &&
                  s !== 'reached_to_user' &&
                  s !== 'reached_to_vendor',
              ),
            },
          },
          { status: 'accepted', trip_type: { $ne: 2 } },
          { status: 'reached_to_user', trip_type: { $ne: 2 } },
          { status: 'reached_to_vendor', trip_type: { $ne: 2 } },
        ];
      } else if (status === '3') {
        query.$or = [
          { status: 'processed' },
          { status: 'accepted', trip_type: 2 },
          { status: 'reached_to_vendor', trip_type: 2 },
        ];
      } else if (status === '4') {
        const s4 = statusMapping['4'] as string[];
        query.$or = [
          { status: { $in: s4 } },
          { status: 'reached_to_user', trip_type: 2 },
        ];
      } else {
        const mappedStatus = statusMapping[status];
        if (mappedStatus !== undefined) {
          // If mapped status is an array, use $in operator
          if (Array.isArray(mappedStatus)) {
            query.status = { $in: mappedStatus };
          } else {
            query.status = mappedStatus;
          }
        } else {
          query.status = status;
        }
      }
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    let [orders, total]: any = await Promise.all([
      this.orderModel.aggregate([
        { $match: query },
        { $sort: { created_at: -1 } },
        { $skip: skip },
        { $limit: limitNum },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user',
            pipeline: [
              {
                $project: {
                  name: 1,
                  phone: 1,
                  email: 1,
                },
              },
            ],
          },
        },
        {
          $unwind: {
            path: '$user',
            preserveNullAndEmptyArrays: true,
          },
        },
      ]),
      this.orderModel.countDocuments(query),
    ]);

    // Helper function to build updateLogs for a single order
    const buildUpdateLogs = (order: any, statusFilter?: string) => {
      const updateLogs: any[] = [];

      // Handle status_timestamps (could be Map, object, or undefined)
      const statusTimestamps = order.status_timestamps || {};
      const timestampEntries =
        statusTimestamps instanceof Map
          ? Array.from(statusTimestamps.entries())
          : Object.entries(statusTimestamps);

      // Convert to object for easier access
      const timestampsObj: any = {};
      for (const [key, value] of timestampEntries) {
        timestampsObj[key] = value;
      }

      // Special handling for status 2 (accepted orders: accepted, processing, picked_up)
      if (statusFilter === '2' || statusFilter === 'accepted') {
        // For status 2, only show picked_up_at timestamp (if exists)
        // Do NOT show accepted_at or processing_at timestamps
        if (timestampsObj.picked_up_at) {
          // Show picked_up timestamp
          // updateLogs.push({
          //   statusStr: statusAbr.str.picked_up_at,
          //   status: statusAbr.num.picked_up_at,
          //   timestamp: timestampsObj.picked_up_at,
          // });
          // Add PHONE and OTP after picked_up
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
          // If picked_up_at doesn't exist yet (order is accepted or processing but not picked up)
          // Show "Pending rider" to indicate waiting for pickup
          updateLogs.push({
            statusStr: 'Pending rider',
            status: 17,
            timestamp: null,
          });
        }
      }
      // Special handling for status 3 (processed orders)
      else if (statusFilter === '3' || statusFilter === 'processed') {
        // For status 3, show "Pending rider" OR PHONE and OTP (not both)
        // Check if there's an out_for_delivery_at timestamp (set when vendor marks complete)
        if (timestampsObj.out_for_delivery_at && order.driver_id_2) {
          // If out_for_delivery_at exists, show PHONE and OTP (not "Pending rider")
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
          // If no out_for_delivery_at timestamp, show "Pending rider"
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
        for (const [status, timestamp] of timestampEntries) {
          if (statusAbr.str[status] && statusAbr.num[status]) {
            updateLogs.push({
              statusStr: statusAbr.str[status],
              status: statusAbr.num[status],
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
      const createdAt = order.createdAt || order.created_at;
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
          .map((o: any) => o.items?.[0]?.service_id?.toString())
          .filter((id: any) => !!id),
      ),
    );

    const services = await this.servicesModel
      .find({
        _id: { $in: serviceIds.map((id: any) => new Types.ObjectId(id)) },
      })
      .select('pricing_type')
      .lean();

    const serviceMap = new Map(
      services.map((s: any) => [s._id.toString(), s.pricing_type]),
    );

    const ordersWithLogs = Array.isArray(orders)
      ? orders.map((order: any) => {
        const serviceId = order.items?.[0]?.service_id?.toString();
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
            serviceMap.get(orders.items?.[0]?.service_id?.toString()) ==
              'per_pc'
              ? 1
              : 2,
          service_type_str:
            serviceMap.get(orders.items?.[0]?.service_id?.toString()) || null,
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
    const servicesRaw = await this.servicesModel.find().lean();
    const services = servicesRaw.map((service) => {
      return {
        service_name: service.service_name,
        image_url: service.image_url,
        pricing_type: service.pricing_type,
        service_description: service.service_description,
        items_by_category: (service.items || []).reduce((acc, item) => {
          if (!acc[item.category]) {
            acc[item.category] = [];
          }
          acc[item.category].push(item);
          return acc;
        }, {}),
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
      const services = await this.servicesModel.find({}, { items: 0 }).lean();
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
      const vendor = await this.vendorModel.findOne({ phone });
      if (!vendor) return ResponseHelper.error('Vendor not found');

      await this.ensureVendorServicesMapped(vendor);
      if (!vendor.services_offered || vendor.services_offered.length === 0) {
        return ResponseHelper.error(
          'No master services available to map for vendor',
        );
      }

      const results = [];
      const errors = [];

      for (let serviceToggle of payload.services) {
        try {
          const serviceId = new Types.ObjectId(serviceToggle.service_id);
          const service = vendor.services_offered.find((s) =>
            s.service_id.equals(serviceId),
          );

          if (!service) {
            errors.push({
              service_id: serviceToggle.service_id,
              error: 'Service not found',
            });
            continue;
          }

          service.is_active = serviceToggle.is_active;
          results.push({
            service_id: serviceToggle.service_id,
            service_name: service.service_name,
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

      if (results.length > 0) {
        vendor.markModified('services_offered');
        await vendor.save();
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
      const vendor = await this.vendorModel.findOne({ phone: phoneNumber });
      if (!vendor) return ResponseHelper.error('Vendor not found');

      const skip = (page - 1) * limit;

      const [notifications, total, unreadCount] = await Promise.all([
        this.notificationModel
          .find({
            recipient_id: vendor._id,
            recipient_role: 'vendor',
          })
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        this.notificationModel.countDocuments({
          recipient_id: vendor._id,
          recipient_role: 'vendor',
        }),
        this.notificationModel.countDocuments({
          recipient_id: vendor._id,
          recipient_role: 'vendor',
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

  async getMyReviews(
    phoneNumber: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const vendor = await this.vendorModel.findOne({ phone: phoneNumber });
      if (!vendor) return ResponseHelper.error('Vendor not found');

      const skip = (page - 1) * limit;

      const [reviews, totalReviews] = await Promise.all([
        this.reviewModel
          .find({ vendor_id: vendor._id })
          .populate('user_id', 'name')
          .populate('order_id', 'order_number')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        this.reviewModel.countDocuments({
          vendor_id: vendor._id,
        }),
      ]);

      return ResponseHelper.success('Reviews retrieved successfully', {
        reviews,
        total: totalReviews,
        average_reviews: vendor.rating.average,
        reviews_count: vendor.rating.total_reviews,
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
      const vendor = await this.vendorModel.findOneAndUpdate(
        { phone },
        { session_token: null, fcm_token: null },
      );
      this.trackingGateway.deleteGroup(vendor?._id.toString());
      if (!vendor) {
        return ResponseHelper.error('Vendor not found');
      }
      return ResponseHelper.success('Logout successful');
    } catch (error) {
      console.error('Error during logout:', error);
      return ResponseHelper.error('Failed to logout');
    }
  }

  async getServicesByState(phone: string) {
    try {
      const vendor = await this.vendorModel.findOne({ phone });
      if (!vendor) return ResponseHelper.error('Vendor not found');

      await this.ensureVendorServicesMapped(vendor);

      const services = vendor.services_offered || [];

      // Helper function to format service (without items)
      const formatService = (service: any) => {
        const items = service.items || [];
        const activeItemsCount = items.filter(
          (item: any) => item.is_active === true,
        ).length;
        const totalItemsCount = items.length;

        return {
          service_id: service.service_id,
          service_name: service.service_name,
          image_url: service.image_url,
          pricing_type: service.pricing_type,
          service_description: service.service_description,
          max_count_per_day: service.max_count_per_day,
          is_offer: service.is_offer,
          offer_percentage: service.offer_percentage,
          offer_max_cap: service.offer_max_cap,
          is_active: service.is_active,
          is_approved: service.is_approved,
          is_express_available: service.is_express_available,
          express_delivery_time_minutes: service.express_delivery_time_minutes,
          normal_delivery_time_minutes: service.normal_delivery_time_minutes,
          express_time: service.express_time ?? 8,
          standard_time: service.standard_time ?? 48,
          active_items_count: activeItemsCount,
          total_items_count: totalItemsCount,
        };
      };

      // Group services by verified/unverified
      const verified: any[] = [];
      const unverified: any[] = [];

      services.forEach((service) => {
        const formattedService = formatService(service);
        if (service.is_approved) {
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
      const vendor = await this.vendorModel.findOne({ phone });
      if (!vendor) return ResponseHelper.error('Vendor not found');

      const updates: Record<string, any> = {};

      // Update shop_name if provided
      if (payload.shop_name !== undefined) {
        updates['shop_name'] = payload.shop_name;
      }

      // Update contactNum if provided
      if (payload.contactNum !== undefined) {
        updates['contactNum'] = payload.contactNum;
      }

      // Handle shop image upload if provided
      if (files?.shop_image?.[0]) {
        const f = files.shop_image[0];
        const { url } = await this.uploadVendorDocument(
          f.buffer,
          f.mimetype,
          `vendors/${vendor._id.toString()}/shop_image`,
        );
        updates['shop_image_url'] = url;
      }

      // Update address if provided
      if (payload.address !== undefined) {
        const addressUpdates: Record<string, any> = {};
        if (payload.address.address_line1 !== undefined) {
          addressUpdates['address.address_line1'] =
            payload.address.address_line1;
        }
        if (payload.address.address_line2 !== undefined) {
          addressUpdates['address.address_line2'] =
            payload.address.address_line2;
        }
        if (payload.address.city !== undefined) {
          addressUpdates['address.city'] = payload.address.city;
        }
        if (payload.address.state !== undefined) {
          addressUpdates['address.state'] = payload.address.state;
        }
        if (payload.address.pincode !== undefined) {
          addressUpdates['address.pincode'] = payload.address.pincode;
        }
        if (payload.address.latitude !== undefined) {
          addressUpdates['address.latitude'] = payload.address.latitude;
        }
        if (payload.address.longitude !== undefined) {
          addressUpdates['address.longitude'] = payload.address.longitude;
        }
        if (payload.address.landmark !== undefined) {
          addressUpdates['address.landmark'] = payload.address.landmark;
        }
        Object.assign(updates, addressUpdates);
      }

      // Update operating_hours if provided
      if (payload.operating_hours !== undefined) {
        Object.keys(payload.operating_hours).forEach((day) => {
          if (payload.operating_hours[day]) {
            updates[`operating_hours.${day}`] = payload.operating_hours[day];
          }
        });
      }

      // Check if there are any updates
      if (Object.keys(updates).length === 0) {
        return ResponseHelper.error('No shop details provided to update');
      }

      // Update the vendor
      await this.vendorModel.updateOne({ _id: vendor._id }, { $set: updates });

      // Fetch updated vendor
      const updatedVendor = await this.vendorModel
        .findById(vendor._id)
        .select('shop_name contactNum shop_image_url address operating_hours')
        .lean();

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
      const vendor = await this.vendorModel.findOne({ phone });
      if (!vendor) return ResponseHelper.error('Vendor not found');
      if (vendor.status !== 'active')
        throw new NotFoundException('Only active vendors can toggle settings');

      const results: any = {};

      // Handle express status toggle
      if (payload.express_status !== undefined) {
        vendor.express_status = payload.express_status;
        results.express_status = vendor.express_status;
      }

      // Handle shop status toggle
      if (payload.shop_status !== undefined) {
        vendor.shop_status.status = payload.shop_status ? 'open' : 'close';
        vendor.shop_status.close_time =
          vendor.shop_status.status == 'close' ? new Date() : null;
        results.shop_status = {
          status: vendor.shop_status.status,
          close_time: vendor.shop_status.close_time,
        };
      } else if (payload.express_status === undefined) {
        // If no shop_status provided and no express_status, toggle current shop status
        if (vendor.shop_status.status === 'close') {
          vendor.shop_status.status = 'open';
          vendor.shop_status.close_time = null;
        } else {
          vendor.shop_status.status = 'close';
          vendor.shop_status.close_time = new Date();
        }
        results.shop_status = {
          status: vendor.shop_status.status,
          close_time: vendor.shop_status.close_time,
        };
      }

      await vendor.save();

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
