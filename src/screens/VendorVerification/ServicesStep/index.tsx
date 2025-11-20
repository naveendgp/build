import React, { useMemo } from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import CustomText from '../../../components/Text';
import styles from './styles';
import CheckIcon from '../../../assets/auto-generated-svg-icons/CheckIcon';
import { COLORS } from '../../../constants/colors';
import { listServices } from '../../../apiService/api/profileApi';
import { ListServicesResponse, ListServiceItem } from '../../../apiService/types/profileTypes';
import { showErrorToast } from '../../../utils/Toast';
import Loader from '../../../components/Loader';

interface ServicesStepProps {
  selectedServices: string[];
  setSelectedServices: (services: string[]) => void;
}

const ServicesStep: React.FC<ServicesStepProps> = ({
  selectedServices,
  setSelectedServices,
}) => {
  const serviceNote = useMemo(
    () => 'Note: Select the services available at your shop',
    [],
  );

  // Fetch services from API
  const { data, isLoading, error } = useQuery<
    ListServicesResponse,
    AxiosError<{ message: string }>
  >({
    queryKey: ['list-services'],
    queryFn: listServices,
  });

  // Handle error
  React.useEffect(() => {
    if (error) {
      const msg = error.response?.data?.message || error.message;
      showErrorToast(msg || 'Failed to load services');
    }
  }, [error]);

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
    </View>
  );
};

export default ServicesStep;

