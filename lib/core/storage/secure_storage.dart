import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Lyket — Secure Token & Session Storage
/// Uses encrypted keychain (iOS) / keystore (Android) instead of SharedPreferences.
class SecureStorage {
  SecureStorage._();

  static const _storage = FlutterSecureStorage(aOptions: AndroidOptions());

  // ─── Keys ──────────────────────────────────────────────────────────
  static const _keyAuthToken = 'auth_token';
  static const _keyUserRole = 'user_role';
  static const _keyBrandId = 'brand_id';
  static const _keyUserId = 'user_id';

  // ─── Token ─────────────────────────────────────────────────────────

  static Future<void> saveToken(String token) async {
    await _storage.write(key: _keyAuthToken, value: token);
  }

  static Future<String?> getToken() async {
    return await _storage.read(key: _keyAuthToken);
  }

  static Future<void> deleteToken() async {
    await _storage.delete(key: _keyAuthToken);
  }

  // ─── Role ──────────────────────────────────────────────────────────

  static Future<void> saveRole(String role) async {
    await _storage.write(key: _keyUserRole, value: role);
  }

  static Future<String?> getRole() async {
    return await _storage.read(key: _keyUserRole);
  }

  // ─── Brand ID ──────────────────────────────────────────────────────

  static Future<void> saveBrandId(String id) async {
    await _storage.write(key: _keyBrandId, value: id);
  }

  static Future<String?> getBrandId() async {
    return await _storage.read(key: _keyBrandId);
  }

  // ─── User ID ───────────────────────────────────────────────────────

  static Future<void> saveUserId(String id) async {
    await _storage.write(key: _keyUserId, value: id);
  }

  static Future<String?> getUserId() async {
    return await _storage.read(key: _keyUserId);
  }

  // ─── Session Management ────────────────────────────────────────────

  /// Check if user has an active session
  static Future<bool> hasSession() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  /// Clear all session data on logout
  static Future<void> clearSession() async {
    await _storage.deleteAll();
  }
}
