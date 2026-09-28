import 'dart:io';
import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart' as http_parser;
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../models/brand_profile_models.dart';

enum BrandLoadState { initial, loading, loaded, error }

class BrandProfileState {
  final BrandLoadState loadState;
  final BrandProfile? profile;
  final List<BrandPost> posts;
  final List<BrandGalleryItem> gallery;
  final BrandQuicksiteData? quicksite;
  final List<BrandReview> reviews;
  final List<BrandTestimonial> testimonials;
  final BrandAnalytics? analytics;
  final int activeTab;
  final String? errorMessage;
  final String? lastActionError;

  const BrandProfileState({
    this.loadState = BrandLoadState.initial,
    this.profile,
    this.posts = const [],
    this.gallery = const [],
    this.quicksite,
    this.reviews = const [],
    this.testimonials = const [],
    this.analytics,
    this.activeTab = 0,
    this.errorMessage,
    this.lastActionError,
  });

  BrandProfileState copyWith({
    BrandLoadState? loadState,
    BrandProfile? profile,
    List<BrandPost>? posts,
    List<BrandGalleryItem>? gallery,
    BrandQuicksiteData? quicksite,
    List<BrandReview>? reviews,
    List<BrandTestimonial>? testimonials,
    BrandAnalytics? analytics,
    int? activeTab,
    String? errorMessage,
    String? lastActionError,
  }) {
    return BrandProfileState(
      loadState: loadState ?? this.loadState,
      profile: profile ?? this.profile,
      posts: posts ?? this.posts,
      gallery: gallery ?? this.gallery,
      quicksite: quicksite ?? this.quicksite,
      reviews: reviews ?? this.reviews,
      testimonials: testimonials ?? this.testimonials,
      analytics: analytics ?? this.analytics,
      activeTab: activeTab ?? this.activeTab,
      errorMessage: errorMessage ?? this.errorMessage,
      lastActionError: lastActionError,
    );
  }
}

class BrandProfileNotifier extends StateNotifier<BrandProfileState> {
  final ApiClient apiClient;

  BrandProfileNotifier(this.apiClient) : super(const BrandProfileState());

  Future<void> loadBrand(String brandId) async {
    state = state.copyWith(loadState: BrandLoadState.loading);
    try {
      final isMe = brandId == 'me';
      final endpoint = isMe ? '/brand/profile' : '/brand/$brandId';

      final profileRes = await apiClient.dio.get(endpoint);
      final profileData = Map<String, dynamic>.from(profileRes.data);
      if (isMe) {
        profileData['isOwner'] = true;
        // Silently fix the gallery state on the remote backend
        if (profileData['isGalleryEnabled'] == false) {
          try {
            await apiClient.dio.put('/brand/profile', data: {'isGalleryEnabled': true});
            profileData['isGalleryEnabled'] = true;
          } catch (_) {}
        }
      }

      final postsEndpoint = isMe ? '/brand/me/posts' : '/brand/$brandId/posts';
      final postsRes = await apiClient.dio.get(postsEndpoint);

      final profile = BrandProfile.fromJson(profileData);
      final quicksite = BrandQuicksiteData.fromJson(profileData);

      List<dynamic> parseList(dynamic data) {
        if (data == null) return [];
        if (data is List) return data;
        return [];
      }

      final galleryRaw = parseList(profileData['gallery']);
      final gallery = galleryRaw.map((e) => BrandGalleryItem.fromJson(e)).toList();

      final postsRaw = parseList(postsRes.data);
      final posts = postsRaw.map((e) => BrandPost.fromJson(e)).toList();

      final reviews = parseList(
        profileData['reviews'],
      ).map((e) => BrandReview.fromJson(e)).toList();
      final testimonials = parseList(
        profileData['testimonials'],
      ).map((e) => BrandTestimonial.fromJson(e)).toList();
      BrandAnalytics? analytics;
      if (isMe) {
        analytics = profileData['analytics'] != null
            ? BrandAnalytics.fromJson(profileData['analytics'])
            : MockBrandData.getAnalytics();
      }

      state = state.copyWith(
        loadState: BrandLoadState.loaded,
        profile: profile,
        posts: posts,
        gallery: gallery,
        quicksite: quicksite,
        reviews: reviews,
        testimonials: testimonials,
        analytics: analytics,
        errorMessage: null,
      );
    } catch (e) {
      debugPrint('BrandProfile API Error: $e');
      state = state.copyWith(loadState: BrandLoadState.error, errorMessage: e.toString());
    }
  }

  void setActiveTab(int index) {
    state = state.copyWith(activeTab: index);
  }

  void removePost(String postId) {
    state = state.copyWith(posts: state.posts.where((p) => p.id != postId).toList());
  }

  Future<void> toggleFollow() async {
    if (state.profile == null) return;
    final p = state.profile!;
    final newFollowing = !p.isFollowing;

    // Optimistic update
    state = state.copyWith(
      profile: p.copyWith(
        isFollowing: newFollowing,
        followerCount: p.followerCount + (newFollowing ? 1 : -1),
      ),
    );

    try {
      if (newFollowing) {
        await apiClient.dio.post('/follow/${p.id}');
      } else {
        await apiClient.dio.delete('/follow/${p.id}');
      }
    } catch (e) {
      // Revert on error
      if (mounted) {
        state = state.copyWith(
          profile: p.copyWith(isFollowing: !newFollowing, followerCount: p.followerCount),
        );
      }
    }
  }

  /// The bell: mutes or unmutes this brand's new posts for whoever is
  /// signed in. Personal accounts and brands that follow brands both use it.
  Future<void> togglePostNotifications() async {
    final p = state.profile;
    if (p == null || !p.isFollowing) return;
    final next = !p.notifyOnPosts;

    state = state.copyWith(profile: p.copyWith(notifyOnPosts: next));
    try {
      await apiClient.dio.patch('/follow/${p.id}/notifications', data: {'notify': next});
    } catch (e) {
      if (mounted) {
        state = state.copyWith(profile: p.copyWith(notifyOnPosts: !next));
      }
    }
  }

  /// Adds a photo to the gallery. The caption is asked for before the upload
  /// starts, so a photo never sits in the grid without one.
  /// Rewrites a photo's caption. The grid and the viewer both read it, so the
  /// item is swapped in place rather than reloading the whole brand.
  Future<bool> updateGalleryDescription(String itemId, String description) async {
    final previous = state.gallery;
    if (previous.isEmpty) return false;
    final updated = [
      for (final item in previous)
        if (item.id == itemId) item.copyWith(description: description.trim()) else item,
    ];
    state = state.copyWith(gallery: updated);

    try {
      await apiClient.dio.patch(
        '/gallery/$itemId/description',
        data: {'description': description.trim()},
      );
      return true;
    } catch (e) {
      debugPrint('Gallery description error: $e');
      if (mounted) state = state.copyWith(gallery: previous);
      return false;
    }
  }

  Future<bool> uploadGalleryImage(File file, {String description = ''}) async {
    try {
      final filename = file.path.split('/').last;

      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          file.path,
          filename: filename,
          contentType: http_parser.MediaType('image', 'jpeg'),
        ),
      });

      final uploadRes = await apiClient.dio.post('/upload', data: formData);
      if (uploadRes.statusCode != 200) {
        debugPrint('Gallery upload error: upload status ${uploadRes.statusCode} ${uploadRes.data}');
        state = state.copyWith(lastActionError: _friendlyErrorMessage(uploadRes.statusCode));
        return false;
      }

      final uploadedUrl = uploadRes.data is Map ? uploadRes.data['url'] : null;
      if (uploadedUrl == null) {
        debugPrint('Gallery upload error: response missing url ${uploadRes.data}');
        state = state.copyWith(lastActionError: _friendlyErrorMessage(null));
        return false;
      }

      final galleryRes = await apiClient.dio.post(
        '/gallery',
        data: {
          'url': uploadedUrl,
          'type': 'IMAGE',
          if (description.trim().isNotEmpty) 'description': description.trim(),
        },
      );

      if (galleryRes.statusCode == 200 || galleryRes.statusCode == 201) {
        // Refresh gallery by reloading brand
        await loadBrand('me');
        state = state.copyWith(lastActionError: null);
        return true;
      }
      debugPrint(
        'Gallery upload error: gallery post status ${galleryRes.statusCode} ${galleryRes.data}',
      );
      state = state.copyWith(lastActionError: _friendlyErrorMessage(galleryRes.statusCode));
      return false;
    } on DioException catch (e) {
      final statusCode = e.response?.statusCode;
      debugPrint('Gallery upload error: $statusCode ${e.response?.data ?? e.message}');
      state = state.copyWith(
        lastActionError: _friendlyErrorMessage(
          statusCode,
          isTimeout:
              e.type == DioExceptionType.connectionTimeout ||
              e.type == DioExceptionType.sendTimeout ||
              e.type == DioExceptionType.receiveTimeout,
          isConnectionError: e.type == DioExceptionType.connectionError,
        ),
      );
      return false;
    } catch (e) {
      debugPrint('Gallery upload error: $e');
      state = state.copyWith(lastActionError: _friendlyErrorMessage(null));
      return false;
    }
  }

  Future<bool> updateProfileImage(File file, {required bool isCover}) async {
    try {
      final filename = file.path.split('/').last;

      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          file.path,
          filename: filename,
          contentType: http_parser.MediaType('image', 'jpeg'),
        ),
      });

      final uploadRes = await apiClient.dio.post('/upload', data: formData);
      if (uploadRes.statusCode != 200) {
        debugPrint('Profile image upload error: status ${uploadRes.statusCode} ${uploadRes.data}');
        state = state.copyWith(lastActionError: _friendlyErrorMessage(uploadRes.statusCode));
        return false;
      }

      final uploadedUrl = uploadRes.data is Map ? uploadRes.data['url'] : null;
      if (uploadedUrl == null) {
        debugPrint('Profile image upload error: response missing url ${uploadRes.data}');
        state = state.copyWith(lastActionError: _friendlyErrorMessage(null));
        return false;
      }

      final updateData = isCover ? {'coverImageUrl': uploadedUrl} : {'logoUrl': uploadedUrl};
      final updateRes = await apiClient.dio.put('/brand/profile', data: updateData);

      if (updateRes.statusCode == 200) {
        if (state.profile != null) {
          final resolvedUrl = ApiClient.resolveMediaUrl(uploadedUrl.toString());
          state = state.copyWith(
            profile: state.profile!.copyWith(
              logoUrl: isCover ? null : resolvedUrl,
              coverUrl: isCover ? resolvedUrl : null,
            ),
            lastActionError: null,
          );
        }
        return true;
      }
      debugPrint(
        'Profile image upload error: profile update status ${updateRes.statusCode} ${updateRes.data}',
      );
      state = state.copyWith(lastActionError: _friendlyErrorMessage(updateRes.statusCode));
      return false;
    } on DioException catch (e) {
      final statusCode = e.response?.statusCode;
      debugPrint('Profile image upload error: $statusCode ${e.response?.data ?? e.message}');
      state = state.copyWith(
        lastActionError: _friendlyErrorMessage(
          statusCode,
          isTimeout:
              e.type == DioExceptionType.connectionTimeout ||
              e.type == DioExceptionType.sendTimeout ||
              e.type == DioExceptionType.receiveTimeout,
          isConnectionError: e.type == DioExceptionType.connectionError,
        ),
      );
      return false;
    } catch (e) {
      debugPrint('Profile image upload error: $e');
      state = state.copyWith(lastActionError: _friendlyErrorMessage(null));
      return false;
    }
  }

  /// Maps technical failures to short, user-facing copy. Full technical
  /// detail is always logged via debugPrint above for diagnosis.
  String _friendlyErrorMessage(
    int? statusCode, {
    bool isTimeout = false,
    bool isConnectionError = false,
  }) {
    if (isConnectionError)
      return 'No internet connection. Please check your network and try again.';
    if (isTimeout) return 'The upload timed out. Please try again.';
    if (statusCode == 413) return 'That image is too large. Please choose a smaller photo.';
    if (statusCode == 401 || statusCode == 403)
      return 'Your session has expired. Please log in again.';
    if (statusCode != null && statusCode >= 500)
      return 'Our servers are having trouble right now. Please try again shortly.';
    return 'Something went wrong. Please try again.';
  }

  Future<bool> updateBrandDetails({
    String? bio,
    Map<String, dynamic>? quicksite,
    List<String>? tags,
  }) async {
    try {
      final updateData = <String, dynamic>{};
      if (bio != null) updateData['bio'] = bio;
      if (quicksite != null) updateData['quicksite'] = quicksite;
      if (tags != null) updateData['tags'] = tags;

      if (updateData.isEmpty) return true;

      final res = await apiClient.dio.put('/brand/profile', data: updateData);
      if (res.statusCode == 200) {
        if (state.profile != null) {
          state = state.copyWith(
            profile: state.profile!.copyWith(bio: bio, tags: tags),
            quicksite: quicksite != null
                ? BrandQuicksiteData.fromJson({'quicksite': quicksite})
                : state.quicksite,
          );
        }
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Update brand details error: $e');
      return false;
    }
  }
}

final brandProfileProvider = StateNotifierProvider.autoDispose
    .family<BrandProfileNotifier, BrandProfileState, String>((ref, id) {
      final apiClient = ref.watch(apiClientProvider);
      return BrandProfileNotifier(apiClient)..loadBrand(id);
    });
