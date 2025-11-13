import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomText from '../../components/Text';
import styles from './styles';
import { useProfileStore } from '../../apiService/store/useProfileStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import CustomBtn from '../../components/CustomBtn';
import {
  VendorProfile,
  OperatingHoursInput,
} from '../../apiService/types/profileTypes';
import Toolbar from '../../components/Toolbar';
import { useMutation } from '@tanstack/react-query';
import { updateOperatingHours } from '../../apiService/api/profileApi';
import CustomToast from '../../components/CustomToast';
import { showErrorToast, showSuccessToast } from '../../utils/Toast';

type ShopStatusNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'ShopStatus'
>;

interface BusinessHours {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

const ShopStatusScreen: React.FC = () => {
  const navigation = useNavigation<ShopStatusNavProp>();
  const { profile, refreshProfile } = useProfileStore();

  // Helper function to convert profile operating hours to BusinessHours format
  const getInitialBusinessHours = (): BusinessHours[] => {
    const days = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];

    return days.map(day => {
      const dayKey = day.toLowerCase();
      const operatingHours = profile?.operating_hours?.[dayKey];

      if (operatingHours) {
        return {
          day,
          isOpen: true,
          openTime: operatingHours.open,
          closeTime: operatingHours.close,
        };
      }

      // Default values if no operating hours found
      return {
        day,
        isOpen: false,
        openTime: '09:00',
        closeTime: '21:00',
      };
    });
  };

  const [businessHours, setBusinessHours] = useState<BusinessHours[]>(
    getInitialBusinessHours(),
  );

  // Update business hours when profile changes
  useEffect(() => {
    setBusinessHours(getInitialBusinessHours());
  }, [profile?.operating_hours]);

  const [selectedDay, setSelectedDay] = useState<string>('');
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [timeType, setTimeType] = useState<'open' | 'close'>('open');

  const updateOperatingHoursMutation = useMutation({
    mutationFn: updateOperatingHours,
    onSuccess: async data => {
      showSuccessToast(data.message);
      await refreshProfile(); // Refresh profile data
      navigation.goBack();
    },
    onError: (error: any) => {
      showErrorToast(
        error?.response?.data?.message || 'Failed to update operating hours',
      );
    },
  });

  const handleSave = () => {
    // Filter out disabled days and create the API payload
    const operatingHoursPayload: OperatingHoursInput = {};

    businessHours.forEach(dayHours => {
      if (dayHours.isOpen) {
        // Convert day name to lowercase for API
        const dayKey = dayHours.day.toLowerCase();
        operatingHoursPayload[dayKey] = {
          open: dayHours.openTime,
          close: dayHours.closeTime,
        };
      }
    });

    // Call the API mutation
    updateOperatingHoursMutation.mutate(operatingHoursPayload);
  };

  const toggleDayStatus = (day: string) => {
    setBusinessHours(prev =>
      prev.map(hour =>
        hour.day === day ? { ...hour, isOpen: !hour.isOpen } : hour,
      ),
    );
  };

  const openTimeModal = (day: string, type: 'open' | 'close') => {
    setSelectedDay(day);
    setTimeType(type);
    setTimeModalVisible(true);
  };

  const updateTime = (day: string, type: 'open' | 'close', time: string) => {
    setBusinessHours(prev =>
      prev.map(hour =>
        hour.day === day
          ? { ...hour, [type === 'open' ? 'openTime' : 'closeTime']: time }
          : hour,
      ),
    );
    setTimeModalVisible(false);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#34C759';
      case 'close':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Open';
      case 'close':
        return 'Closed';
      default:
        return 'Unknown';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Toolbar title="Shop Status" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>Current Status</CustomText>

          <View style={styles.statusCard}>
            <View style={styles.statusInfo}>
              <CustomText style={styles.statusLabel}>Shop Status</CustomText>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: getStatusColor(
                      profile?.shop_status?.status || '',
                    ),
                  },
                ]}
              >
                <CustomText style={styles.statusText}>
                  {getStatusText(profile?.shop_status?.status || '')}
                </CustomText>
              </View>
            </View>

            <View style={styles.switchRow}>
              <CustomText style={styles.switchLabel}>
                Toggle Shop Status
              </CustomText>
              <Switch
                value={profile?.shop_status?.status === 'open'}
                onValueChange={() => {}}
                trackColor={{ false: '#E0E0E0', true: '#1B2A4A' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>Business Hours</CustomText>

          {businessHours.map((dayHours, index) => (
            <View key={dayHours.day} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <CustomText style={styles.dayName}>{dayHours.day}</CustomText>
                <Switch
                  value={dayHours.isOpen}
                  onValueChange={() => toggleDayStatus(dayHours.day)}
                  trackColor={{ false: '#E0E0E0', true: '#1B2A4A' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {dayHours.isOpen && (
                <View style={styles.timeRow}>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => openTimeModal(dayHours.day, 'open')}
                  >
                    <CustomText style={styles.timeLabel}>Open</CustomText>
                    <CustomText style={styles.timeValue}>
                      {formatTime(dayHours.openTime)}
                    </CustomText>
                  </TouchableOpacity>

                  <CustomText style={styles.timeSeparator}>-</CustomText>

                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => openTimeModal(dayHours.day, 'close')}
                  >
                    <CustomText style={styles.timeLabel}>Close</CustomText>
                    <CustomText style={styles.timeValue}>
                      {formatTime(dayHours.closeTime)}
                    </CustomText>
                  </TouchableOpacity>
                </View>
              )}

              {!dayHours.isOpen && (
                <CustomText style={styles.closedText}>Closed</CustomText>
              )}
            </View>
          ))}
        </View>

        <CustomBtn
          title="Update Business Hours"
          onPress={handleSave}
          loading={updateOperatingHoursMutation.isPending}
        />
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal
        visible={timeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTimeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <CustomText style={styles.modalTitle}>
              Select {timeType === 'open' ? 'Opening' : 'Closing'} Time for{' '}
              {selectedDay}
            </CustomText>

            <ScrollView
              style={styles.timePickerContainer}
              showsVerticalScrollIndicator={true}
              bounces={false}
              contentContainerStyle={{ paddingBottom: 10 }}
            >
              {Array.from({ length: 24 }, (_, hour) => (
                <View key={hour} style={styles.hourRow}>
                  {Array.from({ length: 4 }, (_, quarter) => {
                    const minutes = quarter * 15;
                    const timeString = `${hour
                      .toString()
                      .padStart(2, '0')}:${minutes
                      .toString()
                      .padStart(2, '0')}`;
                    const isSelected =
                      businessHours.find(h => h.day === selectedDay)?.[
                        timeType === 'open' ? 'openTime' : 'closeTime'
                      ] === timeString;

                    return (
                      <TouchableOpacity
                        key={quarter}
                        style={[
                          styles.timeOption,
                          isSelected && styles.selectedTimeOption,
                        ]}
                        onPress={() =>
                          updateTime(selectedDay, timeType, timeString)
                        }
                      >
                        <CustomText
                          style={[
                            styles.timeOptionText,
                            isSelected && styles.selectedTimeOptionText,
                          ]}
                        >
                          {formatTime(timeString)}
                        </CustomText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setTimeModalVisible(false)}
            >
              <CustomText style={styles.closeButtonText}>Close</CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ShopStatusScreen;
