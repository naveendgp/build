import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/socket_client.dart';
import '../models/message_models.dart';
import '../../../features/auth/providers/auth_provider.dart';

class InboxState {
  final bool isLoading;
  final bool isLoadingMore;
  final List<Conversation> conversations;
  final String? error;
  final String activeTab; // 'Brands', 'Profiles', 'Requests'

  const InboxState({
    this.isLoading = false,
    this.isLoadingMore = false,
    this.conversations = const [],
    this.error,
    this.activeTab = 'Brands',
  });

  InboxState copyWith({
    bool? isLoading,
    bool? isLoadingMore,
    List<Conversation>? conversations,
    String? error,
    String? activeTab,
    bool clearError = false,
  }) {
    return InboxState(
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      conversations: conversations ?? this.conversations,
      error: clearError ? null : (error ?? this.error),
      activeTab: activeTab ?? this.activeTab,
    );
  }
}

class InboxNotifier extends StateNotifier<InboxState> {
  final ApiClient _api;
  final String _currentUserId;

  InboxNotifier(this._api, this._currentUserId) : super(const InboxState());

  Future<void> loadInbox() async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final response = await _api.dio.get('/conversations');
      final data = response.data as List<dynamic>;
      final mockConversations = data
          .map((json) => Conversation.fromJson(json, _currentUserId))
          .toList();

      state = state.copyWith(isLoading: false, conversations: mockConversations);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Failed to load inbox.');
    }
  }

  void setTab(String tab) {
    state = state.copyWith(activeTab: tab);
  }

  void _handleNewMessage(dynamic data) {
    if (data == null) return;
    try {
      final Map<String, dynamic> jsonMap = data is Map
          ? Map<String, dynamic>.from(data)
          : data as Map<String, dynamic>;
      final msg = Message.fromJson(jsonMap);
      final conversationId = msg.conversationId;

      // Update the last message in the conversation list and bump it to top
      final currentConvos = List<Conversation>.from(state.conversations);
      final index = currentConvos.indexWhere((c) => c.id == conversationId);

      if (index != -1) {
        final convo = currentConvos[index];
        final isChatActive = ChatNotifier.activeConversationId == msg.conversationId;
        final updatedConvo = convo.copyWith(
          lastMessage: msg,
          updatedAt: msg.createdAt,
          unreadCount: (msg.senderId != _currentUserId && !isChatActive)
              ? convo.unreadCount + 1
              : convo.unreadCount,
        );
        currentConvos.removeAt(index);
        currentConvos.insert(0, updatedConvo); // move to top
        state = state.copyWith(conversations: currentConvos);
      } else {
        // If conversation is new, reload the inbox to fetch it
        loadInbox();
      }
    } catch (e) {
      debugPrint('Error handling new_message for inbox: $e');
    }
  }

  void markConversationRead(String conversationId) {
    final currentConvos = List<Conversation>.from(state.conversations);
    final index = currentConvos.indexWhere((c) => c.id == conversationId);

    if (index != -1) {
      final convo = currentConvos[index];
      if (convo.unreadCount > 0) {
        currentConvos[index] = convo.copyWith(unreadCount: 0);
        state = state.copyWith(conversations: currentConvos);
      }
    }
  }
}

final inboxProvider = StateNotifierProvider.autoDispose<InboxNotifier, InboxState>((ref) {
  final api = ref.read(apiClientProvider);
  final authState = ref.watch(authProvider);
  // A brand's own id first when signed in as a brand: its messages are
  // recorded against brandId, and 'mock_user_id' silently matched nothing.
  final userId = authState.loggedInRole == UserRole.brand
      ? (authState.brandId ?? authState.userId ?? '')
      : (authState.userId ?? authState.brandId ?? '');
  final socketClient = ref.read(socketClientProvider);

  final notifier = InboxNotifier(api, userId);

  socketClient.on('new_message', notifier._handleNewMessage);

  ref.onDispose(() {
    socketClient.off('new_message', notifier._handleNewMessage);
  });

  return notifier..loadInbox();
});

class ChatState {
  final bool isLoading;
  final List<Message> messages;
  final String? error;
  final bool isTyping;
  final ChatParticipant? participant;

  /// I blocked them. The thread then says so, with Unblock where the message
  /// box was.
  final bool blockedByMe;

  /// They blocked me. The server refuses messages either way, so the box is
  /// replaced with a plain notice rather than a button.
  final bool blockedMe;

  bool get isBlocked => blockedByMe || blockedMe;

  const ChatState({
    this.isLoading = false,
    this.messages = const [],
    this.error,
    this.isTyping = false,
    this.participant,
    this.blockedByMe = false,
    this.blockedMe = false,
  });

  ChatState copyWith({
    bool? isLoading,
    List<Message>? messages,
    String? error,
    bool? isTyping,
    ChatParticipant? participant,
    bool? blockedByMe,
    bool? blockedMe,
    bool clearError = false,
  }) {
    return ChatState(
      isLoading: isLoading ?? this.isLoading,
      messages: messages ?? this.messages,
      error: clearError ? null : (error ?? this.error),
      isTyping: isTyping ?? this.isTyping,
      participant: participant ?? this.participant,
      blockedByMe: blockedByMe ?? this.blockedByMe,
      blockedMe: blockedMe ?? this.blockedMe,
    );
  }
}

class ChatNotifier extends StateNotifier<ChatState> {
  static String? activeConversationId;

  final ApiClient _api;
  final String _conversationId;
  final String _currentUserId;

  ChatNotifier(this._api, this._conversationId, this._currentUserId) : super(const ChatState());

  /// Blocks or unblocks the other side of this thread. A brand blocks a
  /// person; a person blocks a brand - the endpoints differ, so the caller
  /// says which it is.
  Future<bool> setBlocked(bool blocked, {required bool asBrand}) async {
    final target = state.participant?.id;
    if (target == null || target == 'unknown') return false;

    final previous = state.blockedByMe;
    state = state.copyWith(blockedByMe: blocked);
    try {
      final path = asBrand ? '/brand/blocked-users/$target' : '/user/me/blocked-brands/$target';
      if (blocked) {
        await _api.dio.post(path);
      } else {
        await _api.dio.delete(path);
      }
      return true;
    } catch (e) {
      debugPrint('Block toggle failed: $e');
      if (mounted) state = state.copyWith(blockedByMe: previous);
      return false;
    }
  }

  Future<void> loadMessages() async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      // Fetch conversation details to get the participant info
      final detailsResponse = await _api.dio.get('/conversations/$_conversationId/details');
      final conversation = Conversation.fromJson(detailsResponse.data, _currentUserId);

      // Fetch messages
      final response = await _api.dio.get('/conversations/$_conversationId/messages');
      List<dynamic> dataList = [];
      if (response.data is Map && response.data['data'] != null) {
        dataList = response.data['data'] as List<dynamic>;
      } else if (response.data is List) {
        dataList = response.data as List<dynamic>;
      }

      final msgs = dataList.map((json) => Message.fromJson(json)).toList();

      final details = detailsResponse.data is Map
          ? Map<String, dynamic>.from(detailsResponse.data as Map)
          : <String, dynamic>{};

      state = state.copyWith(
        isLoading: false,
        messages: msgs.reversed.toList(), // usually descending in list view
        participant: conversation.otherParticipant,
        blockedByMe: details['blockedByMe'] == true,
        blockedMe: details['blockedMe'] == true,
      );

      // Mark as read immediately when loaded
      _api.dio.post('/conversations/$_conversationId/read').then((_) {}, onError: (_) {});
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Failed to load messages');
    }
  }

  /// Returns false when the message did not reach the server, so the screen
  /// can say so and hand the text back instead of losing it.
  Future<bool> sendMessage(String text) async {
    if (text.trim().isEmpty) return false;

    final newMessage = Message(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      conversationId: _conversationId,
      senderId: _currentUserId,
      content: text,
      createdAt: DateTime.now(),
    );

    // Optimistic update
    state = state.copyWith(messages: [newMessage, ...state.messages]);

    try {
      final response = await _api.dio.post(
        '/conversations/$_conversationId/messages',
        data: {'content': text},
      );

      // Replace optimistic message with actual message from server
      final actualMessage = Message.fromJson(response.data);
      state = state.copyWith(
        messages: state.messages.map((m) => m.id == newMessage.id ? actualMessage : m).toList(),
      );
      return true;
    } catch (e) {
      // Revert on failure. The screen reports it; nothing used to, so the
      // message simply vanished from the thread.
      state = state.copyWith(
        messages: state.messages.where((m) => m.id != newMessage.id).toList(),
        error: 'Failed to send message',
      );
      return false;
    }
  }

  void _handleNewMessage(dynamic data) {
    if (data == null) return;
    try {
      final Map<String, dynamic> jsonMap = data is Map
          ? Map<String, dynamic>.from(data)
          : data as Map<String, dynamic>;
      final msg = Message.fromJson(jsonMap);
      if (msg.conversationId == _conversationId) {
        // Prevent duplicating if it's our own optimistic message
        if (msg.senderId != _currentUserId) {
          state = state.copyWith(messages: [msg, ...state.messages]);
          // Mark as read since we are on the screen
          _api.dio.post('/conversations/$_conversationId/read').then((_) {}, onError: (_) {});
        }
      }
    } catch (e) {
      debugPrint('Error parsing new_message: $e');
    }
  }

  void _handleMessagesRead(dynamic data) {
    if (data == null) return;
    try {
      final Map<String, dynamic> jsonMap = data is Map
          ? Map<String, dynamic>.from(data)
          : data as Map<String, dynamic>;
      final String convId = jsonMap['conversationId']?.toString() ?? '';
      if (convId == _conversationId) {
        // Mark all messages as read where I am the sender
        final updatedMessages = state.messages.map((msg) {
          if (msg.senderId == _currentUserId && !msg.isRead) {
            return msg.copyWith(isRead: true);
          }
          return msg;
        }).toList();
        state = state.copyWith(messages: updatedMessages);
      }
    } catch (e) {
      debugPrint('Error parsing messages_read: $e');
    }
  }
}

final chatProvider = StateNotifierProvider.family<ChatNotifier, ChatState, String>((
  ref,
  conversationId,
) {
  final api = ref.read(apiClientProvider);
  final authState = ref.watch(authProvider);
  // A brand's own id first when signed in as a brand: its messages are
  // recorded against brandId, and 'mock_user_id' silently matched nothing.
  final userId = authState.loggedInRole == UserRole.brand
      ? (authState.brandId ?? authState.userId ?? '')
      : (authState.userId ?? authState.brandId ?? '');
  final socketClient = ref.read(socketClientProvider);

  final notifier = ChatNotifier(api, conversationId, userId);

  // Set up socket listener
  socketClient.on('new_message', notifier._handleNewMessage);
  socketClient.on('messages_read', notifier._handleMessagesRead);

  ref.onDispose(() {
    socketClient.off('new_message', notifier._handleNewMessage);
    socketClient.off('messages_read', notifier._handleMessagesRead);
  });

  return notifier..loadMessages();
});
