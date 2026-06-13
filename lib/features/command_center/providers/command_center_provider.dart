import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../brand_profile/providers/brand_profile_provider.dart';
import '../../home/widgets/hamburger_menu_sheet.dart' show userProfileProvider;

final commandCenterProvider = StateNotifierProvider<CommandCenterNotifier, bool>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return CommandCenterNotifier(apiClient, ref);
});

class CommandCenterNotifier extends StateNotifier<bool> {
  final ApiClient _apiClient;
  final Ref _ref;

  CommandCenterNotifier(this._apiClient, this._ref) : super(false);

  /// Update profile fields (text, toggles, etc.)
  Future<bool> updateProfile(Map<String, dynamic> data, {bool isBrand = false}) async {
    state = true;
    try {
      final endpoint = isBrand ? '/brand/profile' : '/user/me';
      final res = await _apiClient.dio.put(endpoint, data: data);
      if (res.statusCode == 200) {
        if (isBrand) {
          _ref.read(brandProfileProvider('me').notifier).loadBrand('me');
        }
        _ref.invalidate(userProfileProvider);
        state = false;
        return true;
      }
    } catch (e) {
      debugPrint('Failed to update profile: $e');
    }
    state = false;
    return false;
  }

  /// Upload an image file via the generic /upload endpoint.
  /// [type] can be: 'avatar', 'background', 'gallery', 'post'
  /// Returns the uploaded image URL on success, null on failure.
  Future<String?> uploadImage(File file, String type) async {
    state = true;
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(file.path),
      });
      final res = await _apiClient.dio.post(
        '/upload',
        data: formData,
        queryParameters: {'type': type},
      );
      if (res.statusCode == 200 || res.statusCode == 201) {
        state = false;
        return res.data['url'] as String?;
      }
    } catch (e) {
      debugPrint('Failed to upload image: $e');
    }
    state = false;
    return null;
  }

  /// Upload a user avatar via the dedicated /user/me/avatar endpoint.
  /// This endpoint handles both upload + DB update in one call.
  Future<bool> uploadUserAvatar(File file) async {
    state = true;
    try {
      final formData = FormData.fromMap({
        'avatar': await MultipartFile.fromFile(file.path),
      });
      final res = await _apiClient.dio.post(
        '/user/me/avatar',
        data: formData,
      );
      if (res.statusCode == 200) {
        _ref.invalidate(userProfileProvider);
        state = false;
        return true;
      }
    } catch (e) {
      debugPrint('Failed to upload avatar: $e');
    }
    state = false;
    return false;
  }
}
