import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import CustomText from '../../../components/Text';
import Toolbar from '../../../components/Toolbar';
import CustomBtn from '../../../components/CustomBtn';
import CustomSwitch from '../../../components/CustomSwitch';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { Service, ServiceItem } from '../../../apiService/types/profileTypes';
import styles from './style';
import RightArrowIcon from '../../../assets/auto-generated-svg-icons/ArrowRightIcon';
import SvgOfferIcon from '../../../assets/auto-generated-svg-icons/OfferIcon';
import SvgClockIcon from '../../../assets/auto-generated-svg-icons/CountownIcon';
import SvgExpressIcon from '../../../assets/auto-generated-svg-icons/ExpressIcon';
import { COLORS } from '../../../constants/colors';
import { PRICING_TYPES } from '../../../constants';
import categoryItemStyles from '../Components/style';
import PricingDialog, { OfferData, ServiceTimeData } from '../PricingDialog';
import ServiceAddedDialog from '../ServiceAddedDialog';
import SvgServiceEditIcon from '../../../assets/auto-generated-svg-icons/ServiceEditIcon';
import DiscardDialog from '../../../components/DiscardDialog';
import { useServiceForm } from './hooks/useServiceForm';
import { useServiceDialogs } from './hooks/useServiceDialogs';
import { useEditableItems } from './hooks/useEditableItems';
import { useServiceChangeDetection } from './hooks/useServiceChangeDetection';
import { useServiceDataRestore } from './hooks/useServiceDataRestore';
import { useServiceMutation } from './hooks/useServiceMutation';
import { useServiceNavigation } from './hooks/useServiceNavigation';

type ServiceDetailNavProp = NativeStackNavigationProp<
    RootStackParamList,
    'ServiceDetail'
>;
type ServiceDetailRouteProp = RouteProp<RootStackParamList, 'ServiceDetail'>;

const ServiceDetailScreen: React.FC = () => {
    const navigation = useNavigation<ServiceDetailNavProp>();
    const route = useRoute<ServiceDetailRouteProp>();
    const insets = useSafeAreaInsets();
    const { service: initialService } = route.params;

    // Refs to track navigation state
    const isNavigatingAfterSaveRef = useRef(false);
    const shouldAllowNavigationRef = useRef(false);

    // Use state to track current service (can be updated from CategoryList)
    const [service, setService] = useState<Service>(initialService);
    const [shouldPreventNavigation, setShouldPreventNavigation] = useState(false);

    // Use custom hooks
    const formState = useServiceForm(initialService);
    const dialogs = useServiceDialogs();
    const { editableItems, setEditableItems, updateItemField, justUpdatedFromCategoryListRef, previousItemsStrRef } = useEditableItems(service);

    // Change detection
    const { hasUnsavedChanges, updateInitialServiceRef, initialServiceRef } = useServiceChangeDetection({
        initialService: service,
        expressServiceEnabled: formState.expressServiceEnabled,
        offerEnabled: formState.offerEnabled,
        maxItemsPerDay: formState.maxItemsPerDay,
        serviceTimeData: formState.serviceTimeData,
        offerData: formState.offerData,
        standardPricePerKg: formState.standardPricePerKg,
        expressPricePerKg: formState.expressPricePerKg,
        editableItems,
    });

    // Data restoration
    const { isRestoringRef } = useServiceDataRestore({
        service,
        setService,
        expressServiceEnabled: formState.expressServiceEnabled,
        offerEnabled: formState.offerEnabled,
        maxItemsPerDay: formState.maxItemsPerDay,
        serviceTimeData: formState.serviceTimeData,
        offerData: formState.offerData,
        standardPricePerKg: formState.standardPricePerKg,
        expressPricePerKg: formState.expressPricePerKg,
        setExpressServiceEnabled: formState.setExpressServiceEnabled,
        setOfferEnabled: formState.setOfferEnabled,
        setMaxItemsPerDay: formState.setMaxItemsPerDay,
        setServiceTimeData: formState.setServiceTimeData,
        setOfferData: formState.setOfferData,
        setStandardPricePerKg: formState.setStandardPricePerKg,
        setExpressPricePerKg: formState.setExpressPricePerKg,
        setEditableItems,
        justUpdatedFromCategoryListRef,
        previousItemsStrRef,
    });

    // Mutation
    const { updateServicesMutation, handleConfirm } = useServiceMutation({
        service,
        expressServiceEnabled: formState.expressServiceEnabled,
        offerEnabled: formState.offerEnabled,
        maxItemsPerDay: formState.maxItemsPerDay,
        serviceTimeData: formState.serviceTimeData,
        offerData: formState.offerData,
        standardPricePerKg: formState.standardPricePerKg,
        expressPricePerKg: formState.expressPricePerKg,
        editableItems,
        setShowDialog: dialogs.setShowDialog,
        updateInitialServiceRef,
        isNavigatingAfterSaveRef,
        shouldAllowNavigationRef,
        setShouldPreventNavigation,
    });

    // Navigation
    const { handleDiscardChanges, handleCancelDiscard, handleBackPress } = useServiceNavigation({
        hasUnsavedChanges,
        shouldPreventNavigation,
        showDiscardDialog: dialogs.showDiscardDialog,
        setShowDiscardDialog: dialogs.setShowDiscardDialog,
        setShouldPreventNavigation,
        isNavigatingAfterSaveRef,
        shouldAllowNavigationRef,
        updateServicesMutationIsPending: updateServicesMutation.isPending,
        initialService,
        setExpressServiceEnabled: formState.setExpressServiceEnabled,
        setOfferEnabled: formState.setOfferEnabled,
        setMaxItemsPerDay: formState.setMaxItemsPerDay,
        setServiceTimeData: formState.setServiceTimeData,
        setOfferData: formState.setOfferData,
        setStandardPricePerKg: formState.setStandardPricePerKg,
        setExpressPricePerKg: formState.setExpressPricePerKg,
        setEditableItems,
    });

    // Update shouldPreventNavigation when changes are detected
    useEffect(() => {
        setShouldPreventNavigation(hasUnsavedChanges());
    }, [hasUnsavedChanges]);

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

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
            <Toolbar title={service?.service_name} onBackPress={handleBackPress} />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
                <View style={styles.section}>
                    <CustomText style={styles.sectionTitle}>Service Details</CustomText>

                    {/* Express Service Card */}
                    <View style={styles.toggleCard}>
                        <View style={styles.toggleCardHeader}>
                            <CustomText style={styles.toggleCardTitle}>Express Service</CustomText>
                            <CustomSwitch
                                value={formState.expressServiceEnabled}
                                onValueChange={formState.setExpressServiceEnabled}
                            />
                        </View>

                        <View style={styles.subOptionsContainer}>
                            <View style={styles.subOptionsContent}>
                                <View style={styles.subOptionRow}>
                                    <View style={styles.subOptionLeft}>
                                        <SvgClockIcon />
                                        <CustomText style={styles.subOptionText}>
                                            Standard {formState.serviceTimeData.standardTime} Hours
                                        </CustomText>
                                    </View>
                                </View>
                                <View style={styles.subOptionRow}>
                                    <View style={styles.subOptionLeft}>
                                        <SvgExpressIcon />
                                        <CustomText style={styles.subOptionText}>
                                            Express {formState.serviceTimeData.expressTime} Hours
                                        </CustomText>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => dialogs.setShowServiceTimeDialog(true)}
                            >
                                <SvgServiceEditIcon />
                                <CustomText style={styles.editText}>Edit</CustomText>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Offer Card */}
                    <View style={[styles.toggleCard, styles.offerCard]}>
                        <View style={[styles.toggleCardHeader, { backgroundColor: COLORS.OFFER_BACKGROUND, borderColor: COLORS.OFFER_BORDER }]}>
                            <CustomText style={styles.toggleCardTitle}>Offer for this service</CustomText>
                            <CustomSwitch value={formState.offerEnabled} onValueChange={formState.setOfferEnabled} />
                        </View>

                        <View style={styles.subOptionsContainer}>
                            <View style={styles.subOptionRow}>
                                <View style={styles.subOptionLeft}>
                                    <SvgOfferIcon color={COLORS.THEME_GREEN} />
                                    <CustomText style={styles.subOptionText}>
                                        Flat {formState.offerData.offerPercentage} % Off
                                    </CustomText>
                                </View>
                                <TouchableOpacity
                                    style={styles.editButton}
                                    onPress={() => dialogs.setShowOfferDialog(true)}
                                >
                                    <SvgServiceEditIcon />
                                    <CustomText style={styles.editText}>Edit</CustomText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Max Items Per Day */}
                    <View style={styles.inputSection}>
                        <CustomText style={styles.inputLabel}>
                            {service?.pricing_type === PRICING_TYPES.PER_PC ? 'Max Number Of Items Per Day' : 'Max Number of Kgs Per day'}
                        </CustomText>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                value={formState.maxItemsPerDay}
                                onChangeText={formState.setMaxItemsPerDay}
                                placeholder="0"
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
                                        <View key={index} style={{ marginBottom: 16 }}>
                                            <TouchableOpacity
                                                style={styles.categoryItem}
                                                onPress={() => {
                                                    // Create service with current editableItems merged in
                                                    // This ensures CategoryList has the latest item states
                                                    const serviceWithEditableItems = {
                                                        ...service,
                                                        items: Object.values(editableItems),
                                                        items_by_category: {
                                                            ...(service?.items_by_category || {}),
                                                            [category]: Object.values(editableItems).filter(
                                                                (item: ServiceItem) => item.category === category
                                                            ),
                                                        },
                                                    };
                                                    // Navigate to CategoryList with service and selected category
                                                    navigation.navigate('CategoryListScreen', { service: serviceWithEditableItems, category });
                                                }}
                                            >
                                                <CustomText style={styles.categoryItemText}>{category}</CustomText>
                                                <RightArrowIcon color={COLORS.INPUT_TEXT} />
                                            </TouchableOpacity>
                                            {(selected > 0) && <CustomText style={styles.categorySubtitle}>
                                                Selected Items - {selected}/{total}
                                            </CustomText>}
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                        :
                        <View>
                            <CustomText style={styles.categoryTitle}>Price</CustomText>
                            <View style={categoryItemStyles.itemCard}>
                                <CustomText style={categoryItemStyles.itemName}>1kg</CustomText>
                                <View style={[categoryItemStyles.priceRow, { marginTop: 16 }]}>
                                    <View style={categoryItemStyles.priceColumn}>
                                        <CustomText style={categoryItemStyles.priceLabel}>Standard</CustomText>
                                        <View style={categoryItemStyles.priceInputWrapper}>
                                            <CustomText style={categoryItemStyles.currencySymbol}>₹</CustomText>
                                            <TextInput
                                                style={categoryItemStyles.priceInput}
                                                value={formState.standardPricePerKg}
                                                onChangeText={formState.setStandardPricePerKg}
                                                placeholder="0"
                                                keyboardType="decimal-pad"
                                            />
                                        </View>
                                    </View>
                                    <View style={categoryItemStyles.priceColumn}>
                                        <CustomText style={categoryItemStyles.priceLabel}>Express</CustomText>
                                        <View style={categoryItemStyles.priceInputWrapper}>
                                            <CustomText style={categoryItemStyles.currencySymbol}>₹</CustomText>
                                            <TextInput
                                                style={categoryItemStyles.priceInput}
                                                value={formState.expressPricePerKg}
                                                onChangeText={formState.setExpressPricePerKg}
                                                placeholder="0"
                                                keyboardType="decimal-pad"
                                            />
                                        </View>
                                    </View>
                                </View>
                            </View>
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
                visible={dialogs.showServiceTimeDialog}
                onClose={() => dialogs.setShowServiceTimeDialog(false)}
                type="serviceTime"
                title={`${service?.service_name || 'Service'} Service Time`}
                onConfirm={(data) => {
                    formState.setServiceTimeData(data as ServiceTimeData);
                }}
                initialData={formState.serviceTimeData}
            />

            {/* Offer Dialog */}
            <PricingDialog
                visible={dialogs.showOfferDialog}
                onClose={() => dialogs.setShowOfferDialog(false)}
                type="offer"
                title={`${service?.service_name || 'Service'} Offer`}
                onConfirm={(data) => {
                    formState.setOfferData(data as OfferData);
                }}
                initialData={formState.offerData}
            />

            {/* Success Dialog */}
            <ServiceAddedDialog
                visible={dialogs.showDialog}
                onClose={() => dialogs.setShowDialog(false)}
                title={'Successfully Updated'}
                bodyText={'Your service details have been updated successfully.'}
            />

            {/* Discard Changes Dialog */}
            <DiscardDialog
                visible={dialogs.showDiscardDialog}
                onClose={handleCancelDiscard}
                title="Discard Changes?"
                subtitle="You have unsaved changes. Are you sure you want to discard them?"
                primaryButtonText="Discard"
                secondaryButtonText="Cancel"
                onPrimaryButtonPress={handleDiscardChanges}
                onSecondaryButtonPress={handleCancelDiscard}
                closable={true}
            />
        </SafeAreaView>
    );
};

export default ServiceDetailScreen;

