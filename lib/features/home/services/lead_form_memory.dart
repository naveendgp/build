import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// What this person has already told brands through lead forms, kept on the
/// device so a form asking the same questions can be filled in rather than
/// typed again.
///
/// Answers are kept by the question's wording, not by field id: every post
/// carries its own copy of a form, so "Email" on one is a different field from
/// "Email" on another. Nothing is sent anywhere — this never leaves the phone.
class LeadFormMemory {
  LeadFormMemory._();

  static const _key = 'lead_form_answers';

  /// Questions whose answers are not worth reusing: a time someone asked for
  /// last week is not an answer to give again.
  static const _skippedTypes = {'APPOINTMENT'};

  static Map<String, String>? _cache;

  /// Everything remembered, by question in lower case.
  static Future<Map<String, String>> recall() async {
    if (_cache != null) return _cache!;
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_key);
      if (raw == null || raw.isEmpty) return _cache = {};
      final decoded = jsonDecode(raw);
      if (decoded is! Map) return _cache = {};
      return _cache = decoded.map((k, v) => MapEntry(k.toString(), v.toString()));
    } catch (e) {
      debugPrint('[lead memory] could not read: $e');
      return _cache = {};
    }
  }

  /// Keeps the answers from a form that was just sent. Later answers replace
  /// earlier ones for the same question.
  static Future<void> remember(Map<String, String> answersByQuestion) async {
    if (answersByQuestion.isEmpty) return;
    final next = Map<String, String>.from(await recall());

    for (final entry in answersByQuestion.entries) {
      final question = entry.key.trim().toLowerCase();
      final answer = entry.value.trim();
      if (question.isEmpty || answer.isEmpty) continue;
      next[question] = answer;
    }

    _cache = next;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_key, jsonEncode(next));
    } catch (e) {
      // The form was sent either way; only the convenience is lost.
      debugPrint('[lead memory] could not save: $e');
    }
  }

  /// What was answered last time for this question, if anything.
  static String? answerFor(Map<String, String> remembered, String question) {
    final value = remembered[question.trim().toLowerCase()];
    return value == null || value.isEmpty ? null : value;
  }

  static bool isReusable(String fieldType) => !_skippedTypes.contains(fieldType.toUpperCase());

  /// Forgets everything. Used when signing out, so the next person on this
  /// phone is not offered someone else's details.
  static Future<void> clear() async {
    _cache = {};
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_key);
    } catch (e) {
      debugPrint('[lead memory] could not clear: $e');
    }
  }
}
