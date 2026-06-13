import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/haptics.dart';
import '../home/widgets/bottom_nav_dock.dart';
import '../auth/providers/auth_provider.dart';
import 'providers/explore_provider.dart';
import 'widgets/explore_search_bar.dart';
import 'widgets/search_suggestions.dart';
import 'widgets/search_results_grid.dart';
import 'widgets/trending_grid.dart';
import 'widgets/category_chips.dart';

class ExploreScreen extends ConsumerStatefulWidget {
  const ExploreScreen({super.key});

  @override
  ConsumerState<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends ConsumerState<ExploreScreen> {
  final _scrollCtrl = ScrollController();
  final _searchCtrl = TextEditingController();
  final FocusNode _searchFocus = FocusNode();
  bool _isScrolled = false;

  @override
  void initState() {
    super.initState();
    _scrollCtrl.addListener(_onScroll);
    _searchFocus.addListener(_onFocusChange);
  }

  @override
  void dispose() {
    _scrollCtrl.dispose();
    _searchCtrl.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollCtrl.offset > 50 && !_isScrolled) {
      setState(() => _isScrolled = true);
    } else if (_scrollCtrl.offset <= 50 && _isScrolled) {
      setState(() => _isScrolled = false);
    }
  }

  void _onFocusChange() {
    ref.read(searchProvider.notifier).toggleActive(_searchFocus.hasFocus);
  }

  Future<void> _onRefresh() async {
    Haptics.light();
    await ref.read(exploreProvider.notifier).refreshExplore();
  }

  void _navTo(int index) {
    if (index == 0) context.go('/home');
    if (index == 1) return; // Already here
    if (index == 2) context.push('/create');
    if (index == 3) context.push('/messages');
    if (index == 4) {
      final role = ref.read(authProvider).loggedInRole;
      if (role == UserRole.brand) {
        context.push('/brand/me');
      } else {
        context.push('/profile');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final searchState = ref.watch(searchProvider);
    
    return Scaffold(
      backgroundColor: context.colors.background,
      body: Stack(
        children: [
          // Background Glow
          Positioned(
            top: -100,
            left: -100,
            right: -100,
            height: 300,
            child: Container(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  colors: [
                    context.colors.primaryAccent.withValues(alpha: 0.15),
                    Colors.transparent,
                  ],
                  radius: 0.8,
                ),
              ),
            ),
          ),
          
          // Main Scroll Content
          RefreshIndicator(
            onRefresh: _onRefresh,
            color: context.colors.primaryAccent,
            backgroundColor: context.colors.surface,
            edgeOffset: 120,
            child: CustomScrollView(
              controller: _scrollCtrl,
              physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
              slivers: [
                SliverPadding(
                  // Increased padding to prevent overlap with the floating search bar header
                  padding: EdgeInsets.only(
                    top: MediaQuery.of(context).padding.top + 200,
                    bottom: 120,
                  ),
                  sliver: searchState.isActive || searchState.query.isNotEmpty
                      ? _buildSearchResults()
                      : _buildExploreContent(),
                ),
              ],
            ),
          ),

          // Floating Header & Search
          _buildFloatingHeader(),

          // Search Suggestions Overlay
          if (searchState.isActive)
            Positioned(
              top: MediaQuery.of(context).padding.top + 100,
              left: 20,
              right: 20,
              child: SearchSuggestions(
                suggestions: searchState.suggestions,
                recentSearches: searchState.recentSearches,
                onClear: () {
                  ref.read(searchProvider.notifier).clearRecent();
                },
                onSelect: (term) {
                  _searchCtrl.text = term;
                  _searchFocus.unfocus();
                  ref.read(searchProvider.notifier).updateQuery(term);
                  ref.read(searchProvider.notifier).search();
                },
                onRemoveRecent: (term) {
                  ref.read(searchProvider.notifier).removeRecent(term);
                },
              ),
            ),

          // Bottom Navigation Dock
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: BottomNavDock(
              currentIndex: 1, // Explore is index 1
              onTap: _navTo,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFloatingHeader() {
    final searchState = ref.watch(searchProvider);
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: ClipRRect(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: _isScrolled ? 20 : 0, sigmaY: _isScrolled ? 20 : 0),
          child: Container(
            color: context.colors.background.withValues(alpha: _isScrolled ? 0.7 : 0.0),
            padding: EdgeInsets.only(
              top: MediaQuery.of(context).padding.top + 10,
              bottom: 20,
              left: 20,
              right: 20,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Animated Title Row
                AnimatedCrossFade(
                  firstChild: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Explore', style: AppTypography.headlineLarge.copyWith(color: context.colors.textPrimary)),
                          Text('Curated for you', style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary)),
                        ],
                      ),
                    ],
                  ),
                  secondChild: const SizedBox(height: 0),
                  crossFadeState: searchState.isActive || _isScrolled 
                      ? CrossFadeState.showSecond 
                      : CrossFadeState.showFirst,
                  duration: const Duration(milliseconds: 200),
                ),
                SizedBox(height: searchState.isActive || _isScrolled ? 0 : AppSpacing.md),
                
                // Search Bar
                ExploreSearchBar(
                  controller: _searchCtrl,
                  focusNode: _searchFocus,
                  onChanged: (val) {
                    ref.read(searchProvider.notifier).updateQuery(val);
                  },
                  onSubmitted: (val) {
                    _searchFocus.unfocus();
                    ref.read(searchProvider.notifier).search();
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildExploreContent() {
    final state = ref.watch(exploreProvider);
    
    if (state.loadState == ExploreLoadState.initial || state.loadState == ExploreLoadState.loading) {
      return SliverToBoxAdapter(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.only(top: 100),
            child: CircularProgressIndicator(color: context.colors.primaryAccent),
          ),
        ),
      );
    }

    return SliverList(
      delegate: SliverChildListDelegate([
        CategoryChips(
          categories: state.categories,
          selectedCategory: state.selectedCategory,
          onSelect: (cat) {
            ref.read(exploreProvider.notifier).selectCategory(cat);
            Haptics.selection();
          },
        ),
        const SizedBox(height: AppSpacing.xxl),
        
        // Removed SuggestedCarousel & BrandSpotlight because the backend API 
        // currently returns a unified feed of explore posts. We map this to TrendingGrid.
        TrendingGrid(
          posts: state.trendingPosts,
          onTap: (post) {
            Haptics.selection();
            context.push('/explore/post', extra: post);
          },
        ),
      ]),
    );
  }

  Widget _buildSearchResults() {
    final searchState = ref.watch(searchProvider);
    
    return SliverToBoxAdapter(
      child: SearchResultsGrid(
        results: searchState.results,
        isLoading: searchState.searchLoadState == SearchLoadState.loading,
      ),
    );
  }
}
