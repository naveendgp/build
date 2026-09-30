import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/haptics.dart';
import '../providers/support_provider.dart';

const _categories = [
  ('URGENT', 'Urgent', Icons.priority_high_rounded),
  ('SPAM', 'Report Spam', Icons.report_gmailerrorred_rounded),
  ('SERVICES', 'Services Issue', Icons.support_agent_rounded),
  ('SECURITY', 'Security', Icons.shield_outlined),
  ('OTHER', 'Other', Icons.chat_bubble_outline_rounded),
];

/// Starts a live chat the same way lyket-web does: POST /request/create,
/// then wait in a queue (with real-time position updates over the socket)
/// until an agent approves it, at which point we're handed a chatId and
/// move to the actual chat thread.
class LiveChatScreen extends ConsumerStatefulWidget {
  final String? initialCategory;

  const LiveChatScreen({super.key, this.initialCategory});

  @override
  ConsumerState<LiveChatScreen> createState() => _LiveChatScreenState();
}

class _LiveChatScreenState extends ConsumerState<LiveChatScreen> {
  String? _category;
  final _descController = TextEditingController();
  bool _navigated = false;

  @override
  void initState() {
    super.initState();
    _category = widget.initialCategory;
  }

  @override
  void dispose() {
    _descController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_category == null) return;
    Haptics.medium();
    ref
        .read(liveChatRequestProvider.notifier)
        .submit(
          category: _category!,
          description: _descController.text.trim().isEmpty ? null : _descController.text.trim(),
        );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(liveChatRequestProvider);

    ref.listen<LiveChatRequestState>(liveChatRequestProvider, (prev, next) {
      if (next.status == LiveChatRequestStatus.approved && next.chatId != null && !_navigated) {
        _navigated = true;
        ref.invalidate(myChatsProvider);
        Haptics.medium();
        context.pushReplacement('/help/chat/${next.chatId}');
      }
    });

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
          'Live Chat',
          style: AppTypography.titleMedium.copyWith(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: switch (state.status) {
        LiveChatRequestStatus.waiting => _buildWaiting(context, state),
        LiveChatRequestStatus.rejected => _buildRejected(context, state),
        // Nobody picked it up: the same panel, with a way back to a ticket.
        LiveChatRequestStatus.timedOut => _buildRejected(context, state, timedOut: true),
        _ => _buildForm(context, state),
      },
    );
  }

  Widget _buildForm(BuildContext context, LiveChatRequestState state) {
    final isSubmitting = state.status == LiveChatRequestStatus.submitting;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'What do you need help with?',
            style: AppTypography.titleMedium.copyWith(
              color: context.colors.textPrimary,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: _categories.map((c) {
              final (id, label, icon) = c;
              final isSelected = _category == id;
              return GestureDetector(
                onTap: () {
                  Haptics.selection();
                  setState(() => _category = id);
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? context.colors.primaryAccent.withOpacity(0.12)
                        : context.colors.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isSelected ? context.colors.primaryAccent : context.colors.borderLight,
                      width: isSelected ? 1.5 : 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        icon,
                        size: 18,
                        color: isSelected
                            ? context.colors.primaryAccent
                            : context.colors.textSecondary,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        label,
                        style: AppTypography.bodyMedium.copyWith(
                          color: isSelected
                              ? context.colors.primaryAccent
                              : context.colors.textPrimary,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 24),
          Text(
            'Describe your issue (optional)',
            style: AppTypography.labelLarge.copyWith(
              color: context.colors.textSecondary,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _descController,
            maxLines: 5,
            maxLength: 2000,
            style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
            decoration: InputDecoration(
              hintText: 'A few details help the agent get up to speed faster',
              filled: true,
              fillColor: context.colors.surface,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: context.colors.borderLight),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: context.colors.borderLight),
              ),
            ),
          ),
          if (state.status == LiveChatRequestStatus.error && state.errorMessage != null) ...[
            const SizedBox(height: 12),
            Text(
              state.errorMessage!,
              style: AppTypography.bodySmall.copyWith(color: context.colors.error),
            ),
          ],
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            height: 54,
            child: ElevatedButton(
              onPressed: (_category == null || isSubmitting) ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: context.colors.primaryAccent,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: isSubmitting
                  ? const CircularProgressIndicator.adaptive(
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    )
                  : Text(
                      'Request Live Chat',
                      style: AppTypography.titleMedium.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWaiting(BuildContext context, LiveChatRequestState state) {
    final position = state.request?.queuePosition ?? 1;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 64,
              height: 64,
              child: CircularProgressIndicator.adaptive(
                valueColor: AlwaysStoppedAnimation<Color>(context.colors.primaryAccent),
                strokeWidth: 3,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Waiting for an agent…',
              style: AppTypography.titleMedium.copyWith(
                color: context.colors.textPrimary,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              position > 1
                  ? 'You are #$position in the queue'
                  : 'You\'re next — an agent will join shortly',
              style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            TextButton(
              onPressed: () {
                Haptics.light();
                ref.read(liveChatRequestProvider.notifier).reset();
              },
              child: Text(
                'Cancel',
                style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRejected(BuildContext context, LiveChatRequestState state, {bool timedOut = false}) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              timedOut ? Icons.schedule_rounded : Icons.info_outline_rounded,
              size: 48,
              color: timedOut ? context.colors.textSecondary : context.colors.error,
            ),
            const SizedBox(height: 16),
            Text(
              state.errorMessage ??
                  (timedOut ? 'No agent picked this up.' : 'Your request was declined.'),
              style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                Haptics.light();
                ref.read(liveChatRequestProvider.notifier).reset();
              },
              style: ElevatedButton.styleFrom(backgroundColor: context.colors.primaryAccent),
              child: const Text('Try Again', style: TextStyle(color: Colors.white)),
            ),
            if (timedOut) ...[
              const SizedBox(height: 8),
              TextButton(
                onPressed: () {
                  Haptics.light();
                  context.push('/help/ticket');
                },
                child: Text(
                  'Raise a ticket instead',
                  style: AppTypography.button.copyWith(color: context.colors.primaryAccent),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
