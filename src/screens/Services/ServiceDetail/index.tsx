import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import RightArrowIcon from '../../../assets/auto-generated-svg-icons/RightArrowIcon';
import EditIcon from '../../../assets/auto-generated-svg-icons/EditIcon';
import TimerIcon from '../../../assets/auto-generated-svg-icons/TimerIcon';
import CheckIcon from '../../../assets/auto-generated-svg-icons/CheckIcon';
import { COLORS, FONTFAMILY } from '../../../constants/colors';

type ServiceDetailNavProp = NativeStackNavigationProp<
    RootStackParamList,
    'ServiceDetail'
>;
type ServiceDetailRouteProp = RouteProp<RootStackParamList, 'ServiceDetail'>;

const ServiceDetailScreen: React.FC = () => {
    const navigation = useNavigation<ServiceDetailNavProp>();
    const route = useRoute<ServiceDetailRouteProp>();
    const { service } = route.params;

    const [expressServiceEnabled, setExpressServiceEnabled] = useState(true);
    const [offerEnabled, setOfferEnabled] = useState(true);
    const [maxItemsPerDay, setMaxItemsPerDay] = useState<string>(
        service?.max_count_per_day?.toString() || '100',
    );

    // Get categories from service items
    const categories = service?.items_by_category
        ? Object.keys(service.items_by_category).filter(
            (cat: string) => cat && cat !== 'null' && cat !== 'undefined',
        )
        : ['Men', 'Woman', 'Kids', 'Household', 'Pet'];

    const totalItems = service?.items?.length || 0;
    const selectedItems =
        service?.items?.filter((item: ServiceItem) => item.is_active).length || 0;

    const handleConfirm = () => {
        // TODO: Implement save functionality
        console.log('Confirm service details');
        navigation.goBack();
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
                        {expressServiceEnabled && (
                            <View style={styles.subOptionsContainer}>
                                <View style={styles.subOptionRow}>
                                    <View style={styles.subOptionLeft}>
                                        <TimerIcon width={20} height={20} color={COLORS.INPUT_TEXT} />
                                        <CustomText style={styles.subOptionText}>
                                            Standard 48 Hours
                                        </CustomText>
                                    </View>
                                    <TouchableOpacity style={styles.editButton}>
                                        <CustomText style={styles.editText}>Edit</CustomText>
                                        <EditIcon width={16} height={16} color={COLORS.THEME_GREEN} />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.subOptionRow}>
                                    <View style={styles.subOptionLeft}>
                                        <CustomText style={styles.lightningIcon}>⚡</CustomText>
                                        <CustomText style={styles.subOptionText}>Express 8 hours</CustomText>
                                    </View>
                                    <TouchableOpacity style={styles.editButton}>
                                        <CustomText style={styles.editText}>Edit</CustomText>
                                        <EditIcon width={16} height={16} color={COLORS.THEME_GREEN} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Offer Card */}
                    <View style={[styles.toggleCard, styles.offerCard]}>
                        <View style={styles.toggleCardHeader}>
                            <CustomText style={styles.toggleCardTitle}>Offer for this service</CustomText>
                            <CustomSwitch value={offerEnabled} onValueChange={setOfferEnabled} />
                        </View>
                        {offerEnabled && (
                            <View style={styles.subOptionsContainer}>
                                <View style={styles.subOptionRow}>
                                    <View style={styles.subOptionLeft}>
                                        <CheckIcon width={20} height={20} color={COLORS.THEME_GREEN} />
                                        <CustomText style={styles.subOptionText}>Flat 50 % Off</CustomText>
                                    </View>
                                    <TouchableOpacity style={styles.editButton}>
                                        <CustomText style={styles.editText}>Edit</CustomText>
                                        <EditIcon width={16} height={16} color={COLORS.THEME_GREEN} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
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

                    {/* Category Section */}
                    <View style={styles.categorySection}>
                        <CustomText style={styles.categoryTitle}>Category</CustomText>
                        <CustomText style={styles.categorySubtitle}>
                            Selected Items - {selectedItems}/{totalItems}
                        </CustomText>

                        <View style={styles.categoryList}>
                            {categories.map((category, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.categoryItem}
                                    onPress={() => {
                                        // Navigate to CategoryList (ShopList) with service
                                        navigation.navigate('CategoryListScreen', { service });
                                    }}
                                >
                                    <CustomText style={styles.categoryItemText}>{category}</CustomText>
                                    <RightArrowIcon width={20} height={20} color={COLORS.INPUT_TEXT} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <CustomBtn title="Confirm" onPress={handleConfirm} />
            </View>
        </SafeAreaView>
    );
};

export default ServiceDetailScreen;

