import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/form_models.dart';
import 'lead_api_provider.dart';

class FormBuilderState {
  final FormBuilderStep currentStep;
  final FormTemplate template;
  final bool isSaving;

  const FormBuilderState({
    this.currentStep = FormBuilderStep.intro,
    this.isSaving = false,
    required this.template,
  });

  FormBuilderState copyWith({
    FormBuilderStep? currentStep,
    FormTemplate? template,
    bool? isSaving,
  }) {
    return FormBuilderState(
      currentStep: currentStep ?? this.currentStep,
      template: template ?? this.template,
      isSaving: isSaving ?? this.isSaving,
    );
  }
}

class FormBuilderNotifier extends StateNotifier<FormBuilderState> {
  final LeadApiService _apiService;

  FormBuilderNotifier(this._apiService)
    : super(
        FormBuilderState(
          template: const FormTemplate(id: 'new_form', title: 'Untitled Form'),
        ),
      );

  void setStep(FormBuilderStep step) {
    state = state.copyWith(currentStep: step);
  }

  void updateTemplate(FormTemplate newTemplate) {
    state = state.copyWith(template: newTemplate);
  }

  void addField(FormFieldDefinition field) {
    final fields = List<FormFieldDefinition>.from(state.template.fields)..add(field);
    state = state.copyWith(template: state.template.copyWith(fields: fields));
  }

  void removeField(String id) {
    final fields = List<FormFieldDefinition>.from(state.template.fields)
      ..removeWhere((f) => f.id == id);
    state = state.copyWith(template: state.template.copyWith(fields: fields));
  }

  Future<bool> publishForm(String? postId) async {
    state = state.copyWith(isSaving: true);
    try {
      // 1. Create Form
      final newForm = await _apiService.createForm(
        postId: postId,
        title: state.template.title,
        intro: state.template.intro,
      );

      // 2. Add Fields sequentially
      for (var field in state.template.fields) {
        await _apiService.addField(newForm.id, field);
      }

      state = state.copyWith(isSaving: false);
      return true;
    } catch (e) {
      state = state.copyWith(isSaving: false);
      return false;
    }
  }
}

final formBuilderProvider = StateNotifierProvider<FormBuilderNotifier, FormBuilderState>((ref) {
  final api = ref.watch(leadApiServiceProvider);
  return FormBuilderNotifier(api);
});
