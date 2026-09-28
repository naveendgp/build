import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';

class ChatComposer extends StatefulWidget {
  final ValueChanged<String> onSend;
  final bool isTyping;

  final String? initialText;

  const ChatComposer({super.key, required this.onSend, this.isTyping = false, this.initialText});

  @override
  State<ChatComposer> createState() => _ChatComposerState();
}

class _ChatComposerState extends State<ChatComposer> {
  final TextEditingController _controller = TextEditingController();
  bool _isComposing = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialText != null) {
      _controller.text = widget.initialText!;
      _isComposing = widget.initialText!.isNotEmpty;
    }
    _controller.addListener(() {
      setState(() {
        _isComposing = _controller.text.trim().isNotEmpty;
      });
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleSend() {
    if (_isComposing) {
      widget.onSend(_controller.text);
      _controller.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          padding: EdgeInsets.only(
            left: AppSpacing.sm,
            right: AppSpacing.sm,
            top: AppSpacing.sm,
            bottom: bottomPadding > 0 ? bottomPadding : AppSpacing.sm,
          ),
          decoration: BoxDecoration(
            color: context.colors.background.withValues(alpha: 0.75),
            border: Border(top: BorderSide(color: context.colors.border, width: 0.5)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              // Removed Add Media Icon
              Expanded(
                child: Container(
                  constraints: const BoxConstraints(maxHeight: 120),
                  decoration: BoxDecoration(
                    color: context.colors.card,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: context.colors.borderLight),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _controller,
                          maxLines: null,
                          keyboardAppearance: Brightness.dark,
                          style: GoogleFonts.inter(color: context.colors.textPrimary, fontSize: 15),
                          decoration: InputDecoration(
                            hintText: 'Message...',
                            hintStyle: GoogleFonts.inter(
                              color: context.colors.textTertiary,
                              fontSize: 15,
                            ),
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: AppSpacing.md,
                              vertical: 12,
                            ),
                          ),
                        ),
                      ),
                      // Removed Mic Icon
                    ],
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.xs),
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: _isComposing ? 44 : 0,
                height: 44,
                curve: Curves.easeOutCubic,
                decoration: BoxDecoration(
                  color: context.colors.primaryAccent,
                  shape: BoxShape.circle,
                ),
                child: _isComposing
                    ? IconButton(
                        icon: const Icon(Icons.arrow_upward_rounded, color: Colors.white, size: 22),
                        onPressed: _handleSend,
                      )
                    : null,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
