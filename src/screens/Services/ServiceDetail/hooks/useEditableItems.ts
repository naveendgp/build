import { useState, useEffect, useRef } from 'react';
import { Service, ServiceItem } from '../../../../apiService/types/profileTypes';

export const useEditableItems = (service: Service | undefined) => {
    const [editableItems, setEditableItems] = useState<{
        [key: string]: ServiceItem;
    }>({});
    const previousItemsStrRef = useRef<string>('');
    const justUpdatedFromCategoryListRef = useRef(false);

    // Initialize editable items from service items
    useEffect(() => {
        if (!service) return;

        // Skip if we just updated from CategoryList (to prevent overwriting the direct update)
        if (justUpdatedFromCategoryListRef.current) {
            console.log('⏭️ Skipping editableItems update - just updated from CategoryList');
            return;
        }

        const items: { [key: string]: ServiceItem } = {};

        // Prefer items array if available (it has all items, including updates from CategoryList)
        // items_by_category might only have partial data after CategoryList updates
        if (service.items && service.items.length > 0) {
            service.items.forEach((item: ServiceItem) => {
                const itemKey = `${item.item_name}_${item.category}`;
                items[itemKey] = { ...item };
            });
        } else if (service.items_by_category && Object.keys(service.items_by_category).length > 0) {
            // Fallback to items_by_category if items array is not available
            Object.values(service.items_by_category)
                .flat()
                .forEach((item: ServiceItem) => {
                    const itemKey = `${item.item_name}_${item.category}`;
                    items[itemKey] = { ...item };
                });
        }

        // Create a string representation of items for comparison
        const itemsStr = JSON.stringify(items);

        // Always update if service changed (don't rely on string comparison alone)
        // The previousItemsStrRef check helps avoid unnecessary updates, but we need to ensure updates happen
        const shouldUpdate = itemsStr !== previousItemsStrRef.current || Object.keys(items).length !== Object.keys(editableItems).length;

        if (shouldUpdate) {
            console.log('🔄 Updating editableItems from service:', {
                serviceName: service.service_name,
                itemsCount: Object.keys(items).length,
                previousCount: Object.keys(editableItems).length,
                selectedItems: Object.values(items).filter(item => item.is_active).length,
                sampleItem: Object.values(items)[0],
                usingItemsArray: !!(service.items && service.items.length > 0),
            });
            setEditableItems(items);
            previousItemsStrRef.current = itemsStr;
        }
    }, [service, editableItems]);

    const updateItemField = (
        itemKey: string,
        field: keyof ServiceItem,
        value: any,
    ) => {
        setEditableItems(prev => ({
            ...prev,
            [itemKey]: {
                ...prev[itemKey],
                [field]: value,
            },
        }));
    };

    return {
        editableItems,
        setEditableItems,
        updateItemField,
        justUpdatedFromCategoryListRef,
        previousItemsStrRef,
    };
};

