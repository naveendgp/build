import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CustomText from '../../../../components/Text';
import DeliveryAddressCard from '../../../../components/DeliveryAddressCard';
import AddIcon from '../../../../assets/auto-generated-svg-icons/AddIcon';
import { useAddressStore } from '../../../../state/zustand/addressStore';
import { Address } from '../../../../types/profile/profile';
import { EditAddressRequest } from '../../../../services/addressService';
import { RootStackParamList } from '../../../../navigation/AppNavigator';
import styles from './style';
import CustomDialog from '../../../../components/CustomDialog';
import { COLORS } from '../../../../constants';
import { DistanceMap } from '../../../../types/order/order';
import { showErrorToast } from '../../../../components/Toast/Toast';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ChangeAddressProps {
    onAddLocation?: () => void;
    onEditAddress?: (address: Address) => void;
    onSelectAddress?: (address: Address, selectedId: string) => void;
    onClose?: () => void;
    selectedAddressId?: string;
    distanceMap?: DistanceMap[];
    onRefreshOrderPreview?: (addressId: string) => void;
}

const ChangeAddress: React.FC<ChangeAddressProps> = ({
    onAddLocation,
    onEditAddress,
    onSelectAddress,
    onClose,
    selectedAddressId,
    distanceMap,
    onRefreshOrderPreview,
}) => {
    const navigation = useNavigation<NavigationProp>();
    const { addresses, isDeleting, deleteAddress, refreshAddresses, editAddress } = useAddressStore();
    const [selectedId, setSelectedId] = useState<string | undefined>(selectedAddressId);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSettingDefault, setIsSettingDefault] = useState(false);
    const [settingDefaultAddressId, setSettingDefaultAddressId] = useState<string | null>(null);
    const ignorePropUpdateRef = useRef(false);
    const previousAddressCountRef = useRef(0);
    const hasNavigatedToAddLocationRef = useRef(false);
    // Initialize addresses - only refresh if not already loaded
    useEffect(() => {
        const loadAddresses = async () => {
            // Check if addresses are already loaded in the store
            const currentAddresses = useAddressStore.getState().addresses;
            if (currentAddresses.length > 0) {
                // Addresses already loaded, just set the count - no loading needed
                previousAddressCountRef.current = currentAddresses.length;
                return;
            }

            // Only refresh if addresses are empty
            setIsLoading(true);
            await refreshAddresses();
            const updatedAddresses = useAddressStore.getState().addresses;
            previousAddressCountRef.current = updatedAddresses.length;
            setIsLoading(false);
        };
        loadAddresses();
    }, []);

    // Check for new address when addresses array changes (after coming back from Add Location)
    useEffect(() => {
        // Only check if user navigated to add location
        if (!hasNavigatedToAddLocationRef.current) {
            // Update previous count for tracking
            if (addresses.length !== previousAddressCountRef.current) {
                previousAddressCountRef.current = addresses.length;
            }
            return;
        }

        // Check if addresses count increased (new address added)
        if (addresses.length > previousAddressCountRef.current) {
            // Reset the flag
            hasNavigatedToAddLocationRef.current = false;

            // Refresh addresses to get the latest data
            refreshAddresses().then(() => {
                const updatedAddresses = useAddressStore.getState().addresses;

                // Find the newly added address (default address or newest)
                const newAddress = updatedAddresses.find(addr => addr.is_default) || updatedAddresses[updatedAddresses.length - 1];

                if (newAddress) {
                    // Update selected address
                    setSelectedId(newAddress._id);
                    ignorePropUpdateRef.current = true;

                    // Call onSelectAddress to update parent
                    if (onSelectAddress) {
                        onSelectAddress(newAddress, newAddress._id);
                    }

                    // Refresh order preview with new address
                    if (onRefreshOrderPreview) {
                        onRefreshOrderPreview(newAddress._id);
                    }

                    // Close the bottom sheet
                    if (onClose) {
                        onClose();
                    }
                }

                previousAddressCountRef.current = updatedAddresses.length;
            });
        } else {
            // Addresses didn't increase, just reset flag
            hasNavigatedToAddLocationRef.current = false;
        }
    }, [addresses.length, refreshAddresses, onSelectAddress, onRefreshOrderPreview, onClose]);


    // Update selectedId when selectedAddressId prop changes
    useEffect(() => {
        // Ignore prop updates if user just manually selected an address
        if (ignorePropUpdateRef.current) {
            ignorePropUpdateRef.current = false;
            return;
        }
        if (selectedAddressId) {
            setSelectedId(selectedAddressId);
        } else if (addresses.length > 0) {
            // If no selectedAddressId provided, select the default address or first one
            const defaultAddress = addresses.find(addr => addr.is_default);
            setSelectedId(defaultAddress?._id || addresses[0]._id);
        }
    }, [selectedAddressId, addresses]);


    // Format address from Address type to display format
    const formatAddress = (addr: Address): string => {
        const parts = [
            addr.address_line1,
            addr.address_line2,
            addr.city,
            addr.state,
            addr.pincode,
        ].filter(Boolean);
        return parts.join(', ');
    };

    const handleAddLocation = () => {
        // Mark that user is navigating to add location
        hasNavigatedToAddLocationRef.current = true;
        // Navigate to ProfileLocation screen
        // @ts-ignore - route is registered in root stack
        navigation.navigate('ProfileLocation', {
            onSelect: (data: { formattedAddress: string; label?: string; is_default: boolean }) => {
                // This callback is handled by ProfileLocation after API success
            },
        });
    };

    const handleEdit = (address: Address) => {
        // Format address for ProfileLocation
        const formatAddressForEdit = (addr: Address): string => {
            const parts = [
                addr.address_line1,
                addr.address_line2,
                addr.city,
                addr.state,
                addr.pincode,
            ].filter(Boolean);
            return parts.join(', ');
        };

        // Navigate to ProfileLocation screen with edit mode
        // @ts-ignore - route is registered in root stack
        navigation.navigate('ProfileLocation', {
            isEditMode: true,
            addressId: address._id,
            addressData: {
                addressId: address._id,
                label: address.label,
                address_line1: address.address_line1,
                address_line2: address.address_line2,
                city: address.city,
                state: address.state,
                pincode: address.pincode,
                latitude: address.latitude,
                longitude: address.longitude,
                is_default: address.is_default,
                formattedAddress: formatAddressForEdit(address),
            },
        });
    };

    const handleDelete = async (address: Address) => {
        // Prevent deleting default address
        if (address.is_default) {
            Alert.alert('Cannot Delete', 'Default address cannot be deleted.');
            return;
        }

        setAddressToDelete(address);
        setShowDeleteDialog(true);
    };

    const confirmDeleteAddress = async () => {
        if (!addressToDelete) return;

        setShowDeleteDialog(false);
        const address = addressToDelete;
        setAddressToDelete(null);

        const response = await deleteAddress(address._id);
        if (response.success) {
            // If deleted address was selected, select another one
            if (selectedId === address._id) {
                const remainingAddresses = addresses.filter(addr => addr._id !== address._id);
                if (remainingAddresses.length > 0) {
                    const defaultAddr = remainingAddresses.find(addr => addr.is_default);
                    setSelectedId(defaultAddr?._id || remainingAddresses[0]._id);
                    if (onSelectAddress && defaultAddr) {
                        onSelectAddress(defaultAddr, defaultAddr._id);
                    } else if (onSelectAddress && remainingAddresses[0]) {
                        onSelectAddress(remainingAddresses[0], remainingAddresses[0]._id);
                    }
                }
            }
        }
    };

    // Get all address IDs where is_deliverable is false
    const getUnavailableAddressIds = (): Set<string> => {
        if (!distanceMap || distanceMap.length === 0) {
            return new Set();
        }
        // Check both property names for compatibility (is_deliverable from API, isdeliverable for legacy)
        const unavailableIds = distanceMap
            .filter(dm => {
                const isDeliverable = dm.is_deliverable !== undefined ? dm.is_deliverable : dm.isdeliverable;
                return isDeliverable === false;
            })
            .map(dm => dm.address_id);
        return new Set(unavailableIds);
    };

    // Check if address should be disabled (greyed out)
    const isAddressDisabled = (addressId: string): boolean => {
        // Don't disable the currently selected address
        if (selectedId === addressId || selectedAddressId === addressId) {
            return false;
        }
        const unavailableIds = getUnavailableAddressIds();
        return unavailableIds.has(addressId);
    };

    const handleSelect = async (address: Address) => {
        // Don't allow selection if address is disabled (not deliverable)
        const isDisabled = isAddressDisabled(address._id);

        if (isDisabled) {
            showErrorToast('Service not available for this location');
            return;
        }

        // Don't allow selection if already setting default for another address
        if (isSettingDefault) {
            return;
        }

        setSelectedId(address._id);
        // Mark that we should ignore the next prop update to prevent reset
        ignorePropUpdateRef.current = true;

        // If address is already default, proceed immediately without API call
        if (address.is_default) {
            if (onSelectAddress) {
                onSelectAddress(address, address._id);
            }
            if (onClose) {
                onClose();
            }
            return;
        }

        // Set loading state for setting default address
        setIsSettingDefault(true);
        setSettingDefaultAddressId(address._id);

        try {
            const editRequest: EditAddressRequest = {
                addressId: address._id,
                label: address.label,
                address_line1: address.address_line1,
                latitude: address.latitude,
                longitude: address.longitude,
                is_default: true, // Set to true to make it the default address
            };

            const response = await editAddress(editRequest);

            // Check if API call was successful
            if (response.success && response.data?.status) {
                // Success: proceed with selection
                if (onSelectAddress) {
                    onSelectAddress(address, address._id);
                }
                if (onClose) {
                    onClose();
                }
            } else {
                // API call failed but address selection still works
                const errorMessage = response.error || response.data?.message || 'Failed to set default address';
                showErrorToast(errorMessage);

                // Still proceed with selection even if setting default failed
                if (onSelectAddress) {
                    onSelectAddress(address, address._id);
                }
                if (onClose) {
                    onClose();
                }
            }
        } catch (error) {
            // Handle network errors, timeouts, etc.
            const errorMessage = error instanceof Error ? error.message : 'Network error. Please try again.';
            console.error('Failed to set default address:', error);
            showErrorToast(errorMessage);

            // Still proceed with selection even if setting default failed
            if (onSelectAddress) {
                onSelectAddress(address, address._id);
            }
            if (onClose) {
                onClose();
            }
        } finally {
            // Always reset loading state
            setIsSettingDefault(false);
            setSettingDefaultAddressId(null);
        }
    };

    return (
        <View style={styles.container}>
            {/* Title */}
            <CustomText style={styles.title}>Pickup/Delivery At</CustomText>

            {/* Add Location Button */}
            <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddLocation}
                activeOpacity={0.7}
                disabled={isSettingDefault}
            >
                <AddIcon width={20} height={20} />
                <CustomText style={styles.addButtonText}>Add Location</CustomText>
            </TouchableOpacity>

            {/* Address List */}
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {isLoading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={COLORS.THEME_GREEN} />
                    </View>
                ) : (
                    addresses.map((address) => {
                        const isDisabled = isAddressDisabled(address._id);
                        return (
                            <DeliveryAddressCard
                                key={address._id}
                                addressType={address.label || 'Other'}
                                address={formatAddress(address)}
                                isSelected={selectedId === address._id}
                                onSelect={() => handleSelect(address)}
                                onEdit={() => handleEdit(address)}
                                onDelete={() => handleDelete(address)}
                                isDeleting={isDeleting === address._id}
                                isDefault={address.is_default}
                                disabled={isDisabled || isSettingDefault}
                            />
                        );
                    })
                )}
            </ScrollView>

            {/* Loading Overlay when setting default address */}
            {isSettingDefault && (
                <View style={styles.loadingOverlay}>
                    <View style={styles.loadingContent}>
                        <ActivityIndicator size="large" color={COLORS.THEME_GREEN} />
                        <CustomText style={styles.loadingText}>Setting default address...</CustomText>
                    </View>
                </View>
            )}

            {/* Delete Address Dialog */}
            <CustomDialog
                visible={showDeleteDialog}
                title="Delete Address"
                content="Are you sure you want to delete this address?"
                onClose={() => {
                    setShowDeleteDialog(false);
                    setAddressToDelete(null);
                }}
                onConfirm={confirmDeleteAddress}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </View>
    );
};

export default ChangeAddress;

