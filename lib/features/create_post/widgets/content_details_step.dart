import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/haptics.dart';
import 'tag_input.dart';

class ContentDetailsStep extends StatelessWidget {
  final String title;
  final bool isHighlightTitle;
  final String highlightMessage;
  final String highlightTheme;
  final String highlightAnimation;
  final String? highlightIcon;
  final String description;
  final List<String> tags;
  // The brand's own category, pulled from their profile — not user-editable here.
  final String? categoryId;
  final ValueChanged<String> onTitleChanged;
  final VoidCallback onToggleHighlight;
  final ValueChanged<String> onHighlightMessageChanged;
  final ValueChanged<String> onHighlightThemeChanged;
  final ValueChanged<String> onHighlightAnimationChanged;
  final ValueChanged<String?> onHighlightIconChanged;
  final ValueChanged<String> onDescriptionChanged;
  final ValueChanged<String> onAddTag;
  final ValueChanged<String> onRemoveTag;

  const ContentDetailsStep({
    super.key,
    required this.title,
    required this.isHighlightTitle,
    required this.highlightMessage,
    required this.highlightTheme,
    required this.highlightAnimation,
    this.highlightIcon,
    required this.description,
    required this.tags,
    required this.categoryId,
    required this.onTitleChanged,
    required this.onToggleHighlight,
    required this.onHighlightMessageChanged,
    required this.onHighlightThemeChanged,
    required this.onHighlightAnimationChanged,
    required this.onHighlightIconChanged,
    required this.onDescriptionChanged,
    required this.onAddTag,
    required this.onRemoveTag,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title Section
          _SectionLabel(
            label: 'Title',
            infoMessage:
                'Add a short, clear headline to let people know what your '
                'post is about. Keep it concise — it may not appear in every placement.',
          ),
          const SizedBox(height: AppSpacing.sm),
          _TitleInput(title: title, onChanged: onTitleChanged),
          const SizedBox(height: AppSpacing.lg),

          // Highlight Banner Configuration
          Container(
            decoration: BoxDecoration(
              color: context.colors.card,
              borderRadius: AppSpacing.borderRadiusLg,
              border: Border.all(color: context.colors.border),
            ),
            child: SwitchListTile(
              title: Text(
                'Highlight Post',
                style: AppTypography.titleMedium.copyWith(color: context.colors.textPrimary),
              ),
              subtitle: Text(
                'Pin a scrolling marquee above your post',
                style: AppTypography.bodySmall.copyWith(color: context.colors.textSecondary),
              ),
              value: isHighlightTitle,
              onChanged: (val) {
                Haptics.selection();
                onToggleHighlight();
              },
              activeTrackColor: const Color(0xFFFF0000).withValues(alpha: 0.5),
              activeColor: const Color(0xFFFF0000), // activeThumbColor essentially
            ),
          ),
          const SizedBox(height: AppSpacing.sm),

          if (isHighlightTitle) ...[
            _HighlightBannerConfig(
              message: highlightMessage,
              onMessageChanged: onHighlightMessageChanged,
            ),
            const SizedBox(height: AppSpacing.lg),
          ],

          // Description Section
          _SectionLabel(
            label: 'Description',
            infoMessage:
                'Tell people more about your post — the story, offer, or details '
                'behind it. This appears alongside your title to give context.',
          ),
          const SizedBox(height: AppSpacing.sm),
          _DescriptionInput(description: description, onChanged: onDescriptionChanged),
          const SizedBox(height: AppSpacing.lg),

          // Tags Section
          _SectionLabel(label: 'Tags'),
          const SizedBox(height: AppSpacing.sm),
          TagInput(tags: tags, onAdd: onAddTag, onRemove: onRemoveTag, categoryId: categoryId),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;
  final String? infoMessage;
  const _SectionLabel({required this.label, this.infoMessage});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(label, style: AppTypography.labelMedium.copyWith(color: context.colors.textSecondary)),
        if (infoMessage != null) ...[
          const SizedBox(width: AppSpacing.xs),
          GestureDetector(
            onTap: () {
              Haptics.light();
              showDialog(
                context: context,
                builder: (ctx) => AlertDialog(
                  backgroundColor: context.colors.card,
                  title: Text(
                    label,
                    style: AppTypography.titleMedium.copyWith(color: context.colors.textPrimary),
                  ),
                  content: Text(
                    infoMessage!,
                    style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(ctx),
                      child: Text(
                        'Got it',
                        style: AppTypography.labelLarge.copyWith(
                          color: context.colors.primaryAccent,
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
            child: Icon(Icons.info_outline_rounded, size: 16, color: context.colors.textTertiary),
          ),
        ],
      ],
    );
  }
}

class _TitleInput extends StatefulWidget {
  final String title;
  final ValueChanged<String> onChanged;

  const _TitleInput({required this.title, required this.onChanged});

  @override
  State<_TitleInput> createState() => _TitleInputState();
}

class _TitleInputState extends State<_TitleInput> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.title);
  }

  @override
  void didUpdateWidget(_TitleInput oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.title != widget.title && _controller.text != widget.title) {
      _controller.text = widget.title;
      _controller.selection = TextSelection.collapsed(offset: widget.title.length);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: context.colors.card,
        borderRadius: AppSpacing.borderRadiusLg,
        border: Border.all(color: context.colors.border),
      ),
      child: TextField(
        maxLength: 100,
        controller: _controller,
        onChanged: widget.onChanged,
        style: AppTypography.titleMedium.copyWith(color: context.colors.textPrimary),
        decoration: InputDecoration(
          hintText: 'Enter title... ',
          border: InputBorder.none,
          enabledBorder: InputBorder.none,
          focusedBorder: InputBorder.none,
          errorBorder: InputBorder.none,
          focusedErrorBorder: InputBorder.none,
          disabledBorder: InputBorder.none,
          filled: false,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.sm,
          ),
          counterStyle: AppTypography.bodySmall.copyWith(color: context.colors.textSecondary),
        ),
      ),
    );
  }
}

class _DescriptionInput extends StatefulWidget {
  final String description;
  final ValueChanged<String> onChanged;

  const _DescriptionInput({required this.description, required this.onChanged});

  @override
  State<_DescriptionInput> createState() => _DescriptionInputState();
}

class _DescriptionInputState extends State<_DescriptionInput> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.description);
  }

  @override
  void didUpdateWidget(_DescriptionInput oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.description != widget.description && _controller.text != widget.description) {
      _controller.text = widget.description;
      _controller.selection = TextSelection.collapsed(offset: widget.description.length);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: context.colors.card,
        borderRadius: AppSpacing.borderRadiusLg,
        border: Border.all(color: context.colors.border),
      ),
      child: TextField(
        maxLines: null,
        minLines: 4,
        maxLength: 500,
        controller: _controller,
        onChanged: widget.onChanged,
        style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary, height: 1.5),
        decoration: InputDecoration(
          hintText: 'Write your story... ',
          border: InputBorder.none,
          enabledBorder: InputBorder.none,
          focusedBorder: InputBorder.none,
          errorBorder: InputBorder.none,
          focusedErrorBorder: InputBorder.none,
          disabledBorder: InputBorder.none,
          filled: false,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.md,
          ),
          counterStyle: AppTypography.bodySmall.copyWith(color: context.colors.textSecondary),
        ),
      ),
    );
  }
}

class _HighlightBannerConfig extends StatelessWidget {
  final String message;
  final ValueChanged<String> onMessageChanged;

  const _HighlightBannerConfig({required this.message, required this.onMessageChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: context.colors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFF0000).withValues(alpha: 0.3), width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            maxLength: 50,
            onChanged: onMessageChanged,
            controller: TextEditingController.fromValue(
              TextEditingValue(
                text: message,
                selection: TextSelection.collapsed(offset: message.length),
              ),
            ),
            style: TextStyle(color: context.colors.textPrimary),
            decoration: const InputDecoration(
              labelText: 'Highlight Text',
              labelStyle: TextStyle(color: Colors.grey),
              enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.grey)),
              focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFFFF0000))),
            ),
          ),
        ],
      ),
    );
  }
}
