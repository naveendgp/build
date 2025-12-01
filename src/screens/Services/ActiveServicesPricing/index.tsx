import React, { useCallback, useMemo } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import CustomText from '../../../components/Text';
import Toolbar from '../../../components/Toolbar';
import ErrorScreen from '../../../components/ErrorScreen';
import ServiceItemCard from '../Components/ServiceItemCard';
import { getServicesByState, getProfile } from '../../../apiService/api/profileApi';
import { ServiceByState, Service } from '../../../apiService/types/profileTypes';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useProfileStore } from '../../../apiService/store/useProfileStore';
import { COLORS } from '../../../constants/colors';
import styles from '../styles';

type ActiveServicesPricingNavProp = NativeStackNavigationProp<RootStackParamList, 'ServicesPricing'>;

const ActiveServicesPricingScreen: React.FC = () => {
    const navigation = useNavigation<ActiveServicesPricingNavProp>();
    const { profile } = useProfileStore();

    // Fetch services by state
    const { data: servicesData, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['services-by-state'],
        queryFn: getServicesByState,
        enabled: false
    });

    useFocusEffect(useCallback(() => {
        refetch();
    }, []));

    // Get only active services (is_active = true)
    const activeServices = useMemo(() => {
        if (!servicesData?.data) return [];

        const verifiedActive = servicesData.data.verified.filter(service => service.is_active);

        return [...verifiedActive];
    }, [servicesData]);

    // Calculate selected items count
    const selectedItemsCount = useMemo(() => {
        if (!servicesData?.data) return { selected: 0, total: 0 };

        // Count active services (selected)
        const selected = activeServices.length;

        // Count total services (all verified + all unverified)
        const total = (servicesData.data.verified.length || 0) + (servicesData.data.unverified.length || 0);

        return { selected, total };
    }, [servicesData, activeServices]);

    const handleServicePress = (service: ServiceByState) => {
        // Find the full service data from profile's services_offered
        const fullService = profile?.services_offered?.find(
            (s: Service) => s.service_name === service.service_name
        );

        if (fullService) {
            // Navigate with full service data
            navigation.navigate('ServiceDetail', {
                service: fullService
            });
        } else {
            // Fallback: create a minimal service object
            navigation.navigate('ServiceDetail', {
                service: {
                    service_name: service.service_name,
                    image_url: service.image_url,
                    pricing_type: service.pricing_type,
                    max_count_per_day: service.max_count_per_day,
                    service_description: service.service_description,
                    items: [],
                    items_by_category: {},
                    offer_percentage: service.offer_percentage,
                    offer_max_cap: service.offer_max_cap,
                    express_time: service.express_time,
                    standard_time: service.standard_time,
                    is_express_available: service.is_express_available,
                    is_offer: service.is_offer,
                    is_active: service.is_active,
                    _id: service.service_id,
                } as any
            });
        }
    };

    // Dummy toggle handler (not used in this screen, but required by ServiceItemCard)
    const handleServiceToggle = () => {
        // No-op: services are not toggleable in this screen
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Toolbar title="Item Pricing & Offer Details" />

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.THEME_GREEN} />
                </View>
            ) : isError ? (
                <ErrorScreen
                    title="Something went wrong"
                    subtitle="Please check After sometime and try again."
                    onRetry={() => refetch()}
                    retryButtonText="Retry"
                />
            ) : (
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.section}>
                        <View style={styles.servicesList}>
                            {activeServices.map(service => {
                                const isVerified = servicesData?.data?.verified.some(
                                    v => v.service_id === service.service_id
                                ) || false;

                                return (
                                    <ServiceItemCard
                                        key={service.service_id}
                                        item={service}
                                        isVerified={isVerified}
                                        isSelected={service.is_active}
                                        onToggle={handleServiceToggle}
                                        onPress={handleServicePress}
                                        isArrowVisible={true}
                                        showCheckbox={false}
                                        showItemsCount={service.active_items_count > 0}
                                    />
                                );
                            })}
                        </View>
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

export default ActiveServicesPricingScreen;

