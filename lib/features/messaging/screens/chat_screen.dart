import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/message_models.dart';
import '../providers/messaging_provider.dart';
import '../widgets/chat_header.dart';
import '../widgets/chat_composer.dart';
import '../widgets/message_bubble.dart';

class ChatScreen extends ConsumerStatefulWidget {
  final String conversationId;

  const ChatScreen({super.key, required this.conversationId});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  @override
  void initState() {
    super.initState();
    ChatNotifier.activeConversationId = widget.conversationId;
    // Mark as read immediately when screen opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(inboxProvider.notifier).markConversationRead(widget.conversationId);
    });
  }

  @override
  void dispose() {
    ChatNotifier.activeConversationId = null;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final chatState = ref.watch(chatProvider(widget.conversationId));
    final notifier = ref.read(chatProvider(widget.conversationId).notifier);
    final authState = ref.watch(authProvider);
    final currentUserId = authState.userId ?? authState.brandId ?? 'mock_user_id';

    final participant = chatState.participant ?? const ChatParticipant(
      id: 'unknown',
      name: 'Loading...',
    );

    return Scaffold(
      backgroundColor: context.colors.background,
      body: Stack(
        children: [
          // Background Gradient (Cinematic)
          Container(
            decoration: BoxDecoration(
              gradient: context.colors.cinematicGradient,
            ),
          ),
          
          Column(
            children: [
              // Header
              ChatHeader(participant: participant),
              
              // Messages List
              Expanded(
                child: chatState.isLoading
                    ? Center(child: CircularProgressIndicator(color: context.colors.primaryAccent))
                    : ListView.builder(
                        padding: const EdgeInsets.only(top: AppSpacing.md, bottom: 20),
                        reverse: true, // typical for chat
                        itemCount: chatState.messages.length,
                        itemBuilder: (context, index) {
                          final msg = chatState.messages[index];
                          // Check if msg.senderId matches the current user's ID
                          final isMe = msg.senderId == currentUserId;
                          return MessageBubble(message: msg, isMe: isMe);
                        },
                      ),
              ),
              
              // Composer
              ChatComposer(
                onSend: (text) => notifier.sendMessage(text),
                isTyping: chatState.isTyping,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
