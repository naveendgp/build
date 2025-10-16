// Flow 1: User → Driver → Vendor
export enum UserToVendorStatus {
  ACCEPTED = 1,
  ARRIVED = 2,
  ITEM_CONFIRMATION = 3,
  OTP_CONFIRMATION = 4,
  PAYMENT_CONFIRMATION = 5,
  REACHED = 6,
  OTP_DELIVERED = 7,
}

// Labels for Flow 1
export const UserToVendorStatusMap: Record<UserToVendorStatus, string> = {
  [UserToVendorStatus.ACCEPTED]: 'Order Accepted',
  [UserToVendorStatus.ARRIVED]: 'Arrived at User Location',
  [UserToVendorStatus.ITEM_CONFIRMATION]: 'Item Confirmation',
  [UserToVendorStatus.OTP_CONFIRMATION]: 'OTP Confirmation',
  [UserToVendorStatus.PAYMENT_CONFIRMATION]: 'Payment Confirmation',
  [UserToVendorStatus.REACHED]: 'Reached',
  [UserToVendorStatus.OTP_DELIVERED]: 'OTP Verification & Delivered',
};

// Flow 2: Vendor → Driver → User
export enum VendorToUserStatus {
  ACCEPTED = 1,
  ARRIVED = 2,
  PICKUP = 3,
  REACHED = 4,
  DELIVERED = 5,
}

// Labels for Flow 2
export const VendorToUserStatusMap: Record<VendorToUserStatus, string> = {
  [VendorToUserStatus.ACCEPTED]: 'Order Accepted',
  [VendorToUserStatus.ARRIVED]: 'Arrived',
  [VendorToUserStatus.PICKUP]: 'OTP Verification & Order Picked Up',
  [VendorToUserStatus.REACHED]: 'Reached User Location',
  [VendorToUserStatus.DELIVERED]: 'OTP Verification & Order Delivered',
};

export enum LoginUserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
  DOC_PENDING_UPLOAD = 'pending',
  DOC_UNDER_REVIEW = 'upload',
  DOC_REUPLOAD_REQUIRED = 'retry',
}
