import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomText from '../../components/Text';
import Toolbar from '../../components/Toolbar';
import CustomBtn from '../../components/CustomBtn';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Service, ServiceItem } from '../../apiService/types/profileTypes';
import styles from './styles';

type ShopListNavProp = NativeStackNavigationProp<RootStackParamList, 'ShopList'>;
type ShopListRouteProp = RouteProp<RootStackParamList, 'ShopList'>;

interface SelectedItem extends ServiceItem {
  quantity: number;
}

const ShopListScreen: React.FC = () => {
  const navigation = useNavigation<ShopListNavProp>();
  const route = useRoute<ShopListRouteProp>();
  const { service } = route.params;
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: SelectedItem }>({});
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (service?.items_by_category) {
      const categoryKeys = Object.keys(service.items_by_category);
      // Add 'Others' tab to all services
      const allCategories = [...categoryKeys, 'Others'];
      setCategories(allCategories);
      setSelectedCategory(allCategories[0]);
    }
  }, [service]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const handleQuantityChange = (item: ServiceItem, change: number) => {
    const itemKey = `${item.item_name}_${item.category}`;
    const currentItem = selectedItems[itemKey];
    const newQuantity = Math.max(0, (currentItem?.quantity || 0) + change);
    
    if (newQuantity === 0) {
      const newSelectedItems = { ...selectedItems };
      delete newSelectedItems[itemKey];
      setSelectedItems(newSelectedItems);
    } else {
      setSelectedItems({
        ...selectedItems,
        [itemKey]: {
          ...item,
          quantity: newQuantity,
        },
      });
    }
  };

  const getTotalSelectedItems = () => {
    return Object.values(selectedItems).reduce((total, item) => total + item.quantity, 0);
  };

  const clearAllItems = () => {
    setSelectedItems({});
  };

  const handleSubmit = () => {
    // TODO: Implement submit functionality
    console.log('Selected items:', selectedItems);
    navigation.goBack();
  };

  const renderCategoryTab = (category: string) => {
    const isSelected = selectedCategory === category;
    return (
      <TouchableOpacity
        key={category}
        style={[
          styles.categoryTab,
          isSelected && styles.selectedCategoryTab
        ]}
        onPress={() => handleCategorySelect(category)}
        activeOpacity={0.7}
      >
        <CustomText style={[
          styles.categoryTabText,
          isSelected && styles.selectedCategoryTabText
        ]}>
          {category}
        </CustomText>
      </TouchableOpacity>
    );
  };

  const renderItemCard = ({ item }: { item: ServiceItem }) => {
    const itemKey = `${item.item_name}_${item.category}`;
    const selectedItem = selectedItems[itemKey];
    const quantity = selectedItem?.quantity || 0;

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemInfo}>
          <CustomText style={styles.itemName}>{item.item_name}</CustomText>
          <View style={styles.priceContainer}>
            <CustomText style={styles.standardPrice}>
              Standard ₹{item.item_price || 30}
            </CustomText>
            <CustomText style={styles.expressPrice}>
              Express ₹{item.express_price || 60}
            </CustomText>
          </View>
        </View>
        
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item, -1)}
            disabled={quantity === 0}
          >
            <CustomText style={[
              styles.quantityButtonText,
              quantity === 0 && styles.disabledQuantityButton
            ]}>
              -
            </CustomText>
          </TouchableOpacity>
          
          <View style={styles.quantityDisplay}>
            <CustomText style={styles.quantityText}>
              {quantity.toString().padStart(2, '0')}
            </CustomText>
          </View>
          
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item, 1)}
          >
            <CustomText style={styles.quantityButtonText}>+</CustomText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const getCurrentCategoryItems = () => {
    if (selectedCategory === 'Others') {
      // Return empty array for Others tab or implement custom logic
      return [];
    }
    return service?.items_by_category?.[selectedCategory] || [];
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Toolbar title="Shop List" />
      
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

        {/* Summary Bar */}
        <View style={styles.summaryBar}>
          <CustomText style={styles.totalItemsText}>
            Total Items Selected ({getTotalSelectedItems()})
          </CustomText>
          <TouchableOpacity onPress={clearAllItems}>
            <CustomText style={styles.clearAllText}>Clear All</CustomText>
          </TouchableOpacity>
        </View>

        {/* Items List */}
        <FlatList
          data={getCurrentCategoryItems()}
          renderItem={renderItemCard}
          keyExtractor={(item, index) => `${item.item_name}_${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.itemsList}
        />

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <CustomBtn
            title="Submit"
            onPress={handleSubmit}
            disabled={getTotalSelectedItems() === 0}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ShopListScreen;

