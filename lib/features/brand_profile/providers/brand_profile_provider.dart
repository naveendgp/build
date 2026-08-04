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

      final reviews = parseList(profileData['reviews']).map((e) => BrandReview.fromJson(e)).toList();
      final testimonials = parseList(profileData['testimonials']).map((e) => BrandTestimonial.fromJson(e)).toList();
      BrandAnalytics? analytics;
      if (isMe) {
        analytics = profileData['analytics'] != null ? BrandAnalytics.fromJson(profileData['analytics']) : MockBrandData.getAnalytics();
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
      state = state.copyWith(
        loadState: BrandLoadState.error,
        errorMessage: e.toString(),
      );
    }
  }

  void setActiveTab(int index) {
    state = state.copyWith(activeTab: index);
  }

  void removePost(String postId) {
    state = state.copyWith(
      posts: state.posts.where((p) => p.id != postId).toList(),
    );
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
          profile: p.copyWith(
            isFollowing: !newFollowing,
            followerCount: p.followerCount,
          ),
        );
      }
    }
  }

  Future<bool> uploadGalleryImage(File file) async {
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
      if (uploadRes.statusCode != 200) return false;

      final uploadedUrl = uploadRes.data['url'];
      if (uploadedUrl == null) return false;

      final galleryRes = await apiClient.dio.post('/gallery', data: {
        'url': uploadedUrl,
        'type': 'IMAGE',
      });

      if (galleryRes.statusCode == 200 || galleryRes.statusCode == 201) {
        // Refresh gallery by reloading brand
        await loadBrand('me');
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Gallery upload error: $e');
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
        ),
      });

      final uploadRes = await apiClient.dio.post('/upload', data: formData);
      if (uploadRes.statusCode != 200) return false;

      final uploadedUrl = uploadRes.data['url'];
      if (uploadedUrl == null) return false;

      final updateData = isCover ? {'coverUrl': uploadedUrl} : {'logoUrl': uploadedUrl};
      final updateRes = await apiClient.dio.put('/brand/profile', data: updateData);

      if (updateRes.statusCode == 200) {
        if (state.profile != null) {
          state = state.copyWith(
            profile: state.profile!.copyWith(
              logoUrl: isCover ? null : uploadedUrl,
              coverUrl: isCover ? uploadedUrl : null,
            )
          );
        }
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Profile image upload error: $e');
      return false;
    }
  }

  Future<bool> updateBrandDetails({String? bio, Map<String, dynamic>? quicksite, List<String>? tags}) async {
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
            profile: state.profile!.copyWith(bio: bio),
            quicksite: quicksite != null ? BrandQuicksiteData.fromJson({'quicksite': quicksite}) : state.quicksite,
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

final brandProfileProvider = StateNotifierProvider.autoDispose.family<BrandProfileNotifier, BrandProfileState, String>((ref, id) {
  final apiClient = ref.watch(apiClientProvider);
  return BrandProfileNotifier(apiClient)..loadBrand(id);
});
