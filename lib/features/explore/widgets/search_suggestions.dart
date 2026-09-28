// Lyket Explore â€” Floating Search Suggestions Dropdown
import 'dart:ui';
import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../models/explore_models.dart';

class SearchSuggestions extends StatelessWidget {
  final List<SearchSuggestion> suggestions;
  final List<String> recentSearches;
  final VoidCallback? onClear;
  final ValueChanged<String> onSelect;
  final ValueChanged<String>? onRemoveRecent;

  const SearchSuggestions({
    super.key,
    required this.suggestions,
    this.recentSearches = const [],
    this.onClear,
    required this.onSelect,
    this.onRemoveRecent,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: AppSpacing.borderRadiusXl,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 28, sigmaY: 28),
        child: Container(
          decoration: BoxDecoration(
            color: context.colors.card.withValues(alpha: 0.85),
            borderRadius: AppSpacing.borderRadiusXl,
            border: Border.all(color: context.colors.borderLight, width: 1),
          ),
          child: AnimatedSwitcher(
            duration: Duration(milliseconds: 300),
            switchInCurve: Curves.easeOut,
            switchOutCurve: Curves.easeIn,
            // Scrolls within the max height the caller imposes, so a full
            // list of recents stays reachable instead of overflowing.
            child: SingleChildScrollView(
              key: ValueKey('${recentSearches.length}_${suggestions.length}'),
              physics: const ClampingScrollPhysics(),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (recentSearches.isNotEmpty) ...[
                    _buildSectionHeader(
                      context,
                      title: 'Recent Searches',
                      trailing: GestureDetector(
                        onTap: onClear,
                        behavior: HitTestBehavior.opaque,
                        child: Text(
                          'Clear all',
                          style: AppTypography.labelSmall.copyWith(
                            color: context.colors.primaryAccent,
                          ),
                        ),
                      ),
                    ),
                    ...recentSearches.map(
                      (query) => _RecentSearchItem(
                        query: query,
                        onTap: () => onSelect(query),
                        onRemove: onRemoveRecent != null ? () => onRemoveRecent!(query) : null,
                      ),
                    ),
                    _buildDivider(context),
                  ],
                  if (suggestions.isNotEmpty) ...[
                    _buildSectionHeader(context, title: 'Suggestions'),
                    ...suggestions.map(
                      (suggestion) => _SuggestionItem(
                        suggestion: suggestion,
                        onTap: () => onSelect(suggestion.text),
                      ),
                    ),
                  ],
                  SizedBox(height: AppSpacing.sm),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, {required String title, Widget? trailing}) {
    return Padding(
      padding: EdgeInsets.only(left: 16, top: 20, bottom: 12, right: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: AppTypography.labelLarge.copyWith(
              color: context.colors.textSecondary,
              fontSize: 12,
              letterSpacing: 0.6,
            ),
          ),
          trailing ?? SizedBox.shrink(),
        ],
      ),
    );
  }

  Widget _buildDivider(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: AppSpacing.md),
      child: Divider(height: 1, color: context.colors.border),
    );
  }
}

// â”€â”€â”€ Recent Search Item â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _RecentSearchItem extends StatelessWidget {
  final String query;
  final VoidCallback onTap;
  final VoidCallback? onRemove;

  const _RecentSearchItem({required this.query, required this.onTap, this.onRemove});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        height: 44,
        child: Padding(
          padding: EdgeInsets.only(left: 16, right: 8),
          child: Row(
            children: [
              Icon(Icons.history_rounded, size: 18, color: context.colors.textTertiary),
              SizedBox(width: AppSpacing.sm + 4),
              Expanded(
                child: Text(
                  query,
                  style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (onRemove != null)
                GestureDetector(
                  onTap: onRemove,
                  behavior: HitTestBehavior.opaque,
                  child: Padding(
                    padding: EdgeInsets.all(AppSpacing.xs),
                    child: Icon(Icons.close_rounded, size: 16, color: context.colors.textTertiary),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

// â”€â”€â”€ Suggestion Item â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _SuggestionItem extends StatelessWidget {
  final SearchSuggestion suggestion;
  final VoidCallback onTap;

  const _SuggestionItem({required this.suggestion, required this.onTap});

  IconData _iconForType(SuggestionType type) {
    switch (type) {
      case SuggestionType.brand:
        return Icons.storefront_outlined;
      case SuggestionType.category:
        return Icons.grid_view_rounded;
      case SuggestionType.trending:
        return Icons.trending_up_rounded;
      case SuggestionType.recent:
        return Icons.history_rounded;
      case SuggestionType.ai:
        return Icons.auto_awesome_rounded;
    }
  }

  Color _iconColorForType(SuggestionType type) {
    switch (type) {
      case SuggestionType.trending:
      case SuggestionType.ai:
        return Color(0xFF7C5CFF);
      default:
        return Color(0xFF52525B);
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        height: 44,
        child: Padding(
          padding: EdgeInsets.only(left: 16, right: 16),
          child: Row(
            children: [
              Icon(
                _iconForType(suggestion.type),
                size: 18,
                color: _iconColorForType(suggestion.type),
              ),
              SizedBox(width: AppSpacing.sm + 4),
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      suggestion.text,
                      style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (suggestion.subtitle != null)
                      Text(
                        suggestion.subtitle!,
                        style: AppTypography.labelSmall.copyWith(
                          color: context.colors.textTertiary,
                          fontSize: 10,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
              ),
              Icon(Icons.north_west_rounded, size: 14, color: context.colors.textTertiary),
            ],
          ),
        ),
      ),
    );
  }
}
