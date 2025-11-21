import React, { useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation } from '@tanstack/react-query';
import CustomText from '../../components/Text';
import Toolbar from '../../components/Toolbar';
import CustomBtn from '../../components/CustomBtn';
import ServiceItemCard from './Components/ServiceItemCard';
import { getServicesByState, toggleServiceActive } from '../../apiService/api/profileApi';
import { ServiceByState, ToggleServiceActiveInput } from '../../apiService/types/profileTypes';
import { RootStackParamList } from '../../navigation/AppNavigator';
import styles from './styles';
import { showSuccessToast, showErrorToast } from '../../utils/Toast';

type ServicesNavProp = NativeStackNavigationProp<RootStackParamList, 'Services'>;

const ServicesScreen: React.FC = () => {
  const navigation = useNavigation<ServicesNavProp>();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Fetch services by state
  const { data: servicesData, refetch } = useQuery({
    queryKey: ['services-by-state'],
    queryFn: getServicesByState,
  });

  // Initialize selected services from verified services
  React.useEffect(() => {
    if (servicesData?.data) {
      const verifiedServiceNames = servicesData.data.verified
        .filter(service => service.is_active)
        .map(service => service.service_id);
      const unverifiedActiveServiceNames = servicesData.data.unverified
        .filter(service => service.is_active)
        .map(service => service.service_id);
      setSelectedServices([...verifiedServiceNames, ...unverifiedActiveServiceNames]);
    }
  }, [servicesData]);

  // Toggle service active mutation
  const updateMutation = useMutation({
    mutationFn: (input: ToggleServiceActiveInput) => toggleServiceActive(input),
    onSuccess: (data) => {
      showSuccessToast(data.message || 'Services updated successfully');
      refetch();
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update services';
      showErrorToast(errorMessage);
    },
  });

  const handleServiceToggle = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter(id => id !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const handleUpdate = () => {
    if (!servicesData?.data) return;

    const allServices = [...servicesData.data.verified, ...servicesData.data.unverified];

    // Filter out services in minus state
    // Minus state: unverified services where is_active && !is_approved
    // Since services in unverified array have is_approved = false, minus state is: is_active && !is_approved
    const editableServices = allServices.filter(service => {
      // Check if service is in minus state (unverified + is_active + !is_approved)
      const isMinus = !service.is_approved && service.is_active;
      // Exclude minus state services from API call
      return !isMinus;
    });

    // Build the services array for API call, excluding minus state services
    const services: ToggleServiceActiveInput['services'] = editableServices.map(service => ({
      service_id: service.service_id,
      is_active: selectedServices.includes(service.service_id),
    }));

    if (services.length === 0) {
      showErrorToast('No services to update');
      return;
    }

    updateMutation.mutate({ services });
  };

  const handleServicePress = (service: ServiceByState) => {
    // Navigate to ServiceDetail with the selected service
    // Note: ServiceDetail might expect a different format, adjust if needed
    // navigation.navigate('ServiceDetail', { service: service as any });
  };

  const verifiedServices = servicesData?.data?.verified || [];
  const unverifiedServices = servicesData?.data?.unverified || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Toolbar title="Services" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          {verifiedServices.length > 0 && (
            <>
              <CustomText style={styles.sectionTitle}>Verified</CustomText>
              <View style={styles.servicesList}>
                {verifiedServices.map(service => (
                  <ServiceItemCard
                    key={service.service_id}
                    item={service}
                    isVerified={true}
                    isSelected={selectedServices.includes(service.service_id)}
                    onToggle={handleServiceToggle}
                    onPress={handleServicePress}
                    isArrowVisible={false}
                  />
                ))}
              </View>
              <CustomText style={styles.serviceNote}>
                Note: Select the services available at your shop
              </CustomText>
            </>
          )}

          {unverifiedServices.length > 0 && (
            <>
              <CustomText style={styles.sectionTitle}>Not Verified</CustomText>
              <View style={styles.servicesList}>
                {unverifiedServices.map(service => (
                  <ServiceItemCard
                    key={service.service_id}
                    item={service}
                    isVerified={false}
                    isSelected={selectedServices.includes(service.service_id)}
                    onToggle={handleServiceToggle}
                    onPress={handleServicePress}
                    isArrowVisible={false}
                  />
                ))}
              </View>
              <CustomText style={styles.serviceNote}>
                Note: Selected services will be verified within 48 hrs
              </CustomText>
            </>
          )}
        </View>
      </ScrollView>

      <View style={styles.updateButtonContainer}>
        <CustomBtn
          title="Update"
          onPress={handleUpdate}
          disabled={updateMutation.isPending}
          loading={updateMutation.isPending}
          style={styles.updateButton}
        />
      </View>
    </SafeAreaView>
  );
};

export default ServicesScreen;
