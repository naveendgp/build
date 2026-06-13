enum FormFieldType {
  shortText,
  longText,
  email,
  phone,
  dropdown,
  checkbox,
  radio,
  appointment,
  storeLocator;

  String toApi() {
    switch (this) {
      case FormFieldType.shortText: return 'SHORT_TEXT';
      case FormFieldType.longText: return 'LONG_TEXT';
      case FormFieldType.email: return 'EMAIL';
      case FormFieldType.phone: return 'PHONE';
      case FormFieldType.dropdown: return 'DROPDOWN';
      case FormFieldType.checkbox: return 'CHECKBOX';
      case FormFieldType.radio: return 'RADIO';
      case FormFieldType.appointment: return 'APPOINTMENT';
      case FormFieldType.storeLocator: return 'STORE_LOCATOR';
    }
  }

  static FormFieldType fromApi(String value) {
    switch (value) {
      case 'SHORT_TEXT': return FormFieldType.shortText;
      case 'LONG_TEXT': return FormFieldType.longText;
      case 'EMAIL': return FormFieldType.email;
      case 'PHONE': return FormFieldType.phone;
      case 'DROPDOWN': return FormFieldType.dropdown;
      case 'CHECKBOX': return FormFieldType.checkbox;
      case 'RADIO': return FormFieldType.radio;
      case 'APPOINTMENT': return FormFieldType.appointment;
      case 'STORE_LOCATOR': return FormFieldType.storeLocator;
      default: return FormFieldType.shortText;
    }
  }
}

class FormFieldDefinition {
  final String id;
  final FormFieldType type;
  final String label;
  final bool isRequired;
  final List<String> options;
  final int order;
  final String? section;

  const FormFieldDefinition({
    required this.id,
    required this.type,
    required this.label,
    this.isRequired = false,
    this.options = const [],
    this.order = 0,
    this.section = "Custom",
  });

  factory FormFieldDefinition.fromJson(Map<String, dynamic> json) {
    return FormFieldDefinition(
      id: json['id'] ?? '',
      type: FormFieldType.fromApi(json['type'] ?? 'SHORT_TEXT'),
      label: json['label'] ?? '',
      isRequired: json['isRequired'] ?? false,
      options: (json['options'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      order: json['order'] ?? 0,
      section: json['section'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'label': label,
      'type': type.toApi(),
      'isRequired': isRequired,
      'options': options,
      'order': order,
      'section': section,
    };
  }
}

enum FormBuilderStep {
  intro,
  userInfo,
  customQuestions,
  privacy,
  review,
}

class FormTemplate {
  final String id;
  final String? postId;
  final String? brandId;
  final String title;
  final String? intro;
  final int viewCount;
  final List<FormFieldDefinition> fields;

  const FormTemplate({
    required this.id,
    this.postId,
    this.brandId,
    required this.title,
    this.intro,
    this.viewCount = 0,
    this.fields = const [],
  });

  factory FormTemplate.fromJson(Map<String, dynamic> json) {
    return FormTemplate(
      id: json['id'] ?? '',
      postId: json['postId'],
      brandId: json['brandId'],
      title: json['title'] ?? 'Untitled Form',
      intro: json['intro'],
      viewCount: json['viewCount'] ?? 0,
      fields: (json['fields'] as List<dynamic>?)?.map((e) => FormFieldDefinition.fromJson(e)).toList() ?? [],
    );
  }

  FormTemplate copyWith({
    String? id,
    String? postId,
    String? brandId,
    String? title,
    String? intro,
    int? viewCount,
    List<FormFieldDefinition>? fields,
  }) {
    return FormTemplate(
      id: id ?? this.id,
      postId: postId ?? this.postId,
      brandId: brandId ?? this.brandId,
      title: title ?? this.title,
      intro: intro ?? this.intro,
      viewCount: viewCount ?? this.viewCount,
      fields: fields ?? this.fields,
    );
  }
}
