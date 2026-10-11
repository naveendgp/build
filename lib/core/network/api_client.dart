import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../storage/secure_storage.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

class ApiClient {
  // The API moved to its own machine, and internal.lyket.in still resolves to
  // the old one — which is why search kept answering with trending posts while
  // the web, pointed at the new server, was fine. Pointed straight at the new
  // box until that name is moved across with a certificate of its own; this is
  // plain HTTP, so it is a stopgap, not where this should stay.
  static const String baseUrl = 'http://52.66.206.193:3001/api';
  late final Dio _dio;

  ApiClient() {
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 60),
        sendTimeout: const Duration(seconds: 60),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Every answer here depends on who is asking, so none of it may be
          // stored. Without this an intermediary could hand back its own copy
          // and a brand you had just followed still read "Follow".
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
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
      ),
    );
  }

  Dio get dio => _dio;

  static const String _origin = 'http://52.66.206.193:3001';

  /// Hosts that older backend builds baked into stored media URLs. Anything
  /// still pointing at one of these is rebuilt onto [_origin]; S3 and other
  /// absolute URLs pass through untouched.
  static const Set<String> _staleHosts = {
    'localhost',
    '127.0.0.1',
    '10.0.2.2',
    '65.2.11.145',
    '13.233.207.224',
    '3.109.152.20',
    '13.232.115.69',
    '52.66.248.222',
    'internal.lyket.in',
  };

  /// Helper to resolve media URLs, especially if the backend returns 'localhost'
  static String resolveMediaUrl(String? url) {
    if (url == null || url.trim().isEmpty) return '';
    final trimmed = url.trim();

    // Relative path from the backend
    if (trimmed.startsWith('/') || trimmed.startsWith('uploads/')) {
      return '$_origin${trimmed.startsWith('/') ? trimmed : '/$trimmed'}';
    }

    // Assume https for a bare host so we never downgrade to cleartext
    final uri = Uri.tryParse(trimmed.contains('://') ? trimmed : 'https://$trimmed');
    if (uri == null || uri.host.isEmpty) return trimmed;

    // Drop the stale scheme AND port, keeping only the path/query
    if (_staleHosts.contains(uri.host)) {
      return '$_origin${uri.path}${uri.hasQuery ? '?${uri.query}' : ''}';
    }

    return uri.toString();
  }
}
