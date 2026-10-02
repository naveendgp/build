import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/adaptive/adaptive_dialogs.dart';
import '../../../core/utils/app_messenger.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/message_models.dart';
import '../providers/messaging_provider.dart';
import '../widgets/chat_header.dart';
import '../widgets/chat_composer.dart';
import '../widgets/message_bubble.dart';

class ChatScreen extends ConsumerStatefulWidget {
  final String conversationId;
  final String? prefilledMessage;

  const ChatScreen({super.key, required this.conversationId, this.prefilledMessage});

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

  /// Blocking asks first; unblocking does not, since it undoes rather than
  /// does.
  Future<void> _toggleBlock(bool currentlyBlocked) async {
    final notifier = ref.read(chatProvider(widget.conversationId).notifier);
    final name = ref.read(chatProvider(widget.conversationId)).participant?.name ?? 'this account';
    final asBrand = ref.read(authProvider).loggedInRole == UserRole.brand;

    if (!currentlyBlocked) {
      final confirmed = await showAdaptiveConfirmDialog(
        context,
        title: 'Block $name?',
        message: 'They will not be able to message you, and you will not be able to message them.',
        confirmLabel: 'Block',
        isDestructive: true,
      );
      if (confirmed != true) return;
    }

    final done = await notifier.setBlocked(!currentlyBlocked, asBrand: asBrand);
    if (done && mounted) {
      AppMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(currentlyBlocked ? 'Unblocked' : 'Blocked')));
    }
  }

  /// Sends, and says so when it did not go. A failed message is taken back out
  /// of the thread, so without this it just disappeared.
  Future<void> _send(ChatNotifier notifier, String text) async {
    final sent = await notifier.sendMessage(text);
    if (!sent && mounted) {
      AppMessenger.of(context).showError('Message not sent. Check your connection and try again.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final chatState = ref.watch(chatProvider(widget.conversationId));
    final notifier = ref.read(chatProvider(widget.conversationId).notifier);
    final authState = ref.watch(authProvider);
    final currentUserId = authState.userId ?? authState.brandId ?? 'mock_user_id';

    final participant =
        chatState.participant ?? const ChatParticipant(id: 'unknown', name: 'Loading...');

    return Scaffold(
      backgroundColor: context.colors.background,
      body: Stack(
        children: [
          // Background Gradient (Cinematic)
          Container(decoration: BoxDecoration(gradient: context.colors.cinematicGradient)),

          Column(
            children: [
              // Header
              ChatHeader(
                participant: participant,
                isBlocked: chatState.blockedByMe,
                onBlockToggle: () => _toggleBlock(chatState.blockedByMe),
              ),

              // Messages List
              Expanded(
                child: chatState.isLoading
                    ? Center(
                        child: CircularProgressIndicator.adaptive(
                          valueColor: AlwaysStoppedAnimation<Color>(context.colors.primaryAccent),
                        ),
                      )
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

              // Composer, or the notice that takes its place once either side
              // has blocked the other - the server refuses messages then.
              if (chatState.isBlocked)
                _BlockedNotice(
                  blockedByMe: chatState.blockedByMe,
                  name: participant.name,
                  onUnblock: chatState.blockedByMe ? () => _toggleBlock(true) : null,
                )
              else
                ChatComposer(
                  onSend: (text) => _send(notifier, text),
                  isTyping: chatState.isTyping,
                  initialText: widget.prefilledMessage,
                ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Sits where the message box was once a thread is blocked.
class _BlockedNotice extends StatelessWidget {
  final bool blockedByMe;
  final String name;
  final VoidCallback? onUnblock;

  const _BlockedNotice({required this.blockedByMe, required this.name, this.onUnblock});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(
        AppSpacing.md,
        AppSpacing.md,
        AppSpacing.md,
        MediaQuery.of(context).padding.bottom + AppSpacing.md,
      ),
      decoration: BoxDecoration(
        color: context.colors.surface,
        border: Border(top: BorderSide(color: context.colors.border, width: 0.5)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            blockedByMe ? 'You blocked $name' : "You can't reply to this conversation",
            textAlign: TextAlign.center,
            style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
          ),
          if (onUnblock != null) ...[
            const SizedBox(height: AppSpacing.sm),
            TextButton(
              onPressed: onUnblock,
              child: Text(
                'Unblock',
                style: AppTypography.button.copyWith(color: context.colors.primaryAccent),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
