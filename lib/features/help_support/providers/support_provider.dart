import 'dart:async';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart' as http_parser;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/socket_client.dart';
import 'support_api_client.dart';
import '../models/support_models.dart';
import '../models/support_chat_models.dart';

final supportApiClientProvider = Provider((ref) {
  return SupportApiClient(ref.watch(apiClientProvider));
});

final myTicketsProvider = FutureProvider.autoDispose<List<SupportTicket>>((ref) {
  return ref.watch(supportApiClientProvider).getMyTickets();
});

final faqProvider = FutureProvider.autoDispose<List<FaqItem>>((ref) {
  return ref.watch(supportApiClientProvider).getFaqs();
});

enum TicketUploadState { idle, uploading, submitting, success, error }

class CreateTicketState {
  final TicketUploadState status;
  final String? errorMessage;
  final SupportTicket? result;

  const CreateTicketState({this.status = TicketUploadState.idle, this.errorMessage, this.result});

  CreateTicketState copyWith({
    TicketUploadState? status,
    String? errorMessage,
    SupportTicket? result,
  }) {
    return CreateTicketState(
      status: status ?? this.status,
      errorMessage:
          errorMessage, // null by default unless explicitly given? Wait, if we use copyWith, we usually preserve.
      result: result ?? this.result,
    );
  }
}

final createTicketProvider =
    StateNotifierProvider.autoDispose<CreateTicketNotifier, CreateTicketState>((ref) {
      return CreateTicketNotifier(
        ref.watch(supportApiClientProvider),
        ref.watch(apiClientProvider),
      );
    });

class CreateTicketNotifier extends StateNotifier<CreateTicketState> {
  final SupportApiClient _apiClient;
  final ApiClient _baseClient;

  CreateTicketNotifier(this._apiClient, this._baseClient) : super(const CreateTicketState());

  Future<void> submitTicket({
    required String subject,
    required String message,
    required String priority,
    required String ticketType,
  }) async {
    state = state.copyWith(status: TicketUploadState.submitting, errorMessage: null);

    try {
      final ticket = await _apiClient.createTicket({
        'subject': subject,
        'message': message,
        'priority': priority,
        'ticketType': ticketType,
        'attachments': [],
        // The backend already supports this (defaults to 'WEB' if omitted)
        // — the mobile client just never sent it, so bug reports from
        // Android/iOS were indistinguishable from web ones in the admin panel.
        'platform': _currentPlatform(),
      });

      state = state.copyWith(status: TicketUploadState.success, result: ticket);
    } catch (e) {
      state = state.copyWith(status: TicketUploadState.error, errorMessage: e.toString());
    }
  }

  String _currentPlatform() {
    try {
      if (Platform.isAndroid) return 'MOBILE_ANDROID';
      if (Platform.isIOS) return 'MOBILE_IOS';
    } catch (_) {
      // Platform.* throws on web/unsupported platforms.
    }
    return 'WEB';
  }
}

// ═══════════════════════════════════════════════════════════════════
// Live Chat — the system actually used by lyket-web (SupportRequest
// queue -> approved -> SupportChat/SupportMessage), distinct from the
// generic ticket flow above.
// ═══════════════════════════════════════════════════════════════════

final myChatsProvider = FutureProvider.autoDispose<List<SupportChat>>((ref) {
  return ref.watch(supportApiClientProvider).listChats();
});

enum LiveChatRequestStatus {
  idle,
  submitting,
  waiting,
  approved,
  rejected,

  /// Nobody picked the request up. The wait used to run forever, with the
  /// spinner still turning after everyone had gone home.
  timedOut,
  error,
}

class LiveChatRequestState {
  final LiveChatRequestStatus status;
  final SupportRequestModel? request;
  final String? chatId;
  final String? errorMessage;

  const LiveChatRequestState({
    this.status = LiveChatRequestStatus.idle,
    this.request,
    this.chatId,
    this.errorMessage,
  });

  LiveChatRequestState copyWith({
    LiveChatRequestStatus? status,
    SupportRequestModel? request,
    String? chatId,
    String? errorMessage,
  }) {
    return LiveChatRequestState(
      status: status ?? this.status,
      request: request ?? this.request,
      chatId: chatId ?? this.chatId,
      errorMessage: errorMessage,
    );
  }
}

class LiveChatRequestNotifier extends StateNotifier<LiveChatRequestState> {
  final SupportApiClient _api;
  final SocketClient _socket;

  LiveChatRequestNotifier(this._api, this._socket) : super(const LiveChatRequestState());

  /// How long to wait for an agent before saying nobody came. Long enough
  /// for a busy queue, short enough that the screen does not lie.
  static const _waitLimit = Duration(minutes: 3);
  Timer? _waitTimer;

  void Function(dynamic)? _onApproved;
  void Function(dynamic)? _onRejected;
  void Function(dynamic)? _onPosition;

  Future<void> submit({required String category, String? description}) async {
    state = state.copyWith(status: LiveChatRequestStatus.submitting, errorMessage: null);
    try {
      final request = await _api.createSupportRequest(category: category, description: description);
      state = state.copyWith(status: LiveChatRequestStatus.waiting, request: request);
      _listenForUpdates(request.id);
      _startWaitTimer();
    } on DioException catch (e) {
      final data = e.response?.data;
      final msg = data is Map ? data['message']?.toString() : null;
      state = state.copyWith(
        status: LiveChatRequestStatus.error,
        errorMessage: msg ?? 'Failed to start live chat',
      );
    } catch (e) {
      state = state.copyWith(
        status: LiveChatRequestStatus.error,
        errorMessage: 'Failed to start live chat',
      );
    }
  }

  void _startWaitTimer() {
    _waitTimer?.cancel();
    _waitTimer = Timer(_waitLimit, () {
      if (!mounted || state.status != LiveChatRequestStatus.waiting) return;
      _removeListeners();
      state = state.copyWith(
        status: LiveChatRequestStatus.timedOut,
        errorMessage: 'No agent picked this up. Try again, or raise a ticket instead.',
      );
    });
  }

  void _listenForUpdates(String requestId) {
    _removeListeners();

    _onApproved = (data) {
      if (data is! Map) return;
      final req = data['request'];
      if (req is! Map || req['id']?.toString() != requestId) return;
      final chat = data['chat'];
      _waitTimer?.cancel();
      state = state.copyWith(
        status: LiveChatRequestStatus.approved,
        chatId: chat is Map ? chat['id']?.toString() : null,
      );
    };
    _onRejected = (data) {
      if (data is! Map) return;
      final req = data['request'];
      if (req is! Map || req['id']?.toString() != requestId) return;
      state = state.copyWith(
        status: LiveChatRequestStatus.rejected,
        errorMessage: data['reason']?.toString() ?? 'Your request was declined.',
      );
    };
    _onPosition = (data) {
      if (data is! Map || data['requestId']?.toString() != requestId) return;
      final current = state.request;
      if (current == null) return;
      final posRaw = data['newPosition'];
      final pos = posRaw is int ? posRaw : int.tryParse('$posRaw') ?? current.queuePosition;
      state = state.copyWith(
        request: SupportRequestModel(
          id: current.id,
          category: current.category,
          description: current.description,
          status: current.status,
          queuePosition: pos,
          createdAt: current.createdAt,
        ),
      );
    };

    _socket.on('request_approved', _onApproved!);
    _socket.on('request_rejected', _onRejected!);
    _socket.on('request_position_updated', _onPosition!);
  }

  void _removeListeners() {
    if (_onApproved != null) _socket.off('request_approved', _onApproved!);
    if (_onRejected != null) _socket.off('request_rejected', _onRejected!);
    if (_onPosition != null) _socket.off('request_position_updated', _onPosition!);
    _onApproved = null;
    _onRejected = null;
    _onPosition = null;
  }

  void reset() {
    _removeListeners();
    state = const LiveChatRequestState();
  }

  @override
  void dispose() {
    _waitTimer?.cancel();
    _removeListeners();
    super.dispose();
  }
}

final liveChatRequestProvider =
    StateNotifierProvider.autoDispose<LiveChatRequestNotifier, LiveChatRequestState>((ref) {
      return LiveChatRequestNotifier(
        ref.watch(supportApiClientProvider),
        ref.watch(socketClientProvider),
      );
    });

// ─── Chat detail (message thread) ──────────────────────────────────

class ChatDetailState {
  final bool isLoading;
  final SupportChat? chat;
  final String? error;
  final bool isSending;

  const ChatDetailState({this.isLoading = true, this.chat, this.error, this.isSending = false});

  ChatDetailState copyWith({bool? isLoading, SupportChat? chat, String? error, bool? isSending}) {
    return ChatDetailState(
      isLoading: isLoading ?? this.isLoading,
      chat: chat ?? this.chat,
      error: error,
      isSending: isSending ?? this.isSending,
    );
  }
}

class ChatDetailNotifier extends StateNotifier<ChatDetailState> {
  final SupportApiClient _api;
  final SocketClient _socket;
  final String chatId;
  late final void Function(dynamic) _onNewMessage;

  ChatDetailNotifier(this._api, this._socket, this.chatId) : super(const ChatDetailState()) {
    _onNewMessage = (data) {
      if (data is! Map || data['chatId']?.toString() != chatId) return;
      final msg = SupportChatMessage.fromJson(Map<String, dynamic>.from(data));
      final current = state.chat;
      if (current == null) return;
      if (current.messages.any((m) => m.id == msg.id)) return; // dedupe our own echoed send
      state = state.copyWith(
        chat: SupportChat(
          id: current.id,
          category: current.category,
          status: current.status,
          unreadCount: current.unreadCount,
          updatedAt: DateTime.now(),
          messages: [...current.messages, msg],
        ),
      );
    };
    _socket.on('new_chat_message', _onNewMessage);
    _load();
  }

  Future<void> _load() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final chat = await _api.getChat(chatId);
      state = state.copyWith(isLoading: false, chat: chat);
      _api.markChatRead(chatId).catchError((_) {});
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Failed to load chat');
    }
  }

  Future<void> send(String text) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty) return;
    state = state.copyWith(isSending: true);
    try {
      final msg = await _api.sendChatMessage(chatId, trimmed);
      final current = state.chat;
      if (current != null && !current.messages.any((m) => m.id == msg.id)) {
        state = state.copyWith(
          chat: SupportChat(
            id: current.id,
            category: current.category,
            status: current.status,
            unreadCount: current.unreadCount,
            updatedAt: DateTime.now(),
            messages: [...current.messages, msg],
          ),
        );
      }
    } catch (_) {
      // Message just doesn't appear — composer keeps the text via its own
      // controller so nothing is lost; a toast could be added here later.
    } finally {
      state = state.copyWith(isSending: false);
    }
  }

  @override
  void dispose() {
    _socket.off('new_chat_message', _onNewMessage);
    super.dispose();
  }
}

final chatDetailProvider = StateNotifierProvider.autoDispose
    .family<ChatDetailNotifier, ChatDetailState, String>((ref, chatId) {
      return ChatDetailNotifier(
        ref.watch(supportApiClientProvider),
        ref.watch(socketClientProvider),
        chatId,
      );
    });
