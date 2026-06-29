import 'package:flutter/foundation.dart';
import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../models/explore_models.dart';

// Lyket Explore — State Management

enum ExploreLoadState { initial, loading, loaded, error }
enum SearchLoadState { idle, loading, loaded, empty, error }

// ─── Explore State ────────────────────────────────────────
class ExploreState {
  final List<ExploreCategory> categories;
  final List<FeedPost> trendingPosts;
  final List<FeedPost> recommendedPosts;
  final List<ExploreBrand> brands;
  final List<ExploreOffer> offers;
  final ExploreLoadState loadState;
  final String? selectedCategory;
  final String? nextCursor;

  const ExploreState({
    this.categories = const [],
    this.trendingPosts = const [],
    this.recommendedPosts = const [],
    this.brands = const [],
    this.offers = const [],
    this.loadState = ExploreLoadState.initial,
    this.selectedCategory,
    this.nextCursor,
  });

  ExploreState copyWith({
    List<ExploreCategory>? categories,
    List<FeedPost>? trendingPosts,
    List<FeedPost>? recommendedPosts,
    List<ExploreBrand>? brands,
    List<ExploreOffer>? offers,
    ExploreLoadState? loadState,
    String? selectedCategory,
    String? nextCursor,
  }) {
    return ExploreState(
      categories: categories ?? this.categories,
      trendingPosts: trendingPosts ?? this.trendingPosts,
      recommendedPosts: recommendedPosts ?? this.recommendedPosts,
      brands: brands ?? this.brands,
      offers: offers ?? this.offers,
      loadState: loadState ?? this.loadState,
      selectedCategory: selectedCategory,
      nextCursor: nextCursor ?? this.nextCursor,
    );
  }
}

// ─── Search State ──────────────────────────────────────────
class SearchState {
  final String query;
  final bool isActive;
  final List<SearchSuggestion> suggestions;
  final List<FeedPost> results;
  final List<String> recentSearches;
  final SearchLoadState searchLoadState;

  const SearchState({
    this.query = '',
    this.isActive = false,
    this.suggestions = const [],
    this.results = const [],
    this.recentSearches = const ['minimal lifestyle', 'luxury watches', 'tech startups'],
    this.searchLoadState = SearchLoadState.idle,
  });

  SearchState copyWith({
    String? query,
    bool? isActive,
    List<SearchSuggestion>? suggestions,
    List<FeedPost>? results,
    List<String>? recentSearches,
    SearchLoadState? searchLoadState,
  }) {
    return SearchState(
      query: query ?? this.query,
      isActive: isActive ?? this.isActive,
      suggestions: suggestions ?? this.suggestions,
      results: results ?? this.results,
      recentSearches: recentSearches ?? this.recentSearches,
      searchLoadState: searchLoadState ?? this.searchLoadState,
    );
  }
}

// ─── Explore Notifier ─────────────────────────────────────
class ExploreNotifier extends StateNotifier<ExploreState> {
  final ApiClient _apiClient;

  ExploreNotifier(this._apiClient) : super(const ExploreState()) {
    loadExplore();
  }

  Future<void> loadExplore() async {
    state = state.copyWith(loadState: ExploreLoadState.loading);
    try {
      final queryParams = state.selectedCategory != null
          ? {'category': state.selectedCategory}
          : null;
      
      // Fetch both main feed and limited offers in parallel
      final results = await Future.wait([
        _apiClient.dio.get('/feed/explore', queryParameters: queryParams),
        _apiClient.dio.get('/search/limited-offers')
      ]);

      final res = results[0];
      final offersRes = results[1];

      List<ExploreOffer> fetchedOffers = [];
      if (offersRes.statusCode == 200 && offersRes.data['success'] == true) {
        final offersData = offersRes.data['data'] as List;
        fetchedOffers = offersData.map((j) {
          final createdAt = DateTime.tryParse(j['createdAt']?.toString() ?? '') ?? DateTime.now();
          // Assuming offers expire 48 hours after creation for UI purposes
          final expiresAt = createdAt.add(const Duration(hours: 48));
          return ExploreOffer(
            id: j['postId']?.toString() ?? '',
            brandName: j['brandName']?.toString() ?? 'Brand',
            title: j['title']?.toString() ?? '',
            description: j['description']?.toString() ?? '',
            mediaUrl: j['image']?.toString() ?? '',
            discount: 'Limited Offer',
            expiresAt: expiresAt,
          );
        }).toList();
      }

      if (res.statusCode == 200) {
        final dataList = res.data['data'] as List;
        final nextCursor = res.data['nextCursor'] as String?;
        final posts = dataList.map((j) => FeedPost.fromJson(j)).toList();

        // Split posts: first 5 trending, rest recommended
        final trending = posts.take(5).toList();
        final recommended = posts.skip(5).toList();

        state = state.copyWith(
          categories: MockExploreData.categories(),
          trendingPosts: trending.isNotEmpty ? trending : MockExploreData.trendingPosts(),
          recommendedPosts: recommended.isNotEmpty ? recommended : MockExploreData.suggestedPosts(),
          brands: MockExploreData.brands(),
          offers: fetchedOffers,
          loadState: ExploreLoadState.loaded,
          nextCursor: nextCursor,
        );
      } else {
        _loadMockData();
      }
    } catch (e) {
      _loadMockData();
    }
  }

  void _loadMockData() {
    state = state.copyWith(
      categories: MockExploreData.categories(),
      trendingPosts: MockExploreData.trendingPosts(),
      recommendedPosts: MockExploreData.suggestedPosts(),
      brands: MockExploreData.brands(),
      offers: [], // Removed mock data for offers as requested
      loadState: ExploreLoadState.loaded,
    );
  }

  Future<void> refreshExplore() async {
    await loadExplore();
  }

  void selectCategory(String? category) {
    state = state.copyWith(
      selectedCategory: category == state.selectedCategory ? null : category,
    );
    loadExplore();
  }
}

// ─── Search Notifier ──────────────────────────────────────
class SearchNotifier extends StateNotifier<SearchState> {
  final ApiClient _apiClient;
  Timer? _debounceTimer;

  SearchNotifier(this._apiClient) : super(const SearchState());

  @override
  void dispose() {
    _debounceTimer?.cancel();
    super.dispose();
  }

  void updateQuery(String query) {
    if (query.isEmpty) {
      _debounceTimer?.cancel();
      state = state.copyWith(
        query: query,
        suggestions: [],
        searchLoadState: SearchLoadState.idle,
      );
      return;
    }
    final all = MockExploreData.searchSuggestions();
    final filtered = all.where(
      (s) => s.text.toLowerCase().contains(query.toLowerCase()),
    ).toList();
    state = state.copyWith(query: query, suggestions: filtered);

    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 600), () {
      if (state.query.isNotEmpty && state.isActive) {
        search();
      }
    });
  }

  Future<void> search() async {
    if (state.query.isEmpty) return;
    addRecent(state.query);
    state = state.copyWith(searchLoadState: SearchLoadState.loading);

    try {
      final res = await _apiClient.dio.get('/search', queryParameters: {'q': state.query});

      if (res.statusCode == 200) {
        List dataList = [];
        if (res.data is List) {
          dataList = res.data as List;
        } else if (res.data is Map && res.data['data'] is List) {
          dataList = res.data['data'] as List;
        } else {
          throw Exception('Unexpected data structure: ${res.data}');
        }

        final results = dataList
            .map((j) => FeedPost.fromJson(j as Map<String, dynamic>))
            .toList();

        state = state.copyWith(
          results: results,
          searchLoadState:
              results.isEmpty ? SearchLoadState.empty : SearchLoadState.loaded,
        );
      } else {
        throw Exception('Status code: ${res.statusCode}');
      }
    } catch (e) {
      debugPrint('SEARCH ERROR: $e');
      state = state.copyWith(
        searchLoadState: SearchLoadState.error,
        results: [],
      );
    }
  }

  void clearSearch() {
    state = state.copyWith(
      query: '',
      suggestions: [],
      results: [],
      isActive: false,
      searchLoadState: SearchLoadState.idle,
    );
  }

  void toggleActive(bool active) {
    state = state.copyWith(isActive: active);
  }

  void addRecent(String term) {
    final updated =
        [term, ...state.recentSearches.where((s) => s != term)].take(8).toList();
    state = state.copyWith(recentSearches: updated);
  }

  void removeRecent(String term) {
    state = state.copyWith(
        recentSearches: state.recentSearches.where((s) => s != term).toList());
  }

  void clearRecent() {
    state = state.copyWith(recentSearches: []);
  }
}

// ─── Providers ────────────────────────────────────────────
final exploreProvider =
    StateNotifierProvider.autoDispose<ExploreNotifier, ExploreState>(
  (ref) => ExploreNotifier(ref.watch(apiClientProvider)),
);

final searchProvider =
    StateNotifierProvider.autoDispose<SearchNotifier, SearchState>(
  (ref) => SearchNotifier(ref.watch(apiClientProvider)),
);
