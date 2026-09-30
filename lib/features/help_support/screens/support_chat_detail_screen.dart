import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/haptics.dart';
import '../models/support_chat_models.dart';
import '../providers/support_provider.dart';

/// Message thread for one live-chat SupportChat — the same conversation
/// records lyket-web's SupportChatWindow reads/writes via /chat/:id.
class SupportChatDetailScreen extends ConsumerStatefulWidget {
  final String chatId;
  const SupportChatDetailScreen({super.key, required this.chatId});

  @override
  ConsumerState<SupportChatDetailScreen> createState() => _SupportChatDetailScreenState();
}

class _SupportChatDetailScreenState extends ConsumerState<SupportChatDetailScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _send() {
    final text = _controller.text;
    if (text.trim().isEmpty) return;
    Haptics.light();
    ref.read(chatDetailProvider(widget.chatId).notifier).send(text);
    _controller.clear();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(chatDetailProvider(widget.chatId));
    final chat = state.chat;

    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.background,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.colors.textPrimary, size: 20),
          onPressed: () => context.pop(),
        ),
        title: Text(
          chat != null ? _categoryLabel(chat.category) : 'Live Chat',
          style: AppTypography.titleMedium.copyWith(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          if (chat != null && !chat.isOpen)
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: context.colors.textTertiary.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    chat.status,
                    style: AppTypography.labelSmall.copyWith(color: context.colors.textSecondary),
                  ),
                ),
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: state.isLoading
                ? Center(
                    child: CircularProgressIndicator.adaptive(
                      valueColor: AlwaysStoppedAnimation<Color>(context.colors.primaryAccent),
                    ),
                  )
                : state.error != null
                ? Center(
                    child: Text(state.error!, style: TextStyle(color: context.colors.error)),
                  )
                : chat == null || chat.messages.isEmpty
                ? Center(
                    child: Text(
                      'Say hello to get started',
                      style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    reverse: true,
                    padding: const EdgeInsets.all(16),
                    itemCount: chat.messages.length,
                    itemBuilder: (context, index) {
                      // messages are stored oldest -> newest; reverse the index
                      // to pair with `reverse: true` list rendering.
                      final msg = chat.messages[chat.messages.length - 1 - index];
                      return _MessageBubble(message: msg);
                    },
                  ),
          ),
          _buildComposer(context, state.isSending, chat?.isOpen ?? true),
        ],
      ),
    );
  }

  Widget _buildComposer(BuildContext context, bool isSending, bool isOpen) {
    if (!isOpen) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        color: context.colors.surface,
        child: Text(
          'This chat has ended.',
          textAlign: TextAlign.center,
          style: AppTypography.bodySmall.copyWith(color: context.colors.textSecondary),
        ),
      );
    }
    return Container(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 12,
        bottom: 12 + MediaQuery.of(context).padding.bottom,
      ),
      decoration: BoxDecoration(
        color: context.colors.surface,
        border: Border(top: BorderSide(color: context.colors.borderLight, width: 0.5)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: TextField(
              controller: _controller,
              maxLines: 4,
              minLines: 1,
              textCapitalization: TextCapitalization.sentences,
              style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
              decoration: InputDecoration(
                hintText: 'Type a message…',
                filled: true,
                fillColor: context.colors.background,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(22),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          GestureDetector(
            onTap: isSending ? null : _send,
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: context.colors.primaryAccent,
                shape: BoxShape.circle,
              ),
              child: isSending
                  ? const Padding(
                      padding: EdgeInsets.all(12),
                      child: CircularProgressIndicator.adaptive(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Icon(Icons.arrow_upward_rounded, color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  String _categoryLabel(String category) {
    switch (category) {
      case 'URGENT':
        return 'Urgent';
      case 'SPAM':
        return 'Report Spam';
      case 'SERVICES':
        return 'Services Issue';
      case 'SECURITY':
        return 'Security';
      default:
        return 'Live Chat';
    }
  }
}

class _MessageBubble extends StatelessWidget {
  final SupportChatMessage message;
  const _MessageBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    final isMe = !message.isFromAdmin;
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: isMe ? context.colors.primaryAccent : context.colors.surface,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isMe ? 16 : 4),
            bottomRight: Radius.circular(isMe ? 4 : 16),
          ),
        ),
        child: Text(
          message.message,
          style: AppTypography.bodyMedium.copyWith(
            color: isMe ? Colors.white : context.colors.textPrimary,
          ),
        ),
      ),
    );
  }
}
