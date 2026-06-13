import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/haptics.dart';
import 'providers/brand_profile_provider.dart';
import 'widgets/brand_hero_header.dart';
import 'widgets/brand_action_buttons.dart';
import 'widgets/brand_tab_bar.dart';
import '../brand_profile/widgets/brand_posts_tab.dart';
import '../brand_profile/widgets/brand_gallery_tab.dart';
import '../brand_profile/widgets/brand_quicksite_tab.dart';
import '../reviews/presentation/screens/brand_reviews_tab.dart';
import '../lead_management/screens/lead_dashboard_screen.dart' as lyket_lead;
import '../command_center/screens/command_center_screen.dart';
import '../../core/network/api_client.dart';
import '../messaging/screens/chat_screen.dart';

class BrandProfileScreen extends ConsumerStatefulWidget {
  final String brandId;

  const BrandProfileScreen({super.key, required this.brandId});

  @override
  ConsumerState<BrandProfileScreen> createState() => _BrandProfileScreenState();
}

class _BrandProfileScreenState extends ConsumerState<BrandProfileScreen> {
  final _scrollCtrl = ScrollController();
  bool _isScrolled = false;

  @override
  void initState() {
    super.initState();
    _scrollCtrl.addListener(_handleScroll);
  }

  @override
  void dispose() {
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _handleScroll() {
    if (_scrollCtrl.offset > 200 && !_isScrolled) {
      setState(() => _isScrolled = true);
    } else if (_scrollCtrl.offset <= 200 && _isScrolled) {
      setState(() => _isScrolled = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(brandProfileProvider(widget.brandId));

    if (state.loadState == BrandLoadState.initial || state.loadState == BrandLoadState.loading) {
      return Scaffold(
        backgroundColor: context.colors.background,
        body: Center(child: CircularProgressIndicator(color: context.colors.primaryAccent)),
      );
    }

    if (state.loadState == BrandLoadState.error) {
      return Scaffold(
        backgroundColor: context.colors.background,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Text(
              state.errorMessage ?? 'Failed to load brand profile. Please check your connection or login status.',
              style: const TextStyle(color: Colors.red),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      );
    }

    if (state.profile == null) {
      return Scaffold(
        backgroundColor: context.colors.background,
        body: Center(child: Text('Brand not found', style: TextStyle(color: Colors.white))),
      );
    }

    final profile = state.profile!;
    final showQuicksite = state.quicksite != null;

    final tabs = ['Posts', 'Gallery'];
    if (showQuicksite) tabs.add('Quicksite');
    tabs.add('Reviews');

    final tabViews = <Widget>[
      _buildTabWrapper(BrandPostsTab(posts: state.posts, profile: profile)),
      _buildTabWrapper(BrandGalleryTab(
        gallery: state.gallery,
        isOwner: profile.isOwner,
      )),
    ];
    if (showQuicksite) {
      tabViews.add(_buildTabWrapper(BrandQuicksiteTab(quicksiteData: state.quicksite!)));
    }
    tabViews.add(_buildTabWrapper(BrandReviewsTab(brandId: widget.brandId, isOwner: profile.isOwner)));

    return DefaultTabController(
      length: tabs.length,
      child: Scaffold(
        backgroundColor: context.colors.background,
        body: Stack(
          children: [
            NestedScrollView(
              controller: _scrollCtrl,
              headerSliverBuilder: (context, innerBoxIsScrolled) {
                return [
                  BrandHeroHeader(profile: profile),
                  SliverToBoxAdapter(
                    child: Column(
                      children: [
                        if (!profile.isOwner) BrandActionButtons(
                          profile: profile,
                          onFollowToggled: () {
                            // TODO: implement follow API call
                          },
                          onMessageTap: () async {
                            try {
                              final api = ref.read(apiClientProvider);
                              final res = await api.dio.post('/conversations/start', data: {'brandId': profile.id});
                              final conversationId = res.data['id'];
                              if (!context.mounted) return;
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (context) => ChatScreen(conversationId: conversationId),
                                ),
                              );
                            } catch (e) {
                              if (!context.mounted) return;
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Failed to start conversation. Please try again.')),
                              );
                            }
                          },
                        ),
                        const SizedBox(height: AppSpacing.lg),
                      ],
                    ),
                  ),
                  SliverPersistentHeader(
                    pinned: true,
                    delegate: _BrandTabBarDelegate(
                      child: Builder(
                        builder: (context) {
                          final tabController = DefaultTabController.of(context);
                          return AnimatedBuilder(
                            animation: tabController,
                            builder: (context, _) => BrandTabBar(
                              selectedIndex: tabController.index,
                              onTabChanged: (i) => tabController.animateTo(i),
                              tabs: tabs,
                            ),
                          );
                        }
                      ),
                    ),
                  ),
                ];
              },
              body: TabBarView(
                physics: const NeverScrollableScrollPhysics(), // Since content is scrollable inside
                children: tabViews,
              ),
            ),
            
            // Custom Back Button Overlay
          Positioned(
            top: MediaQuery.of(context).padding.top + 10,
            left: 20,
            child: GestureDetector(
              onTap: () {
                Haptics.selection();
                context.pop();
              },
              child: ClipRRect(
                borderRadius: BorderRadius.circular(30),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    color: context.colors.surface.withValues(alpha: 0.5),
                    child: const Icon(Icons.arrow_back_rounded, color: Colors.white, size: 24),
                  ),
                ),
              ),
            ),
          ),

          // Owner Tools Floating Dock (if owner)
          if (profile.isOwner)
            Positioned(
              bottom: MediaQuery.of(context).padding.bottom + 20,
              left: 0, right: 0,
              child: Center(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(100),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.75),
                        borderRadius: BorderRadius.circular(100),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.15), width: 0.5),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          GestureDetector(
                            onTap: () {
                              Haptics.selection();
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (context) => const CommandCenterScreen(),
                                ),
                              );
                            },
                            child: Text(
                              'Edit Profile', 
                              style: AppTypography.buttonSmall.copyWith(
                                color: Colors.white, 
                                fontWeight: FontWeight.w600,
                                letterSpacing: 0.3,
                              )
                            ),
                          ),
                          const SizedBox(width: 24),
                          Container(width: 1, height: 14, color: Colors.white.withValues(alpha: 0.2)),
                          const SizedBox(width: 24),
                          GestureDetector(
                            onTap: () {
                              Haptics.selection();
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (context) => const lyket_lead.LeadDashboardScreen(),
                                ),
                              );
                            },
                            child: Text(
                              'Lead Center', 
                              style: AppTypography.buttonSmall.copyWith(
                                color: Colors.white, 
                                fontWeight: FontWeight.w600,
                                letterSpacing: 0.3,
                              )
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    ));
  }

  // Wraps tab content in a SingleChildScrollView so NestedScrollView works correctly with variable heights
  Widget _buildTabWrapper(Widget child) {
    return Builder(
      builder: (context) {
        return CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverPadding(
              padding: EdgeInsets.only(
                top: AppSpacing.lg,
                bottom: MediaQuery.of(context).padding.bottom + 100, // Space for floating dock
              ),
              sliver: SliverToBoxAdapter(
                child: child,
              ),
            ),
          ],
        );
      }
    );
  }
}

class _BrandTabBarDelegate extends SliverPersistentHeaderDelegate {
  final Widget child;

  _BrandTabBarDelegate({required this.child});

  @override
  double get minExtent => 60.0;
  @override
  double get maxExtent => 60.0;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: context.colors.background,
      child: child,
    );
  }

  @override
  bool shouldRebuild(covariant _BrandTabBarDelegate oldDelegate) {
    return oldDelegate.child != child;
  }
}
