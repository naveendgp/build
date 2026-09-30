import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/haptics.dart';
import '../providers/collections_provider.dart';
import '../../home/models/feed_models.dart';
import '../../../core/utils/app_messenger.dart';

class CreateCollectionModal extends ConsumerStatefulWidget {
  // When opened from "Save to Collection" with a "New" shortcut, the post the
  // user was trying to save gets added to the collection right after it's created.
  final FeedPost? initialPost;

  const CreateCollectionModal({super.key, this.initialPost});

  @override
  ConsumerState<CreateCollectionModal> createState() => _CreateCollectionModalState();
}

class _CreateCollectionModalState extends ConsumerState<CreateCollectionModal> {
  final TextEditingController _nameController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: context.colors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + AppSpacing.xl,
        top: AppSpacing.md,
        left: AppSpacing.lg,
        right: AppSpacing.lg,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: context.colors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            Text(
              'New Collection',
              style: AppTypography.titleLarge.copyWith(
                fontWeight: FontWeight.bold,
                color: context.colors.textPrimary,
              ),
            ),
            const SizedBox(height: AppSpacing.xl),

            TextField(
              controller: _nameController,
              style: AppTypography.bodyLarge.copyWith(color: context.colors.textPrimary),
              decoration: InputDecoration(
                hintText: 'Name your collection',
                hintStyle: AppTypography.bodyLarge.copyWith(color: context.colors.textTertiary),
                filled: true,
                fillColor: context.colors.surface,
                border: OutlineInputBorder(
                  borderRadius: AppSpacing.borderRadiusMd,
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 16),
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  final name = _nameController.text.trim();
                  if (name.isNotEmpty) {
                    Haptics.selection();

                    try {
                      final notifier = ref.read(collectionsProvider.notifier);
                      final newCollection = await notifier.createCollection(name);
                      if (widget.initialPost != null) {
                        await notifier.togglePostInCollection(
                          newCollection.id,
                          widget.initialPost,
                          isCurrentlyInCollection: false,
                        );
                      }
                      if (context.mounted) {
                        Navigator.pop(context);
                      }
                    } catch (e) {
                      if (context.mounted) {
                        AppMessenger.of(
                          context,
                        ).showSnackBar(SnackBar(content: Text('Failed to create collection: $e')));
                      }
                    }
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: context.colors.primaryAccent,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: AppSpacing.borderRadiusMd),
                ),
                child: Text(
                  'Create Collection',
                  style: AppTypography.button.copyWith(color: Colors.white),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
