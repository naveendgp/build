
// Flow 1: User → Driver → Vendor
export enum TripType {
  NO_TRIP = 0,
  USER_TO_VENDOR = 1,
  VENDOR_TO_USER = 2,
}

// Flow 1: User → Driver → Vendor
export enum UserToVendorStatus {
  CREATED = 1,
  VENDOR_ACCEPTED = 2,
  DRIVER_ASSIGNED = 3,
  DRIVER_ARRIVED = 4,
  ITEM_CONFIRMATION = 5,
  OTP_CONFIRMATION = 6,
  PAYMENT_CONFIRMATION = 7,
  REACHED_VENDOR = 8,
  OTP_DELIVERED = 9,
  COMPLETED = 10,
  VENDOR_UN_ACCEPTED = 11,
  VENDOR_REJECTED = 12,
}

// Labels for Flow 1
export const UserToVendorStatusMap: Record<UserToVendorStatus, string> = {
  [UserToVendorStatus.CREATED]: 'Order Created',
  [UserToVendorStatus.VENDOR_ACCEPTED]: 'Vendor Accepted',
  [UserToVendorStatus.DRIVER_ASSIGNED]: 'Driver Assigned',
  [UserToVendorStatus.DRIVER_ARRIVED]: 'Driver Arrived at User Location',
  [UserToVendorStatus.ITEM_CONFIRMATION]: 'Item Confirmation',
  [UserToVendorStatus.OTP_CONFIRMATION]: 'OTP Confirmation',
  [UserToVendorStatus.PAYMENT_CONFIRMATION]: 'Payment Confirmation',
  [UserToVendorStatus.REACHED_VENDOR]: 'Reached Vendor',
  [UserToVendorStatus.OTP_DELIVERED]: 'OTP Verification & Delivered',
  [UserToVendorStatus.COMPLETED]: 'Completed',
  [UserToVendorStatus.VENDOR_UN_ACCEPTED]: 'Vendor Unaccepted',
  [UserToVendorStatus.VENDOR_REJECTED]: 'Vendor Rejected',
};

// Flow 2: Vendor → Driver → User
export enum VendorToUserStatus {
  CREATED = 1,
  ACCEPTED = 2,
  ARRIVED = 3,
  PICKUP = 4,
  REACHED = 5,
  PAYMENT_CONFIRMATION = 6,
  DELIVERED = 7,
}

// Labels for Flow 2
export const VendorToUserStatusMap: Record<VendorToUserStatus, string> = {
  [VendorToUserStatus.CREATED]: 'Order Created',
  [VendorToUserStatus.ACCEPTED]: 'Order Accepted',
  [VendorToUserStatus.ARRIVED]: 'Arrived',
  [VendorToUserStatus.PICKUP]: 'OTP Verification & Order Picked Up',
  [VendorToUserStatus.REACHED]: 'Reached User Location',
  [VendorToUserStatus.PAYMENT_CONFIRMATION]: 'Payment Confirmation',
  [VendorToUserStatus.DELIVERED]: 'OTP Verification & Order Delivered',
};
