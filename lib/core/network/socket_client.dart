import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../storage/secure_storage.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

final socketClientProvider = Provider<SocketClient>((ref) {
  return SocketClient();
});

class SocketClient {
  // Same domain as API, but without /api path
  static const String baseUrl = 'https://internal.lyket.in';
  io.Socket? _socket;
  final Map<String, List<Function(dynamic)>> _listeners = {};

  io.Socket? get socket => _socket;

  void on(String event, Function(dynamic) handler) {
    _listeners.putIfAbsent(event, () => []).add(handler);
    _socket?.on(event, handler);
  }

  void off(String event, Function(dynamic) handler) {
    _listeners[event]?.remove(handler);
    _socket?.off(event, handler);
  }

  Future<void> connect() async {
    if (_socket != null && _socket!.connected) return;

    final token = await SecureStorage.getToken();

    _socket = io.io(baseUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
      'auth': {'token': token ?? ''},
    });

    // Reattach all cached listeners to the new socket instance
    _listeners.forEach((event, handlers) {
      for (var handler in handlers) {
        _socket!.on(event, handler);
      }
    });

    _socket?.connect();

    _socket?.onConnect((_) {
      debugPrint('Socket connected');
    });

    _socket?.onConnectError((err) {
      debugPrint('Socket connect error: $err');
    });

    _socket?.onError((err) {
      debugPrint('Socket error: $err');
    });
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }
}
