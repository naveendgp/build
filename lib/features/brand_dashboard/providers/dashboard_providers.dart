import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../services/dashboard_service.dart';
import '../models/dashboard_models.dart';

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

// Post Analytics Filter (All, PUBLISHED, ARCHIVED)
final dashboardPostsStatusFilterProvider = StateProvider<String>((ref) => 'All');

// Post Analytics Provider
final dashboardPostsProvider = FutureProvider.autoDispose<List<PostAnalytics>>((ref) async {
  final service = ref.watch(dashboardServiceProvider);
  final status = ref.watch(dashboardPostsStatusFilterProvider);
  return service.getPostAnalytics(page: 1, status: status);
});

// Selected Post Provider for Drawer
final selectedPostProvider = StateProvider<PostAnalytics?>((ref) => null);

// Follower Demographics Provider
final followerDemographicsProvider = FutureProvider.autoDispose<FollowerDemographics>((ref) async {
  final service = ref.watch(dashboardServiceProvider);
  return service.getFollowerDemographics();
});

// Top Content — selected month/year
final topContentMonthProvider = StateProvider<DateTime>((ref) => DateTime.now());

// Top Content Provider
final topContentProvider = FutureProvider.autoDispose<List<TopContentPost>>((ref) async {
  final service = ref.watch(dashboardServiceProvider);
  final date = ref.watch(topContentMonthProvider);
  return service.getTopContent(date.month, date.year);
});
