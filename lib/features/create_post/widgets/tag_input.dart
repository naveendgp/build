import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/haptics.dart';
import 'tag_suggestions.dart';

class TagInput extends StatefulWidget {
  final List<String> tags;
  final ValueChanged<String> onAdd;
  final ValueChanged<String> onRemove;
  final String? categoryId;

  const TagInput({
    super.key,
    required this.tags,
    required this.onAdd,
    required this.onRemove,
    this.categoryId,
  });

  @override
  State<TagInput> createState() => _TagInputState();
}

class _TagInputState extends State<TagInput> {
  final TextEditingController _controller = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  String _query = '';

  void _submit([String? text]) {
    final value = (text ?? _controller.text).trim();
    if (value.isNotEmpty) {
      widget.onAdd(value);
      _controller.clear();
      setState(() => _query = '');
    }
  }

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
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
            focusNode: _focusNode,
            onChanged: (val) => setState(() => _query = val),
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
        if (_focusNode.hasFocus || _query.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.sm),
          _buildSuggestions(context),
        ],
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
                    Text(tag, style: AppTypography.labelMedium),
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

  Widget _buildSuggestions(BuildContext context) {
    final suggestions = TagSuggestions.forQuery(
      categoryId: widget.categoryId,
      existingTags: widget.tags,
      query: _query,
    );

    if (suggestions.isEmpty) return const SizedBox.shrink();

    return Wrap(
      spacing: AppSpacing.sm,
      runSpacing: AppSpacing.sm,
      children: suggestions.map((tag) {
        return GestureDetector(
          onTap: () {
            Haptics.selection();
            _submit(tag);
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.xs),
            decoration: BoxDecoration(
              color: context.colors.primaryAccent.withValues(alpha: 0.08),
              borderRadius: AppSpacing.borderRadiusFull,
              border: Border.all(color: context.colors.primaryAccent.withValues(alpha: 0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.add_rounded, size: 14, color: context.colors.primaryAccent),
                const SizedBox(width: 2),
                Text(
                  tag,
                  style: AppTypography.labelMedium.copyWith(color: context.colors.primaryAccent),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}
