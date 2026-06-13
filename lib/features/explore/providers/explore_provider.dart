import 'package:flutter/foundation.dart';
import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../models/explore_models.dart';

// Lyket Explore â€” State Management

enum ExploreLoadState { initial, loading, loaded, error }
enum SearchLoadState { idle, loading, loaded, empty, error }

// â”€â”€â”€ Explore State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class ExploreState {
  final List<ExploreCategory> categories;
  final List<FeedPost> trendingPosts;
  final ExploreLoadState loadState;
  final String? selectedCategory;
  final String? nextCursor;

  const ExploreState({
    this.categories = const [],
    this.trendingPosts = const [],
    this.loadState = ExploreLoadState.initial,
    this.selectedCategory,
    this.nextCursor,
  });

  ExploreState copyWith({
    List<ExploreCategory>? categories,
    List<FeedPost>? trendingPosts,
    ExploreLoadState? loadState,
    String? selectedCategory,
    String? nextCursor,
  }) {
    return ExploreState(
      categories: categories ?? this.categories,
      trendingPosts: trendingPosts ?? this.trendingPosts,
      loadState: loadState ?? this.loadState,
      selectedCategory: selectedCategory,
      nextCursor: nextCursor ?? this.nextCursor,
    );
  }
}

// â”€â”€â”€ Search State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Explore Notifier â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class ExploreNotifier extends StateNotifier<ExploreState> {
  final ApiClient _apiClient;

  ExploreNotifier(this._apiClient) : super(const ExploreState()) {
    loadExplore();
  }

  Future<void> loadExplore() async {
    state = state.copyWith(loadState: ExploreLoadState.loading);
    try {
      final queryParams = state.selectedCategory != null ? {'category': state.selectedCategory} : null;
      final res = await _apiClient.dio.get('/feed/explore', queryParameters: queryParams);
      
      if (res.statusCode == 200) {
        final dataList = res.data['data'] as List;
        final nextCursor = res.data['nextCursor'] as String?;
        final posts = dataList.map((j) => FeedPost.fromJson(j)).toList();
        
        state = state.copyWith(
          categories: MockExploreData.categories(),
          trendingPosts: posts,
          loadState: ExploreLoadState.loaded,
          nextCursor: nextCursor,
        );
      } else {
        state = state.copyWith(loadState: ExploreLoadState.error);
      }
    } catch (e) {
      state = state.copyWith(loadState: ExploreLoadState.error);
    }
  }

  Future<void> refreshExplore() async {
    await loadExplore();
  }

  void selectCategory(String? category) {
    state = state.copyWith(selectedCategory: category == state.selectedCategory ? null : category);
    loadExplore();
  }
}

// â”€â”€â”€ Search Notifier â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

    // Auto-search debounce
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
          // If the structure is completely unexpected, convert res.data to a string
          throw Exception("Unexpected data structure: ${res.data}");
        }
        
        final results = dataList.map((j) => FeedPost.fromJson(j as Map<String, dynamic>)).toList();
        
        state = state.copyWith(
          results: results,
          searchLoadState: results.isEmpty ? SearchLoadState.empty : SearchLoadState.loaded,
        );
      } else {
        throw Exception("Status code: ${res.statusCode}");
      }
    } catch (e) {
      debugPrint('SEARCH ERROR: $e');
      state = state.copyWith(
        searchLoadState: SearchLoadState.loaded,
        results: [
          FeedPost(
            id: 'err',
            brandId: '',
            title: 'Search failed: $e',
            description: '',
            mediaUrl: '',
            brandName: 'Error',
            brandAvatar: '',
            timestamp: 'Just now',
          )
        ],
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
    final updated = [term, ...state.recentSearches.where((s) => s != term)].take(8).toList();
    state = state.copyWith(recentSearches: updated);
  }

  void removeRecent(String term) {
    state = state.copyWith(recentSearches: state.recentSearches.where((s) => s != term).toList());
  }

  void clearRecent() {
    state = state.copyWith(recentSearches: []);
  }
}

// ──────────────────────────────────────────────────
final exploreProvider = StateNotifierProvider.autoDispose<ExploreNotifier, ExploreState>(
  (ref) {
    return ExploreNotifier(ref.watch(apiClientProvider));
  }
);

final searchProvider = StateNotifierProvider.autoDispose<SearchNotifier, SearchState>(
  (ref) {
    return SearchNotifier(ref.watch(apiClientProvider));
  }
);
