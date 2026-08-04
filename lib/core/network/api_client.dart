import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../storage/secure_storage.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

class ApiClient {
  // Configured to use internal.lyket.in backend
  static const String baseUrl = 'https://internal.lyket.in/api';
  late final Dio _dio;

  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(seconds: 60),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await SecureStorage.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onResponse: (response, handler) {
        return handler.next(response);
      },
      onError: (DioException e, handler) {
        // Handle 401 Unauthorized globally — clear session and redirect
        if (e.response?.statusCode == 401) {
          SecureStorage.clearSession();
        }
        return handler.next(e);
      },
    ));
  }

  Dio get dio => _dio;

  /// Helper to resolve media URLs, especially if the backend returns 'localhost'
  static String resolveMediaUrl(String? url) {
    if (url == null || url.trim().isEmpty) return '';
    String trimmed = url.trim();
    
    // If backend returns a relative path
    if (trimmed.startsWith('/') || trimmed.startsWith('uploads/')) {
      final path = trimmed.startsWith('/') ? trimmed : '/$trimmed';
      return 'https://internal.lyket.in$path';
    }
    
    // Replace various possible localhost/old IP references with internal.lyket.in
    String resolved = trimmed
        .replaceFirst('http://localhost:5000', 'https://internal.lyket.in')
        .replaceFirst('http://localhost:3001', 'https://internal.lyket.in')
        .replaceFirst('http://65.2.11.145:3001', 'https://internal.lyket.in')
        .replaceFirst('13.233.207.224', 'internal.lyket.in')
        .replaceFirst('3.109.152.20', 'internal.lyket.in')
        .replaceFirst('localhost', 'internal.lyket.in'); // fallback

    if (!resolved.startsWith('http://') && !resolved.startsWith('https://')) {
      return 'http://$resolved';
    }
    
    return resolved;
  }
}
