import 'package:flutter/foundation.dart';
import 'package:shorebird_code_push/shorebird_code_push.dart';

/// Over-the-air updates through Shorebird.
///
/// Shorebird ships new Dart code to installed apps without a Play Store
/// release. It downloads a patch in the background on launch; the patch only
/// takes effect once the app starts again, so [check] reports when one is
/// waiting and the UI can ask for a restart instead of leaving the person on
/// yesterday's build for days.
///
/// What a patch cannot carry: native Android/iOS code, new or upgraded plugins
/// with native parts, a different Flutter version, or a version bump. Those
/// still need a full release built with `shorebird release android`.
class CodePushService {
  CodePushService._();

  static final _updater = ShorebirdUpdater();

  /// False in debug runs and in any build that did not come from
  /// `shorebird release`, where there is nothing to patch.
  static bool get isAvailable => _updater.isAvailable;

  /// The patch the app is running, or null on the original release.
  static Future<int?> currentPatchNumber() async {
    if (!isAvailable) return null;
    try {
      return (await _updater.readCurrentPatch())?.number;
    } catch (e) {
      debugPrint('[code push] could not read current patch: $e');
      return null;
    }
  }

  /// Looks for a patch and downloads it. Returns true when one is installed and
  /// waiting for the next launch.
  static Future<bool> check() async {
    if (!isAvailable) return false;
    try {
      var status = await _updater.checkForUpdate();

      // With auto_update on (the default) the download may already have
      // happened while the app was starting.
      if (status == UpdateStatus.restartRequired) return true;
      if (status != UpdateStatus.outdated) return false;

      await _updater.update();
      status = await _updater.checkForUpdate();
      return status == UpdateStatus.restartRequired;
    } on UpdateException catch (e) {
      debugPrint('[code push] update failed: ${e.message}');
      return false;
    } catch (e) {
      debugPrint('[code push] update failed: $e');
      return false;
    }
  }
}
