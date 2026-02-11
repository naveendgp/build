import { useState, useEffect, useCallback } from 'react';
import { vendorService } from '../../../services/vendorService';
import { Vendor, VendorDetailResponse, VendorDisplayData, Review } from '../../../types/vendor/vendorDetail';
import { useOrderStore } from '../../../state/zustand/orderStore';

interface UseVendorDetailReturn {
  vendor: Vendor | null;
  displayData: VendorDisplayData | null;
  distance: {
    distance_text: string;
    distance_value: number;
    duration_text: string;
    duration_value: number;
    destination_address: string;
    target_address: string;
    distance_val: string;
  } | null;
  offerDetails: {
    max_offer_percentage: {
      total_percentage: number;
      max_cap: number;
    };
    is_offer: boolean;
  } | null;
  expressDetails: {
    fastest_express_time_hours: number;
    is_express_available: boolean;
  } | null;
  reviews: Review[];
  isLoading: boolean;
  isLoadingReviews: boolean;
  isLoadingMoreReviews: boolean;
  hasMoreReviews: boolean;
  totalReviews: number;
  error: string | null;
  message: string | null;
  refetch: () => Promise<void>;
  refetchReviews: () => Promise<void>;
  loadMoreReviews: () => Promise<void>;
}
export const useVendorDetail = (vendorId: string | undefined): UseVendorDetailReturn => {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [vendorDetailsData, setVendorDetailsData] = useState<VendorDisplayData | null>(null);
  const [distance, setDistance] = useState<{
    distance_text: string;
    distance_value: number;
    duration_text: string;
    duration_value: number;
    destination_address: string;
    target_address: string;
    distance_val: string;
  } | null>(null);
  const [offerDetails, setOfferDetails] = useState<{
    max_offer_percentage: {
      total_percentage: number;
      max_cap: number;
    };
    is_offer: boolean;
  } | null>(null);

  const [expressDetails, setExpressDetails] = useState<{
    fastest_express_time_hours: number;
    is_express_available: boolean;
  } | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(false);
  const [isLoadingMoreReviews, setIsLoadingMoreReviews] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { setVendorDetails } = useOrderStore();

  const fetchVendorDetail = useCallback(async () => {
    if (!vendorId) {
      setError('Vendor ID is required');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await vendorService.getVendorDetails(vendorId);

      if (response.success && response.data) {
        const vendorData = vendorService.extractVendorData(response);

        if (vendorData) {
          setVendor(vendorData);
          setDistance(response.data.data.distance);
          setOfferDetails(response.data.data.offerDetails);
          setExpressDetails(response.data.data.expressDetails);
          const display = vendorService.getVendorDisplayData(vendorData);
          setVendorDetailsData(display);
          setVendorDetails(display);
          setMessage(response.message || 'Vendor details loaded successfully');
        } else {
          setError('Invalid vendor data received');
        }
      } else {
        setError(response.error || 'Failed to load vendor details');
        setMessage(response.message || null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Error fetching vendor details:', err);
    } finally {
      setIsLoading(false);
    }
  }, [vendorId]);

  const fetchVendorReviews = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!vendorId) {
      return;
    }

    if (append) {
      setIsLoadingMoreReviews(true);
    } else {
      setIsLoadingReviews(true);
      setCurrentPage(1);
    }
    setError(null);

    try {
      const response = await vendorService.getVendorReviews(vendorId, page, 10);

      if (response.success && response.data) {
        const reviewsData = response.data.data?.reviews || [];
        const paginationData = response.data.data;

        if (append) {
          setReviews(prev => [...prev, ...reviewsData]);
        } else {
          setReviews(reviewsData);
        }

        setCurrentPage(paginationData?.page || page);
        setTotalPages(paginationData?.totalPages || 0);
        setTotalReviews(paginationData?.totalReviews || 0);
      } else {
        console.error('Failed to load reviews:', response.error);
        // Don't set error for reviews failure, just log it
      }
    } catch (err) {
      console.error('Error fetching vendor reviews:', err);
      // Don't set error for reviews failure, just log it
    } finally {
      setIsLoadingReviews(false);
      setIsLoadingMoreReviews(false);
    }
  }, [vendorId]);

  const loadMoreReviews = useCallback(async () => {
    if (currentPage < totalPages && !isLoadingMoreReviews) {
      await fetchVendorReviews(currentPage + 1, true);
    }
  }, [currentPage, totalPages, isLoadingMoreReviews, fetchVendorReviews]);

  // Fetch data on mount and when vendorId changes
  useEffect(() => {
    if (vendorId) {
      fetchVendorDetail();
      fetchVendorReviews();
    }
  }, [vendorId, fetchVendorDetail, fetchVendorReviews]);

  const refetch = useCallback(async () => {
    await fetchVendorDetail();
  }, [fetchVendorDetail]);

  const refetchReviews = useCallback(async () => {
    await fetchVendorReviews(1, false);
  }, [fetchVendorReviews]);

  const hasMoreReviews = currentPage < totalPages;

  return {
    vendor,
    displayData: vendorDetailsData,
    distance,
    offerDetails,
    reviews,
    isLoading,
    isLoadingReviews,
    isLoadingMoreReviews,
    hasMoreReviews,
    totalReviews,
    error,
    message,
    refetch,
    refetchReviews,
    loadMoreReviews,
    expressDetails,
  };
};