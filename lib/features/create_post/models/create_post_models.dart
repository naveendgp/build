import 'dart:io';
import 'package:flutter/material.dart';
import '../../../core/theme/theme_tokens.dart';

// â”€â”€â”€ Enums â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

enum CreateStep { media, preview, details, objective, cta, leadForm, schedule, review }

enum MediaDimension {
  square, // 1:1
}

enum MediaType { image, video }

enum PostObjective { awareness, traffic, leadGeneration, conversions, getDirections, messaging }

enum CtaType {
  // Awareness
  visitProfile,
  followUs,
  noButton,
  seeMore,
  discover,

  // Traffic
  visitWebsite,
  learnMore,
  shopNow,
  getOffer,
  viewDetails,
  explore,

  // Lead Generation
  bookNow,
  signUp,
  getQuote,
  enquireNow,

  // Conversions
  buyNow,
  getStarted,

  // Directions
  getDirections,
  visitUs,
  locateUs,

  // Messaging
  sendMessage,
  chatNow,
  askQuestion,
  contactUs,
}

enum PublishMode { now, scheduled }

enum UploadStage { idle, compressing, uploading, processing, complete, failed }

// â”€â”€â”€ Objective Metadata â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class ObjectiveMeta {
  final PostObjective objective;
  final String title;
  final String subtitle;
  final String outcome;
  final IconData icon;
  final Color accentColor;
  final List<CtaType> availableCtas;

  const ObjectiveMeta({
    required this.objective,
    required this.title,
    required this.subtitle,
    required this.outcome,
    required this.icon,
    required this.accentColor,
    required this.availableCtas,
  });

  static const List<ObjectiveMeta> all = [
    ObjectiveMeta(
      objective: PostObjective.awareness,
      title: 'Awareness',
      subtitle: 'Maximize visibility and reach',
      outcome: 'More impressions & brand recall',
      icon: Icons.visibility_rounded,
      // Unified to the app's single red brand color across every objective
      // instead of a distinct hue each — was previously indigo here.
      accentColor: ThemeTokens.primaryAccent,
      availableCtas: [
        CtaType.visitProfile,
        CtaType.followUs,
        CtaType.noButton,
        CtaType.seeMore,
        CtaType.learnMore,
        CtaType.discover,
      ],
    ),
    ObjectiveMeta(
      objective: PostObjective.traffic,
      title: 'Traffic',
      subtitle: 'Drive visits to your destination',
      outcome: 'More website clicks & visits',
      icon: Icons.trending_up_rounded,
      accentColor: ThemeTokens.primaryAccent,
      availableCtas: [
        CtaType.visitWebsite,
        CtaType.learnMore,
        CtaType.shopNow,
        CtaType.getOffer,
        CtaType.viewDetails,
        CtaType.visitProfile,
        CtaType.explore,
      ],
    ),
    ObjectiveMeta(
      objective: PostObjective.leadGeneration,
      title: 'Lead Generation',
      subtitle: 'Collect qualified leads',
      outcome: 'More form submissions & inquiries',
      icon: Icons.person_add_rounded,
      accentColor: ThemeTokens.primaryAccent,
      availableCtas: [
        CtaType.bookNow,
        CtaType.signUp,
        CtaType.getQuote,
        CtaType.enquireNow,
        CtaType.learnMore,
      ],
    ),
    ObjectiveMeta(
      objective: PostObjective.conversions,
      title: 'Conversions',
      subtitle: 'Drive purchases and actions',
      outcome: 'More sales & sign-ups',
      icon: Icons.shopping_bag_rounded,
      accentColor: ThemeTokens.primaryAccent,
      availableCtas: [
        CtaType.buyNow,
        CtaType.shopNow,
        CtaType.bookNow,
        CtaType.signUp,
        CtaType.getOffer,
        CtaType.getStarted,
      ],
    ),
    ObjectiveMeta(
      objective: PostObjective.getDirections,
      title: 'Get Directions',
      subtitle: 'Guide customers to your location',
      outcome: 'More store visits & foot traffic',
      icon: Icons.location_on_rounded,
      accentColor: ThemeTokens.primaryAccent,
      availableCtas: [CtaType.getDirections, CtaType.visitUs, CtaType.locateUs],
    ),
    ObjectiveMeta(
      objective: PostObjective.messaging,
      title: 'Messaging',
      subtitle: 'Start conversations with customers',
      outcome: 'More direct messages & inquiries',
      icon: Icons.chat_rounded,
      accentColor: ThemeTokens.primaryAccent,
      availableCtas: [
        CtaType.sendMessage,
        CtaType.enquireNow,
        CtaType.chatNow,
        CtaType.askQuestion,
        CtaType.contactUs,
        CtaType.getQuote,
      ],
    ),
  ];
}

// â”€â”€â”€ Media Item â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class MediaItem {
  final String id;
  final File file;
  final MediaType type;
  final double? uploadProgress;

  /// The zoom/pan transform the user applied in the preview. If null, no transform.
  final Matrix4? transform;

  /// The size of the preview container, used to compute the crop.
  final Size? previewSize;

  const MediaItem({
    required this.id,
    required this.file,
    required this.type,
    this.uploadProgress,
    this.transform,
    this.previewSize,
  });

  MediaItem copyWith({double? uploadProgress, Matrix4? transform, Size? previewSize}) {
    return MediaItem(
      id: id,
      file: file,
      type: type,
      uploadProgress: uploadProgress ?? this.uploadProgress,
      transform: transform ?? this.transform,
      previewSize: previewSize ?? this.previewSize,
    );
  }
}

// â”€â”€â”€ CTA Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class CtaData {
  final CtaType type;
  final String? destinationUrl;
  final String? utmSource;
  final String? utmMedium;
  final String? utmCampaign;

  const CtaData({
    required this.type,
    this.destinationUrl,
    this.utmSource,
    this.utmMedium,
    this.utmCampaign,
  });

  CtaData copyWith({
    CtaType? type,
    String? destinationUrl,
    String? utmSource,
    String? utmMedium,
    String? utmCampaign,
  }) {
    return CtaData(
      type: type ?? this.type,
      destinationUrl: destinationUrl ?? this.destinationUrl,
      utmSource: utmSource ?? this.utmSource,
      utmMedium: utmMedium ?? this.utmMedium,
      utmCampaign: utmCampaign ?? this.utmCampaign,
    );
  }

  String get displayLabel {
    switch (type) {
      case CtaType.visitProfile:
        return 'Visit Profile';
      case CtaType.followUs:
        return 'Follow Us';
      case CtaType.noButton:
        return 'No Button';
      case CtaType.seeMore:
        return 'See More';
      case CtaType.discover:
        return 'Discover';
      case CtaType.visitWebsite:
        return 'Visit Website';
      case CtaType.learnMore:
        return 'Learn More';
      case CtaType.shopNow:
        return 'Shop Now';
      case CtaType.getOffer:
        return 'Get Offer';
      case CtaType.viewDetails:
        return 'View Details';
      case CtaType.explore:
        return 'Explore';
      case CtaType.bookNow:
        return 'Book Now';
      case CtaType.signUp:
        return 'Sign Up';
      case CtaType.getQuote:
        return 'Get Quote';
      case CtaType.enquireNow:
        return 'Enquire Now';
      case CtaType.buyNow:
        return 'Buy Now';
      case CtaType.getStarted:
        return 'Get Started';
      case CtaType.getDirections:
        return 'Get Directions';
      case CtaType.visitUs:
        return 'Visit Us';
      case CtaType.locateUs:
        return 'Locate Us';
      case CtaType.sendMessage:
        return 'Send Message';
      case CtaType.chatNow:
        return 'Chat Now';
      case CtaType.askQuestion:
        return 'Ask a Question';
      case CtaType.contactUs:
        return 'Contact Us';
    }
  }

  String? get builtUrl {
    if (destinationUrl == null || destinationUrl!.isEmpty) return null;
    final params = <String, String>{};
    if (utmSource != null && utmSource!.isNotEmpty) params['utm_source'] = utmSource!;
    if (utmMedium != null && utmMedium!.isNotEmpty) params['utm_medium'] = utmMedium!;
    if (utmCampaign != null && utmCampaign!.isNotEmpty) params['utm_campaign'] = utmCampaign!;
    if (params.isEmpty) return destinationUrl;
    final uri = Uri.parse(destinationUrl!);
    return uri.replace(queryParameters: {...uri.queryParameters, ...params}).toString();
  }
}

// â”€â”€â”€ Lead Form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

enum FormFieldType {
  shortText,
  longText,
  email,
  phone,
  singleChoice,
  multipleChoice,
  dropDown,

  /// A date and time the person picks, for forms that book something. The
  /// answer is stored as an ISO 8601 string.
  appointment,
}

class FormFieldData {
  final String id;
  final FormFieldType type;
  final String question;
  final List<String> options;
  final bool isRequired;
  final bool isPrebuilt;

  const FormFieldData({
    required this.id,
    required this.type,
    required this.question,
    this.options = const [],
    this.isRequired = true,
    this.isPrebuilt = false,
  });

  FormFieldData copyWith({
    FormFieldType? type,
    String? question,
    List<String>? options,
    bool? isRequired,
    bool? isPrebuilt,
  }) {
    return FormFieldData(
      id: id,
      type: type ?? this.type,
      question: question ?? this.question,
      options: options ?? this.options,
      isRequired: isRequired ?? this.isRequired,
      isPrebuilt: isPrebuilt ?? this.isPrebuilt,
    );
  }
}

class LeadFormData {
  final String name;
  final String headline;
  final String description;
  final File? heroImage;
  final List<FormFieldData> fields;
  final String privacyPolicyUrl;
  final String consentText;
  final String thankYouMessage;

  const LeadFormData({
    this.name = '',
    this.headline = '',
    this.description = '',
    this.heroImage,
    this.fields = const [],
    this.privacyPolicyUrl = '',
    this.consentText = 'By submitting this form, you agree to our privacy policy.',
    this.thankYouMessage = 'Thank you for submitting the form',
  });

  List<FormFieldData> get sortedFields {
    final customFields = fields.where((f) => !f.isPrebuilt).toList();
    final prebuiltFields = fields.where((f) => f.isPrebuilt).toList();
    return [...customFields, ...prebuiltFields];
  }

  LeadFormData copyWith({
    String? name,
    String? headline,
    String? description,
    File? heroImage,
    List<FormFieldData>? fields,
    String? privacyPolicyUrl,
    String? consentText,
    String? thankYouMessage,
    bool clearHeroImage = false,
  }) {
    return LeadFormData(
      name: name ?? this.name,
      headline: headline ?? this.headline,
      description: description ?? this.description,
      heroImage: clearHeroImage ? null : (heroImage ?? this.heroImage),
      fields: fields ?? this.fields,
      privacyPolicyUrl: privacyPolicyUrl ?? this.privacyPolicyUrl,
      consentText: consentText ?? this.consentText,
      thankYouMessage: thankYouMessage ?? this.thankYouMessage,
    );
  }
}

class LeadFormTemplate {
  final String id;
  final String name;
  final IconData icon;
  final LeadFormData data;

  const LeadFormTemplate({
    required this.id,
    required this.name,
    required this.icon,
    required this.data,
  });
}

// â”€â”€â”€ Top-Level State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class CreatePostState {
  final CreateStep currentStep;
  final List<MediaItem> media;
  final MediaDimension dimension;

  // Content
  final String title;
  final bool isHighlightTitle;
  final String highlightMessage;
  final String highlightTheme;
  final String highlightAnimation;
  final String? highlightIcon;
  final String description;
  final List<String> tags;
  // The brand's own business category, fetched from their profile —
  // no longer chosen by the user in this flow.
  final String? categoryId;

  // Objective + CTA + Lead Form
  final PostObjective? objective;
  final CtaData? cta;
  final LeadFormData? leadForm;

  final List<LeadFormTemplate> customTemplates;

  // Schedule
  final PublishMode publishMode;
  final DateTime? scheduledAt;
  final String timezone;

  // Upload
  final UploadStage uploadStage;
  final double uploadProgress;
  final String? errorMessage;

  const CreatePostState({
    this.currentStep = CreateStep.media,
    this.media = const [],
    this.dimension = MediaDimension.square,
    this.title = '',
    this.isHighlightTitle = false,
    this.highlightMessage = '',
    this.highlightTheme = 'Primary Accent',
    this.highlightAnimation = 'Auto Scrolling Text',
    this.highlightIcon,
    this.description = '',
    this.tags = const [],
    this.categoryId,
    this.objective,
    this.cta,
    this.leadForm,
    this.customTemplates = const [],
    this.publishMode = PublishMode.now,
    this.scheduledAt,
    this.timezone = 'Asia/Kolkata',
    this.uploadStage = UploadStage.idle,
    this.uploadProgress = 0.0,
    this.errorMessage,
  });

  int get stepIndex => CreateStep.values.indexOf(currentStep);

  bool get hasMedia => media.isNotEmpty;
  bool get hasContent => title.isNotEmpty || description.isNotEmpty;

  List<CreateStep> get activeSteps {
    // Core steps always present. Objective/CTA/Schedule are always shown.
    return [
      CreateStep.media,
      CreateStep.preview,
      CreateStep.details,
      CreateStep.objective,
      CreateStep.cta,
      if (objective == PostObjective.leadGeneration) CreateStep.leadForm,
      CreateStep.schedule,
      CreateStep.review,
    ];
  }

  CreatePostState copyWith({
    CreateStep? currentStep,
    List<MediaItem>? media,
    MediaDimension? dimension,
    String? title,
    bool? isHighlightTitle,
    String? highlightMessage,
    String? highlightTheme,
    String? highlightAnimation,
    String? highlightIcon,
    String? description,
    List<String>? tags,
    String? categoryId,
    PostObjective? objective,
    CtaData? cta,
    LeadFormData? leadForm,
    List<LeadFormTemplate>? customTemplates,
    PublishMode? publishMode,
    DateTime? scheduledAt,
    String? timezone,
    UploadStage? uploadStage,
    double? uploadProgress,
    String? errorMessage,
    bool clearObjective = false,
    bool clearCta = false,
    bool clearLeadForm = false,
    bool clearSchedule = false,
  }) {
    return CreatePostState(
      currentStep: currentStep ?? this.currentStep,
      media: media ?? this.media,
      dimension: dimension ?? this.dimension,
      title: title ?? this.title,
      isHighlightTitle: isHighlightTitle ?? this.isHighlightTitle,
      highlightMessage: highlightMessage ?? this.highlightMessage,
      highlightTheme: highlightTheme ?? this.highlightTheme,
      highlightAnimation: highlightAnimation ?? this.highlightAnimation,
      highlightIcon: highlightIcon ?? this.highlightIcon,
      description: description ?? this.description,
      tags: tags ?? this.tags,
      categoryId: categoryId ?? this.categoryId,
      objective: clearObjective ? null : (objective ?? this.objective),
      cta: clearCta ? null : (cta ?? this.cta),
      leadForm: clearLeadForm ? null : (leadForm ?? this.leadForm),
      customTemplates: customTemplates ?? this.customTemplates,
      publishMode: publishMode ?? this.publishMode,
      scheduledAt: clearSchedule ? null : (scheduledAt ?? this.scheduledAt),
      timezone: timezone ?? this.timezone,
      uploadStage: uploadStage ?? this.uploadStage,
      uploadProgress: uploadProgress ?? this.uploadProgress,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}
