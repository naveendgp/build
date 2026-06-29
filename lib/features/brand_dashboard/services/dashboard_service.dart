import 'package:dio/dio.dart';
import '../models/dashboard_models.dart';

class DashboardService {
  final Dio _dio;

  DashboardService(this._dio);

  Future<DashboardSummary> getSummary() async {
    final response = await _dio.get('/analytics/dashboard-summary');
    return DashboardSummary.fromJson(response.data);
  }

  Future<DashboardChartsData> getCharts(int periodDays) async {
    final response = await _dio.get('/analytics/charts', queryParameters: {
      'period': periodDays,
    });
    return DashboardChartsData.fromJson(response.data);
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
