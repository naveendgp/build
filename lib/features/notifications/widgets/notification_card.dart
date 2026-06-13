import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/haptics.dart';
import '../models/notification_models.dart';

class NotificationCard extends StatelessWidget {
  final AppNotification notification;
  final VoidCallback onTap;
  final VoidCallback onDismiss;
  final VoidCallback onMarkRead;

  const NotificationCard({
    super.key,
    required this.notification,
    required this.onTap,
    required this.onDismiss,
    required this.onMarkRead,
  });

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: Key(notification.id),
      direction: DismissDirection.endToStart,
      onDismissed: (_) => onDismiss(),
      background: Container(
        margin: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.xs),
        decoration: BoxDecoration(
          color: context.colors.error.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        ),
        alignment: Alignment.centerRight,
        padding: EdgeInsets.only(right: AppSpacing.xl),
        child: Icon(Icons.delete_outline, color: context.colors.error),
      ),
      child: GestureDetector(
        onTap: () {
          if (!notification.isRead) {
            onMarkRead();
          }
          onTap();
        },
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.xs),
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: notification.isRead ? context.colors.surface : context.colors.card,
            borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
            border: Border.all(
              color: notification.isPriority 
                  ? context.colors.primaryAccent.withValues(alpha: 0.3)
                  : context.colors.border,
              width: notification.isPriority ? 1 : 0.5,
            ),
            boxShadow: notification.isRead ? [] : [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.2),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildAvatar(context),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Flexible(
                          child: Text(
                            notification.title,
                            style: AppTypography.labelLarge.copyWith(
                              fontWeight: notification.isRead ? FontWeight.w500 : FontWeight.w700,
                              color: notification.isRead ? context.colors.textSecondary : context.colors.textPrimary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Text(
                          '${notification.createdAt.toLocal().hour}:${notification.createdAt.toLocal().minute.toString().padLeft(2, '0')}',
                          style: AppTypography.labelSmall.copyWith(
                            color: notification.isPriority ? context.colors.primaryAccent : context.colors.textTertiary,
                            fontWeight: notification.isPriority ? FontWeight.w600 : FontWeight.w400,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      notification.message,
                      style: AppTypography.bodyMedium.copyWith(
                        color: notification.isRead ? context.colors.textTertiary : context.colors.textSecondary,
                        height: 1.4,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (notification.ctaText != null) ...[
                      const SizedBox(height: AppSpacing.md),
                      _buildCtaButton(context),
                    ],
                  ],
                ),
              ),
              if (!notification.isRead) ...[
                const SizedBox(width: AppSpacing.sm),
                Container(
                  margin: const EdgeInsets.only(top: AppSpacing.xs),
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: context.colors.primaryAccent,
                    shape: BoxShape.circle,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAvatar(BuildContext context) {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: context.colors.background,
        borderRadius: BorderRadius.circular(
          notification.type == NotificationType.brand ? AppSpacing.radiusMd : AppSpacing.radiusFull,
        ),
        border: Border.all(color: context.colors.border, width: 0.5),
      ),
      clipBehavior: Clip.antiAlias,
      child: notification.avatarUrl != null
          ? CachedNetworkImage(
              imageUrl: notification.avatarUrl!,
              fit: BoxFit.cover,
              memCacheWidth: 150,
              placeholder: (context, url) => Container(color: context.colors.surface),
              errorWidget: (context, url, error) => _buildFallbackIcon(context),
            )
          : _buildFallbackIcon(context),
    );
  }

  Widget _buildFallbackIcon(BuildContext context) {
    IconData icon;
    Color color;

    switch (notification.type) {
      case NotificationType.reminder:
        icon = Icons.alarm_rounded;
        color = context.colors.primaryAccent;
        break;
      case NotificationType.brand:
        icon = Icons.storefront_rounded;
        color = context.colors.secondaryAccent;
        break;
      case NotificationType.message:
        icon = Icons.chat_bubble_outline_rounded;
        color = context.colors.primaryAccent;
        break;
      case NotificationType.system:
        icon = Icons.settings_rounded;
        color = context.colors.textTertiary;
        break;
      case NotificationType.social:
        icon = Icons.favorite_border_rounded;
        color = context.colors.error;
        break;
    }

    return Container(
      color: color.withValues(alpha: 0.1),
      child: Icon(icon, color: color, size: 24),
    );
  }

  Widget _buildCtaButton(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Haptics.light();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.xs + 2),
        decoration: BoxDecoration(
          color: context.colors.primaryAccent.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
          border: Border.all(color: context.colors.primaryAccent.withValues(alpha: 0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              notification.ctaText!,
              style: AppTypography.labelSmall.copyWith(
                color: context.colors.primaryAccent,
                fontWeight: FontWeight.w600,
              ),
            ),
            SizedBox(width: AppSpacing.xs),
            Icon(Icons.arrow_forward_rounded, size: 12, color: context.colors.primaryAccent),
          ],
        ),
      ),
    );
  }
}
