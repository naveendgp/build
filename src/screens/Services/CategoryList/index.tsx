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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
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
    UpdateServiceInput,
    UpdateServicesResponse,
} from '../../../apiService/types/profileTypes';
import { ErrorResponse } from '../../../apiService/types/authTypes';
import { updateServicesOffered } from '../../../apiService/api/profileApi';
import { COLORS, FONTFAMILY } from '../../../constants/colors';
import ServiceItemCard from '../Components';
import styles from './style';

type CategoryListNavProp = NativeStackNavigationProp<
    RootStackParamList,
    'CategoryListScreen'
>;
type CategoryListRouteProp = RouteProp<RootStackParamList, 'CategoryListScreen'>;

const CategoryListScreen: React.FC = () => {
    const navigation = useNavigation<CategoryListNavProp>();
    const route = useRoute<CategoryListRouteProp>();
    const { service, category } = route.params;
    const queryClient = useQueryClient();

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

    // React Query mutation for updating services
    const updateServicesMutation = useMutation<
        UpdateServicesResponse,
        AxiosError<ErrorResponse>,
        UpdateServiceInput
    >({
        mutationFn: updateServicesOffered,
        onSuccess: (response: UpdateServicesResponse) => {
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

    const convertToApiFormat = (): UpdateServiceInput => {
        const changedItems = Object.values(editableItems).filter(item => {
            const originalItem = service?.items?.find(
                (orig: ServiceItem) => orig.item_name === item.item_name,
            );
            if (!originalItem) return true;

            return (
                originalItem.item_price !== item.item_price ||
                originalItem.express_price !== item.express_price ||
                originalItem.discount_percentage !== item.discount_percentage ||
                originalItem.is_active !== item.is_active
            );
        });

        const apiInput: UpdateServiceInput = {
            service: {
                service_name: service?.service_name || '',
                max_count_per_day: service?.max_count_per_day || 0,
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
        updateServicesMutation.mutate(apiInput);
    };

    const selectedItemsCount = Object.values(editableItems).filter(
        item => item.is_active,
    ).length;

    const renderItemCard = ({ item }: { item: ServiceItem }) => {
        const itemKey = `${item.item_name}_${item.category}`;
        const editableItem = editableItems[itemKey] || item;

        return (
            <ServiceItemCard
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
                ListFooterComponent={() => <View style={{ height: 100 }} />}
            />

            <View style={styles.submitContainer}>
                <CustomBtn
                    title={updateServicesMutation.isPending ? 'Saving...' : 'Save'}
                    onPress={handleSubmit}
                    disabled={updateServicesMutation.isPending || !hasChanges}
                    style={styles.confirmButton}
                    textStyle={styles.continueText}
                />
            </View>
        </SafeAreaView>
    );
};

export default CategoryListScreen;
