import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../models/dashboard_models.dart';
import '../providers/dashboard_providers.dart';
import '../services/dashboard_service.dart';
import 'package:intl/intl.dart';

class DashboardPostCardList extends ConsumerStatefulWidget {
  final List<PostAnalytics> posts;

  const DashboardPostCardList({super.key, required this.posts});

  @override
  ConsumerState<DashboardPostCardList> createState() => _DashboardPostCardListState();
}

class _DashboardPostCardListState extends ConsumerState<DashboardPostCardList> {
  String _searchQuery = '';
  String _selectedObjective = 'All';
  String _selectedPerformance = 'All';

  @override
  Widget build(BuildContext context) {
    final statusFilter = ref.watch(dashboardPostsStatusFilterProvider);
    final filteredPosts = widget.posts.where((p) {
      final matchesSearch = p.title.toLowerCase().contains(_searchQuery.toLowerCase());
      final matchesObjective = _selectedObjective == 'All' || p.objective == _selectedObjective;
      final matchesPerformance = _selectedPerformance == 'All' || p.performanceScore == _selectedPerformance;
      return matchesSearch && matchesObjective && matchesPerformance;
    }).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Post Performance',
          style: AppTypography.titleLarge.copyWith(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        _buildStatusTabs(context, statusFilter),
        const SizedBox(height: AppSpacing.md),
        _buildFilters(context),
        const SizedBox(height: AppSpacing.lg),
        if (filteredPosts.isEmpty)
          Container(
            height: 200,
            alignment: Alignment.center,
            child: Text(
              'No posts found.',
              style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
            ),
          )
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: filteredPosts.length,
            separatorBuilder: (context, index) => const SizedBox(height: AppSpacing.md),
            itemBuilder: (context, index) {
              return _PostAnalyticsCard(
                post: filteredPosts[index],
                statusFilter: statusFilter,
                onTap: () {
                  ref.read(selectedPostProvider.notifier).state = filteredPosts[index];
                  Scaffold.of(context).openEndDrawer();
                },
              ).animate().fadeIn(delay: (50 * index).ms).slideY(begin: 0.1, end: 0);
            },
          ),
      ],
    );
  }

  Widget _buildStatusTabs(BuildContext context, String currentStatus) {
    final tabs = ['All', 'PUBLISHED', 'ARCHIVED'];
    final displayNames = {'All': 'All', 'PUBLISHED': 'Published', 'ARCHIVED': 'Archived'};

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: context.colors.surfaceSecondary,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: tabs.map((tab) {
            final isSelected = currentStatus == tab;
            return GestureDetector(
              onTap: () {
                ref.read(dashboardPostsStatusFilterProvider.notifier).state = tab;
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected ? context.colors.surface : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                  boxShadow: isSelected ? context.shadows.layer1 : null,
                ),
                child: Text(
                  displayNames[tab]!,
                  style: AppTypography.labelMedium.copyWith(
                    color: isSelected ? const Color(0xFFFF0000) : const Color(0xFFFF0000).withOpacity(0.5),
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildFilters(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          // Search
          Container(
            width: 200,
            height: 40,
            decoration: BoxDecoration(
              color: context.colors.surfaceSecondary,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: context.colors.borderLight.withOpacity(0.1)),
            ),
            child: TextField(
              onChanged: (val) => setState(() => _searchQuery = val),
              style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
              decoration: InputDecoration(
                hintText: 'Search posts...',
                hintStyle: AppTypography.bodyMedium.copyWith(color: context.colors.textTertiary),
                prefixIcon: Icon(Icons.search_rounded, size: 20, color: context.colors.textTertiary),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 10),
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          _buildDropdown(
            context,
            value: _selectedObjective,
            items: ['All', 'Awareness', 'Traffic', 'Lead Generation', 'Messaging', 'Conversions'],
            onChanged: (val) => setState(() => _selectedObjective = val!),
          ),
          const SizedBox(width: AppSpacing.sm),
          _buildDropdown(
            context,
            value: _selectedPerformance,
            items: ['All', 'Excellent', 'Good', 'Average', 'Poor'],
            onChanged: (val) => setState(() => _selectedPerformance = val!),
          ),
        ],
      ),
    );
  }

  Widget _buildDropdown(BuildContext context, {required String value, required List<String> items, required ValueChanged<String?> onChanged}) {
    return Container(
      height: 40,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: context.colors.surfaceSecondary,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.colors.borderLight.withOpacity(0.1)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          icon: Icon(Icons.keyboard_arrow_down_rounded, color: context.colors.textSecondary, size: 20),
          dropdownColor: context.colors.surfaceSecondary,
          style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
          onChanged: onChanged,
          items: items.map((item) => DropdownMenuItem(value: item, child: Text(item))).toList(),
        ),
      ),
    );
  }
}

class _PostAnalyticsCard extends ConsumerWidget {
  final PostAnalytics post;
  final VoidCallback onTap;
  final String statusFilter;

  const _PostAnalyticsCard({
    required this.post,
    required this.onTap,
    required this.statusFilter,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    String formattedDate = '';
    try {
      final dt = DateTime.parse(post.createdAt);
      formattedDate = DateFormat('MMM d').format(dt);
    } catch (_) {}

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        splashColor: context.colors.primaryAccent.withOpacity(0.1),
        highlightColor: context.colors.primaryAccent.withOpacity(0.05),
        child: Ink(
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: context.colors.surfaceSecondary,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: context.colors.borderLight.withOpacity(0.1)),
            boxShadow: context.shadows.layer1,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Row 1: Header (Thumbnail, Title, Badges, Score)
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: post.thumbnail != null
                        ? Image.network(
                            post.thumbnail!,
                            width: 48,
                            height: 48,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => _buildPlaceholder(context),
                          )
                        : _buildPlaceholder(context),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                post.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AppTypography.bodyMedium.copyWith(
                                  color: context.colors.textPrimary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            const SizedBox(width: AppSpacing.sm),
                            _buildScoreHeader(context),
                            const SizedBox(width: AppSpacing.xs),
                            InkWell(
                              onTap: () => _showPostMenu(context, ref),
                              borderRadius: BorderRadius.circular(16),
                              child: Padding(
                                padding: const EdgeInsets.all(4),
                                child: Icon(Icons.more_vert_rounded, size: 20, color: context.colors.textSecondary),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Wrap(
                          crossAxisAlignment: WrapCrossAlignment.center,
                          spacing: 8,
                          runSpacing: 4,
                          children: [
                            Text(
                              formattedDate,
                              style: AppTypography.labelSmall.copyWith(color: context.colors.textTertiary),
                            ),
                            _buildBadge(context, post.objective, context.colors.primaryAccent),
                            _buildStatusPill(context, post.performanceScore),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              // Row 2: Metrics
              Container(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
                decoration: BoxDecoration(
                  color: context.colors.background,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: context.colors.borderLight.withOpacity(0.05)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildCompactMetric(context, 'Reach', _formatNumber(post.metrics.impressions), post.trends.impressionsTrend),
                    _buildCompactMetric(context, 'Leads', post.metrics.leads.toString(), post.trends.leadsTrend),
                    _buildCompactMetric(context, 'CTR', '${post.metrics.ctr}%', post.trends.ctrTrend),
                    _buildCompactMetric(context, 'Msgs', post.metrics.messages.toString(), post.trends.messagesTrend),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showPostMenu(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      backgroundColor: context.colors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (BuildContext bottomSheetContext) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (statusFilter == 'ARCHIVED') ...[
                  _buildMenuAction(
                    context,
                    icon: Icons.restore_rounded,
                    label: 'Restore Post',
                    onTap: () {
                      Navigator.pop(bottomSheetContext);
                      _showRestoreDialog(context, ref);
                    },
                  ),
                  _buildMenuAction(
                    context,
                    icon: Icons.analytics_outlined,
                    label: 'View Analytics',
                    onTap: () {
                      Navigator.pop(bottomSheetContext);
                      onTap();
                    },
                  ),
                  _buildMenuAction(
                    context,
                    icon: Icons.delete_forever_rounded,
                    label: 'Delete Permanently',
                    isDestructive: true,
                    onTap: () {
                      Navigator.pop(bottomSheetContext);
                    },
                  ),
                ] else ...[
                  _buildMenuAction(
                    context,
                    icon: Icons.archive_outlined,
                    label: 'Archive Post',
                    onTap: () {
                      Navigator.pop(bottomSheetContext);
                      _showArchiveDialog(context, ref);
                    },
                  ),
                  _buildMenuAction(
                    context,
                    icon: Icons.analytics_outlined,
                    label: 'View Analytics',
                    onTap: () {
                      Navigator.pop(bottomSheetContext);
                      onTap();
                    },
                  ),
                  _buildMenuAction(
                    context,
                    icon: Icons.delete_outline_rounded,
                    label: 'Delete Post',
                    isDestructive: true,
                    onTap: () {
                      Navigator.pop(bottomSheetContext);
                    },
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildMenuAction(BuildContext context, {required IconData icon, required String label, required VoidCallback onTap, bool isDestructive = false}) {
    final color = isDestructive ? context.colors.error : context.colors.textPrimary;
    return ListTile(
      leading: Icon(icon, color: color),
      title: Text(label, style: AppTypography.bodyMedium.copyWith(color: color, fontWeight: FontWeight.w500)),
      onTap: onTap,
    );
  }

  void _showRestoreDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          backgroundColor: context.colors.surface,
          title: Text('Restore Post?', style: AppTypography.titleMedium.copyWith(color: context.colors.textPrimary)),
          content: Text('This post will become publicly visible again.', style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary)),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: Text('Cancel', style: AppTypography.buttonSmall.copyWith(color: context.colors.textSecondary)),
            ),
            TextButton(
              onPressed: () async {
                Navigator.pop(dialogContext);
                await ref.read(dashboardServiceProvider).unarchivePost(post.id);
                ref.invalidate(dashboardPostsProvider);
              },
              child: Text('Restore', style: AppTypography.buttonSmall.copyWith(color: context.colors.primaryAccent)),
            ),
          ],
        );
      },
    );
  }

  void _showArchiveDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          backgroundColor: context.colors.surface,
          title: Text('Archive Post?', style: AppTypography.titleMedium.copyWith(color: context.colors.textPrimary)),
          content: Text('This post will be removed from public feeds.', style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary)),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: Text('Cancel', style: AppTypography.buttonSmall.copyWith(color: context.colors.textSecondary)),
            ),
            TextButton(
              onPressed: () async {
                Navigator.pop(dialogContext);
                await ref.read(dashboardServiceProvider).archivePost(post.id);
                ref.invalidate(dashboardPostsProvider);
              },
              child: Text('Archive', style: AppTypography.buttonSmall.copyWith(color: context.colors.primaryAccent)),
            ),
          ],
        );
      },
    );
  }

  Widget _buildScoreHeader(BuildContext context) {
    return Row(
      children: [
        SizedBox(
          width: 16,
          height: 16,
          child: CircularProgressIndicator(
            value: post.performanceScoreValue / 100,
            strokeWidth: 2.5,
            backgroundColor: context.colors.borderLight.withOpacity(0.1),
            valueColor: AlwaysStoppedAnimation<Color>(_getScoreColor(context, post.performanceScoreValue)),
          ),
        ),
        const SizedBox(width: 6),
        Text(
          '${post.performanceScoreValue}',
          style: AppTypography.labelMedium.copyWith(color: context.colors.textPrimary, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  Widget _buildCompactMetric(BuildContext context, String label, String value, double trend) {
    final isPositive = trend >= 0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: AppTypography.labelSmall.copyWith(color: context.colors.textTertiary, fontSize: 10),
        ),
        const SizedBox(height: 2),
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text(
              value,
              style: AppTypography.labelLarge.copyWith(color: context.colors.textPrimary, fontWeight: FontWeight.bold),
            ),
            const SizedBox(width: 4),
            Icon(isPositive ? Icons.arrow_upward_rounded : Icons.arrow_downward_rounded, 
                size: 10, color: isPositive ? context.colors.success : context.colors.error),
          ],
        ),
      ],
    );
  }

  Widget _buildBadge(BuildContext context, String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        text,
        style: AppTypography.labelSmall.copyWith(color: color, fontSize: 10, fontWeight: FontWeight.w600),
      ),
    );
  }

  Widget _buildStatusPill(BuildContext context, String status) {
    Color color;
    switch (status) {
      case 'Excellent': color = context.colors.success; break;
      case 'Good': color = context.colors.primaryAccent; break;
      case 'Poor': color = context.colors.error; break;
      default: color = const Color(0xFFF59E0B); break; // Amber
    }
    return _buildBadge(context, status, color);
  }

  Color _getScoreColor(BuildContext context, int score) {
    if (score >= 80) return context.colors.success;
    if (score >= 60) return context.colors.primaryAccent;
    if (score < 40) return context.colors.error;
    return const Color(0xFFF59E0B);
  }

  Widget _buildPlaceholder(BuildContext context) {
    return Container(
      width: 48,
      height: 48,
      color: context.colors.surface,
      child: Icon(Icons.image_rounded, size: 20, color: context.colors.textTertiary),
    );
  }

  String _formatNumber(int number) {
    if (number >= 1000) return '${(number / 1000).toStringAsFixed(1)}k';
    return number.toString();
  }
}
