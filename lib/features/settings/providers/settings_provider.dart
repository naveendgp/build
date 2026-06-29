import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../models/settings_models.dart';

final userSettingsProvider = StateNotifierProvider<UserSettingsNotifier, AsyncValue<UserSettings>>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return UserSettingsNotifier(apiClient);
});

class UserSettingsNotifier extends StateNotifier<AsyncValue<UserSettings>> {
  final ApiClient _apiClient;

  UserSettingsNotifier(this._apiClient) : super(const AsyncValue.loading()) {
    fetchSettings();
  }

  Future<void> fetchSettings() async {
    try {
      state = const AsyncValue.loading();
      final response = await _apiClient.dio.get('/settings/user');
      final settings = UserSettings.fromJson(response.data);
      state = AsyncValue.data(settings);
    } catch (e, st) {
      print('Error fetching user settings: $e\n$st');
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> updateSettings(UserSettings updatedSettings) async {
    final previousState = state;
    state = AsyncValue.data(updatedSettings); // Optimistic update

    try {
      await _apiClient.dio.put(
        '/settings/user',
        data: updatedSettings.toJson(),
      );
    } catch (e) {
      state = previousState; // Rollback
      rethrow;
    }
  }
}

final brandSettingsProvider = StateNotifierProvider<BrandSettingsNotifier, AsyncValue<BrandSettings>>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return BrandSettingsNotifier(apiClient);
});

class BrandSettingsNotifier extends StateNotifier<AsyncValue<BrandSettings>> {
  final ApiClient _apiClient;

  BrandSettingsNotifier(this._apiClient) : super(const AsyncValue.loading()) {
    fetchSettings();
  }

  Future<void> fetchSettings() async {
    try {
      state = const AsyncValue.loading();
      final response = await _apiClient.dio.get('/settings/brand');
      final settings = BrandSettings.fromJson(response.data);
      state = AsyncValue.data(settings);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> updateSettings(BrandSettings updatedSettings) async {
    final previousState = state;
    state = AsyncValue.data(updatedSettings); // Optimistic update

    try {
      await _apiClient.dio.put(
        '/settings/brand',
        data: updatedSettings.toJson(),
      );
    } catch (e) {
      state = previousState; // Rollback
      rethrow;
    }
  }
}

final blockedBrandsProvider = StateNotifierProvider<BlockedBrandsNotifier, AsyncValue<List<BlockedBrand>>>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return BlockedBrandsNotifier(apiClient);
});

class BlockedBrandsNotifier extends StateNotifier<AsyncValue<List<BlockedBrand>>> {
  final ApiClient _apiClient;

  BlockedBrandsNotifier(this._apiClient) : super(const AsyncValue.loading()) {
    fetchBlockedBrands();
  }

  Future<void> fetchBlockedBrands() async {
    try {
      state = const AsyncValue.loading();
      final response = await _apiClient.dio.get('/user/blocked-brands');
      final brands = (response.data as List)
          .map((json) => BlockedBrand.fromJson(json as Map<String, dynamic>))
          .toList();
      state = AsyncValue.data(brands);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> blockBrand(String brandId) async {
    try {
      await _apiClient.dio.post('/user/block-brand/$brandId');
      fetchBlockedBrands(); // Refresh list
    } catch (e) {
      rethrow;
    }
  }

  Future<void> unblockBrand(String brandId) async {
    try {
      // Optimistic UI
      if (state.hasValue) {
        final current = state.value!;
        state = AsyncValue.data(current.where((b) => b.id != brandId).toList());
      }
      await _apiClient.dio.post('/user/unblock-brand/$brandId');
    } catch (e) {
      fetchBlockedBrands(); // Revert on fail
      rethrow;
    }
  }
}
