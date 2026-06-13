import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';

class TagInput extends StatefulWidget {
  final List<String> tags;
  final ValueChanged<String> onAdd;
  final ValueChanged<String> onRemove;

  const TagInput({
    super.key,
    required this.tags,
    required this.onAdd,
    required this.onRemove,
  });

  @override
  State<TagInput> createState() => _TagInputState();
}

class _TagInputState extends State<TagInput> {
  final TextEditingController _controller = TextEditingController();

  void _submit() {
    final text = _controller.text.trim();
    if (text.isNotEmpty) {
      widget.onAdd(text);
      _controller.clear();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          decoration: BoxDecoration(
            color: context.colors.card,
            borderRadius: AppSpacing.borderRadiusLg,
            border: Border.all(color: context.colors.border),
          ),
          child: TextField(
            controller: _controller,
            onSubmitted: (_) => _submit(),
            style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
            decoration: InputDecoration(
              hintText: 'Add a tag and press enter...',
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              errorBorder: InputBorder.none,
              focusedErrorBorder: InputBorder.none,
              disabledBorder: InputBorder.none,
              filled: false,
              contentPadding: EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
              suffixIcon: IconButton(
                icon: Icon(Icons.add_circle_outline, color: context.colors.textSecondary),
                onPressed: _submit,
              ),
            ),
          ),
        ),
        if (widget.tags.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.sm),
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: widget.tags.map((tag) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.xs),
                decoration: BoxDecoration(
                  color: context.colors.surface,
                  borderRadius: AppSpacing.borderRadiusFull,
                  border: Border.all(color: context.colors.border),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('#$tag', style: AppTypography.labelMedium),
                    const SizedBox(width: AppSpacing.xs),
                    GestureDetector(
                      onTap: () => widget.onRemove(tag),
                      child: Icon(Icons.close, size: 16, color: context.colors.textSecondary),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ],
    );
  }
}
