import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/app_messenger.dart';
import '../../core/utils/haptics.dart';
import '../brand_dashboard/providers/dashboard_providers.dart';
import '../home/providers/feed_provider.dart';
import 'widgets/tag_input.dart';

/// Edit a post the brand already published: its title, description, tags and
/// the text behind its action button.
///
/// The three-dot menu offered Archive and Delete and nothing in between, so a
/// typo in a published post could only be fixed by deleting it and posting
/// again — losing its likes, comments and leads. The web has had an edit page
/// all along (`/brand-dashboard/edit/[id]`, `PUT /posts/:id`).
///
/// The pictures are not editable here; the web form can replace them.
class EditPostScreen extends ConsumerStatefulWidget {
  final String postId;

  const EditPostScreen({super.key, required this.postId});

  @override
  ConsumerState<EditPostScreen> createState() => _EditPostScreenState();
}

class _EditPostScreenState extends ConsumerState<EditPostScreen> {
  final _title = TextEditingController();
  final _description = TextEditingController();
  final _ctaText = TextEditingController();
  final _destinationUrl = TextEditingController();
  final _prefilledMessage = TextEditingController();

  List<String> _tags = [];
  String? _objective;
  String? _thumbnail;
  String? _category;

  bool _loading = true;
  bool _saving = false;
  String? _loadError;
  String? _saveError;

  /// Objectives whose button goes to a link the brand chooses.
  bool get _hasDestination =>
      _objective == 'TRAFFIC' || _objective == 'CONVERSIONS' || _objective == 'GET_DIRECTIONS';

  bool get _isMessaging => _objective == 'MESSAGING';

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _ctaText.dispose();
    _destinationUrl.dispose();
    _prefilledMessage.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final res = await ref.read(apiClientProvider).dio.get('/posts/${widget.postId}');
      final data = Map<String, dynamic>.from(res.data as Map);
      final media = (data['media'] as List?) ?? const [];

      setState(() {
        _title.text = (data['title'] ?? '').toString();
        _description.text = (data['description'] ?? '').toString();
        _ctaText.text = (data['ctaText'] ?? '').toString();
        _destinationUrl.text = (data['destinationUrl'] ?? '').toString();
        _prefilledMessage.text = (data['prefilledMessage'] ?? '').toString();
        _tags = ((data['tags'] as List?) ?? const []).map((t) => t.toString()).toList();
        _objective = data['marketingObjective']?.toString();
        _category = data['category']?.toString();
        _thumbnail = media.isEmpty
            ? null
            : ApiClient.resolveMediaUrl((media.first as Map)['url']?.toString());
        _loading = false;
      });
    } catch (e) {
      debugPrint('Could not load the post to edit: $e');
      if (mounted) setState(() => _loading = false);
      if (mounted) setState(() => _loadError = 'Could not open this post for editing.');
    }
  }

  Future<void> _save() async {
    if (_title.text.trim().isEmpty) {
      setState(() => _saveError = 'A post needs a title.');
      return;
    }

    setState(() {
      _saving = true;
      _saveError = null;
    });

    try {
      await ref.read(apiClientProvider).dio.put('/posts/${widget.postId}', data: {
        'title': _title.text.trim(),
        'description': _description.text.trim(),
        'tags': _tags,
        if (_ctaText.text.trim().isNotEmpty) 'ctaText': _ctaText.text.trim(),
        if (_hasDestination) 'destinationUrl': _destinationUrl.text.trim(),
        if (_isMessaging) 'prefilledMessage': _prefilledMessage.text.trim(),
      });

      // Every list holding this post is now out of date.
      ref.read(feedProvider.notifier).refreshFeed();
      ref.invalidate(brandDashboardPostsProvider);

      if (!mounted) return;
      Haptics.medium();
      AppMessenger.of(context).showSnackBar(const SnackBar(content: Text('Post updated')));
      context.pop(true);
    } catch (e) {
      debugPrint('Saving the post failed: $e');
      if (!mounted) return;
      setState(() {
        _saving = false;
        _saveError = 'Could not save your changes. Please try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.background,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: Icon(Icons.close_rounded, color: context.colors.textPrimary),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Edit Post',
          style: AppTypography.titleMedium.copyWith(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          if (!_loading && _loadError == null)
            TextButton(
              onPressed: _saving ? null : _save,
              child: Text(
                _saving ? 'Saving…' : 'Save',
                style: AppTypography.labelLarge.copyWith(
                  color: context.colors.primaryAccent,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
        ],
      ),
      body: _loading
          ? Center(
              child: CircularProgressIndicator.adaptive(
                valueColor: AlwaysStoppedAnimation<Color>(context.colors.primaryAccent),
              ),
            )
          : _loadError != null
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Text(
                  _loadError!,
                  textAlign: TextAlign.center,
                  style: AppTypography.bodyMedium.copyWith(color: context.colors.textSecondary),
                ),
              ),
            )
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 48),
              children: [
                if (_thumbnail != null) _buildMediaNote(),
                _label('Title'),
                _field(_title, hint: 'What is this post about?', maxLength: 100),
                const SizedBox(height: AppSpacing.md),
                _label('Description'),
                _field(_description, hint: 'Tell people more', maxLines: 5, maxLength: 2000),
                const SizedBox(height: AppSpacing.md),
                _label('Tags'),
                TagInput(
                  tags: _tags,
                  categoryId: _category,
                  onAdd: (t) => setState(() {
                    if (!_tags.contains(t)) _tags = [..._tags, t];
                  }),
                  onRemove: (t) => setState(() => _tags = _tags.where((x) => x != t).toList()),
                ),
                if (_ctaText.text.isNotEmpty || _hasDestination || _isMessaging) ...[
                  const SizedBox(height: AppSpacing.lg),
                  _label('Action button'),
                  _field(_ctaText, hint: 'Button text, e.g. Learn More', maxLength: 30),
                  if (_hasDestination) ...[
                    const SizedBox(height: AppSpacing.sm),
                    _field(_destinationUrl, hint: 'https://…', keyboard: TextInputType.url),
                  ],
                  if (_isMessaging) ...[
                    const SizedBox(height: AppSpacing.sm),
                    _field(_prefilledMessage, hint: 'Message people start with', maxLines: 3),
                  ],
                ],
                if (_saveError != null) ...[
                  const SizedBox(height: AppSpacing.md),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: context.colors.error.withValues(alpha: 0.08),
                      borderRadius: AppSpacing.borderRadiusMd,
                      border: Border.all(color: context.colors.error.withValues(alpha: 0.4)),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.error_outline_rounded, size: 18, color: context.colors.error),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _saveError!,
                            style: AppTypography.bodySmall.copyWith(color: context.colors.error),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
    );
  }

  Widget _buildMediaNote() {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.lg),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: AppSpacing.borderRadiusMd,
        border: Border.all(color: context.colors.borderLight, width: 0.5),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: AppSpacing.borderRadiusSm,
            child: Image.network(
              _thumbnail!,
              width: 56,
              height: 56,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => Container(
                width: 56,
                height: 56,
                color: context.colors.surfaceSecondary,
                child: Icon(Icons.image_outlined, color: context.colors.textTertiary, size: 20),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'The pictures stay as they are. Everything else can be changed.',
              style: AppTypography.bodySmall.copyWith(color: context.colors.textSecondary),
            ),
          ),
        ],
      ),
    );
  }

  Widget _label(String text) => Padding(
    padding: const EdgeInsets.only(bottom: 6),
    child: Text(
      text,
      style: AppTypography.labelLarge.copyWith(
        color: context.colors.textPrimary,
        fontWeight: FontWeight.w600,
      ),
    ),
  );

  Widget _field(
    TextEditingController controller, {
    String? hint,
    int maxLines = 1,
    int? maxLength,
    TextInputType? keyboard,
  }) {
    return TextField(
      controller: controller,
      enabled: !_saving,
      maxLines: maxLines,
      maxLength: maxLength,
      keyboardType: keyboard,
      style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
      decoration: InputDecoration(
        hintText: hint,
        counterText: '',
        filled: true,
        fillColor: context.colors.surface,
        border: OutlineInputBorder(
          borderRadius: AppSpacing.borderRadiusMd,
          borderSide: BorderSide(color: context.colors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: AppSpacing.borderRadiusMd,
          borderSide: BorderSide(color: context.colors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: AppSpacing.borderRadiusMd,
          borderSide: BorderSide(color: context.colors.primaryAccent, width: 1.5),
        ),
      ),
    );
  }
}
