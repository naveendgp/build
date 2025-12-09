import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    TouchableOpacity,
    FlatList,
    TextInput,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomText from '../../../components/Text';
import Toolbar from '../../../components/Toolbar';
import CustomBtn from '../../../components/CustomBtn';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import {
    Service,
    ServiceItem,
} from '../../../apiService/types/profileTypes';
import { COLORS, FONTFAMILY } from '../../../constants/colors';
import CategoryItemCard from '../Components/CategoryItemCard';
import { useServiceDataStore } from '../../../apiService/store/useServiceDataStore';
import styles from './style';
import { showErrorToast } from '../../../utils/Toast';

type CategoryListNavProp = NativeStackNavigationProp<
    RootStackParamList,
    'CategoryListScreen'
>;
type CategoryListRouteProp = RouteProp<RootStackParamList, 'CategoryListScreen'>;

const CategoryListScreen: React.FC = () => {
    const navigation = useNavigation<CategoryListNavProp>();
    const route = useRoute<CategoryListRouteProp>();
    const { service, category } = route.params;
    const { setUpdatedService } = useServiceDataStore();

    // Get items for the selected category
    const categoryItems = category
        ? service?.items_by_category?.[category] || []
        : [];

    const [editableItems, setEditableItems] = useState<{
        [key: string]: ServiceItem;
    }>({});
    const [hasChanges, setHasChanges] = useState<boolean>(false);

    // Initialize editable items from category items
    useEffect(() => {
        const items: { [key: string]: ServiceItem } = {};
        categoryItems.forEach((item: ServiceItem) => {
            const itemKey = `${item.item_name}_${item.category}`;
            items[itemKey] = { ...item };
        });
        setEditableItems(items);
    }, [categoryItems]);

    // No API call here - just save and go back with updated data

    const updateItemField = (
        itemKey: string,
        field: keyof ServiceItem,
        value: any,
    ) => {
        setEditableItems(prev => {
            const updated = {
                ...prev,
                [itemKey]: {
                    ...prev[itemKey],
                    [field]: value,
                },
            };
            return updated;
        });
        setHasChanges(true);
    };

    const handleClearAll = () => {
        Alert.alert(
            'Clear All',
            'Are you sure you want to deselect all items?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: () => {
                        const updated: { [key: string]: ServiceItem } = {};
                        Object.keys(editableItems).forEach(key => {
                            updated[key] = {
                                ...editableItems[key],
                                is_active: false,
                            };
                        });
                        setEditableItems(updated);
                        setHasChanges(true);
                    },
                },
            ],
        );
    };


    const handleSubmit = () => {
        if (!hasChanges) {
            showErrorToast('No changes have been made to save.');
            return;
        }

        // Get all items from service (from items array or items_by_category)
        const allServiceItems: ServiceItem[] = [];
        if (service?.items && service.items.length > 0) {
            allServiceItems.push(...service.items);
        } else if (service?.items_by_category) {
            // Flatten items_by_category into a single array
            Object.values(service.items_by_category).forEach(categoryItems => {
                if (Array.isArray(categoryItems)) {
                    allServiceItems.push(...(categoryItems as ServiceItem[]));
                }
            });
        }

        // Get updated items from this category
        const updatedItems = Object.values(editableItems);

        // Merge: update existing items or add new ones
        const finalItems = allServiceItems.map((item: ServiceItem) => {
            // If this item belongs to the current category, use updated version
            if (item.category === category) {
                const updatedItem = updatedItems.find(
                    (updated) => updated.item_name === item.item_name && updated.category === item.category,
                );
                return updatedItem || item;
            }
            // Otherwise, keep the original item
            return item;
        });

        // Add any new items from updatedItems that don't exist in allServiceItems
        updatedItems.forEach(updatedItem => {
            const exists = finalItems.find(
                item => item.item_name === updatedItem.item_name && item.category === updatedItem.category
            );
            if (!exists) {
                finalItems.push(updatedItem);
            }
        });

        const selectedCount = finalItems.filter((item: ServiceItem) => item.is_active).length;

        console.log('💾 Saving data from CategoryList:', {
            category,
            serviceName: service?.service_name,
            totalItems: finalItems.length,
            selectedItems: selectedCount,
            updatedItems: updatedItems.map(item => ({
                name: item.item_name,
                category: item.category,
                is_active: item.is_active,
                item_price: item.item_price,
                express_price: item.express_price,
            })),
            finalItems: finalItems.map(item => ({
                name: item.item_name,
                category: item.category,
                is_active: item.is_active,
                item_price: item.item_price,
                express_price: item.express_price,
            })),
        });

        // Prepare updated service data to pass back
        const updatedService = {
            ...service,
            items: finalItems,
            // Also update items_by_category to keep it in sync
            items_by_category: {
                ...(service?.items_by_category || {}),
                ...(category ? { [category]: updatedItems } : {}),
            },
        };

        // Store updated service data temporarily
        setUpdatedService(updatedService);

        // Go back to ServiceDetail screen
        navigation.goBack();
    };

    const selectedItemsCount = Object.values(editableItems).filter(
        item => item.is_active,
    ).length;

    const renderItemCard = ({ item }: { item: ServiceItem }) => {
        const itemKey = `${item.item_name}_${item.category}`;
        const editableItem = editableItems[itemKey] || item;

        return (
            <CategoryItemCard
                item={item}
                editableItem={editableItem}
                onUpdateField={(field, value) => {
                    updateItemField(itemKey, field, value);
                }}
            />
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Toolbar title={category || 'Category'} />

            <View style={styles.summaryBar}>
                <CustomText style={styles.totalItemsText}>
                    Total Items Selected ({selectedItemsCount})
                </CustomText>
                <TouchableOpacity onPress={handleClearAll}>
                    <CustomText style={styles.clearAllText}>Clear All</CustomText>
                </TouchableOpacity>
            </View>

            <FlatList
                data={categoryItems}
                renderItem={renderItemCard}
                keyExtractor={(item, index) => `${item.item_name}_${index}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.itemsList}
                ListFooterComponent={() => <View style={{ height: 300 }} />}
            />

            <View style={styles.submitContainer}>
                <CustomBtn
                    title="Save"
                    onPress={handleSubmit}
                    style={styles.confirmButton}
                    textStyle={styles.continueText}
                />
            </View>
        </SafeAreaView>
    );
};

export default CategoryListScreen;
