import { useState, useCallback } from 'react';
import { Vendor } from '../../../types/vendor/vendorDetail';

export interface ServiceItem {
  item_id: string;
  item_name: string;
  image_url: string;
  item_price: number;
  express_price: number;
  item_description: string;
  category: string;
  is_active: boolean;
}

export type ServiceItems = Record<string, ServiceItem[]>;

interface UseServiceItemsReturn {
  serviceItems: ServiceItems;
  isLoading: boolean;
  error: string | null;
  setServiceItems: (items: ServiceItems) => void;
  updateServiceItems: (serviceName: string, vendorDetails: any) => void;
}

export const useServiceItems = (tabCategories: string[] = []): UseServiceItemsReturn => {
  const defaultCategories = ["Men", "Women", "Kids", "Household", "Pet"];
  const categories = tabCategories.length > 0 ? tabCategories : defaultCategories;

  const [serviceItems, setServiceItems] = useState<ServiceItems>(
    Object.fromEntries(categories.map(cat => [cat, []]))
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const updateServiceItems = useCallback((serviceName: string, vendorDetails: Vendor) => {

    if (!vendorDetails?.services_offered) {
      setError('No services data available');
      return;
    }

    const service = vendorDetails.services_offered.find((s: any) => s.service_name.toLowerCase().replace(/\s+/g, '') === serviceName.toLowerCase().replace(/\s+/g, ''));
    if (!service) {
      setError('Service not found');
      return;
    }

    if (!service?.items) {
      setError('No items found for this service');
      return;
    }

    // Group items by category using dynamic categories
    // Support both existing flow (Men, Women, etc.) and weight-based flow
    const groupedItems: ServiceItems = Object.fromEntries(categories.map(cat => [cat, []]));

    service.items.forEach((item: ServiceItem) => {
      const itemCategory = item.category.toLowerCase();

      // Find matching category (case-insensitive)
      const matchingCategory = categories.find(cat => cat.toLowerCase() === itemCategory);

      if (matchingCategory) {
        // Safe Frontend Deduplication: Check if item already exists in the category list
        const existing = groupedItems[matchingCategory].find(i => i.item_id === item.item_id);
        if (!existing) {
          groupedItems[matchingCategory].push(item);
        }
      }
    });
    setServiceItems(groupedItems);
    setError(null);
  }, [categories]);

  return {
    serviceItems,
    isLoading,
    error,
    setServiceItems,
    updateServiceItems,
  };
};