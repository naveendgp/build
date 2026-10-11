import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../models/lead_models.dart';
import '../models/form_models.dart';

class LeadApiService {
  final ApiClient _apiClient;

  LeadApiService(this._apiClient);

  // --- Analytics ---
  Future<BrandLeadStats> getBrandStats() async {
    final response = await _apiClient.dio.get('/leads/brand/stats');
    return BrandLeadStats.fromJson(response.data);
  }

  // --- Leads ---
  Future<List<LeadSubmission>> getLeadsForPost(String postId, {bool archived = false}) async {
    final response = await _apiClient.dio.get(
      '/leads/$postId',
      queryParameters: {'archived': archived.toString()},
    );
    final data = response.data as List<dynamic>;
    return data.map((e) => LeadSubmission.fromJson(e)).toList();
  }

  /// Archives a lead, or puts it back. The delete endpoint is gone: the
  /// answers belong to the person who sent them, so they are only ever moved
  /// out of the way.
  Future<void> setLeadArchived(String submissionId, bool archived) async {
    await _apiClient.dio.patch(
      '/leads/submissions/$submissionId/archive',
      data: {'archived': archived},
    );
  }

  // --- Google Sheet ---

  /// How the brand's sheet stands: connected or not, how many leads are
  /// waiting, and what went wrong last time if anything did.
  Future<BrandLeadSheet> getSheet() async {
    final res = await _apiClient.dio.get('/leads/brand/sheet');
    return BrandLeadSheet.fromJson(Map<String, dynamic>.from(res.data as Map));
  }

  /// Connects a sheet by its link. The server checks it can actually write
  /// there before saving, and says what to fix when it cannot — so the
  /// message it returns is shown as it was written.
  Future<Map<String, dynamic>> connectSheet(String url) async {
    final res = await _apiClient.dio.put('/leads/brand/sheet', data: {'url': url});
    return Map<String, dynamic>.from(res.data as Map);
  }

  /// Writes whatever is waiting, rather than leaving it to the next run.
  Future<Map<String, dynamic>> syncSheet() async {
    final res = await _apiClient.dio.post('/leads/brand/sheet/sync');
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<void> disconnectSheet() async {
    await _apiClient.dio.delete('/leads/brand/sheet');
  }

  String getExportCsvUrl(String postId) {
    // Return the URL that can be launched in a browser for download
    return '${_apiClient.dio.options.baseUrl}/leads/$postId/export/csv';
  }

  // --- Form Builder ---
  Future<FormTemplate> createForm({String? postId, required String title, String? intro}) async {
    final response = await _apiClient.dio.post(
      '/lead-form',
      data: {'postId': postId, 'title': title, 'intro': intro},
    );
    return FormTemplate.fromJson(response.data);
  }

  Future<FormTemplate> getFormById(String formId) async {
    final response = await _apiClient.dio.get('/lead-form/$formId');
    return FormTemplate.fromJson(response.data);
  }

  Future<List<FormTemplate>> getBrandForms() async {
    final response = await _apiClient.dio.get('/lead-form?type=all');
    final data = response.data as List<dynamic>;
    return data.map((e) => FormTemplate.fromJson(e)).toList();
  }

  Future<void> toggleFormStatus(String formId, bool isArchived) async {
    await _apiClient.dio.put('/lead-form/$formId', data: {'isArchived': isArchived});
  }

  Future<FormFieldDefinition> addField(String formId, FormFieldDefinition field) async {
    final data = field.toJson();
    data['formId'] = formId;
    final response = await _apiClient.dio.post('/lead-form/field', data: data);
    return FormFieldDefinition.fromJson(response.data);
  }

  Future<FormFieldDefinition> updateField(String fieldId, FormFieldDefinition field) async {
    final response = await _apiClient.dio.put('/lead-form/field/$fieldId', data: field.toJson());
    return FormFieldDefinition.fromJson(response.data);
  }

  Future<void> deleteField(String fieldId) async {
    await _apiClient.dio.delete('/lead-form/field/$fieldId');
  }
}

final leadApiServiceProvider = Provider<LeadApiService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return LeadApiService(apiClient);
});

// Provides state for brand stats (Analytics Tab & Dashboard KPI)
final brandLeadStatsProvider = FutureProvider<BrandLeadStats>((ref) async {
  final api = ref.watch(leadApiServiceProvider);
  return api.getBrandStats();
});

// Provides state for lead submissions by post
typedef LeadsQuery = ({String postId, bool archived});

final postLeadsProvider = FutureProvider.family<List<LeadSubmission>, LeadsQuery>((
  ref,
  query,
) async {
  if (query.postId.isEmpty) return [];
  final api = ref.watch(leadApiServiceProvider);
  return api.getLeadsForPost(query.postId, archived: query.archived);
});

// Provides state for brand forms
final brandFormsProvider = FutureProvider<List<FormTemplate>>((ref) async {
  final api = ref.watch(leadApiServiceProvider);
  return api.getBrandForms();
});

/// The brand's Google Sheet connection.
final brandLeadSheetProvider = FutureProvider<BrandLeadSheet>((ref) async {
  final api = ref.watch(leadApiServiceProvider);
  return api.getSheet();
});
