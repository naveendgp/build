import 'package:dio/dio.dart';
import '../models/dashboard_models.dart';

class DashboardService {
  final Dio _dio;

  DashboardService(this._dio);

  Future<DashboardSummary> getSummary({DateTime? startDate, DateTime? endDate}) async {
    final params = <String, dynamic>{};
    if (startDate != null) params['startDate'] = startDate.toIso8601String();
    if (endDate != null) params['endDate'] = endDate.toIso8601String();
    final response = await _dio.get('/analytics/dashboard-summary', queryParameters: params);
    return DashboardSummary.fromJson(response.data);
  }

  Future<DashboardChartsData> getCharts({int? periodDays, DateTime? startDate, DateTime? endDate}) async {
    final params = <String, dynamic>{};
    if (startDate != null && endDate != null) {
      params['startDate'] = startDate.toIso8601String();
      params['endDate'] = endDate.toIso8601String();
    } else if (periodDays != null) {
      params['period'] = periodDays;
    }
    final response = await _dio.get('/analytics/charts', queryParameters: params);
    return DashboardChartsData.fromJson(response.data);
  }

  Future<FollowerDemographics> getFollowerDemographics() async {
    final response = await _dio.get('/analytics/follower-demographics');
    return FollowerDemographics.fromJson(response.data);
  }

  Future<List<TopContentPost>> getTopContent(int month, int year) async {
    final response = await _dio.get('/analytics/top-content', queryParameters: {
      'month': month,
      'year': year,
    });
    final List<dynamic> data = response.data['data'] ?? [];
    return data.map((json) => TopContentPost.fromJson(json)).toList();
  }

  Future<List<PostAnalytics>> getPostAnalytics({int page = 1, String? status}) async {
    final response = await _dio.get('/analytics/posts', queryParameters: {
      'page': page,
      if (status != null && status != 'All') 'status': status,
    });
    final List<dynamic> data = response.data['data'] ?? [];
    return data.map((json) => PostAnalytics.fromJson(json)).toList();
  }

  Future<void> archivePost(String postId) async {
    await _dio.post('/posts/$postId/archive');
  }

  Future<void> unarchivePost(String postId) async {
    await _dio.post('/posts/$postId/unarchive');
  }

  Future<void> deletePost(String postId) async {
    await _dio.delete('/posts/$postId');
  }
}
