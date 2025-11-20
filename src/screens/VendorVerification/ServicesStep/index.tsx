import React, { useMemo, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import CustomText from '../../../components/Text';
import styles from './styles';
import CheckIcon from '../../../assets/auto-generated-svg-icons/CheckIcon';
import { COLORS } from '../../../constants/colors';
import { listServices, getProfile } from '../../../apiService/api/profileApi';
import { ListServicesResponse, ListServiceItem, Service } from '../../../apiService/types/profileTypes';
import { showErrorToast } from '../../../utils/Toast';
import Loader from '../../../components/Loader';

interface ServicesStepProps {
  selectedServices: string[];
  setSelectedServices: (services: string[]) => void;
  error?: string;
  isReupload?: boolean;
}

const ServicesStep: React.FC<ServicesStepProps> = ({
  selectedServices,
  setSelectedServices,
  error: validationError,
  isReupload = false,
}) => {
  const serviceNote = useMemo(
    () => 'Note: Select the services available at your shop',
    [],
  );

  // Fetch services from API
  const { data, isLoading, error: queryError } = useQuery<
    ListServicesResponse,
    AxiosError<{ message: string }>
  >({
    queryKey: ['list-services'],
    queryFn: listServices,
  });

  // Fetch profile data when isReupload is true to compare services
  const { data: profileData } = useQuery({
    queryKey: ['vendor-profile'],
    queryFn: async () => {
      const response = await getProfile();
      return response.data;
    },
    enabled: isReupload,
  });

  // Handle error
  React.useEffect(() => {
    if (queryError) {
      const msg = queryError.response?.data?.message || queryError.message;
      showErrorToast(msg || 'Failed to load services');
    }
  }, [queryError]);

  // Track if we've initialized from profile data
  const hasInitializedFromProfile = useRef(false);

  // Compare services_offered with listServices and set selected services
  useEffect(() => {
    if (isReupload && profileData && data?.data && !hasInitializedFromProfile.current) {
      const allServices = data.data;
      const servicesOffered = profileData.services_offered || [];
      
      // Create a map of service names from services_offered for quick lookup
      const servicesOfferedMap = new Map<string, Service>();
      servicesOffered.forEach(service => {
        servicesOfferedMap.set(service.service_name, service);
      });

      // Determine which services should be selected
      // A service is selected if:
      // 1. It exists in services_offered AND
      // 2. is_active is true
      // Otherwise, it's unchecked (if is_active is false or service not in services_offered)
      const selectedServiceNames = allServices
        .filter(listService => {
          const offeredService = servicesOfferedMap.get(listService.service_name);
          if (offeredService) {
            // Service exists in services_offered
            // Check if is_active is true
            // If is_active is false, consider it unchecked
            return offeredService.is_active === true;
          }
          // Service not in services_offered, so unchecked
          return false;
        })
        .map(service => service.service_name);

      setSelectedServices(selectedServiceNames);
      hasInitializedFromProfile.current = true;
    }
  }, [isReupload, profileData, data, setSelectedServices]);

  const handleServiceToggle = (serviceName: string) => {
    if (selectedServices.includes(serviceName)) {
      setSelectedServices(selectedServices.filter(name => name !== serviceName));
    } else {
      setSelectedServices([...selectedServices, serviceName]);
    }
  };

  const renderServiceItem = (service: ListServiceItem) => {
    const isSelected = selectedServices.includes(service.service_name);

    return (
      <TouchableOpacity
        key={service._id}
        activeOpacity={0.9}
        style={[
          styles.serviceOptionCard,
          isSelected && styles.serviceOptionCardSelected,
        ]}
        onPress={() => handleServiceToggle(service.service_name)}
      >
        <View style={styles.serviceOptionLeft}>
          <View
            style={[
              styles.serviceCheckbox,
              isSelected && styles.serviceCheckboxSelected,
            ]}
          >
            {isSelected && <CheckIcon width={16} height={16} color={COLORS.WHITE} />}
          </View>
          <CustomText
            style={[
              styles.serviceOptionName,
              isSelected && styles.serviceOptionNameSelected,
            ]}
          >
            {service.service_name}
          </CustomText>
        </View>

        <View style={styles.serviceOptionRight}>
          {service.image_url ? (
            <Image
              source={{ uri: service.image_url }}
              style={styles.serviceImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.serviceImagePlaceholder} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Loader />
      </View>
    );
  }

  const services = data?.data || [];

  return (
    <View style={styles.container}>
      <View style={styles.servicesList}>
        {services.length > 0 ? (
          services.map(renderServiceItem)
        ) : (
          <CustomText style={styles.serviceNote}>
            No services available
          </CustomText>
        )}
      </View>

      <CustomText style={styles.serviceNote}>{serviceNote}</CustomText>
      {validationError ? (
        <CustomText style={styles.errorText}>
          {validationError}
        </CustomText>
      ) : null}
    </View>
  );
};

export default ServicesStep;

