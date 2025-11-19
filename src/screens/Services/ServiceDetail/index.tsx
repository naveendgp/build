import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import CustomText from '../../../components/Text';
import Toolbar from '../../../components/Toolbar';
import CustomBtn from '../../../components/CustomBtn';
import CustomSwitch from '../../../components/CustomSwitch';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { ItemsByCategory, Service, ServiceItem, UpdateServiceInput, UpdateServicesResponse } from '../../../apiService/types/profileTypes';
import { ErrorResponse } from '../../../apiService/types/authTypes';
import { updateServicesOffered } from '../../../apiService/api/profileApi';
import { useProfileStore } from '../../../apiService/store/useProfileStore';
import { useServiceDataStore } from '../../../apiService/store/useServiceDataStore';
import styles from './style';
import RightArrowIcon from '../../../assets/auto-generated-svg-icons/RightArrowIcon';
import EditIcon from '../../../assets/auto-generated-svg-icons/EditIcon';
import TimerIcon from '../../../assets/auto-generated-svg-icons/TimerIcon';
import CheckIcon from '../../../assets/auto-generated-svg-icons/CheckIcon';
import { COLORS, FONTFAMILY } from '../../../constants/colors';
import { PRICING_TYPES } from '../../../constants';
import { showSuccessToast, showErrorToast } from '../../../utils/Toast';
import ServiceItemCard from '../Components';
import PricingDialog, { OfferData, ServiceTimeData } from '../PricingDialog';
import ServiceAddedDialog from '../ServiceAddedDialog';

type ServiceDetailNavProp = NativeStackNavigationProp<
    RootStackParamList,
    'ServiceDetail'
>;
type ServiceDetailRouteProp = RouteProp<RootStackParamList, 'ServiceDetail'>;

const ServiceDetailScreen: React.FC = () => {
    const navigation = useNavigation<ServiceDetailNavProp>();
    const route = useRoute<ServiceDetailRouteProp>();
    const { service: initialService } = route.params;
    const queryClient = useQueryClient();
    const { refreshProfile } = useProfileStore();
    const { updatedService, clearUpdatedService } = useServiceDataStore();

    // Use state to track current service (can be updated from CategoryList)
    const [service, setService] = useState<Service>(initialService);

    const [expressServiceEnabled, setExpressServiceEnabled] = useState<boolean>(
        initialService?.is_express_available ?? true,
    );
    const [offerEnabled, setOfferEnabled] = useState<boolean>(
        initialService?.is_offer ?? true,
    );
    const [maxItemsPerDay, setMaxItemsPerDay] = useState<string>(
        initialService?.max_count_per_day?.toString() || '100',
    );
    const [editableItems, setEditableItems] = useState<{
        [key: string]: ServiceItem;
    }>({});

    // Dialog states
    const [showServiceTimeDialog, setShowServiceTimeDialog] = useState(false);
    const [showOfferDialog, setShowOfferDialog] = useState(false);
    const [showDialog, setShowDialog] = useState(false);

    // Service time and offer data - initialize from service with defaults
    const [serviceTimeData, setServiceTimeData] = useState<ServiceTimeData>({
        standardTime: initialService?.standard_time ?? 48,
        expressTime: initialService?.express_time ?? 8,
    });
    const [offerData, setOfferData] = useState<OfferData>({
        offerPercentage: initialService?.offer_percentage ?? 50,
        maxCap: initialService?.offer_max_cap ?? 100,
    });

    // Update service when coming back from CategoryList (only for PER_PC)
    useFocusEffect(
        React.useCallback(() => {
            // Only handle updates for PER_PC pricing type
            if (service?.pricing_type !== PRICING_TYPES.PER_PC) {
                return;
            }

            // Check if there's updated service data from CategoryList
            if (updatedService && updatedService.service_name === service.service_name) {
                // Check if items have changed
                const itemsChanged = JSON.stringify(updatedService.items) !== JSON.stringify(service.items);
                if (itemsChanged) {
                    console.log('📦 Updated service data from CategoryList:', {
                        serviceName: updatedService.service_name,
                        items: updatedService.items,
                        itemsCount: updatedService.items?.length || 0,
                        selectedItems: updatedService.items?.filter((item: ServiceItem) => item.is_active).length || 0,
                    });
                    setService(updatedService);
                    // Clear the temporary store after using it
                    clearUpdatedService();
                }
            }
        }, [updatedService, service, clearUpdatedService]),
    );

    // Update state when service changes (including when updated from CategoryList or refreshed)
    useEffect(() => {
        if (service) {
            // Update express service toggle
            if (service.is_express_available !== undefined) {
                setExpressServiceEnabled(service.is_express_available);
            }
            // Update offer toggle
            if (service.is_offer !== undefined) {
                setOfferEnabled(service.is_offer);
            }
            // Update max items per day
            if (service.max_count_per_day !== undefined) {
                setMaxItemsPerDay(service.max_count_per_day.toString());
            }
            // Update service time data
            if (service.standard_time !== undefined || service.express_time !== undefined) {
                setServiceTimeData({
                    standardTime: service.standard_time ?? 48,
                    expressTime: service.express_time ?? 8,
                });
            }
            // Update offer data
            if (service.offer_percentage !== undefined || service.offer_max_cap !== undefined) {
                setOfferData({
                    offerPercentage: service.offer_percentage ?? 50,
                    maxCap: service.offer_max_cap ?? 100,
                });
            }
        }
    }, [service]);

    // Initialize editable items from service items
    useEffect(() => {
        const items: { [key: string]: ServiceItem } = {};
        // Handle items_by_category structure
        if (service?.items_by_category) {
            Object.values(service.items_by_category)
                .flat()
                .forEach((item: ServiceItem) => {
                    const itemKey = `${item.item_name}_${item.category}`;
                    items[itemKey] = { ...item };
                });
        } else if (service?.items) {
            // Fallback to items array if items_by_category is not available
            service.items.forEach((item: ServiceItem) => {
                const itemKey = `${item.item_name}_${item.category}`;
                items[itemKey] = { ...item };
            });
        }
        setEditableItems(items);
    }, [service]);

    const updateItemField = (
        itemKey: string,
        field: keyof ServiceItem,
        value: any,
    ) => {
        setEditableItems(prev => ({
            ...prev,
            [itemKey]: {
                ...prev[itemKey],
                [field]: value,
            },
        }));
    };

    // Get categories from service items
    const categories = service?.items_by_category
        ? Object.keys(service.items_by_category).filter(
            (cat: string) => cat && cat !== 'null' && cat !== 'undefined',
        )
        : ['Men', 'Woman', 'Kids', 'Household', 'Pet'];

    // Helper function to get selected items count for a specific category
    const getCategoryItemCounts = (categoryName: string) => {
        const categoryItems = Object.values(editableItems).filter(
            (item: ServiceItem) => item.category === categoryName,
        );
        const total = categoryItems.length;
        const selected = categoryItems.filter((item: ServiceItem) => item.is_active).length;
        return { total, selected };
    };

    // React Query mutation for updating services
    const updateServicesMutation = useMutation<
        UpdateServicesResponse,
        AxiosError<ErrorResponse>,
        UpdateServiceInput
    >({
        mutationFn: updateServicesOffered,
        onSuccess: async () => {
            // Refresh profile
            await refreshProfile();
            queryClient.invalidateQueries({ queryKey: ['profile'] });

            // Show success dialog for 1 second
            setShowDialog(true);
            setTimeout(() => {
                setShowDialog(false);
                navigation.goBack();
            }, 1000);
        },
        onError: (error: AxiosError<ErrorResponse>) => {
            console.error('Error updating service:', error);
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                'Failed to update service. Please try again.';
            showErrorToast(errorMessage);
        },
    });

    const convertToApiFormat = (): UpdateServiceInput => {
        // Use editableItems which contains all items (from all categories for PER_PC, or direct edits for PER_KG)
        const allItems: ServiceItem[] = Object.values(editableItems);

        console.log('📤 Converting to API format:', {
            pricingType: service?.pricing_type,
            editableItemsCount: allItems.length,
            selectedItems: allItems.filter(item => item.is_active).length,
            items: allItems.map(item => ({
                name: item.item_name,
                category: item.category,
                is_active: item.is_active,
                item_price: item.item_price,
                express_price: item.express_price,
            })),
        });

        const apiInput: UpdateServiceInput = {
            service: {
                service_id: (service as any)?._id || (service as any)?.service_id || '',
                service_name: service?.service_name || '',
                max_count_per_day: parseInt(maxItemsPerDay) || service?.max_count_per_day || 0,
                is_express: expressServiceEnabled,
                is_offer: offerEnabled,
                offer_max_cap: offerData.maxCap || 0,
                offer_percentage: offerData.offerPercentage || 0,
                express_time: serviceTimeData.expressTime || 0,
                standard_time: serviceTimeData.standardTime || 0,
                items: allItems.map(item => ({
                    item_name: item.item_name,
                    item_price: item.item_price,
                    item_category: item.category,
                    express_price: item.express_price,
                    discount_percentage: item.discount_percentage,
                    is_active: item.is_active,
                })),
            },
        };

        console.log('📤 API Payload:', JSON.stringify(apiInput, null, 2));

        return apiInput;
    };

    const handleConfirm = () => {
        const apiInput = convertToApiFormat();
        updateServicesMutation.mutate(apiInput);
    };


    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Toolbar title={service?.service_name || 'Service Details'} />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <CustomText style={styles.sectionTitle}>Service Details</CustomText>

                    {/* Express Service Card */}
                    <View style={styles.toggleCard}>
                        <View style={styles.toggleCardHeader}>
                            <CustomText style={styles.toggleCardTitle}>Express Service</CustomText>
                            <CustomSwitch
                                value={expressServiceEnabled}
                                onValueChange={setExpressServiceEnabled}
                            />
                        </View>

                        <View style={styles.subOptionsContainer}>
                            <View style={styles.subOptionsContent}>
                                <View style={styles.subOptionRow}>
                                    <View style={styles.subOptionLeft}>
                                        <TimerIcon width={20} height={20} color={COLORS.INPUT_TEXT} />
                                        <CustomText style={styles.subOptionText}>
                                            Standard {serviceTimeData.standardTime} Hours
                                        </CustomText>
                                    </View>
                                </View>
                                <View style={styles.subOptionRow}>
                                    <View style={styles.subOptionLeft}>
                                        <TimerIcon width={20} height={20} color={COLORS.INPUT_TEXT} />
                                        <CustomText style={styles.subOptionText}>
                                            Express {serviceTimeData.expressTime} Hours
                                        </CustomText>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => setShowServiceTimeDialog(true)}
                            >
                                <EditIcon width={16} height={16} color={COLORS.THEME_GREEN} />

                                <CustomText style={styles.editText}>Edit</CustomText>
                            </TouchableOpacity>
                        </View>

                    </View>

                    {/* Offer Card */}
                    <View style={[styles.toggleCard, styles.offerCard]}>
                        <View style={[styles.toggleCardHeader, { backgroundColor: COLORS.OFFER_BACKGROUND, borderColor: COLORS.OFFER_BORDER }]}>
                            <CustomText style={styles.toggleCardTitle}>Offer for this service</CustomText>
                            <CustomSwitch value={offerEnabled} onValueChange={setOfferEnabled} />
                        </View>

                        <View style={styles.subOptionsContainer}>
                            <View style={styles.subOptionRow}>
                                <View style={styles.subOptionLeft}>
                                    <CheckIcon width={20} height={20} color={COLORS.THEME_GREEN} />
                                    <CustomText style={styles.subOptionText}>
                                        Flat {offerData.offerPercentage} % Off
                                    </CustomText>
                                </View>
                                <TouchableOpacity
                                    style={styles.editButton}
                                    onPress={() => setShowOfferDialog(true)}
                                >
                                    <CustomText style={styles.editText}>Edit</CustomText>
                                    <EditIcon width={16} height={16} color={COLORS.THEME_GREEN} />
                                </TouchableOpacity>
                            </View>
                        </View>

                    </View>

                    {/* Max Items Per Day */}
                    <View style={styles.inputSection}>
                        <CustomText style={styles.inputLabel}>
                            Max Number Of Items Per Day
                        </CustomText>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                value={maxItemsPerDay}
                                onChangeText={setMaxItemsPerDay}
                                placeholder="100 Items"
                                keyboardType="number-pad"
                                placeholderTextColor={COLORS.LOGIN_SUBTITLE}
                            />
                        </View>
                        <CustomText style={styles.inputNote}>
                            Note: This will be the max number of items you will be receiving for this
                            service
                        </CustomText>
                    </View>

                    {service?.pricing_type === PRICING_TYPES.PER_PC
                        ?
                        <View style={styles.categorySection}>
                            <CustomText style={styles.categoryTitle}>Category</CustomText>


                            <View style={styles.categoryList}>
                                {categories.map((category, index) => {
                                    const { total, selected } = getCategoryItemCounts(category);
                                    return (
                                        <View key={index}>
                                            <TouchableOpacity
                                                style={styles.categoryItem}
                                                onPress={() => {
                                                    // Navigate to CategoryList with service and selected category
                                                    navigation.navigate('CategoryListScreen', { service, category });
                                                }}
                                            >
                                                <CustomText style={styles.categoryItemText}>{category}</CustomText>
                                                <RightArrowIcon width={24} height={24} color={COLORS.INPUT_TEXT} />
                                            </TouchableOpacity>
                                            <CustomText style={styles.categorySubtitle}>
                                                Selected Items - {selected}/{total}
                                            </CustomText>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                        :
                        <View>
                            <CustomText style={styles.categoryTitle}>Price</CustomText>

                            {service?.items_by_category &&
                                Object.values(service.items_by_category)
                                    .flat()
                                    .map((item: ServiceItem, index: number) => {
                                        const itemKey = `${item.item_name}_${item.category}`;
                                        const editableItem = editableItems[itemKey] || item;
                                        return (
                                            <ServiceItemCard
                                                key={`${item.item_name}_${item.category}_${index}`}
                                                item={item}
                                                editableItem={editableItem}
                                                onUpdateField={(field, value) => {
                                                    updateItemField(itemKey, field, value);
                                                }}
                                            />
                                        );
                                    })}

                            <CustomText style={[styles.inputNote, { marginBottom: 24 }]}>Note: Clothes will be weighed during pickup and the bill will be generated accordingly.</CustomText>
                        </View>

                    }


                    <CustomBtn
                        title={updateServicesMutation.isPending ? 'Saving...' : 'Confirm'}
                        onPress={handleConfirm}
                        disabled={updateServicesMutation.isPending}
                        style={styles.confirmButton}
                        textStyle={styles.continueText}
                    />
                </View>
            </ScrollView>

            {/* Service Time Dialog */}
            <PricingDialog
                visible={showServiceTimeDialog}
                onClose={() => setShowServiceTimeDialog(false)}
                type="serviceTime"
                title={`${service?.service_name || 'Service'} Service Time`}
                onConfirm={(data) => {
                    setServiceTimeData(data as ServiceTimeData);
                }}
                initialData={serviceTimeData}
            />

            {/* Offer Dialog */}
            <PricingDialog
                visible={showOfferDialog}
                onClose={() => setShowOfferDialog(false)}
                type="offer"
                title={`${service?.service_name || 'Service'} Offer`}
                onConfirm={(data) => {
                    setOfferData(data as OfferData);
                }}
                initialData={offerData}
            />

            <ServiceAddedDialog
                visible={showDialog}
                onClose={() => setShowDialog(false)}
            />
        </SafeAreaView>
    );
};

export default ServiceDetailScreen;

