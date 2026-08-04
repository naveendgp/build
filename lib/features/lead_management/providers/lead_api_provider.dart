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
  Future<List<LeadSubmission>> getLeadsForPost(String postId) async {
    final response = await _apiClient.dio.get('/leads/$postId');
    final data = response.data as List<dynamic>;
    return data.map((e) => LeadSubmission.fromJson(e)).toList();
  }

  Future<void> deleteLeadSubmission(String submissionId) async {
    await _apiClient.dio.delete('/leads/submissions/$submissionId');
  }

  String getExportCsvUrl(String postId) {
    // Return the URL that can be launched in a browser for download
    return '${_apiClient.dio.options.baseUrl}/leads/$postId/export/csv';
  }

  // --- Form Builder ---
  Future<FormTemplate> createForm({String? postId, required String title, String? intro}) async {
    final response = await _apiClient.dio.post('/lead-form', data: {
      'postId': postId,
      'title': title,
      'intro': intro,
    });
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
final postLeadsProvider = FutureProvider.family<List<LeadSubmission>, String>((ref, postId) async {
  if (postId.isEmpty) return [];
  final api = ref.watch(leadApiServiceProvider);
  return api.getLeadsForPost(postId);
});

// Provides state for brand forms
final brandFormsProvider = FutureProvider<List<FormTemplate>>((ref) async {
  final api = ref.watch(leadApiServiceProvider);
  return api.getBrandForms();
});
