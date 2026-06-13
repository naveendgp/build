import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

/// Lyket — Premium Share Service
/// Handles all external sharing destinations and clipboard operations.
class ShareService {
  ShareService._();

  /// Canonical deep link URL for a post
  static String postUrl(String postId) => 'https://lyket.app/post/$postId';

  /// Brand profile URL
  static String brandUrl(String brandId) => 'https://lyket.app/brand/$brandId';

  // ─── Copy Link ─────────────────────────────────────────────────────

  static Future<bool> copyLink(String postId) async {
    try {
      final url = postUrl(postId);
      await Clipboard.setData(ClipboardData(text: url));
      return true;
    } catch (_) {
      return false;
    }
  }

  // ─── Native Share ──────────────────────────────────────────────────

  static Future<void> nativeShare({
    required String postId,
    required String title,
    String? brandName,
  }) async {
    final url = postUrl(postId);
    final text = brandName != null
        ? 'Check out "$title" by $brandName on Lyket\n$url'
        : 'Check out "$title" on Lyket\n$url';
    await SharePlus.instance.share(ShareParams(text: text));
  }

  // ─── Social Destinations ──────────────────────────────────────────

  static Future<bool> shareToWhatsApp(String postId, String title) async {
    final url = postUrl(postId);
    final text = Uri.encodeComponent('Check out "$title" on Lyket\n$url');
    return _launchUrl('https://wa.me/?text=$text');
  }

  static Future<bool> shareToTelegram(String postId, String title) async {
    final url = postUrl(postId);
    final encodedUrl = Uri.encodeComponent(url);
    final text = Uri.encodeComponent('Check out "$title" on Lyket');
    return _launchUrl('https://t.me/share/url?url=$encodedUrl&text=$text');
  }

  static Future<bool> shareToX(String postId, String title) async {
    final url = postUrl(postId);
    final text = Uri.encodeComponent('Check out "$title" on Lyket');
    final encodedUrl = Uri.encodeComponent(url);
    return _launchUrl('https://twitter.com/intent/tweet?text=$text&url=$encodedUrl');
  }

  static Future<bool> shareToFacebook(String postId) async {
    final url = postUrl(postId);
    final encodedUrl = Uri.encodeComponent(url);
    return _launchUrl('https://www.facebook.com/sharer/sharer.php?u=$encodedUrl');
  }

  static Future<bool> shareToInstagram(String postId, String title) async {
    // Instagram doesn't support direct URL sharing via intent
    // Best approach: copy the link and open Instagram
    await copyLink(postId);
    final launched = await _launchUrl('https://www.instagram.com/');
    return launched;
  }

  static Future<bool> shareToEmail(String postId, String title, String? brandName) async {
    final url = postUrl(postId);
    final subject = Uri.encodeComponent('Check out this post on Lyket');
    final body = brandName != null
        ? Uri.encodeComponent('Hey, check out "$title" by $brandName on Lyket:\n\n$url')
        : Uri.encodeComponent('Hey, check out "$title" on Lyket:\n\n$url');
    return _launchUrl('mailto:?subject=$subject&body=$body');
  }

  static Future<bool> shareToSMS(String postId, String title) async {
    final url = postUrl(postId);
    final body = Uri.encodeComponent('Check out "$title" on Lyket\n$url');
    return _launchUrl('sms:?body=$body');
  }

  // ─── Helpers ───────────────────────────────────────────────────────

  static Future<bool> _launchUrl(String urlString) async {
    try {
      final uri = Uri.parse(urlString);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }
}
