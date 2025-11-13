import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import CustomText from '../../components/Text';
import Toolbar from '../../components/Toolbar';
import CustomBtn from '../../components/CustomBtn';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import {
  Service,
  ServiceItem,
  UpdateServiceInput,
  UpdateServicesResponse,
} from '../../apiService/types/profileTypes';
import { ErrorResponse } from '../../apiService/types/authTypes';
import { updateServicesOffered } from '../../apiService/api/profileApi';
import styles from './styles';

type ShopListNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'ShopList'
>;
type ShopListRouteProp = RouteProp<RootStackParamList, 'ShopList'>;

const ShopListScreen: React.FC = () => {
  const navigation = useNavigation<ShopListNavProp>();
  const route = useRoute<ShopListRouteProp>();
  const { service } = route.params;
  const queryClient = useQueryClient();

  // Direct state management - no hooks
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [editableItems, setEditableItems] = useState<{
    [key: string]: ServiceItem;
  }>({});
  const [maxCountPerDay, setMaxCountPerDay] = useState<number>(
    service?.max_count_per_day || 0,
  );
  const [originalMaxCount, setOriginalMaxCount] = useState<number>(
    service?.max_count_per_day || 0,
  );
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // React Query mutation for updating services
  const updateServicesMutation = useMutation<
    UpdateServicesResponse,
    AxiosError<ErrorResponse>,
    UpdateServiceInput
  >({
    mutationFn: updateServicesOffered,
    onSuccess: (response: UpdateServicesResponse) => {
      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      Alert.alert(
        'Success',
        response.message || 'Service updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      console.error('Error updating service:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to update service. Please try again.';
      Alert.alert('Error', errorMessage);
    },
  });

  useEffect(() => {
    console.log('Service data:', service);
    console.log('Items by category:', service?.items_by_category);

    if (service?.items_by_category) {
      const allKeys = Object.keys(service.items_by_category);
      console.log('All category keys:', allKeys);

      // Show all categories including undefined ones
      const categoryKeys = allKeys.filter(key => key !== null);
      console.log('All category keys (including undefined):', categoryKeys);

      // Initialize editable items
      const items: { [key: string]: ServiceItem } = {};
      Object.values(service.items_by_category).forEach(categoryItems => {
        (categoryItems as ServiceItem[]).forEach((item: ServiceItem) => {
          const itemKey = `${item.item_name}_${item.category}`;
          items[itemKey] = { ...item };
        });
      });
      setEditableItems(items);

      // If we have categories, use them; otherwise just show Others
      if (categoryKeys.length > 0) {
        const allCategories = [...categoryKeys, 'Others'];
        setCategories(allCategories);
        setSelectedCategory(allCategories[0]);
      } else {
        setCategories(['Others']);
        setSelectedCategory('Others');
      }
    } else {
      // Fallback when no categories are available
      setCategories(['Others']);
      setSelectedCategory('Others');
    }
  }, [service]);

  const handleCategorySelect = (category: string) => {
    console.log('Selecting category:', category);
    console.log('Current selected category:', selectedCategory);
    setSelectedCategory(category);
  };

  const updateItemField = (
    itemKey: string,
    field: keyof ServiceItem,
    value: any,
  ) => {
    console.log('updateItemField called:', { itemKey, field, value });
    setEditableItems(prev => {
      const updated = {
        ...prev,
        [itemKey]: {
          ...prev[itemKey],
          [field]: value,
        },
      };
      console.log('Updated editableItems:', updated);
      return updated;
    });
    setHasChanges(true);
  };

  const updateMaxCount = (value: number) => {
    console.log('updateMaxCount called:', value);
    setMaxCountPerDay(value);
    setHasChanges(true);
  };

  const convertToApiFormat = (): UpdateServiceInput => {
    // Get only changed items
    const changedItems = Object.values(editableItems).filter(item => {
      const originalItem = service?.items?.find(
        (orig: ServiceItem) => orig.item_name === item.item_name,
      );
      if (!originalItem) return true; // New item

      return (
        originalItem.item_price !== item.item_price ||
        originalItem.express_price !== item.express_price ||
        originalItem.discount_percentage !== item.discount_percentage ||
        originalItem.is_active !== item.is_active
      );
    });

    // Only include max_count_per_day if it changed
    const includeMaxCount = maxCountPerDay !== originalMaxCount;

    const apiInput: UpdateServiceInput = {
      service: {
        service_name: service?.service_name || '',
        max_count_per_day: includeMaxCount ? maxCountPerDay : originalMaxCount,
        items: changedItems.map(item => ({
          item_name: item.item_name,
          item_price: item.item_price,
          item_category: item.category,
          express_price: item.express_price,
          discount_percentage: item.discount_percentage,
          is_active: item.is_active,
        })),
      },
    };
    return apiInput;
  };

  const handleSubmit = async () => {
    if (!hasChanges) {
      Alert.alert('No Changes', 'No changes have been made to save.');
      return;
    }

    const apiInput = convertToApiFormat();
    console.log('=== API INPUT BODY ===');
    console.log('API Input:', JSON.stringify(apiInput, null, 2));

    updateServicesMutation.mutate(apiInput);
  };

  const getCurrentCategoryItems = () => {
    if (selectedCategory === 'Others') {
      // Others tab is for settings (max count per day), not for listing items
      return [];
    }
    return service?.items_by_category?.[selectedCategory] || [];
  };

  const renderCategoryTab = (category: string) => {
    const isSelected = selectedCategory === category;
    console.log(`Rendering tab: ${category}, isSelected: ${isSelected}`);
    return (
      <TouchableOpacity
        key={category}
        style={[styles.categoryTab, isSelected && styles.selectedCategoryTab]}
        onPress={() => handleCategorySelect(category)}
        activeOpacity={0.7}
      >
        <CustomText
          fontWeight={isSelected ? 'Bold' : 'Medium'}
          style={[
            styles.categoryTabText,
            isSelected && styles.selectedCategoryTabText,
          ]}
        >
          {category === 'undefined' ? 'General' : category}
        </CustomText>
      </TouchableOpacity>
    );
  };

  const renderItemCardComponent = ({ item }: { item: ServiceItem }) => {
    const itemKey = `${item.item_name}_${item.category}`;
    const editableItem = editableItems[itemKey] || item;

    console.log('Rendering item card:', {
      itemName: item.item_name,
      itemKey,
      editableItem,
      hasEditableItem: !!editableItems[itemKey],
    });

    return (
      <View style={styles.itemCard}>
        {/* Item Header */}
        <View style={styles.itemHeader}>
          <CustomText style={styles.itemName}>{item.item_name}</CustomText>
          <View style={styles.activeContainer}>
            <CustomText style={styles.activeLabel}>Active</CustomText>
            <Switch
              value={editableItem.is_active}
              onValueChange={value => {
                console.log('Switch changed:', value);
                updateItemField(itemKey, 'is_active', value);
              }}
              trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
              thumbColor={'#FFFFFF'}
            />
          </View>
        </View>

        {/* Price Fields */}
        <View style={styles.editablePriceContainer}>
          {[
            { label: 'Standard', key: 'item_price' as keyof ServiceItem },
            {
              label: 'Express',
              key: 'express_price' as keyof ServiceItem,
            },
            {
              label: 'Discount %',
              key: 'discount_percentage' as keyof ServiceItem,
            },
          ].map(({ label, key }) => (
            <View key={key} style={styles.priceInputContainer}>
              <CustomText style={styles.priceLabel}>{label}</CustomText>
              <TextInput
                style={styles.priceInput}
                value={editableItem[key]?.toString() || ''}
                onChangeText={text => {
                  console.log('TextInput changed:', { key, text, itemKey });
                  updateItemField(itemKey, key, parseInt(text) || 0);
                }}
                keyboardType="numeric"
                placeholder="0"
                onFocus={() => console.log('TextInput focused:', key)}
                onBlur={() => console.log('TextInput blurred:', key)}
              />
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderOthersTabComponent = () => {
    console.log('Rendering Others tab, maxCountPerDay:', maxCountPerDay);

    return (
      <View style={styles.othersTabContainer}>
        <View style={styles.maxCountContainer}>
          <CustomText style={styles.maxCountLabel}>
            Max Count Per Day:
          </CustomText>
          <TextInput
            style={styles.maxCountInput}
            value={maxCountPerDay.toString()}
            onChangeText={text => {
              console.log('Max count changed:', text);
              updateMaxCount(parseInt(text) || 0);
            }}
            keyboardType="numeric"
            placeholder="0"
          />
          <CustomText style={styles.maxCountDescription}>
            Maximum number of orders that can be accepted per day for this
            service
          </CustomText>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Toolbar title={service?.service_name || 'Service List'} />

      <View style={styles.content}>
        {/* Category Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryTabsContainer}
          contentContainerStyle={styles.categoryTabsContent}
        >
          {categories.map(renderCategoryTab)}
        </ScrollView>

        {/* Items List or Others Tab Content */}
        {(() => {
          console.log('Current selectedCategory:', selectedCategory);
          console.log('Is Others selected?', selectedCategory === 'Others');
          return selectedCategory === 'Others' ? (
            <View style={{ flex: 1, padding: 16 }}>
              {renderOthersTabComponent()}
            </View>
          ) : (
            <FlatList
              data={getCurrentCategoryItems()}
              renderItem={renderItemCardComponent}
              keyExtractor={(item, index) => `${item.item_name}_${index}`}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
              ListFooterComponent={() => <View style={{ height: 150 }} />}
            />
          );
        })()}
      </View>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <CustomBtn
          title={
            updateServicesMutation.isPending ? 'Updating...' : 'Update Service'
          }
          onPress={handleSubmit}
          disabled={updateServicesMutation.isPending || !hasChanges}
        />
      </View>
    </SafeAreaView>
  );
};

export default ShopListScreen;
