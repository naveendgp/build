/**
 * Refactored VendorHelper — MongoDB → PostgreSQL (Prisma)
 *
 * Changes from original vendor.helper.ts:
 *  - Removed `import { Types } from 'mongoose'`
 *  - Replaced `ObjectId.equals()` comparisons with plain string `===`
 *  - All IDs are now UUIDs (strings), so no ObjectId wrappers needed
 *
 * NOTE: The vendorData passed to this helper now comes from Prisma
 *       with `include: { servicesOffered: { include: { items: true } } }`
 *       so property names follow the Prisma camelCase convention.
 */

export class VendorHelper {
  validateOrderData(
    vendorData: any,
    vendorOrders: any,
    serviceItems: any,
    appConfigData: any,
    is_express: boolean,
  ): {
    success: boolean;
    message: string;
    amountToVendor?: number;
    amountToPlatform?: number;
    gstAmount?: number;
    totalPayableAmount?: number;
    offerDiscountAmount?: number;
  } {
    // Check if all service items have the same service_id
    if (serviceItems.length === 0)
      return { success: true, message: 'No items to validate' };

    const firstServiceId = serviceItems[0].service_id;
    if (
      !serviceItems.every((item: any) => item.service_id === firstServiceId)
    ) {
      return {
        success: false,
        message: 'All items must belong to the same service',
      };
    }

    // ── BEFORE (Mongoose) ──
    // const service = vendorData?.services_offered?.find((s: any) =>
    //   s.service_id.equals(new Types.ObjectId(String(firstServiceId))),
    // );

    // ── AFTER (Prisma) ──
    // With Prisma, IDs are plain UUID strings — use strict equality
    const service = vendorData?.servicesOffered?.find(
      (s: any) => String(s.serviceId) === String(firstServiceId),
    );

    if (!service) {
      return {
        success: false,
        message: `Service not found for ID: ${firstServiceId}`,
      };
    }

    if (service.isActive !== true || service.isApproved !== true) {
      return {
        success: false,
        message: `The service is currently inactive`,
      };
    }

    if (service?.isExpressAvailable === false && is_express === true) {
      return {
        success: false,
        message: `The service is not available for express orders`,
      };
    }

    // Validate items and calculate pricing
    let subtotal = 0;
    let offerDiscountAmount = 0;

    for (const item of serviceItems) {
      // ── BEFORE (Mongoose) ──
      // const serviceItem = service.items.find((i: any) =>
      //   i.item_id.equals(new Types.ObjectId(String(item.item_id))),
      // );

      // ── AFTER (Prisma) ──
      const serviceItem = service.items?.find(
        (i: any) => String(i.itemId) === String(item.item_id),
      );

      if (!serviceItem || !serviceItem.isActive) {
        console.log(
          `Item not found or inactive: item_id=${item.item_id}, item_name=${item.item_name}, is_active=${serviceItem?.isActive}`,
        );
        return {
          success: false,
          message: `Item "${item.item_name}" is not available or inactive`,
        };
      }

      // Calculate item total - use weight if per_kg
      const itemTotal =
        service.pricingType === 'per_kg'
          ? (item.weight || 0) * item.price_per_item
          : item.quantity * item.price_per_item;
      subtotal += itemTotal;

      // Check for offer on this service
      if (service.isOffer && service.offerPercentage > 0) {
        console.log(
          `Offer applied for service: ${service.serviceName}, Offer percentage: ${service.offerPercentage}`,
        );
        const itemDiscount = (itemTotal * service.offerPercentage) / 100;
        offerDiscountAmount += itemDiscount;
      }
    }

    // Validate daily limits
    const maxCount = service.maxCountPerDay;
    if (maxCount && maxCount > 0) {
      let totalExisting = 0;
      for (const order of vendorOrders) {
        for (const orderItem of order.items) {
          // ── BEFORE (Mongoose) ──
          // if (orderItem.service_id && orderItem.service_id.equals(service.service_id.toString())) {

          // ── AFTER (Prisma) ──
          if (
            orderItem.serviceId &&
            String(orderItem.serviceId) === String(service.serviceId)
          ) {
            // Use weight if per_kg
            totalExisting +=
              service.pricingType === 'per_kg'
                ? orderItem.weight || 0
                : orderItem.quantity;
          }
        }
      }
      let newTotal = 0;
      for (const item of serviceItems) {
        // Use weight if per_kg
        newTotal +=
          service.pricingType === 'per_kg' ? item.weight || 0 : item.quantity;
      }
      console.log(
        `Max count validation: Service=${service.serviceName}, Pricing=${service.pricingType}, Max=${maxCount}, Existing=${totalExisting}, New=${newTotal}, Total=${totalExisting + newTotal}`,
      );
      if (totalExisting + newTotal > maxCount) {
        const unit = service.pricingType === 'per_kg' ? 'kg' : 'items';
        console.log(
          `Max count exceeded: ${totalExisting + newTotal} > ${maxCount} ${unit}`,
        );
        return {
          success: false,
          message: `Order exceeds daily limit for ${service.serviceName} service. Maximum allowed: ${maxCount} ${unit}, Requested: ${newTotal} ${unit}, Already ordered today: ${totalExisting} ${unit}`,
        };
      }
    }

    // Calculate payment breakdown
    const afterOfferAmount = subtotal - offerDiscountAmount;

    // Get platform fee percentage from app config
    const platformFeePercentage =
      appConfigData?.paymentConfig?.platformFee ||
      appConfigData?.payment_config?.platform_fee ||
      5;
    const platformFeeAmount =
      (afterOfferAmount * platformFeePercentage) / 100;

    // Calculate vendor and platform amounts
    const amountToVendor = afterOfferAmount - platformFeeAmount;
    const amountToPlatform = platformFeeAmount;

    // Get delivery fee from app config
    const deliveryFee =
      appConfigData?.paymentConfig?.deliveryFee ||
      appConfigData?.payment_config?.delivery_fee ||
      0;

    // Calculate GST on the total amount (after offer, before delivery)
    const gstPercentage =
      appConfigData?.paymentConfig?.gst ||
      appConfigData?.payment_config?.gst ||
      18;
    const gstAmount = (afterOfferAmount * gstPercentage) / 100;

    // Calculate total payable amount
    const totalPayableAmount = afterOfferAmount + deliveryFee + gstAmount;

    return {
      success: true,
      message: 'Order validation successful',
      amountToVendor: Math.round(amountToVendor * 100) / 100,
      amountToPlatform: Math.round(amountToPlatform * 100) / 100,
      gstAmount: Math.round(gstAmount * 100) / 100,
      totalPayableAmount: Math.round(totalPayableAmount * 100) / 100,
      offerDiscountAmount: Math.round(offerDiscountAmount * 100) / 100,
    };
  }
}
