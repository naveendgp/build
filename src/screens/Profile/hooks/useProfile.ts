import { useEffect, useState, useMemo } from "react";
import { useCommonStore } from "../../../state/zustand/commonStore";

export const useProfile = () => {
  const { profile, isLoading, error, getProfile } = useCommonStore();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    getProfile();
  }, []);

  // Get default address from addresses array
  const getDefaultAddress = () => {
    if (!profile?.addresses || profile.addresses.length === 0) {
      return "No address provided";
    }
    const defaultAddress = profile.addresses.find(addr => !addr.is_default) || profile.addresses[0];
    const parts = [
      defaultAddress.address_line1,
      defaultAddress.address_line2,
      defaultAddress.city,
      defaultAddress.state,
      defaultAddress.pincode
    ].filter(Boolean);
    return parts.join(", ");
  };

  // Get default address with label and address separately
  const getDefaultAddressWithLabel = () => {
    if (!profile?.addresses || profile.addresses.length === 0) {
      return {
        label: "No address",
        address: "No address provided",
        addressId: ""
      };
    }
    const defaultAddress = profile.addresses.find(addr => addr.is_default) || profile.addresses[0];
    const parts = [
      defaultAddress.address_line1,
      defaultAddress.address_line2,
      // defaultAddress.city,
      // defaultAddress.state,
      // defaultAddress.pincode,    Check this later
      // defaultAddress._id
    ].filter(Boolean);

    return {
      label: defaultAddress.label || "Address",
      address: parts.join(", "),
      addressId: defaultAddress._id
    };
  };

  // Format phone number
  const formatPhone = (phone: string) => {
    if (!phone) return "+91 0000000000";
    // If phone doesn't start with +, add +91
    if (!phone.startsWith("+")) {
      return `+91 ${phone}`;
    }
    return phone;
  };

  // Get initials for avatar - use phone or default
  const getInitials = () => {
    if (profile?.name && profile.name.length >= 2) {
      const name = profile.name.toUpperCase();
      return name.substring(0, 2);
    }
    // Fallback to phone last 2 digits or "U"
    if (profile?.phone) {
      const lastTwo = profile.phone.slice(-2);
      return lastTwo.toUpperCase();
    }
    return "U";
  };

  return {
    profile,
    isLoading,
    error,
    showLogoutDialog,
    setShowLogoutDialog,
    getDefaultAddress,
    getDefaultAddressWithLabel,
    formatPhone,
    getInitials,
  };
};