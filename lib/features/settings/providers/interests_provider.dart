import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../home/models/feed_models.dart';

class InterestsState {
  final List<FeedPost> posts;
  final bool isLoading;
  final String? error;
  final Set<String> interestedIds;

  const InterestsState({
    this.posts = const [],
    this.isLoading = false,
    this.error,
    this.interestedIds = const {},
  });

  InterestsState copyWith({
    List<FeedPost>? posts,
    bool? isLoading,
    String? error,
    Set<String>? interestedIds,
  }) =>
      InterestsState(
        posts: posts ?? this.posts,
        isLoading: isLoading ?? this.isLoading,
        error: error,
        interestedIds: interestedIds ?? this.interestedIds,
      );
}

class InterestsNotifier extends StateNotifier<InterestsState> {
  final Ref ref;

  InterestsNotifier(this.ref) : super(const InterestsState()) {
    fetch();
  }

  ApiClient get _api => ref.read(apiClientProvider);

  Future<void> fetch() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _api.dio.get('/posts/interested/me');
      if (res.statusCode == 200) {
        final data = res.data as List? ?? [];
        final posts = data.map((j) => FeedPost.fromJson(j)).toList();
        state = state.copyWith(
          posts: posts,
          interestedIds: posts.map((p) => p.id).toSet(),
          isLoading: false,
        );
      } else {
        state = state.copyWith(isLoading: false, error: 'Failed to load interests');
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> addInterest(String postId) async {
    if (state.interestedIds.contains(postId)) return;
    final newIds = Set<String>.from(state.interestedIds)..add(postId);
    state = state.copyWith(interestedIds: newIds);
    try {
      await _api.dio.post('/posts/$postId/interested');
    } catch (_) {
      final revert = Set<String>.from(state.interestedIds)..remove(postId);
      state = state.copyWith(interestedIds: revert);
    }
  }

  Future<void> removeInterest(String postId) async {
    final prevPosts = state.posts;
    final prevIds = state.interestedIds;
    state = state.copyWith(
      posts: state.posts.where((p) => p.id != postId).toList(),
      interestedIds: Set<String>.from(state.interestedIds)..remove(postId),
    );
    try {
      await _api.dio.delete('/posts/$postId/interested');
    } catch (_) {
      state = state.copyWith(posts: prevPosts, interestedIds: prevIds);
    }
  }

  bool isInterested(String postId) => state.interestedIds.contains(postId);
}

final interestsProvider =
    StateNotifierProvider<InterestsNotifier, InterestsState>(
  (ref) => InterestsNotifier(ref),
);
