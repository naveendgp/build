import 'package:flutter/material.dart' show DateTimeRange;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../services/dashboard_service.dart';
import '../models/dashboard_models.dart';
import '../models/dashboard_post.dart';

final dashboardServiceProvider = Provider<DashboardService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return DashboardService(apiClient.dio);
});

// Date range state
class DashboardDateRange {
  final int? presetDays;
  final DateTime? startDate;
  final DateTime? endDate;

  const DashboardDateRange({this.presetDays = 30, this.startDate, this.endDate});

  bool get isCustom => startDate != null && endDate != null;

  String get label {
    if (isCustom) return 'Custom';
    switch (presetDays) {
      case 7:
        return '7 Days';
      case 30:
        return '30 Days';
      case 90:
        return '90 Days';
      default:
        return '${presetDays}d';
    }
  }
}

final dashboardDateRangeProvider = StateProvider<DashboardDateRange>(
  (ref) => const DashboardDateRange(),
);

// Keep legacy period provider for backward compat
final dashboardPeriodProvider = Provider<int>((ref) {
  final range = ref.watch(dashboardDateRangeProvider);
  return range.presetDays ?? 30;
});

// Summary Provider
final dashboardSummaryProvider = FutureProvider.autoDispose<DashboardSummary>((ref) async {
  final service = ref.watch(dashboardServiceProvider);
  final range = ref.watch(dashboardDateRangeProvider);
  if (range.isCustom) {
    return service.getSummary(startDate: range.startDate, endDate: range.endDate);
  }
  return service.getSummary();
});

// Charts Provider
final dashboardChartsProvider = FutureProvider.autoDispose<DashboardChartsData>((ref) async {
  final service = ref.watch(dashboardServiceProvider);
  final range = ref.watch(dashboardDateRangeProvider);
  if (range.isCustom) {
    return service.getCharts(startDate: range.startDate, endDate: range.endDate);
  }
  return service.getCharts(periodDays: range.presetDays ?? 30);
});


// ── The brand's own posts, as the web dashboard reads them ─────────────
//
// `/analytics/posts` returns a scored summary; the dashboard list needs the
// posts themselves — objective, schedule, media and raw counts — which is what
// `/brand/me/posts` gives, the same call the web page makes.
final brandDashboardPostsProvider = FutureProvider.autoDispose<List<BrandDashboardPost>>((
  ref,
) async {
  final api = ref.watch(apiClientProvider);
  final res = await api.dio.get('/brand/me/posts');
  final data = res.data as List? ?? const [];
  return data.map((j) => BrandDashboardPost.fromJson(Map<String, dynamic>.from(j as Map))).toList();
});

/// Which stretch of time the posts list covers: `all`, a `yyyy-MM` month, or
/// `range` with [dashboardPostsRangeProvider].
final dashboardPostsPeriodProvider = StateProvider<String>((ref) => 'all');

/// The dates behind the `range` period; null until the brand picks them.
final dashboardPostsRangeProvider = StateProvider<DateTimeRange?>((ref) => null);

/// `top` or `newest`, as on the web.
final dashboardPostsSortProvider = StateProvider<String>((ref) => 'top');
