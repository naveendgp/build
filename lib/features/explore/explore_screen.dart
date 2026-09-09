import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
import 'widgets/trending_hero_carousel.dart';
import 'widgets/limited_offers_row.dart';
import 'widgets/trending_brands_carousel.dart';
import 'widgets/explore_category_chips.dart';
import 'widgets/explore_masonry_feed.dart';
import 'widgets/recommended_for_you_row.dart';
import 'widgets/explore_section_header.dart';
import '../home/models/feed_models.dart';


class ExploreScreen extends ConsumerStatefulWidget {
  const ExploreScreen({super.key});

  @override
  ConsumerState<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends ConsumerState<ExploreScreen>
    with SingleTickerProviderStateMixin {
  final _scrollCtrl = ScrollController();
  final _searchCtrl = TextEditingController();
  final FocusNode _searchFocus = FocusNode();
  bool _isScrolled = false;
  late final AnimationController _headerAnimCtrl;
  late final Animation<double> _headerFadeAnim;

  // Compact header height when scrolled
  static const double _headerExpandedHeight = 130.0;
  static const double _headerCollapsedHeight = 72.0;

  @override
  void initState() {
    super.initState();
    _headerAnimCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 250),
    );
    _headerFadeAnim =
        CurvedAnimation(parent: _headerAnimCtrl, curve: Curves.easeOut);
    _scrollCtrl.addListener(_onScroll);
    _searchFocus.addListener(_onFocusChange);
  }

  @override
  void dispose() {
    _scrollCtrl.dispose();
    _searchCtrl.dispose();
    _searchFocus.dispose();
    _headerAnimCtrl.dispose();
    super.dispose();
  }

  void _onScroll() {
    final scrolled = _scrollCtrl.offset > 40;
    if (scrolled != _isScrolled) {
      setState(() => _isScrolled = scrolled);
      if (scrolled) {
        _headerAnimCtrl.forward();
      } else {
        _headerAnimCtrl.reverse();
      }
    }
  }

  void _onFocusChange() {
    ref.read(searchProvider.notifier).toggleActive(_searchFocus.hasFocus);
  }

  Future<void> _onRefresh() async {
    HapticFeedback.mediumImpact();
    await ref.read(exploreProvider.notifier).refreshExplore();
  }

  void _navTo(int index) {
    if (index == 0) context.go('/home');
    if (index == 1) return;
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

  double get _currentHeaderHeight =>
      _isScrolled ? _headerCollapsedHeight : _headerExpandedHeight;

  /// The dropdown floats in the Stack, so nothing else bounds its height —
  /// without a cap, eight recents plus suggestions cover the whole screen.
  double _suggestionsMaxHeight(BuildContext context, double topPad) {
    final mq = MediaQuery.of(context);
    final available = mq.size.height -
        (topPad + _currentHeaderHeight) -
        mq.viewInsets.bottom -
        24;
    return available.clamp(120.0, 420.0);
  }

  @override
  Widget build(BuildContext context) {
    final searchState = ref.watch(searchProvider);
    final topPad = MediaQuery.of(context).padding.top;

    return Scaffold(
      backgroundColor: context.colors.background,
      body: Stack(
        children: [
          // ── Ambient glow orbs ──────────────────────────────
          Positioned(
            top: -80,
            left: -60,
            child: Container(
              width: 260,
              height: 260,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    context.colors.primaryAccent.withOpacity(0.12),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            top: 60,
            right: -80,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    context.colors.secondaryAccent.withOpacity(0.08),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // ── Main scroll body ───────────────────────────────
          RefreshIndicator(
            onRefresh: _onRefresh,
            color: context.colors.primaryAccent,
            backgroundColor: context.colors.surface,
            edgeOffset: topPad + _currentHeaderHeight,
            child: CustomScrollView(
              controller: _scrollCtrl,
              physics: const BouncingScrollPhysics(
                  parent: AlwaysScrollableScrollPhysics()),
              slivers: [
                // Top spacer for floating header
                SliverToBoxAdapter(
                  child: SizedBox(
                      height: topPad + _currentHeaderHeight + 12),
                ),

                // Content
                if (searchState.isActive || searchState.query.isNotEmpty)
                  _buildSearchResultsSliver()
                else
                  _buildExploreContent(),

                // Bottom nav clearance
                const SliverToBoxAdapter(child: SizedBox(height: 120)),
              ],
            ),
          ),

          // ── Floating header ────────────────────────────────
          _buildFloatingHeader(topPad),

          // ── Search suggestions overlay ─────────────────────
          if (searchState.isActive &&
              searchState.searchLoadState == SearchLoadState.idle)
            Positioned(
              top: topPad + _currentHeaderHeight - 4,
              left: 16,
              right: 16,
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxHeight: _suggestionsMaxHeight(context, topPad),
                ),
                child: SearchSuggestions(
                  suggestions: searchState.suggestions,
                  recentSearches: searchState.recentSearches,
                  onClear: () =>
                      ref.read(searchProvider.notifier).clearRecent(),
                  onSelect: (term) {
                    _searchCtrl.text = term;
                    _searchFocus.unfocus();
                    ref.read(searchProvider.notifier).updateQuery(term);
                    ref.read(searchProvider.notifier).search();
                  },
                  onRemoveRecent: (term) =>
                      ref.read(searchProvider.notifier).removeRecent(term),
                ),
              ),
            ),

          // ── Bottom Nav Dock ────────────────────────────────
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: BottomNavDock(currentIndex: 1, onTap: _navTo),
          ),
        ],
      ),
    );
  }

  // ── Floating Header ─────────────────────────────────────
  Widget _buildFloatingHeader(double topPad) {
    final searchState = ref.watch(searchProvider);
    final showTitle = !searchState.isActive && !_isScrolled;

    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: ClipRect(
        child: BackdropFilter(
          filter: ImageFilter.blur(
            sigmaX: _isScrolled ? 24 : 0,
            sigmaY: _isScrolled ? 24 : 0,
          ),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOutCubic,
            color: _isScrolled
                ? context.colors.background.withOpacity(0.82)
                : Colors.transparent,
            padding: EdgeInsets.only(
              top: topPad + 12,
              bottom: 14,
              left: AppSpacing.md,
              right: AppSpacing.md,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Title — collapses when scrolled or searching
                AnimatedCrossFade(
                  duration: const Duration(milliseconds: 220),
                  crossFadeState: showTitle
                      ? CrossFadeState.showFirst
                      : CrossFadeState.showSecond,
                  firstChild: _buildHeaderTitle(),
                  secondChild: const SizedBox(height: 0, width: double.infinity),
                ),
                AnimatedContainer(
                  duration: const Duration(milliseconds: 220),
                  height: showTitle ? 12 : 0,
                ),
                // Search bar
                ExploreSearchBar(
                  controller: _searchCtrl,
                  focusNode: _searchFocus,
                  hintText: 'Search brands, products, offers...',
                  onChanged: (val) =>
                      ref.read(searchProvider.notifier).updateQuery(val),
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

  Widget _buildHeaderTitle() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Discover',
              style: AppTypography.displaySmall.copyWith(
                color: context.colors.textPrimary,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.8,
              ),
            ),
            Text(
              'Curated just for you',
              style: AppTypography.bodySmall.copyWith(
                color: context.colors.textSecondary,
              ),
            ),
          ],
        ),

      ],
    );
  }

  // ── Search results sliver ────────────────────────────────
  Widget _buildSearchResultsSliver() {
    final searchState = ref.watch(searchProvider);
    return SliverToBoxAdapter(
      child: SearchResultsGrid(
        results: searchState.results,
        isLoading: searchState.searchLoadState == SearchLoadState.loading,
      ),
    );
  }

  // ── Explore content ──────────────────────────────────────
  Widget _buildExploreContent() {
    final state = ref.watch(exploreProvider);

    if (state.loadState == ExploreLoadState.initial ||
        state.loadState == ExploreLoadState.loading) {
      return SliverToBoxAdapter(child: _buildLoadingSkeleton());
    }

    if (state.loadState == ExploreLoadState.error &&
        state.trendingPosts.isEmpty) {
      return SliverToBoxAdapter(child: _buildErrorState());
    }

    return SliverList(
      delegate: SliverChildListDelegate([
        // ── Section 1: Trending Now ──────────────────────
        ExploreSectionHeader(
          title: 'Trending Now',
          subtitle: 'Most engaging posts right now',
        ),
        const SizedBox(height: 14),
        TrendingHeroCarousel(
          posts: state.trendingPosts,
          onTap: (post) {
            Haptics.selection();
            context.push('/explore/post', extra: post);
          },
        ),

        const SizedBox(height: 28),

        // ── Section 2: Limited Time Offers ───────────────
        if (state.offers.isNotEmpty) ...[
          ExploreSectionHeader(
            title: 'Limited Time Offers',
            subtitle: 'Deals ending soon',
            badge: _UrgentBadge(),
          ),
          const SizedBox(height: 14),
          LimitedOffersRow(
            offers: state.offers,
            onTap: (offer) {
              Haptics.selection();
              context.push('/explore/post', extra: FeedPost(
                id: offer.id,
                brandId: '', 
                brandName: offer.brandName,
                brandAvatar: '',
                mediaUrl: offer.mediaUrl,
                title: offer.title,
                description: offer.description,
                timestamp: 'Limited Offer',
              ));
            },
          ),
          const SizedBox(height: 28),
        ],

        // ── Section 4: Recommended For You ────────────────
        ExploreSectionHeader(
          title: 'Recommended For You',
          subtitle: 'Based on your activity',
        ),
        const SizedBox(height: 14),
        RecommendedForYouRow(
          posts: state.recommendedPosts,
          onTap: (post) {
            Haptics.selection();
            context.push('/explore/post', extra: post);
          },
        ),

        const SizedBox(height: 28),



        // ── Section 6: Explore Feed (masonry) ─────────────
        ExploreSectionHeader(
          title: 'Explore Feed',
          subtitle: state.selectedCategory != null
              ? 'Filtered by ${state.categories.firstWhere((c) => c.id == state.selectedCategory, orElse: () => state.categories.first).name}'
              : 'Discover everything',
        ),
        const SizedBox(height: 14),
        ExploreMasonryFeed(
          posts: state.trendingPosts + state.recommendedPosts,
          onTap: (post) {
            Haptics.selection();
            context.push('/explore/post', extra: post);
          },
        ),
      ]),
    );
  }

  // ── Loading skeleton ─────────────────────────────────────
  Widget _buildLoadingSkeleton() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Skeleton hero
          Container(
            height: 260,
            decoration: BoxDecoration(
              color: context.colors.surface,
              borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
            ),
          ),
          const SizedBox(height: 24),
          // Skeleton row
          Row(
            children: List.generate(
              3,
              (_) => Expanded(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  height: 160,
                  decoration: BoxDecoration(
                    color: context.colors.surface,
                    borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),
          Container(
            height: 48,
            decoration: BoxDecoration(
              color: context.colors.surface,
              borderRadius: BorderRadius.circular(100),
            ),
          ),
          const SizedBox(height: 24),
          Center(
            child: CircularProgressIndicator(
              color: context.colors.primaryAccent,
              strokeWidth: 2,
            ),
          ),
        ],
      ),
    );
  }

  // ── Error state ──────────────────────────────────────────
  Widget _buildErrorState() {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        children: [
          const SizedBox(height: 48),
          Icon(Icons.wifi_off_rounded,
              size: 56, color: context.colors.textTertiary),
          const SizedBox(height: 16),
          Text(
            'Couldn\'t load content',
            style: AppTypography.titleSmall.copyWith(
              color: context.colors.textPrimary,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Check your connection and pull down to refresh.',
            style: AppTypography.bodySmall
                .copyWith(color: context.colors.textSecondary),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          GestureDetector(
            onTap: _onRefresh,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              decoration: BoxDecoration(
                color: context.colors.primaryAccent,
                borderRadius: BorderRadius.circular(100),
              ),
              child: Text(
                'Try Again',
                style: AppTypography.labelMedium.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Small badge widgets ──────────────────────────────────────

class _LiveBadge extends StatefulWidget {
  @override
  State<_LiveBadge> createState() => _LiveBadgeState();
}

class _LiveBadgeState extends State<_LiveBadge>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _pulse;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);
    _pulse = CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _pulse,
      builder: (_, __) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: const Color(0xFFFF3B30).withOpacity(0.15 + 0.08 * _pulse.value),
          borderRadius: BorderRadius.circular(100),
          border: Border.all(
            color: const Color(0xFFFF3B30).withOpacity(0.5),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFFFF3B30)
                    .withOpacity(0.6 + 0.4 * _pulse.value),
              ),
            ),
            const SizedBox(width: 5),
            Text(
              'LIVE',
              style: AppTypography.labelSmall.copyWith(
                color: const Color(0xFFFF3B30),
                fontWeight: FontWeight.w800,
                fontSize: 9,
                letterSpacing: 0.8,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _UrgentBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: const Color(0xFFF59E0B).withOpacity(0.15),
        borderRadius: BorderRadius.circular(100),
        border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.5)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('⏳', style: TextStyle(fontSize: 9)),
          const SizedBox(width: 4),
          Text(
            'Ends Soon',
            style: AppTypography.labelSmall.copyWith(
              color: const Color(0xFFF59E0B),
              fontWeight: FontWeight.w700,
              fontSize: 9,
            ),
          ),
        ],
      ),
    );
  }
}

class _AiBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: context.colors.primaryAccent.withOpacity(0.12),
        borderRadius: BorderRadius.circular(100),
        border: Border.all(
            color: context.colors.primaryAccent.withOpacity(0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.auto_awesome_rounded,
              size: 9, color: context.colors.primaryAccent),
          const SizedBox(width: 4),
          Text(
            'AI',
            style: AppTypography.labelSmall.copyWith(
              color: context.colors.primaryAccent,
              fontWeight: FontWeight.w800,
              fontSize: 9,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}
