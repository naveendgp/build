import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import SvgSearchIcons from "../../assets/auto-generated-svg-icons/SearchIcons";
import SvgSortDownIcon from "../../assets/auto-generated-svg-icons/SortDownIcon";
import SvgBackArrowIcon from "../../assets/auto-generated-svg-icons/BackArrowIcon";
import LaundryServiceCard from "../Home/LaundryServiceCard";
import CustomBottomSheet from "../../components/BottomSheet";
import CustomSkeleton from "../../components/CustomSkeleton";
import DutyToggle from "../../components/DutyToggle";
import { COLORS } from "../../constants/colors";
import { FONTFAMILY } from "../../constants/fonts";
import CustomIcon from "../../components/Icon";
import BackgroundGradient from "../../components/backgroundGradient";
import SvgCancelIcon from "../../assets/auto-generated-svg-icons/CancelIcon";
import EmptyScreen from "../../components/EmptyScreen";
import { Vendor, VendorsResponse, VendorsResponseData } from "../../types/services/services";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toolbar from "../../components/Toolbar";

export default function ServiceList() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const serviceId = route.params?.serviceId; // Get serviceId from route params
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState("");
  const [expressOnly, setExpressOnly] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [selectedSort, setSelectedSort] = useState<string>("");
  const [isSortBottomSheetVisible, setIsSortBottomSheetVisible] = useState(false);
  const [sortOptions, setSortOptions] = useState<string[] | undefined>();
  const [sortLabels, setSortLabels] = useState<Record<string, string>>({});
  const [isSortOptionsLoading, setIsSortOptionsLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState<Array<Record<string, string>> | undefined>();
  const [filterMap, setFilterMap] = useState<Record<string, string>>({}); // Maps filter label to ID
  const [idToLabelMap, setIdToLabelMap] = useState<Record<string, string>>({}); // Maps filter ID to label (reverse map)
  const hasAutoSelectedRef = useRef(false); // Track if we've already auto-selected the filter
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10); // Items per page
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isLoadingMoreRef = useRef(false); // Prevent multiple simultaneous calls
  const [refreshing, setRefreshing] = useState(false);

  // Use local state for vendors to avoid sharing with HomeScreen
  const [vendors, setVendors] = useState<VendorsResponse>();
  const [isLoading, setIsLoading] = useState(false);
  const isInitialLoadRef = useRef(true); // Track if this is the initial load
  const [isInitialDataReady, setIsInitialDataReady] = useState(false);

  useEffect(() => {
    fetchSortOptions();
  }, []);

  // Auto-select filter when serviceId is provided and filterOptions are loaded
  useEffect(() => {
    if (serviceId && !isSortOptionsLoading && Object.keys(idToLabelMap).length > 0 && !hasAutoSelectedRef.current) {
      // Find the filter label that corresponds to the service ID
      const filterLabel = idToLabelMap[serviceId];
      if (filterLabel && !selectedFilters.includes(filterLabel)) {
        setSelectedFilters(prev => [...prev, filterLabel]);
        hasAutoSelectedRef.current = true; // Mark as auto-selected
        isInitialLoadRef.current = false; // Mark that initial load is complete
      }
    } else if (!serviceId && !isSortOptionsLoading) {
      // If no serviceId, mark initial load as complete
      isInitialLoadRef.current = false;
    }
  }, [serviceId, isSortOptionsLoading, idToLabelMap, selectedFilters]);


  const handleFetchVendors = useCallback(async (sortKey?: string, page: number = 1, append: boolean = false) => {
    const sortParam = (sortKey !== undefined ? sortKey : selectedSort) ? [(sortKey !== undefined ? sortKey : selectedSort)] : [];

    // Separate "is_offer" from regular service filters
    const isOffer = selectedFilters.includes("is_offer");

    // Map selected filter labels to their IDs for regular filters (exclude "is_offer")
    // For regular filters like "Iron", "Dry Clean", etc., pass their IDs
    const regularFilters = selectedFilters.filter(filter => filter !== "is_offer");
    const serviceFilterIds = regularFilters
      .map(filterLabel => filterMap[filterLabel])
      .filter(id => id !== undefined); // Only include filters that have valid IDs

    // Add "is_offer" string to serviceFilters if offer filter is selected
    const finalServiceFilters = isOffer
      ? [...serviceFilterIds, "is_offer"]
      : serviceFilterIds;

    // When performing a fresh fetch (not pagination append), mark initial data as not ready
    if (!append) setIsInitialDataReady(false);
    setIsLoading(true);
    try {
      // Import commonService dynamically to avoid circular dependency
      const { commonService } = await import('../../services/commonService');
      const response = await commonService.getVendors({
        sort: sortParam,
        isExpress: expressOnly,
        isOffer: isOffer ? true : null,
        serviceFilters: finalServiceFilters,
        search: searchText.trim(),
      }, page, limit);

      if (response.success && response.data) {
        if (append && vendors?.data?.vendors) {
          // Append new vendors to existing list for FlatList pagination
          setVendors({
            ...response.data,
            data: {
              ...response.data.data,
              vendors: [...vendors.data.vendors, ...response.data.data.vendors]
            }
          });
        } else {
          // Replace vendors (new search/filter or first load)
          setVendors(response.data);
        }
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setIsLoading(false);
      // Mark that initial data has been attempted/loaded (used to hide premature Empty state)
      setIsInitialDataReady(true);
    }
  }, [expressOnly, selectedFilters, selectedSort, filterMap, limit, vendors, searchText]);

  // Reset pagination when filters/sort change - FlatList will load first page
  useEffect(() => {
    // Don't fetch if:
    // 1. Still loading sort options
    // 2. We have a serviceId but haven't auto-selected the filter yet (waiting for filter to be set)
    const shouldWaitForFilter = serviceId && !hasAutoSelectedRef.current && Object.keys(idToLabelMap).length > 0;

    if (!isSortOptionsLoading && !shouldWaitForFilter) {
      setCurrentPage(1);
      setIsLoadingMore(false);
      isLoadingMoreRef.current = false;
      handleFetchVendors(undefined, 1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expressOnly, selectedFilters, selectedSort, isSortOptionsLoading, serviceId, idToLabelMap, searchText]);

  // FlatList onEndReached handler for pagination
  const handleLoadMore = useCallback(() => {
    if (
      isLoadingMoreRef.current ||
      isLoading ||
      isLoadingMore ||
      !vendors?.data ||
      currentPage >= vendors.data.totalPages
    ) {
      return; // Don't load if already loading, no more pages, or no data
    }

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);

    handleFetchVendors(undefined, nextPage, true).finally(() => {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    });
  }, [currentPage, vendors, isLoading, isLoadingMore, handleFetchVendors]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setIsLoadingMore(false);
    isLoadingMoreRef.current = false;
    await handleFetchVendors(undefined, 1, false);
    setRefreshing(false);
  }, [handleFetchVendors]);

  const fetchSortOptions = async () => {
    try {
      const { commonService } = await import('../../services/commonService');
      const response = await commonService.getFilterList();

      if (response.success && response.data?.data?.services) {
        // API returns services as an array of strings like: "distance-low-to-high"
        const servicesArray: string[] = response.data.data.services;
        setSortOptions(servicesArray);

        const labels: Record<string, string> = {};
        servicesArray.forEach((val) => {
          labels[val] = formatLabel(val);
        });
        setSortLabels(labels);
      }

      if (response.success && response.data?.data?.filter_options) {
        // API returns filter_options as an array of objects like: [{"Iron": "68ef41e6195e86d28ede4058"}, ...]
        const filterOptionsArray = response.data.data.filter_options;
        setFilterOptions(filterOptionsArray);

        // Create a map of filter label to ID for API calls
        const map: Record<string, string> = {};
        // Create a reverse map of ID to label for finding filter by service ID
        const reverseMap: Record<string, string> = {};
        filterOptionsArray.forEach((filterObj: Record<string, string>) => {
          Object.keys(filterObj).forEach((key) => {
            map[key] = filterObj[key];
            // Only create reverse map for non-"is_offer" filters (those with actual IDs)
            if (filterObj[key] !== "is_offer") {
              reverseMap[filterObj[key]] = key;
            }
          });
        });
        setFilterMap(map);
        setIdToLabelMap(reverseMap);
      }
    } finally {
      setIsSortOptionsLoading(false);
    }
  };

  // Helper to convert keys like "distance-low-to-high" or "isExpress" into user-friendly labels
  const formatLabel = (key: string | undefined | null) => {
    if (!key || typeof key !== 'string') return "";
    // replace hyphens/underscores with spaces
    let s = key.replace(/[-_]/g, ' ')
      // split camelCase (e.g., isExpress -> is Express)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');

    // Capitalize each word
    s = s.replace(/\b\w/g, (l) => l.toUpperCase());
    return s;
  };




  const handleFilterToggle = (filterKey: string, event?: any) => {
    // Prevent double toggle when clicking close icon
    if (event) {
      event.stopPropagation();
    }

    setSelectedFilters(prevFilters => {
      const isOfferKey = "is_offer";

      if (filterKey === isOfferKey) {
        // Toggle is_offer, keep other filters
        return prevFilters.includes(isOfferKey)
          ? prevFilters.filter(f => f !== isOfferKey)
          : [...prevFilters, isOfferKey];
      }

      // For other filters: single selection logic but preserve is_offer
      const isOfferSelected = prevFilters.includes(isOfferKey);
      const isCurrentSelected = prevFilters.includes(filterKey);

      // Start with is_offer if it was there
      const result = isOfferSelected ? [isOfferKey] : [];

      // Add the new filter if it wasn't already selected (toggle behavior)
      if (!isCurrentSelected) {
        result.push(filterKey);
      }

      return result;
    });
    // useEffect will handle the fetch when selectedFilters changes
  };

  const handleSortSelect = (sortKey: string) => {
    // Toggle sort: if same key is selected, clear it; otherwise set it
    const newSort = selectedSort === sortKey ? "" : sortKey;
    setSelectedSort(newSort);
    setIsSortBottomSheetVisible(false);
    setCurrentPage(1); // Reset to first page when sort changes
    handleFetchVendors(newSort, 1, false);
  };

  const renderVendorItem = useCallback(
    ({ item }: { item: Vendor }) => {
      return (
        <LaundryServiceCard
          vendor={item}
          fromPage=""
          onPress={() => {
            console.log("Navigating to VendorDetail with vendorId:", item._id);
            // Get valid filter ID if one is selected (excluding is_offer)
            const activeFilter = selectedFilters.find(f => f !== "is_offer");
            const filterId = activeFilter ? filterMap[activeFilter] : undefined;
            console.log("Navigating to VendorDetail with filterId:", filterId);
            navigation.navigate("VendorDetail", {
              vendorId: item._id,
              selectedFilterId: filterId
            });
          }}
        />
      );
    },
    [navigation, selectedFilters, filterMap]
  );
  const SkeletonList = () => (
    <View>
      {Array.from({ length: 5 }).map((_, index) => (
        <View key={`skeleton-${index}`} style={styles.skeletonVendorCard}>
          <View style={styles.skeletonVendorContent}>
            <View style={styles.skeletonVendorHeader}>
              <View style={styles.skeletonVendorTextContainer}>
                <CustomSkeleton width={180} height={24} borderRadius={6} />
                <View style={styles.skeletonVendorSubtitleRow}>
                  <CustomSkeleton width={80} height={16} borderRadius={4} />
                  <CustomSkeleton width={60} height={16} borderRadius={4} />
                </View>
              </View>
              <CustomSkeleton width={50} height={20} borderRadius={4} />
            </View>

            <View style={styles.skeletonVendorServicesRow}>
              <CustomSkeleton width={70} height={28} borderRadius={8} />
              <CustomSkeleton width={70} height={28} borderRadius={8} />
              <CustomSkeleton width={70} height={28} borderRadius={8} />
            </View>

            <View style={styles.skeletonVendorFooter}>
              <View>
                <CustomSkeleton width={60} height={14} borderRadius={4} />
                <CustomSkeleton width={80} height={18} borderRadius={4} />
              </View>
              <CustomSkeleton width={60} height={48} borderRadius={16} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const EmptyList = () => (
    <View style={styles.emptyContainer}>
      <EmptyScreen
        title="No Shops Found"
        subtitle="Try adjusting your filters to see more results"
      />
    </View>
  )

  const LoadFooter = () => (
    <View style={{ padding: 20, alignItems: 'center' }}>
      <Text style={{ color: COLORS.TEXT_PRIMARY }}>Loading more...</Text>
    </View>
  );


  return (
    <View style={{ flex: 1 }}>
      <BackgroundGradient />
      <View style={[styles.container]}>
        {/* Header */}

        <Toolbar
          title="Shop List"
          showBackIcon
          onBackPress={() => navigation.goBack()}
          style={{ paddingHorizontal: 0 }}
        />


        {/* Search */}
        <View style={styles.searchContainer}>
          <SvgSearchIcons />
          <TextInput
            placeholder="Search by name"
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Filter Row with Sort and Filters Scrollable, Express Toggle Fixed */}
        <View style={styles.filterRow}>
          {/* Sort and Filters - Scrollable */}
          <TouchableOpacity style={styles.sortButtonNew} onPress={() => setIsSortBottomSheetVisible(true)}>
            <SvgSortDownIcon />
            <Text style={styles.sortText}>Sort</Text>
            {/* <CustomIcon type="FontAwesome" name="play" size={10} color={COLORS.BLACK} /> */}
          </TouchableOpacity>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScrollContent}
            style={styles.filtersScrollView}
          >
            {/* Sort Btn */}


            {/* Filters */}
            {isSortOptionsLoading ? (
              // Show skeleton for filter options when loading
              Array.from({ length: 5 }).map((_, index) => (
                <View key={`filter-skeleton-${index}`} style={styles.filterSkeleton}>
                  <CustomSkeleton width={80} height={28} borderRadius={8} />
                </View>
              ))
            ) : (
              filterOptions &&
              filterOptions.map((filterObj, index) => {
                // Extract the key (label) from the object
                const filterKey = Object.keys(filterObj)[0];
                const filterId = filterObj[filterKey];
                const isSelected = selectedFilters.includes(filterKey);
                return (
                  <TouchableOpacity
                    key={filterKey || index}
                    style={[styles.filterOption, isSelected && styles.filterOptionSelected]}
                    onPress={() => handleFilterToggle(filterKey)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterOptionText, isSelected && styles.filterOptionTextSelected]}>
                      {filterKey || formatLabel(filterKey)}
                    </Text>
                    {isSelected && (
                      <TouchableOpacity
                        style={styles.filterCancelIcon}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleFilterToggle(filterKey, e);
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <SvgCancelIcon />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* Vertical Separator Line */}
          <View style={styles.verticalSeparator} />

          {/* Express Toggle - Fixed */}
          <View style={styles.expressWrap}>
            <DutyToggle value={expressOnly} onValueChange={setExpressOnly} onColor={COLORS.GREEN} offColor={COLORS.GRAY_DARK} />
            <Text style={styles.expressToggleLabel}>Express</Text>
          </View>
        </View>

        {/* List with FlatList pagination */}
        <FlatList
          data={isLoading ? [] : (vendors?.data?.vendors || [])}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          renderItem={renderVendorItem}
          contentContainerStyle={[
            !isLoading && (!vendors?.data?.vendors || vendors.data.vendors.length === 0)
              ? { flexGrow: 1 }
              : undefined,
            { paddingBottom: insets.bottom + 16 }
          ]}
          ListEmptyComponent={
            (!isInitialDataReady || isLoading || isSortOptionsLoading) ? (
              <SkeletonList />
            ) : !isLoading && (!vendors?.data?.vendors || vendors.data.vendors.length === 0) ? (
              <EmptyList />
            ) : null
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListFooterComponent={
            isLoadingMore ? (
              <LoadFooter />
            ) : null
          }
        />

        {/* Sort Sheet */}
        <CustomBottomSheet
          isVisible={isSortBottomSheetVisible}
          onClose={() => setIsSortBottomSheetVisible(false)}
          height={60}
          bgColor="#fff"
        >
          <View style={styles.sortOptionsContainer}>
            {isSortOptionsLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                <View key={i} style={styles.sortOption}>
                  <CustomSkeleton width={20} height={20} borderRadius={10} />
                </View>
              ))
              : sortOptions && (
                <>
                  <Text style={styles.sortByHeader}>Sort by</Text>
                  {sortOptions.map((val) => {
                    const isSelected = selectedSort === val;
                    return (
                      <TouchableOpacity key={val} style={styles.sortOption} onPress={() => handleSortSelect(val)}>
                        <View style={styles.radioContainer}>
                          <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
                            {isSelected && <View style={styles.radioInner} />}
                          </View>
                          <Text style={styles.sortOptionText}>{sortLabels[val] || formatLabel(val)}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
          </View>
        </CustomBottomSheet>
      </View>
    </View>
  );
}

// ✅ Styles
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#e1f0d9", paddingTop: Platform.OS === "android" ? 25 : 0 },
  container: { flex: 1, paddingHorizontal: 12, position: 'absolute', width: '100%', height: '100%' },
  headerRow: { flexDirection: "row", alignItems: "center", marginVertical: 12 },
  backButton: { padding: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#000", marginLeft: 8 },
  searchContainer: {
    flexDirection: "row", backgroundColor: "#f5f5f5", borderRadius: 12, height: 44, alignItems: "center", marginBottom: 12,
    paddingHorizontal: 8,
  },
  searchInput: { flex: 1, paddingHorizontal: 10, fontSize: 15, color: "#000" },

  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  sortButtonNew: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    marginRight: 8,
  },
  sortText: { marginLeft: 6, fontSize: 14, color: "#000", fontFamily: FONTFAMILY.INTER_MEDIUM, fontWeight: "500" },

  filtersScrollView: {
    flex: 1,
  },
  filtersScrollContent: {
    alignItems: "center",
    paddingRight: 8,
  },

  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 6,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 8,
  },
  filterOptionSelected: { backgroundColor: "#000", borderColor: "#000" },
  filterOptionText: { fontSize: 14, color: "#333", fontWeight: "500" },
  filterOptionTextSelected: { color: "#fff" },
  filterCancelIcon: { marginLeft: 6 },

  verticalSeparator: {
    width: 1,
    height: 28,
    backgroundColor: "#ccc",
    marginLeft: 8,
    marginRight: 8,
  },

  expressWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  expressToggleLabel: {
    fontSize: 12, fontWeight: "500", marginTop: 2,
    color: "#000", fontFamily: FONTFAMILY.INTER_MEDIUM,
  },

  sortOptionsContainer: { padding: 16 },
  sortByHeader: { fontSize: 24, fontWeight: "600", color: COLORS.TEXT_PRIMARY, marginBottom: 12, fontFamily: FONTFAMILY.INTER_SEMIBOLD },
  sortOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  radioContainer: { flexDirection: "row", alignItems: "center" },
  radioButton: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: "#CCCCCC", marginRight: 10, justifyContent: "center", alignItems: "center" },
  radioButtonSelected: { borderColor: COLORS.GREEN },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.GREEN },
  sortOptionText: { fontSize: 16, color: "#333" },
  // Skeleton styles for Vendor Cards
  skeletonVendorCard: {
    backgroundColor: COLORS.CARD_BACKGROUND || "#fff",
    borderRadius: 16,
    marginBottom: 16,
    paddingTop: 12,
    elevation: 2,
  },
  skeletonVendorContent: {
    paddingHorizontal: 12,
  },
  skeletonVendorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 12,
  },
  skeletonVendorTextContainer: {
    flex: 1,
    gap: 8,
  },
  skeletonVendorSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  skeletonVendorServicesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 12,
    gap: 8,
  },
  skeletonVendorFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#D1D1D1",
  },
  filterSkeleton: {
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
