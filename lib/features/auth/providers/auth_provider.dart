import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../core/services/notification_service.dart';

enum AuthStatus { idle, loading, success, error }
enum UserRole { user, brand }

class AuthState {
  final AuthStatus status;
  final UserRole? selectedRole;
  final UserRole? loggedInRole; // Added to store actual logged in role
  final String? errorMessage;
  final bool rememberMe;
  final String? brandId; // Store brand ID if logged in as brand
  final String? userId; // Store the actual user UUID

  const AuthState({
    this.status = AuthStatus.idle,
    this.selectedRole,
    this.loggedInRole,
    this.errorMessage,
    this.rememberMe = false,
    this.brandId,
    this.userId,
  });

  AuthState copyWith({
    AuthStatus? status, 
    UserRole? selectedRole, 
    UserRole? loggedInRole,
    String? errorMessage, 
    bool? rememberMe,
    String? brandId,
    String? userId,
  }) {
    return AuthState(
      status: status ?? this.status,
      selectedRole: selectedRole ?? this.selectedRole,
      loggedInRole: loggedInRole ?? this.loggedInRole,
      errorMessage: errorMessage, // Reset error if not provided
      rememberMe: rememberMe ?? this.rememberMe,
      brandId: brandId ?? this.brandId,
      userId: userId ?? this.userId,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _apiClient;

  AuthNotifier(this._apiClient) : super(const AuthState());

  void selectRole(UserRole role) {
    state = state.copyWith(selectedRole: role);
  }

  void toggleRememberMe() {
    state = state.copyWith(rememberMe: !state.rememberMe);
  }

  void setLoggedInRole(UserRole role) {
    state = state.copyWith(loggedInRole: role);
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
    try {
      final response = await _apiClient.dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200) {
        final data = response.data;
        final token = data['token'];
        final roleString = (data['role'] as String?)?.toLowerCase() ?? 'user';
        final role = roleString == 'brand' ? UserRole.brand : UserRole.user;
        final brandId = role == UserRole.brand ? data['userId'] : null;
        final userId = data['userId']; // Get the actual UUID

        if (token != null) {
          await SecureStorage.saveToken(token);
          if (role == UserRole.brand && brandId != null) {
            await SecureStorage.saveBrandId(brandId.toString());
          }
          if (userId != null) {
            await SecureStorage.saveUserId(userId.toString());
          }
          await SecureStorage.saveRole(roleString);
        }

        state = state.copyWith(
          status: AuthStatus.success, 
          loggedInRole: role,
          brandId: brandId?.toString(),
          userId: userId?.toString(),
        );

        // Initialize push notifications after successful login
        NotificationService().initialize();

        return true;
      } else {
        state = state.copyWith(status: AuthStatus.error, errorMessage: 'Login failed');
        return false;
      }
    } on DioException catch (e) {
      debugPrint('DioException in login: ${e.message}');
      debugPrint('Response data: ${e.response?.data}');
      final msg = e.response?.data?['message'] ?? 'Network error or Invalid credentials';
      state = state.copyWith(status: AuthStatus.error, errorMessage: msg);
      return false;
    } catch (e) {
      debugPrint('Unknown error in login: $e');
      state = state.copyWith(status: AuthStatus.error, errorMessage: 'An unexpected error occurred');
      return false;
    }
  }

  Future<void> restoreSession() async {
    try {
      final token = await SecureStorage.getToken();
      if (token != null) {
        final roleString = await SecureStorage.getRole() ?? 'user';
        final brandId = await SecureStorage.getBrandId();
        final userId = await SecureStorage.getUserId();
        final role = roleString.toLowerCase() == 'brand' ? UserRole.brand : UserRole.user;
        
        state = state.copyWith(
          status: AuthStatus.success,
          loggedInRole: role,
          brandId: brandId,
          userId: userId,
        );

        // Initialize push notifications when session is restored
        NotificationService().initialize();
      }
    } catch (e) {
      debugPrint('Error restoring session: $e');
    }
  }

  void resetError() {
    state = state.copyWith(status: AuthStatus.idle, errorMessage: null);
  }

  Future<bool> forgotPassword(String email) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
    try {
      final response = await _apiClient.dio.post('/auth/forgot-password', data: {
        'email': email,
      });

      if (response.statusCode == 200) {
        state = state.copyWith(status: AuthStatus.success);
        return true;
      } else {
        state = state.copyWith(status: AuthStatus.error, errorMessage: 'Failed to send reset code');
        return false;
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ?? 'Network error';
      state = state.copyWith(status: AuthStatus.error, errorMessage: msg);
      return false;
    } catch (e) {
      state = state.copyWith(status: AuthStatus.error, errorMessage: 'An unexpected error occurred');
      return false;
    }
  }

  Future<bool> verifyResetCode(String email, String code) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
    try {
      final response = await _apiClient.dio.post('/auth/verify-reset-code', data: {
        'email': email,
        'code': code,
      });

      if (response.statusCode == 200) {
        state = state.copyWith(status: AuthStatus.success);
        return true;
      } else {
        state = state.copyWith(status: AuthStatus.error, errorMessage: 'Invalid verification code');
        return false;
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ?? 'Network error';
      state = state.copyWith(status: AuthStatus.error, errorMessage: msg);
      return false;
    } catch (e) {
      state = state.copyWith(status: AuthStatus.error, errorMessage: 'An unexpected error occurred');
      return false;
    }
  }

  Future<bool> resetPassword(String email, String code, String newPassword) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
    try {
      final response = await _apiClient.dio.post('/auth/reset-password', data: {
        'email': email,
        'code': code,
        'newPassword': newPassword,
      });

      if (response.statusCode == 200) {
        state = state.copyWith(status: AuthStatus.success);
        return true;
      } else {
        state = state.copyWith(status: AuthStatus.error, errorMessage: 'Failed to reset password');
        return false;
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ?? 'Network error';
      state = state.copyWith(status: AuthStatus.error, errorMessage: msg);
      return false;
    } catch (e) {
      state = state.copyWith(status: AuthStatus.error, errorMessage: 'An unexpected error occurred');
      return false;
    }
  }

  Future<bool> continueWithGoogle() async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
    try {
      final googleSignIn = GoogleSignIn(
        scopes: ['email', 'profile'],
        serverClientId: '799567267925-04kaengl0teimcj5k0colbabfkn8q8g5.apps.googleusercontent.com',
      );
      
      // If user is already signed in (from previous session), sign them out to force account picker
      await googleSignIn.signOut();
      
      final GoogleSignInAccount? account = await googleSignIn.signIn();
      
      if (account == null) {
        // User cancelled the login flow
        state = state.copyWith(status: AuthStatus.idle);
        return false;
      }
      
      final GoogleSignInAuthentication auth = await account.authentication;
      final String? idToken = auth.idToken;
      
      if (idToken == null) {
        state = state.copyWith(status: AuthStatus.error, errorMessage: 'Failed to retrieve Google token');
        return false;
      }

      final response = await _apiClient.dio.post('/auth/google', data: {
        'idToken': idToken,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data;
        await SecureStorage.saveToken(data['token']);
        await SecureStorage.saveRole(data['role']?.toString().toLowerCase() ?? 'user');
        
        state = state.copyWith(
          status: AuthStatus.success,
          loggedInRole: UserRole.user,
        );

        // Initialize push notifications after successful Google login
        NotificationService().initialize();

        return true;
      } else {
        state = state.copyWith(status: AuthStatus.error, errorMessage: 'Google login failed');
        return false;
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ?? 'Network error';
      state = state.copyWith(status: AuthStatus.error, errorMessage: msg);
      return false;
    } catch (e) {
      state = state.copyWith(status: AuthStatus.error, errorMessage: 'An unexpected error occurred: $e');
      return false;
    }
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AuthNotifier(apiClient);
});
