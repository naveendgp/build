import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/haptics.dart';
import '../models/lead_models.dart';
import '../providers/lead_api_provider.dart';

/// Sends every lead to a Google Sheet the brand owns.
///
/// The server holds the connection and does the writing — a cron picks up new
/// leads about a minute after they arrive — so this screen only connects a
/// sheet, shows how it stands, and asks for a sync when someone does not want
/// to wait.
class GoogleSheetSection extends ConsumerStatefulWidget {
  const GoogleSheetSection({super.key});

  @override
  ConsumerState<GoogleSheetSection> createState() => _GoogleSheetSectionState();
}

class _GoogleSheetSectionState extends ConsumerState<GoogleSheetSection> {
  final _linkController = TextEditingController();

  bool _busy = false;
  String? _error;
  String? _notice;

  @override
  void dispose() {
    _linkController.dispose();
    super.dispose();
  }

  /// Runs one of the sheet calls, keeping the button quiet while it works and
  /// showing whatever the server says when it refuses.
  Future<void> _run(Future<String?> Function() action) async {
    setState(() {
      _busy = true;
      _error = null;
      _notice = null;
    });
    try {
      final notice = await action();
      ref.invalidate(brandLeadSheetProvider);
      if (mounted) setState(() => _notice = notice);
    } on DioException catch (e) {
      // The server checks the sheet before saving and says exactly what to
      // fix — sharing, the wrong kind of link, a tab that is gone. Its words
      // are more useful than anything written here.
      final data = e.response?.data;
      final message = data is Map ? data['message']?.toString() : null;
      if (mounted) {
        setState(() => _error = message?.isNotEmpty == true
            ? message
            : 'Could not reach the server. Please try again.');
      }
    } catch (e) {
      debugPrint('[sheet] $e');
      if (mounted) setState(() => _error = 'Something went wrong. Please try again.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _open(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final sheetAsync = ref.watch(brandLeadSheetProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.table_chart_rounded, size: 20, color: context.colors.textPrimary),
            const SizedBox(width: AppSpacing.sm),
            Text(
              'Google Sheet',
              style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.bold),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          'Every lead is written to a sheet you own, as it arrives.',
          style: AppTypography.bodySmall.copyWith(color: context.colors.textSecondary),
        ),
        const SizedBox(height: AppSpacing.md),
        sheetAsync.when(
          loading: () => const Padding(
            padding: EdgeInsets.symmetric(vertical: AppSpacing.lg),
            child: Center(child: CircularProgressIndicator.adaptive()),
          ),
          error: (err, _) {
            debugPrint('[sheet] could not load: $err');
            return _card(
              child: Text(
                'Could not load your sheet settings. Pull down to try again.',
                style: AppTypography.bodySmall.copyWith(color: context.colors.textSecondary),
              ),
            );
          },
          data: (sheet) => sheet.connected ? _buildConnected(sheet) : _buildSetup(sheet),
        ),
      ],
    );
  }

  // ── Not connected ──────────────────────────────────────────────────

  Widget _buildSetup(BrandLeadSheet sheet) {
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _step(1, "In your sheet press Share, and under General access set 'Anyone with the link' to Editor."),
          const SizedBox(height: AppSpacing.sm),
          _step(2, 'Paste the link to the sheet below.'),
          if (sheet.shareWith != null && sheet.shareWith!.trim().isNotEmpty) ...[
            const SizedBox(height: AppSpacing.sm),
            _step(3, 'Or share it with ${sheet.shareWith} instead.'),
          ],
          const SizedBox(height: AppSpacing.md),
          _warning(),
          const SizedBox(height: AppSpacing.md),
          TextField(
            controller: _linkController,
            enabled: !_busy,
            keyboardType: TextInputType.url,
            autocorrect: false,
            style: AppTypography.bodyMedium.copyWith(color: context.colors.textPrimary),
            decoration: InputDecoration(
              hintText: 'https://docs.google.com/spreadsheets/…',
              hintStyle: AppTypography.bodyMedium.copyWith(color: context.colors.textTertiary),
              filled: true,
              fillColor: context.colors.background,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md,
                vertical: AppSpacing.md,
              ),
              border: OutlineInputBorder(
                borderRadius: AppSpacing.borderRadiusMd,
                borderSide: BorderSide(color: context.colors.borderLight),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: AppSpacing.borderRadiusMd,
                borderSide: BorderSide(color: context.colors.borderLight),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: AppSpacing.borderRadiusMd,
                borderSide: BorderSide(color: context.colors.primaryAccent, width: 1.5),
              ),
            ),
          ),
          if (_error != null) ...[const SizedBox(height: AppSpacing.md), _errorPanel(_error!)],
          const SizedBox(height: AppSpacing.md),
          _primaryButton(
            label: 'Connect sheet',
            icon: Icons.link_rounded,
            onTap: () {
              final url = _linkController.text.trim();
              if (url.isEmpty) {
                setState(() => _error = 'Paste the link to your sheet first.');
                return;
              }
              _run(() async {
                final res = await ref.read(leadApiServiceProvider).connectSheet(url);
                final written = res['written'];
                final title = res['title']?.toString();
                _linkController.clear();
                // Connecting back-fills everything collected so far.
                return written is int && written > 0
                    ? 'Connected${title == null ? '' : ' to $title'}. $written lead${written == 1 ? '' : 's'} written.'
                    : 'Connected${title == null ? '' : ' to $title'}.';
              });
            },
          ),
        ],
      ),
    );
  }

  // ── Connected ──────────────────────────────────────────────────────

  Widget _buildConnected(BrandLeadSheet sheet) {
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.check_circle_rounded, size: 18, color: context.colors.success),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  sheet.tab == null || sheet.tab!.isEmpty
                      ? 'Connected'
                      : 'Connected · ${sheet.tab}',
                  style: AppTypography.bodyMedium.copyWith(
                    color: context.colors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          // Waiting leads are ordinary: the server writes them about a minute
          // after they arrive.
          Text(
            sheet.pending == 0
                ? 'Everything collected so far has been written.'
                : '${sheet.pending} lead${sheet.pending == 1 ? '' : 's'} waiting to be written. '
                      'They go across on their own within a minute or so.',
            style: AppTypography.bodySmall.copyWith(color: context.colors.textSecondary),
          ),
          if (sheet.lastError != null && sheet.lastError!.trim().isNotEmpty) ...[
            const SizedBox(height: AppSpacing.md),
            _errorPanel('Last write failed: ${sheet.lastError}'),
          ],
          if (_error != null) ...[const SizedBox(height: AppSpacing.md), _errorPanel(_error!)],
          if (_notice != null) ...[
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Icon(Icons.check_rounded, size: 16, color: context.colors.success),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    _notice!,
                    style: AppTypography.bodySmall.copyWith(color: context.colors.textSecondary),
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: AppSpacing.lg),
          _primaryButton(
            label: sheet.pending == 0 ? 'Send again now' : 'Send waiting leads',
            icon: Icons.sync_rounded,
            onTap: () => _run(() async {
              final res = await ref.read(leadApiServiceProvider).syncSheet();
              final written = res['written'];
              final failed = res['lastError']?.toString();
              if (failed != null && failed.isNotEmpty) throw DioException(
                requestOptions: RequestOptions(path: '/leads/brand/sheet/sync'),
                response: Response(
                  requestOptions: RequestOptions(path: '/leads/brand/sheet/sync'),
                  data: {'message': failed},
                ),
              );
              return written is int && written > 0
                  ? '$written lead${written == 1 ? '' : 's'} written.'
                  : 'Nothing was waiting.';
            }),
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              Expanded(
                child: _secondaryButton(
                  label: 'Open sheet',
                  icon: Icons.open_in_new_rounded,
                  onTap: sheet.url == null ? null : () => _open(sheet.url!),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: _secondaryButton(
                  label: 'Disconnect',
                  icon: Icons.link_off_rounded,
                  destructive: true,
                  onTap: () => _run(() async {
                    await ref.read(leadApiServiceProvider).disconnectSheet();
                    return null;
                  }),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── Pieces ─────────────────────────────────────────────────────────

  Widget _card({required Widget child}) => Container(
    padding: const EdgeInsets.all(AppSpacing.md),
    decoration: BoxDecoration(
      color: context.colors.surface,
      borderRadius: AppSpacing.borderRadiusLg,
      border: Border.all(color: context.colors.borderLight.withValues(alpha: 0.2)),
    ),
    child: child,
  );

  Widget _step(int number, String text) => Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Container(
        width: 20,
        height: 20,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: context.colors.surfaceSecondary,
          shape: BoxShape.circle,
        ),
        child: Text(
          '$number',
          style: AppTypography.labelSmall.copyWith(
            color: context.colors.textSecondary,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      const SizedBox(width: AppSpacing.sm),
      Expanded(
        child: Text(
          text,
          style: AppTypography.bodySmall.copyWith(
            color: context.colors.textPrimary,
            height: 1.4,
          ),
        ),
      ),
    ],
  );

  /// Said plainly, because a link-shared sheet is readable by anyone who has
  /// the link, and it holds people's names, emails and phone numbers.
  Widget _warning() => Container(
    padding: const EdgeInsets.all(AppSpacing.sm + 2),
    decoration: BoxDecoration(
      color: context.colors.warning.withValues(alpha: 0.08),
      borderRadius: AppSpacing.borderRadiusMd,
      border: Border.all(color: context.colors.warning.withValues(alpha: 0.35)),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(Icons.warning_amber_rounded, size: 18, color: context.colors.warning),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Text(
            'Anyone holding that link can read and edit the sheet, and it holds '
            'your leads’ names, emails and phone numbers. Keep the link to '
            'yourself.',
            style: AppTypography.bodySmall.copyWith(
              color: context.colors.textSecondary,
              height: 1.4,
            ),
          ),
        ),
      ],
    ),
  );

  Widget _errorPanel(String message) => Container(
    padding: const EdgeInsets.all(AppSpacing.sm + 2),
    decoration: BoxDecoration(
      color: context.colors.error.withValues(alpha: 0.08),
      borderRadius: AppSpacing.borderRadiusMd,
      border: Border.all(color: context.colors.error.withValues(alpha: 0.4)),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(Icons.error_outline_rounded, size: 18, color: context.colors.error),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Text(
            message,
            style: AppTypography.bodySmall.copyWith(color: context.colors.error, height: 1.4),
          ),
        ),
      ],
    ),
  );

  Widget _primaryButton({
    required String label,
    required IconData icon,
    required VoidCallback onTap,
  }) => GestureDetector(
    onTap: _busy
        ? null
        : () {
            Haptics.light();
            onTap();
          },
    child: Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            context.colors.primaryAccent.withValues(alpha: _busy ? 0.5 : 1),
            context.colors.primaryAccent.withValues(alpha: _busy ? 0.4 : 0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: AppSpacing.borderRadiusMd,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (_busy)
            const SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator.adaptive(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            )
          else
            Icon(icon, color: Colors.white, size: 20),
          const SizedBox(width: AppSpacing.sm),
          Text(
            label,
            style: AppTypography.titleSmall.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    ),
  );

  Widget _secondaryButton({
    required String label,
    required IconData icon,
    VoidCallback? onTap,
    bool destructive = false,
  }) {
    final colour = destructive ? context.colors.error : context.colors.textPrimary;
    return GestureDetector(
      onTap: _busy ? null : onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
        decoration: BoxDecoration(
          color: context.colors.background,
          borderRadius: AppSpacing.borderRadiusMd,
          border: Border.all(color: context.colors.borderLight),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 18, color: colour),
            const SizedBox(width: 6),
            Text(
              label,
              style: AppTypography.labelLarge.copyWith(
                color: colour,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
