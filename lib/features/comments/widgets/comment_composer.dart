import 'dart:ui';

import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/haptics.dart';

class CommentComposer extends StatefulWidget {
  const CommentComposer({
    super.key,
    this.replyToName,
    required this.isSending,
    required this.onCancelReply,
    required this.onSend,
  });

  final String? replyToName;
  final bool isSending;
  final VoidCallback onCancelReply;
  final ValueChanged<String> onSend;

  @override
  State<CommentComposer> createState() => _CommentComposerState();
}

class _CommentComposerState extends State<CommentComposer> {
  final TextEditingController _controller = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  bool _hasText = false;

  @override
  void initState() {
    super.initState();
    _controller.addListener(_onTextChanged);
  }

  void _onTextChanged() {
    final hasText = _controller.text.trim().isNotEmpty;
    if (hasText != _hasText) {
      setState(() => _hasText = hasText);
    }
  }

  void _handleSend() {
    final text = _controller.text.trim();
    if (text.isEmpty || widget.isSending) return;
    Haptics.medium();
    widget.onSend(text);
    _controller.clear();
  }

  @override
  void dispose() {
    _controller.removeListener(_onTextChanged);
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final viewInsets = MediaQuery.of(context).viewInsets.bottom;
    final bottomPadding = MediaQuery.of(context).padding.bottom;
    // Only apply bottom padding if the keyboard is NOT open,
    // otherwise the padding is handled by the parent sheet.
    final effectiveBottom = viewInsets > 0 ? AppSpacing.sm : bottomPadding + AppSpacing.sm;

    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
        child: Container(
          width: double.infinity,
          decoration: BoxDecoration(
            color: context.colors.surface.withValues(alpha: 0.85),
            border: Border(top: BorderSide(color: context.colors.borderLight, width: 0.5)),
          ),
          padding: EdgeInsets.only(
            left: AppSpacing.md,
            right: AppSpacing.md,
            top: AppSpacing.sm,
            bottom: effectiveBottom,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [_buildReplyIndicator(), _buildInputRow()],
          ),
        ),
      ),
    );
  }

  Widget _buildReplyIndicator() {
    final isReplying = widget.replyToName != null;

    return AnimatedSize(
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeOutCubic,
      alignment: Alignment.topCenter,
      child: AnimatedCrossFade(
        duration: const Duration(milliseconds: 200),
        crossFadeState: isReplying ? CrossFadeState.showFirst : CrossFadeState.showSecond,
        sizeCurve: Curves.easeOutCubic,
        firstChild: Container(
          width: double.infinity,
          margin: const EdgeInsets.only(bottom: AppSpacing.sm),
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: 6),
          decoration: BoxDecoration(
            color: context.colors.card,
            borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
          ),
          child: Row(
            children: [
              Expanded(
                child: Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(
                        text: 'Replying to ',
                        style: AppTypography.labelSmall.copyWith(
                          color: context.colors.textTertiary,
                        ),
                      ),
                      TextSpan(
                        text: '@${widget.replyToName ?? ''}',
                        style: AppTypography.labelSmall.copyWith(
                          color: context.colors.primaryAccent,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: AppSpacing.xs),
              GestureDetector(
                onTap: () {
                  Haptics.light();
                  widget.onCancelReply();
                },
                behavior: HitTestBehavior.opaque,
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.xxs),
                  child: Icon(Icons.close, size: 16, color: context.colors.textTertiary),
                ),
              ),
            ],
          ),
        ),
        secondChild: const SizedBox(width: double.infinity, height: 0),
      ),
    );
  }

  Widget _buildInputRow() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        // Text field
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: context.colors.border, width: 0.5),
            ),
            child: TextField(
              controller: _controller,
              focusNode: _focusNode,
              style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
              decoration: InputDecoration(
                hintText: 'Share your thoughts\u2026',
                hintStyle: AppTypography.bodyMedium.copyWith(color: context.colors.textTertiary),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                isDense: true,
              ),
              maxLines: 4,
              minLines: 1,
              textCapitalization: TextCapitalization.sentences,
              textInputAction: TextInputAction.newline,
              cursorColor: context.colors.primaryAccent,
            ),
          ),
        ),
        const SizedBox(width: AppSpacing.sm),

        // Send button
        GestureDetector(
          onTap: _handleSend,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeOutCubic,
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: _hasText ? context.colors.primaryAccent : context.colors.card,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: widget.isSending
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator.adaptive(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : AnimatedSwitcher(
                      duration: const Duration(milliseconds: 200),
                      child: Icon(
                        Icons.arrow_upward_rounded,
                        key: ValueKey(_hasText),
                        size: 20,
                        color: _hasText ? Colors.white : context.colors.textTertiary,
                      ),
                    ),
            ),
          ),
        ),
      ],
    );
  }
}
