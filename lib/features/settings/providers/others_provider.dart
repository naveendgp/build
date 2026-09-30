import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../home/models/feed_models.dart';

/// One post the person reported, with the reason they gave.
class ReportedPost {
  final String id;
  final String reportType;
  final FeedPost? post;

  const ReportedPost({required this.id, required this.reportType, this.post});

  factory ReportedPost.fromJson(Map<String, dynamic> json) {
    final postJson = json['post'];
    return ReportedPost(
      id: (json['id'] ?? '').toString(),
      reportType: (json['reportType'] ?? '').toString(),
      post: postJson is Map<String, dynamic> ? FeedPost.fromJson(postJson) : null,
    );
  }

  /// "FLAGGED_CONTENT" reads as "flagged content".
  String get reasonLabel => reportType.toLowerCase().replaceAll('_', ' ');
}

/// Posts hidden with "Not interested". They can be put back.
final notInterestedPostsProvider = FutureProvider.autoDispose<List<FeedPost>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final res = await api.dio.get('/posts/not-interested/me');
  final data = res.data as List? ?? [];
  return data.map((j) => FeedPost.fromJson(j as Map<String, dynamic>)).toList();
});

/// Posts the person reported. A report stands: there is no taking it back
/// from here, only reading what was sent.
final reportedPostsProvider = FutureProvider.autoDispose<List<ReportedPost>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final res = await api.dio.get('/reports/me');
  final raw = res.data;
  final data = raw is List ? raw : (raw is Map ? (raw['data'] as List? ?? []) : const []);
  return data.map((j) => ReportedPost.fromJson(Map<String, dynamic>.from(j as Map))).toList();
});

/// Brings a hidden post back into the feed.
Future<bool> removeNotInterested(WidgetRef ref, String postId) async {
  try {
    await ref.read(apiClientProvider).dio.delete('/posts/$postId/not-interested');
    ref.invalidate(notInterestedPostsProvider);
    return true;
  } catch (_) {
    return false;
  }
}
