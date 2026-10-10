import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:http_parser/http_parser.dart' as http_parser;
import 'package:image_picker/image_picker.dart';
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
import 'models/create_post_models.dart';
import 'providers/create_post_provider.dart';
import 'widgets/tag_input.dart';

/// Edit a post the brand already published: its title, description, tags and
/// the text behind its action button.
///
/// The three-dot menu offered Archive and Delete and nothing in between, so a
/// typo in a published post could only be fixed by deleting it and posting
/// again — losing its likes, comments and leads. The web has had an edit page
/// all along (`/brand-dashboard/edit/[id]`, `PUT /posts/:id`).
///
/// Pictures can be replaced, added, removed and reordered, up to the same five
/// a carousel holds elsewhere. A video post is left alone: swapping a video is
/// its own job, and the backend refuses a video alongside anything else.
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

  final _highlightMessage = TextEditingController();

  List<String> _tags = [];
  String? _objective;
  String? _category;

  /// The action button: which one, and where it goes.
  PostObjective? _objectiveEnum;
  CtaType? _ctaType;
  bool _isHighlighted = false;

  /// The carousel as it stands, existing pictures and newly picked ones alike.
  List<_EditMedia> _media = [];
  bool _mediaChanged = false;
  bool _isVideoPost = false;

  final _picker = ImagePicker();

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
    _highlightMessage.dispose();
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
        _objectiveEnum = objectiveFromBackend(_objective);
        // A post made on the web carries the button's text and no type, so
        // fall back to matching the label — otherwise nothing was selected on
        // a post that plainly has a button.
        _ctaType =
            ctaTypeFromBackend(data['ctaType']?.toString()) ??
            _ctaTypeForLabel(_objectiveEnum, (data['ctaText'] ?? '').toString());
        _isHighlighted = data['isHighlighted'] == true;
        _highlightMessage.text = (data['highlightMessage'] ?? '').toString();
        _category = data['category']?.toString();
        _media = media
            .map((m) => Map<String, dynamic>.from(m as Map))
            .map(
              (m) => _EditMedia.existing(
                url: ApiClient.resolveMediaUrl(m['url']?.toString()),
                type: (m['type'] ?? 'IMAGE').toString().toUpperCase(),
              ),
            )
            .toList();
        _isVideoPost = _media.any((m) => m.isVideo);
        _loading = false;
      });
    } catch (e) {
      debugPrint('Could not load the post to edit: $e');
      if (mounted) setState(() => _loading = false);
      if (mounted) setState(() => _loadError = 'Could not open this post for editing.');
    }
  }


  // ── The carousel ───────────────────────────────────────────────────

  void _moveMedia(int from, int to) {
    if (to < 0 || to >= _media.length) return;
    Haptics.selection();
    setState(() {
      final item = _media.removeAt(from);
      _media.insert(to, item);
      _mediaChanged = true;
    });
  }

  void _removeMedia(int index) {
    if (_media.length <= 1) {
      setState(() => _saveError = 'A post needs at least one picture.');
      return;
    }
    Haptics.medium();
    setState(() {
      _media.removeAt(index);
      _mediaChanged = true;
      _saveError = null;
    });
  }

  /// [replaceIndex] swaps one picture; without it the picture is added.
  Future<void> _pickMedia({int? replaceIndex}) async {
    if (replaceIndex == null && _media.length >= CreatePostNotifier.maxCarouselImages) {
      setState(
        () => _saveError =
            'A carousel holds ${CreatePostNotifier.maxCarouselImages} pictures.',
      );
      return;
    }
    final picked = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 92);
    if (picked == null || !mounted) return;
    setState(() {
      final item = _EditMedia.picked(File(picked.path));
      if (replaceIndex != null) {
        _media[replaceIndex] = item;
      } else {
        _media.add(item);
      }
      _mediaChanged = true;
      _saveError = null;
    });
  }

  /// Sends the newly picked files and returns the carousel as the API wants
  /// it: every picture in order, old and new together.
  Future<List<Map<String, dynamic>>> _uploadMedia() async {
    final api = ref.read(apiClientProvider);
    final out = <Map<String, dynamic>>[];

    for (var i = 0; i < _media.length; i++) {
      final item = _media[i];
      if (item.url != null) {
        out.add({'url': item.url, 'type': item.type, 'order': i});
        continue;
      }

      final form = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          item.file!.path,
          contentType: http_parser.MediaType('image', 'jpeg'),
        ),
      });
      final res = await api.dio.post(
        '/upload',
        data: form,
        queryParameters: {'type': 'post'},
        options: Options(
          sendTimeout: const Duration(minutes: 5),
          receiveTimeout: const Duration(minutes: 5),
        ),
      );
      if (res.statusCode != 200 || res.data?['url'] == null) {
        throw Exception('upload failed for picture ${i + 1}');
      }
      out.add({'url': res.data['url'], 'type': 'IMAGE', 'order': i});
    }

    return out;
  }

  /// The button whose own label matches what the post stores.
  static CtaType? _ctaTypeForLabel(PostObjective? objective, String label) {
    if (label.trim().isEmpty) return null;
    final wanted = label.trim().toLowerCase();
    final pool = objective == null
        ? CtaType.values
        : (ObjectiveMeta.all
                  .where((m) => m.objective == objective)
                  .firstOrNull
                  ?.availableCtas ??
              CtaType.values);
    for (final type in pool) {
      if (CtaData(type: type).displayLabel.toLowerCase() == wanted) return type;
    }
    return null;
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
      // Only sent when something moved: the server replaces the whole set.
      final media = _mediaChanged ? await _uploadMedia() : null;

      await ref.read(apiClientProvider).dio.put('/posts/${widget.postId}', data: {
        'title': _title.text.trim(),
        'description': _description.text.trim(),
        'tags': _tags,
        if (_ctaText.text.trim().isNotEmpty) 'ctaText': _ctaText.text.trim(),
        if (_objective != null) 'marketingObjective': _objective,
        if (_ctaType != null) 'ctaType': ctaTypeToBackend[_ctaType],
        'isHighlighted': _isHighlighted,
        'highlightMessage': _isHighlighted ? _highlightMessage.text.trim() : '',
        if (_hasDestination) 'destinationUrl': _destinationUrl.text.trim(),
        if (_isMessaging) 'prefilledMessage': _prefilledMessage.text.trim(),
        if (media != null) 'media': media,
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
                if (_media.isNotEmpty) _buildMediaEditor(),
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
                const SizedBox(height: AppSpacing.lg),
                _buildHighlightSection(),
                const SizedBox(height: AppSpacing.lg),
                _buildCtaSection(),
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

  /// The carousel: tap a picture to swap it, × to drop it, arrows to move it,
  /// and the last tile to add another — up to five, as everywhere else.

  /// The marquee above a post. The create flow offers it; editing had no way
  /// to switch it off again, or to fix its wording.
  Widget _buildHighlightSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          decoration: BoxDecoration(
            color: context.colors.surface,
            borderRadius: AppSpacing.borderRadiusMd,
            border: Border.all(color: context.colors.borderLight, width: 0.5),
          ),
          child: SwitchListTile(
            title: Text(
              'Highlight Post',
              style: AppTypography.bodyMedium.copyWith(
                color: context.colors.textPrimary,
                fontWeight: FontWeight.w600,
              ),
            ),
            subtitle: Text(
              'A scrolling banner above the post',
              style: AppTypography.labelSmall.copyWith(color: context.colors.textSecondary),
            ),
            value: _isHighlighted,
            activeThumbColor: context.colors.primaryAccent,
            onChanged: _saving
                ? null
                : (val) {
                    Haptics.selection();
                    setState(() => _isHighlighted = val);
                  },
          ),
        ),
        if (_isHighlighted) ...[
          const SizedBox(height: AppSpacing.sm),
          _field(_highlightMessage, hint: 'Highlight text, e.g. 20% OFF', maxLength: 50),
        ],
      ],
    );
  }

  /// The action button: which one, and where it points. Editing showed this
  /// only when the post already had button text, so most posts could not
  /// change their button at all.
  /// Changes the campaign. The buttons belong to it, so one that the new
  /// campaign does not allow is dropped rather than left selected.
  void _setObjective(PostObjective next) {
    Haptics.selection();
    final allowed = ObjectiveMeta.all
        .where((m) => m.objective == next)
        .firstOrNull
        ?.availableCtas;
    setState(() {
      _objectiveEnum = next;
      _objective = objectiveToBackend[next];
      if (allowed == null || _ctaType == null || !allowed.contains(_ctaType)) {
        _ctaType = null;
        _ctaText.clear();
      }
    });
  }

  Widget _buildCtaSection() {
    final meta = _objectiveEnum == null
        ? null
        : ObjectiveMeta.all.where((m) => m.objective == _objectiveEnum).firstOrNull;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // The campaign this post runs. It was fixed at creation, and with no
        // objective stored the Action button heading sat above nothing at all.
        _label('Campaign'),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: ObjectiveMeta.all.map((option) {
            final selected = _objectiveEnum == option.objective;
            return GestureDetector(
              onTap: _saving ? null : () => _setObjective(option.objective),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: selected
                      ? context.colors.primaryAccent.withValues(alpha: 0.12)
                      : Colors.transparent,
                  borderRadius: AppSpacing.borderRadiusFull,
                  border: Border.all(
                    color: selected
                        ? context.colors.primaryAccent.withValues(alpha: 0.5)
                        : context.colors.border,
                    width: selected ? 1.5 : 1,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      option.icon,
                      size: 14,
                      color: selected
                          ? context.colors.primaryAccent
                          : context.colors.textSecondary,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      option.title,
                      style: AppTypography.labelLarge.copyWith(
                        color: selected
                            ? context.colors.primaryAccent
                            : context.colors.textSecondary,
                        fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: AppSpacing.lg),
        _label('Action button'),
        if (meta != null) ...[
          Text(
            'The buttons ${meta.title} allows.',
            style: AppTypography.labelSmall.copyWith(color: context.colors.textTertiary),
          ),
          const SizedBox(height: AppSpacing.sm),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: meta.availableCtas.map((type) {
              final selected = _ctaType == type;
              final label = CtaData(type: type).displayLabel;
              return GestureDetector(
                onTap: _saving
                    ? null
                    : () {
                        Haptics.selection();
                        // The chip is the button: its own label is what the
                        // post stores and shows. Typing a different one was
                        // offered here and nowhere else, so a post could end
                        // up with a button the create flow cannot produce.
                        setState(() {
                          _ctaType = type;
                          _ctaText.text = label;
                        });
                      },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                  decoration: BoxDecoration(
                    color: selected
                        ? context.colors.primaryAccent.withValues(alpha: 0.12)
                        : Colors.transparent,
                    borderRadius: AppSpacing.borderRadiusFull,
                    border: Border.all(
                      color: selected
                          ? context.colors.primaryAccent.withValues(alpha: 0.5)
                          : context.colors.border,
                      width: selected ? 1.5 : 1,
                    ),
                  ),
                  child: Text(
                    label,
                    style: AppTypography.labelLarge.copyWith(
                      color: selected ? context.colors.primaryAccent : context.colors.textSecondary,
                      fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: AppSpacing.md),
        ] else
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.md),
            child: Text(
              'Pick a campaign above to choose a button.',
              style: AppTypography.labelSmall.copyWith(color: context.colors.textTertiary),
            ),
          ),
        if (_hasDestination) ...[
          const SizedBox(height: AppSpacing.md),
          _label('Where it goes'),
          _field(_destinationUrl, hint: 'https://…', keyboard: TextInputType.url),
        ],
        if (_isMessaging) ...[
          const SizedBox(height: AppSpacing.md),
          _label('Message people start with'),
          _field(_prefilledMessage, hint: 'Hi, I would like to know more…', maxLines: 3),
        ],
      ],
    );
  }

  Widget _buildMediaEditor() {
    if (_isVideoPost) {
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
            Icon(Icons.videocam_rounded, size: 20, color: context.colors.textSecondary),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'The video stays as it is. Everything else can be changed.',
                style: AppTypography.bodySmall.copyWith(color: context.colors.textSecondary),
              ),
            ),
          ],
        ),
      );
    }

    final canAdd = _media.length < CreatePostNotifier.maxCarouselImages;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            _label('Pictures'),
            const Spacer(),
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Text(
                '${_media.length}/${CreatePostNotifier.maxCarouselImages}',
                style: AppTypography.labelSmall.copyWith(color: context.colors.textSecondary),
              ),
            ),
          ],
        ),
        SizedBox(
          height: _media.length > 1 ? 136 : 104,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: _media.length + (canAdd ? 1 : 0),
            separatorBuilder: (_, _) => const SizedBox(width: AppSpacing.sm),
            itemBuilder: (context, index) {
              // Children of a horizontal list are stretched to its height, so
              // each tile is wrapped in a top-aligned column of its own —
              // otherwise the Add tile grew taller than the pictures.
              final child = index == _media.length ? _buildAddTile() : _buildMediaTile(index);
              return Align(alignment: Alignment.topCenter, child: child);
            },
          ),
        ),
        const SizedBox(height: 6),
        Text(
          _media.length > 1
              ? 'Tap a picture to replace it. The first one is the cover.'
              : 'Tap the picture to replace it, or add up to '
                    '${CreatePostNotifier.maxCarouselImages} to make a carousel.',
          style: AppTypography.labelSmall.copyWith(color: context.colors.textTertiary),
        ),
        const SizedBox(height: AppSpacing.lg),
      ],
    );
  }

  Widget _buildAddTile() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        GestureDetector(
          onTap: _saving ? null : () => _pickMedia(),
          child: Container(
            width: 96,
            height: 96,
            decoration: BoxDecoration(
              color: context.colors.surfaceSecondary,
              borderRadius: AppSpacing.borderRadiusMd,
              border: Border.all(color: context.colors.border),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.add_rounded, size: 22, color: context.colors.textSecondary),
                const SizedBox(height: 4),
                Text(
                  'Add',
                  style: AppTypography.labelSmall.copyWith(color: context.colors.textSecondary),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMediaTile(int index) {
    final item = _media[index];

    return Column(
      children: [
        GestureDetector(
          onTap: _saving ? null : () => _pickMedia(replaceIndex: index),
          child: Stack(
            children: [
              ClipRRect(
                borderRadius: AppSpacing.borderRadiusMd,
                child: SizedBox(
                  width: 96,
                  height: 96,
                  child: item.file != null
                      ? Image.file(item.file!, fit: BoxFit.cover)
                      : Image.network(
                          item.url!,
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => Container(
                            color: context.colors.surfaceSecondary,
                            child: Icon(
                              Icons.broken_image_outlined,
                              color: context.colors.textTertiary,
                              size: 18,
                            ),
                          ),
                        ),
                ),
              ),
              Positioned(
                top: 4,
                right: 4,
                child: GestureDetector(
                  onTap: _saving ? null : () => _removeMedia(index),
                  child: Container(
                    padding: const EdgeInsets.all(3),
                    decoration: const BoxDecoration(
                      color: Colors.black54,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.close_rounded, size: 14, color: Colors.white),
                  ),
                ),
              ),
              if (index == 0)
                Positioned(
                  bottom: 4,
                  left: 4,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.black54,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      'Cover',
                      style: AppTypography.labelSmall.copyWith(
                        color: Colors.white,
                        fontSize: 9,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
        if (_media.length > 1)
          SizedBox(
            width: 96,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                IconButton(
                  tooltip: 'Move earlier',
                  visualDensity: VisualDensity.compact,
                  onPressed: index == 0 || _saving ? null : () => _moveMedia(index, index - 1),
                  icon: Icon(
                    Icons.arrow_back_rounded,
                    size: 16,
                    color: index == 0 ? context.colors.textTertiary : context.colors.textPrimary,
                  ),
                ),
                IconButton(
                  tooltip: 'Move later',
                  visualDensity: VisualDensity.compact,
                  onPressed: index == _media.length - 1 || _saving
                      ? null
                      : () => _moveMedia(index, index + 1),
                  icon: Icon(
                    Icons.arrow_forward_rounded,
                    size: 16,
                    color: index == _media.length - 1
                        ? context.colors.textTertiary
                        : context.colors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
      ],
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

/// One picture in the edit screen's carousel: either one the post already has
/// (a URL on the server) or one just picked from the gallery (a local file).
class _EditMedia {
  final String? url;
  final File? file;
  final String type;

  const _EditMedia._({this.url, this.file, required this.type});

  factory _EditMedia.existing({required String url, required String type}) =>
      _EditMedia._(url: url, type: type);

  factory _EditMedia.picked(File file) => _EditMedia._(file: file, type: 'IMAGE');

  bool get isVideo => type == 'VIDEO';
}
