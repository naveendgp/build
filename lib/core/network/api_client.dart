import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../storage/secure_storage.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

class ApiClient {
  // Configured to use Node.js Backend port 3001
  static const String baseUrl = 'http://65.2.11.145:3001/api';
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
      return 'http://65.2.11.145:3001$path';
    }
    
    // Replace various possible localhost/production references with local emulator IP
    String resolved = trimmed
        .replaceFirst('http://localhost:5000', 'http://65.2.11.145:3001')
        .replaceFirst('http://localhost:3001', 'http://65.2.11.145:3001')
        .replaceFirst('13.233.207.224', '65.2.11.145')
        .replaceFirst('3.109.152.20', '65.2.11.145')
        .replaceFirst('localhost', '65.2.11.145'); // fallback

    if (!resolved.startsWith('http://') && !resolved.startsWith('https://')) {
      return 'http://$resolved';
    }
    
    return resolved;
  }
}
