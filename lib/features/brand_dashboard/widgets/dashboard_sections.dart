import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/adaptive/adaptive.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/video_thumbnail.dart';
import '../../../core/utils/app_messenger.dart';
import '../../../core/utils/haptics.dart';
import '../models/dashboard_models.dart';
import '../models/dashboard_post.dart';
import '../providers/dashboard_providers.dart';

/// The dashboard, section by section, as the web page lays it out: six stat
/// cards, Interactions over the last 30 days, Campaign mix, then the posts with
/// their numbers. Every figure comes from the API.

String compactNumber(int n) =>
    NumberFormat.compact(locale: 'en_IN').format(n).replaceAll(' ', '');

// ── Summary cards ──────────────────────────────────────────────────────

class DashboardSummaryCards extends StatelessWidget {
  final DashboardSummary summary;
  final int postCountFallback;

  const DashboardSummaryCards({
    super.key,
    required this.summary,
    required this.postCountFallback,
  });

  @override
  Widget build(BuildContext context) {
    final cards = <Widget>[
      _StatCard(label: 'Followers', icon: Icons.group_outlined, metric: summary.followers),
      // Every picture and video uploaded, carousels slide by slide.
      _StatCard(label: 'Images', icon: Icons.image_outlined, metric: summary.mediaCount),
      _StatCard(label: 'Total likes', icon: Icons.favorite_outline_rounded, metric: summary.likes),
      _StatCard(
        label: 'Leads',
        icon: Icons.description_outlined,
        metric: summary.leads,
        onTap: () => context.push('/brand-dashboard/leads'),
      ),
      _StatCard(
        label: 'Reminders set',
        icon: Icons.notifications_none_rounded,
        metric: summary.remindersSet,
      ),
      _StatCard(
        label: 'Posts',
        icon: Icons.auto_awesome_outlined,
        metric: summary.posts.value == 0
            ? MetricValue(value: postCountFallback, growth: 0)
            : summary.posts,
      ),
    ];

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: AppSpacing.sm + 4,
      crossAxisSpacing: AppSpacing.sm + 4,
      childAspectRatio: 1.9,
      children: cards,
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final IconData icon;
  final MetricValue? metric;
  final VoidCallback? onTap;

  const _StatCard({required this.label, required this.icon, this.metric, this.onTap});

  @override
  Widget build(BuildContext context) {
    final growth = metric?.growth ?? 0;
    return InkWell(
      onTap: onTap,
      borderRadius: AppSpacing.borderRadiusMd,
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md - 2),
        decoration: BoxDecoration(
          color: context.colors.surface,
          borderRadius: AppSpacing.borderRadiusMd,
          border: Border.all(color: context.colors.borderLight, width: 0.5),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              children: [
                Icon(icon, size: 14, color: context.colors.textSecondary),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    label,
                    style: AppTypography.labelSmall.copyWith(color: context.colors.textSecondary),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (onTap != null)
                  Icon(Icons.chevron_right_rounded, size: 16, color: context.colors.textTertiary),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              metric == null ? '—' : compactNumber(metric!.value),
              style: AppTypography.headlineSmall.copyWith(
                color: context.colors.primaryAccent,
                fontWeight: FontWeight.w700,
              ),
            ),
            if (growth != 0)
              Text(
                '${growth > 0 ? '+' : ''}${growth.toStringAsFixed(0)}% vs previous 30 days',
                style: AppTypography.labelSmall.copyWith(
                  color: growth > 0 ? const Color(0xFF10B981) : context.colors.error,
                  fontSize: 10,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
          ],
        ),
      ),
    );
  }
}

// ── Interactions ───────────────────────────────────────────────────────

/// Likes and comments per day for the last 30 days, from `/analytics/charts`.
class DashboardInteractionsChart extends StatelessWidget {
  final List<TimeSeriesData> trend;

  const DashboardInteractionsChart({super.key, required this.trend});

  @override
  Widget build(BuildContext context) {
    final total = trend.fold<int>(0, (sum, d) => sum + d.value);

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: AppSpacing.borderRadiusMd,
        border: Border.all(color: context.colors.borderLight, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Interactions',
                      style: AppTypography.titleSmall.copyWith(
                        color: context.colors.textPrimary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Likes and comments, last 30 days',
                      style: AppTypography.labelSmall.copyWith(
                        color: context.colors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                NumberFormat.decimalPattern('en_IN').format(total),
                style: AppTypography.titleLarge.copyWith(
                  color: context.colors.textPrimary,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          SizedBox(
            height: 176,
            child: total == 0
                ? Container(
                    decoration: BoxDecoration(
                      color: context.colors.surfaceSecondary,
                      borderRadius: AppSpacing.borderRadiusSm,
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      'No likes or comments in the last 30 days',
                      style: AppTypography.labelSmall.copyWith(
                        color: context.colors.textSecondary,
                      ),
                    ),
                  )
                : _chart(context),
          ),
        ],
      ),
    );
  }

  Widget _chart(BuildContext context) {
    const line = Color(0xFFEF4444);
    final spots = <FlSpot>[
      for (var i = 0; i < trend.length; i++) FlSpot(i.toDouble(), trend[i].value.toDouble()),
    ];
    final maxY = trend.map((d) => d.value).reduce((a, b) => a > b ? a : b).toDouble();
    final step = (trend.length / 5).ceil().clamp(1, trend.length);

    return LineChart(
      LineChartData(
        minY: 0,
        maxY: maxY <= 0 ? 1 : maxY * 1.2,
        gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          getDrawingHorizontalLine: (_) =>
              FlLine(color: context.colors.borderLight, strokeWidth: 0.5),
        ),
        borderData: FlBorderData(show: false),
        titlesData: FlTitlesData(
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 30,
              getTitlesWidget: (value, _) => Text(
                value % 1 != 0 ? '' : compactNumber(value.toInt()),
                style: AppTypography.labelSmall.copyWith(
                  color: context.colors.textTertiary,
                  fontSize: 10,
                ),
              ),
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 22,
              interval: step.toDouble(),
              getTitlesWidget: (value, _) {
                final i = value.round();
                if (i < 0 || i >= trend.length) return const SizedBox.shrink();
                final date = DateTime.tryParse(trend[i].date);
                return Text(
                  date == null ? '' : DateFormat('d MMM').format(date),
                  style: AppTypography.labelSmall.copyWith(
                    color: context.colors.textTertiary,
                    fontSize: 10,
                  ),
                );
              },
            ),
          ),
        ),
        lineTouchData: LineTouchData(
          touchTooltipData: LineTouchTooltipData(
            getTooltipColor: (_) => context.colors.surfaceSecondary,
            getTooltipItems: (spots) => spots.map((s) {
              final i = s.x.round();
              final date = i >= 0 && i < trend.length ? DateTime.tryParse(trend[i].date) : null;
              return LineTooltipItem(
                '${s.y.toInt()} interactions\n${date == null ? '' : DateFormat('d MMM').format(date)}',
                AppTypography.labelSmall.copyWith(color: context.colors.textPrimary),
              );
            }).toList(),
          ),
        ),
        lineBarsData: [
          LineChartBarData(
            spots: spots,
            isCurved: true,
            curveSmoothness: 0.25,
            color: line,
            barWidth: 2,
            dotData: const FlDotData(show: false),
            belowBarData: BarAreaData(
              show: true,
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [line.withValues(alpha: 0.25), line.withValues(alpha: 0)],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Campaign mix ───────────────────────────────────────────────────────

class DashboardCampaignMix extends StatelessWidget {
  final List<BrandDashboardPost> posts;

  const DashboardCampaignMix({super.key, required this.posts});

  @override
  Widget build(BuildContext context) {
    final mix = dashboardObjectives
        .map((o) => (o: o, count: posts.where((p) => p.objective == o.key).length))
        .where((e) => e.count > 0)
        .toList();

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: AppSpacing.borderRadiusMd,
        border: Border.all(color: context.colors.borderLight, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Campaign mix',
            style: AppTypography.titleSmall.copyWith(
              color: context.colors.textPrimary,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            'Posts by objective',
            style: AppTypography.labelSmall.copyWith(color: context.colors.textSecondary),
          ),
          if (mix.isEmpty)
            Padding(
              padding: const EdgeInsets.only(top: AppSpacing.lg),
              child: Text(
                'No posts yet',
                style: AppTypography.labelSmall.copyWith(color: context.colors.textSecondary),
              ),
            )
          else
            ...mix.map((e) {
              final pct = (e.count / posts.length * 100).round();
              return Padding(
                padding: const EdgeInsets.only(top: AppSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            e.o.label,
                            style: AppTypography.bodySmall.copyWith(
                              color: context.colors.textPrimary,
                            ),
                          ),
                        ),
                        Text(
                          '${e.count} · $pct%',
                          style: AppTypography.labelSmall.copyWith(
                            color: context.colors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(3),
                      child: LinearProgressIndicator(
                        value: pct / 100,
                        minHeight: 6,
                        backgroundColor: context.colors.surfaceSecondary,
                        valueColor: AlwaysStoppedAnimation<Color>(Color(e.o.color)),
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }
}

// ── Posts ──────────────────────────────────────────────────────────────

class DashboardPostsSection extends ConsumerWidget {
  final List<BrandDashboardPost> posts;

  const DashboardPostsSection({super.key, required this.posts});

  /// The last twelve months a post was published in, newest first.
  List<({String key, String label})> _months() {
    final seen = <String, String>{};
    for (final p in posts) {
      final d = p.createdAt;
      if (d == null) continue;
      final key = DateFormat('yyyy-MM').format(d);
      seen.putIfAbsent(key, () => DateFormat('MMM yyyy').format(d));
    }
    final keys = seen.keys.toList()..sort((a, b) => b.compareTo(a));
    return keys.take(12).map((k) => (key: k, label: seen[k]!)).toList();
  }

  List<BrandDashboardPost> _filtered(String period, DateTimeRange? range, String sort) {
    var list = [...posts];

    if (period == 'range' && range != null) {
      // The "to" day counts in full.
      final to = DateTime(range.end.year, range.end.month, range.end.day, 23, 59, 59);
      list = list.where((p) {
        final d = p.createdAt;
        return d != null && !d.isBefore(range.start) && !d.isAfter(to);
      }).toList();
    } else if (period != 'all' && period != 'range') {
      list = list
          .where((p) => p.createdAt != null && DateFormat('yyyy-MM').format(p.createdAt!) == period)
          .toList();
    }

    if (sort == 'newest') {
      list.sort(
        (a, b) => (b.createdAt ?? DateTime(0)).compareTo(a.createdAt ?? DateTime(0)),
      );
    } else {
      list.sort((a, b) => b.topScore.compareTo(a.topScore));
    }
    return list;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final period = ref.watch(dashboardPostsPeriodProvider);
    final range = ref.watch(dashboardPostsRangeProvider);
    final sort = ref.watch(dashboardPostsSortProvider);
    final shown = _filtered(period, range, sort);

    return Container(
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: AppSpacing.borderRadiusMd,
        border: Border.all(color: context.colors.borderLight, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.md, AppSpacing.md, 10),
            child: Row(
              children: [
                Text(
                  'Posts',
                  style: AppTypography.titleSmall.copyWith(
                    color: context.colors.textPrimary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                if (shown.length != posts.length) ...[
                  const SizedBox(width: 6),
                  Text(
                    '${shown.length} of ${posts.length}',
                    style: AppTypography.labelSmall.copyWith(
                      color: context.colors.textSecondary,
                    ),
                  ),
                ],
                const Spacer(),
                _periodButton(context, ref, period, range),
                const SizedBox(width: 8),
                _sortToggle(context, ref, sort),
              ],
            ),
          ),
          Divider(height: 1, color: context.colors.borderLight),
          if (shown.isEmpty)
            _empty(context)
          else
            ...shown.map(
              (p) => _PostRow(
                post: p,
                onTap: () => showPostInsights(context, ref, p),
                onMenu: () => _showMenu(context, ref, p),
              ),
            ),
        ],
      ),
    );
  }

  Widget _empty(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: 44),
    child: Column(
      children: [
        Icon(Icons.image_outlined, size: 32, color: context.colors.textTertiary),
        const SizedBox(height: AppSpacing.sm + 4),
        Text(
          'No posts yet',
          style: AppTypography.bodyMedium.copyWith(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Create a post to start seeing views, likes and leads here.',
          textAlign: TextAlign.center,
          style: AppTypography.labelSmall.copyWith(color: context.colors.textSecondary),
        ),
        const SizedBox(height: AppSpacing.md),
        FilledButton.icon(
          onPressed: () => context.push('/create'),
          style: FilledButton.styleFrom(backgroundColor: context.colors.primaryAccent),
          icon: const Icon(Icons.add_rounded, size: 16, color: Colors.white),
          label: Text(
            'Create post',
            style: AppTypography.labelLarge.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    ),
  );

  Widget _periodButton(
    BuildContext context,
    WidgetRef ref,
    String period,
    DateTimeRange? range,
  ) {
    String label;
    if (period == 'all') {
      label = 'All time';
    } else if (period == 'range') {
      label = range == null
          ? 'Pick dates'
          : '${DateFormat('d MMM').format(range.start)} – ${DateFormat('d MMM').format(range.end)}';
    } else {
      label = _months().where((m) => m.key == period).firstOrNull?.label ?? period;
    }

    return InkWell(
      onTap: () => _showPeriodSheet(context, ref),
      borderRadius: AppSpacing.borderRadiusSm,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          borderRadius: AppSpacing.borderRadiusSm,
          border: Border.all(color: context.colors.border),
        ),
        child: Row(
          children: [
            Text(
              label,
              style: AppTypography.labelSmall.copyWith(color: context.colors.textPrimary),
            ),
            const SizedBox(width: 2),
            Icon(Icons.expand_more_rounded, size: 14, color: context.colors.textSecondary),
          ],
        ),
      ),
    );
  }

  void _showPeriodSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      backgroundColor: context.colors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheet) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
          children: [
            ListTile(
              title: Text(
                'All time',
                style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
              ),
              onTap: () {
                ref.read(dashboardPostsPeriodProvider.notifier).state = 'all';
                Navigator.pop(sheet);
              },
            ),
            ..._months().map(
              (m) => ListTile(
                title: Text(
                  m.label,
                  style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
                ),
                onTap: () {
                  ref.read(dashboardPostsPeriodProvider.notifier).state = m.key;
                  Navigator.pop(sheet);
                },
              ),
            ),
            ListTile(
              leading: Icon(Icons.date_range_rounded, color: context.colors.textSecondary),
              title: Text(
                'Pick dates…',
                style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
              ),
              onTap: () async {
                Navigator.pop(sheet);
                final picked = await showDateRangePicker(
                  context: context,
                  firstDate: DateTime.now().subtract(const Duration(days: 365 * 3)),
                  lastDate: DateTime.now(),
                  initialDateRange: ref.read(dashboardPostsRangeProvider),
                );
                if (picked != null) {
                  ref.read(dashboardPostsRangeProvider.notifier).state = picked;
                  ref.read(dashboardPostsPeriodProvider.notifier).state = 'range';
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _sortToggle(BuildContext context, WidgetRef ref, String sort) {
    Widget tab(String key, String label) {
      final active = sort == key;
      return GestureDetector(
        onTap: () {
          Haptics.selection();
          ref.read(dashboardPostsSortProvider.notifier).state = key;
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: active ? context.colors.primaryAccent : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            label,
            style: AppTypography.labelSmall.copyWith(
              color: active ? Colors.white : context.colors.textSecondary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(2),
      decoration: BoxDecoration(
        color: context.colors.surfaceSecondary,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(children: [tab('top', 'Top'), tab('newest', 'Newest')]),
    );
  }

  void _showMenu(BuildContext context, WidgetRef ref, BrandDashboardPost post) {
    showModalBottomSheet(
      context: context,
      backgroundColor: context.colors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheet) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Icon(Icons.edit_outlined, color: context.colors.textPrimary),
              title: Text(
                'Edit',
                style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
              ),
              onTap: () {
                Navigator.pop(sheet);
                context.push('/edit-post/${post.id}');
              },
            ),
            ListTile(
              leading: Icon(Icons.open_in_new_rounded, color: context.colors.textPrimary),
              title: Text(
                'View post',
                style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
              ),
              onTap: () {
                Navigator.pop(sheet);
                context.push('/explore/post', extra: post.id);
              },
            ),
            if (!post.archivedByAdmin)
              ListTile(
                leading: Icon(Icons.archive_outlined, color: context.colors.textPrimary),
                title: Text(
                  'Archive',
                  style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
                ),
                onTap: () {
                  Navigator.pop(sheet);
                  archiveDashboardPost(context, ref, post);
                },
              ),
            ListTile(
              leading: Icon(Icons.delete_outline_rounded, color: context.colors.error),
              title: Text(
                'Delete',
                style: AppTypography.bodyMedium.copyWith(color: context.colors.error),
              ),
              onTap: () {
                Navigator.pop(sheet);
                deleteDashboardPost(context, ref, post);
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _PostRow extends StatelessWidget {
  final BrandDashboardPost post;
  final VoidCallback onTap;
  final VoidCallback onMenu;

  const _PostRow({required this.post, required this.onTap, required this.onMenu});

  @override
  Widget build(BuildContext context) {
    final primary = post.primaryMetric;
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 10),
          child: Row(
            children: [
              Expanded(
                child: InkWell(
                  onTap: onTap,
                  child: Row(
                    children: [
                      _Thumb(post: post, size: 48),
                      const SizedBox(width: AppSpacing.sm + 4),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              post.title.isEmpty ? 'Untitled' : post.title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppTypography.bodyMedium.copyWith(
                                color: context.colors.textPrimary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              post.isScheduled
                                  ? 'Scheduled · ${post.publishAt == null ? '' : DateFormat('d MMM, h:mm a').format(post.publishAt!)}'
                                  : '${objectiveLabel(post.objective)} · ${post.createdAt == null ? '' : DateFormat('d MMM').format(post.createdAt!)}',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppTypography.labelSmall.copyWith(
                                color: post.isScheduled
                                    ? const Color(0xFFF59E0B)
                                    : context.colors.textSecondary,
                                fontWeight: post.isScheduled ? FontWeight.w600 : FontWeight.w400,
                              ),
                            ),
                            const SizedBox(height: 4),
                            // Phones: the numbers on one line under the title.
                            Row(
                              children: [
                                _MiniStat(
                                  icon: Icons.visibility_outlined,
                                  value: post.viewCount,
                                ),
                                const SizedBox(width: 12),
                                _MiniStat(
                                  icon: Icons.favorite_outline_rounded,
                                  value: post.likeCount,
                                ),
                                const SizedBox(width: 12),
                                _MiniStat(
                                  icon: Icons.chat_bubble_outline_rounded,
                                  value: post.commentCount,
                                ),
                                if (primary != null) ...[
                                  const SizedBox(width: 12),
                                  Flexible(
                                    child: Text(
                                      '${compactNumber(primary.value)} ${primary.label.toLowerCase()}',
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: AppTypography.labelSmall.copyWith(
                                        color: context.colors.textPrimary,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              IconButton(
                onPressed: onMenu,
                tooltip: 'Post actions',
                icon: Icon(Icons.more_horiz_rounded, size: 20, color: context.colors.textSecondary),
              ),
            ],
          ),
        ),
        Divider(height: 1, color: context.colors.borderLight),
      ],
    );
  }
}

class _MiniStat extends StatelessWidget {
  final IconData icon;
  final int value;

  const _MiniStat({required this.icon, required this.value});

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Icon(icon, size: 12, color: context.colors.textSecondary),
      const SizedBox(width: 3),
      Text(
        compactNumber(value),
        style: AppTypography.labelSmall.copyWith(color: context.colors.textSecondary),
      ),
    ],
  );
}

class _Thumb extends StatelessWidget {
  final BrandDashboardPost post;
  final double size;

  const _Thumb({required this.post, required this.size});

  @override
  Widget build(BuildContext context) {
    final url = post.thumbnail;
    return ClipRRect(
      borderRadius: AppSpacing.borderRadiusSm,
      child: SizedBox(
        width: size,
        height: size,
        // A video shows its own first frame; it used to be a camera icon on
        // a grey tile, which told the brand nothing about which post it was.
        child: url != null && url.isNotEmpty && post.isVideo
            ? VideoThumbnail(url: url, size: size)
            : url == null || url.isEmpty
            ? Container(
                color: context.colors.surfaceSecondary,
                alignment: Alignment.center,
                child: Icon(
                  Icons.image_outlined,
                  size: 18,
                  color: context.colors.textTertiary,
                ),
              )
            : Image.network(
                url,
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) => Container(
                  color: context.colors.surfaceSecondary,
                  alignment: Alignment.center,
                  child: Icon(
                    Icons.broken_image_outlined,
                    size: 18,
                    color: context.colors.textTertiary,
                  ),
                ),
              ),
      ),
    );
  }
}

// ── Post insights ──────────────────────────────────────────────────────

/// The web's "Post insights" dialog: real numbers only, with rates left as "—"
/// while nothing has been viewed.
void showPostInsights(BuildContext context, WidgetRef ref, BrandDashboardPost post) {
  final primary = post.primaryMetric;
  final rate = post.engagementRate;
  final isLead = post.objective == 'LEAD_GENERATION';

  final stats = <({String label, String value})>[
    (label: 'Views', value: compactNumber(post.viewCount)),
    (label: 'Likes', value: compactNumber(post.likeCount)),
    (label: 'Comments', value: compactNumber(post.commentCount)),
    (label: 'Shares', value: compactNumber(post.sharesCount)),
    (label: 'Engagement rate', value: rate == null ? '—' : '${rate.toStringAsFixed(1)}%'),
    if (primary != null) (label: primary.label, value: compactNumber(primary.value)),
    if (isLead) ...[
      (label: 'Form views', value: compactNumber(post.leadFormViews)),
      (
        label: 'Conversion rate',
        value: post.leadFormViews > 0
            ? '${(post.leadFormSubmissions / post.leadFormViews * 100).toStringAsFixed(1)}%'
            : '—',
      ),
    ],
    if (!isLead && post.viewCount > 0 && post.clicksCount > 0)
      (
        label: 'Click-through rate',
        value: '${(post.clicksCount / post.viewCount * 100).toStringAsFixed(1)}%',
      ),
  ];

  showModalBottomSheet(
    context: context,
    backgroundColor: context.colors.surface,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (sheet) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Post insights',
                    style: AppTypography.titleSmall.copyWith(
                      color: context.colors.textPrimary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(sheet),
                  icon: Icon(Icons.close_rounded, size: 20, color: context.colors.textSecondary),
                ),
              ],
            ),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _Thumb(post: post, size: 76),
                const SizedBox(width: AppSpacing.sm + 4),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        post.title.isEmpty ? 'Untitled' : post.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: AppTypography.bodyMedium.copyWith(
                          color: context.colors.textPrimary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${objectiveLabel(post.objective)} · Posted ${post.createdAt == null ? '' : DateFormat('d MMM yyyy').format(post.createdAt!)}',
                        style: AppTypography.labelSmall.copyWith(
                          color: context.colors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 6),
                      GestureDetector(
                        onTap: () {
                          Navigator.pop(sheet);
                          context.push('/explore/post', extra: post.id);
                        },
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'View post',
                              style: AppTypography.labelSmall.copyWith(
                                color: context.colors.primaryAccent,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Icon(
                              Icons.open_in_new_rounded,
                              size: 12,
                              color: context.colors.primaryAccent,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: AppSpacing.sm,
              crossAxisSpacing: AppSpacing.sm,
              childAspectRatio: 2.6,
              children: stats
                  .map(
                    (s) => Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: context.colors.surfaceSecondary,
                        borderRadius: AppSpacing.borderRadiusSm,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            s.label,
                            style: AppTypography.labelSmall.copyWith(
                              color: context.colors.textSecondary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            s.value,
                            style: AppTypography.titleSmall.copyWith(
                              color: context.colors.textPrimary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                  .toList(),
            ),
            if (post.viewCount == 0)
              Padding(
                padding: const EdgeInsets.only(top: AppSpacing.sm + 4),
                child: Text(
                  "No views recorded yet, so rates aren't available.",
                  style: AppTypography.labelSmall.copyWith(color: context.colors.textSecondary),
                ),
              ),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                if (post.archivedByAdmin)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        Navigator.pop(sheet);
                        context.push('/help/ticket');
                      },
                      child: Text(
                        'Get help',
                        style: AppTypography.labelLarge.copyWith(
                          color: const Color(0xFFF59E0B),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  )
                else
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        Navigator.pop(sheet);
                        archiveDashboardPost(context, ref, post);
                      },
                      icon: Icon(Icons.archive_outlined, size: 16, color: context.colors.textPrimary),
                      label: Text(
                        'Archive',
                        style: AppTypography.labelLarge.copyWith(
                          color: context.colors.textPrimary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.pop(sheet);
                      deleteDashboardPost(context, ref, post);
                    },
                    icon: Icon(Icons.delete_outline_rounded, size: 16, color: context.colors.error),
                    label: Text(
                      'Delete',
                      style: AppTypography.labelLarge.copyWith(
                        color: context.colors.error,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    ),
  );
}

// ── Actions ────────────────────────────────────────────────────────────

Future<void> archiveDashboardPost(
  BuildContext context,
  WidgetRef ref,
  BrandDashboardPost post,
) async {
  final ok = await showAdaptiveConfirmDialog(
    context,
    title: 'Archive this post?',
    message: "It is removed from public feeds. Find it in your profile's Archived tab.",
    confirmLabel: 'Archive',
  );
  if (ok != true) return;
  try {
    await ref.read(dashboardServiceProvider).archivePost(post.id);
    ref.invalidate(brandDashboardPostsProvider);
    ref.invalidate(dashboardSummaryProvider);
    if (context.mounted) {
      AppMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Post archived. Find it in your profile's Archived tab.")),
      );
    }
  } catch (_) {
    if (context.mounted) {
      AppMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Failed to archive post')));
    }
  }
}

Future<void> deleteDashboardPost(
  BuildContext context,
  WidgetRef ref,
  BrandDashboardPost post,
) async {
  final ok = await showAdaptiveConfirmDialog(
    context,
    title: 'Delete this post?',
    message: "Its likes, comments and leads are removed too. This can't be undone.",
    confirmLabel: 'Delete post',
    isDestructive: true,
  );
  if (ok != true) return;
  try {
    await ref.read(dashboardServiceProvider).deletePost(post.id);
    ref.invalidate(brandDashboardPostsProvider);
    ref.invalidate(dashboardSummaryProvider);
    if (context.mounted) {
      AppMessenger.of(context).showSnackBar(const SnackBar(content: Text('Post deleted')));
    }
  } catch (_) {
    if (context.mounted) {
      AppMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Failed to delete post')));
    }
  }
}
