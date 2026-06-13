import 'dart:io';
import 'package:flutter/material.dart';

// â”€â”€â”€ Enums â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

enum CreateStep {
  media,
  preview,
  details,
  objective,
  cta,
  leadForm,
  schedule,
  review,
}

enum MediaDimension {
  square,   // 1:1
  vertical, // 9:16
}

enum MediaType {
  image,
  video,
}

enum PostObjective {
  awareness,
  traffic,
  leadGeneration,
  conversions,
  getDirections,
  messaging,
}

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

enum PublishMode {
  now,
  scheduled,
}

enum UploadStage {
  idle,
  compressing,
  uploading,
  processing,
  complete,
  failed,
}

// â”€â”€â”€ Post Categories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class PostCategory {
  final String id;
  final String label;
  final IconData icon;
  final Color accentColor;

  const PostCategory({
    required this.id,
    required this.label,
    required this.icon,
    required this.accentColor,
  });

  static const List<PostCategory> all = [
    PostCategory(id: 'fashion', label: 'Fashion', icon: Icons.checkroom_rounded, accentColor: Color(0xFFE879F9)),
    PostCategory(id: 'beauty', label: 'Beauty', icon: Icons.spa_rounded, accentColor: Color(0xFFF472B6)),
    PostCategory(id: 'food', label: 'Food', icon: Icons.restaurant_rounded, accentColor: Color(0xFFFB923C)),
    PostCategory(id: 'travel', label: 'Travel', icon: Icons.flight_rounded, accentColor: Color(0xFF38BDF8)),
    PostCategory(id: 'tech', label: 'Tech', icon: Icons.devices_rounded, accentColor: Color(0xFF818CF8)),
    PostCategory(id: 'fitness', label: 'Fitness', icon: Icons.fitness_center_rounded, accentColor: Color(0xFF4ADE80)),
    PostCategory(id: 'art', label: 'Art', icon: Icons.palette_rounded, accentColor: Color(0xFFFBBF24)),
    PostCategory(id: 'music', label: 'Music', icon: Icons.music_note_rounded, accentColor: Color(0xFFF87171)),
    PostCategory(id: 'education', label: 'Education', icon: Icons.school_rounded, accentColor: Color(0xFF2DD4BF)),
    PostCategory(id: 'lifestyle', label: 'Lifestyle', icon: Icons.favorite_rounded, accentColor: Color(0xFFC084FC)),
  ];
}

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
      accentColor: Color(0xFF818CF8),
      availableCtas: [CtaType.visitProfile, CtaType.followUs, CtaType.noButton, CtaType.seeMore, CtaType.learnMore, CtaType.discover],
    ),
    ObjectiveMeta(
      objective: PostObjective.traffic,
      title: 'Traffic',
      subtitle: 'Drive visits to your destination',
      outcome: 'More website clicks & visits',
      icon: Icons.trending_up_rounded,
      accentColor: Color(0xFF38BDF8),
      availableCtas: [CtaType.visitWebsite, CtaType.learnMore, CtaType.shopNow, CtaType.getOffer, CtaType.viewDetails, CtaType.visitProfile, CtaType.explore],
    ),
    ObjectiveMeta(
      objective: PostObjective.leadGeneration,
      title: 'Lead Generation',
      subtitle: 'Collect qualified leads',
      outcome: 'More form submissions & inquiries',
      icon: Icons.person_add_rounded,
      accentColor: Color(0xFF4ADE80),
      availableCtas: [CtaType.bookNow, CtaType.signUp, CtaType.getQuote, CtaType.enquireNow, CtaType.learnMore],
    ),
    ObjectiveMeta(
      objective: PostObjective.conversions,
      title: 'Conversions',
      subtitle: 'Drive purchases and actions',
      outcome: 'More sales & sign-ups',
      icon: Icons.shopping_bag_rounded,
      accentColor: Color(0xFFFB923C),
      availableCtas: [CtaType.buyNow, CtaType.shopNow, CtaType.bookNow, CtaType.signUp, CtaType.getOffer, CtaType.getStarted],
    ),
    ObjectiveMeta(
      objective: PostObjective.getDirections,
      title: 'Get Directions',
      subtitle: 'Guide customers to your location',
      outcome: 'More store visits & foot traffic',
      icon: Icons.location_on_rounded,
      accentColor: Color(0xFFF472B6),
      availableCtas: [CtaType.getDirections, CtaType.visitUs, CtaType.locateUs],
    ),
    ObjectiveMeta(
      objective: PostObjective.messaging,
      title: 'Messaging',
      subtitle: 'Start conversations with customers',
      outcome: 'More direct messages & inquiries',
      icon: Icons.chat_rounded,
      accentColor: Color(0xFF2DD4BF),
      availableCtas: [CtaType.sendMessage, CtaType.enquireNow, CtaType.chatNow, CtaType.askQuestion, CtaType.contactUs, CtaType.getQuote],
    ),
  ];
}

// â”€â”€â”€ Media Item â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class MediaItem {
  final String id;
  final File file;
  final MediaType type;
  final double? uploadProgress;

  const MediaItem({
    required this.id,
    required this.file,
    required this.type,
    this.uploadProgress,
  });

  MediaItem copyWith({double? uploadProgress}) {
    return MediaItem(
      id: id,
      file: file,
      type: type,
      uploadProgress: uploadProgress ?? this.uploadProgress,
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
      case CtaType.visitProfile: return 'Visit Profile';
      case CtaType.followUs: return 'Follow Us';
      case CtaType.noButton: return 'No Button';
      case CtaType.seeMore: return 'See More';
      case CtaType.discover: return 'Discover';
      case CtaType.visitWebsite: return 'Visit Website';
      case CtaType.learnMore: return 'Learn More';
      case CtaType.shopNow: return 'Shop Now';
      case CtaType.getOffer: return 'Get Offer';
      case CtaType.viewDetails: return 'View Details';
      case CtaType.explore: return 'Explore';
      case CtaType.bookNow: return 'Book Now';
      case CtaType.signUp: return 'Sign Up';
      case CtaType.getQuote: return 'Get Quote';
      case CtaType.enquireNow: return 'Enquire Now';
      case CtaType.buyNow: return 'Buy Now';
      case CtaType.getStarted: return 'Get Started';
      case CtaType.getDirections: return 'Get Directions';
      case CtaType.visitUs: return 'Visit Us';
      case CtaType.locateUs: return 'Locate Us';
      case CtaType.sendMessage: return 'Send Message';
      case CtaType.chatNow: return 'Chat Now';
      case CtaType.askQuestion: return 'Ask a Question';
      case CtaType.contactUs: return 'Contact Us';
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
}

class FormFieldData {
  final String id;
  final FormFieldType type;
  final String question;
  final List<String> options;
  final bool isRequired;

  const FormFieldData({
    required this.id,
    required this.type,
    required this.question,
    this.options = const [],
    this.isRequired = true,
  });

  FormFieldData copyWith({
    FormFieldType? type,
    String? question,
    List<String>? options,
    bool? isRequired,
  }) {
    return FormFieldData(
      id: id,
      type: type ?? this.type,
      question: question ?? this.question,
      options: options ?? this.options,
      isRequired: isRequired ?? this.isRequired,
    );
  }
}

class LeadFormData {
  final String headline;
  final String description;
  final File? heroImage;
  final List<FormFieldData> fields;
  final String privacyPolicyUrl;
  final String consentText;

  const LeadFormData({
    this.headline = '',
    this.description = '',
    this.heroImage,
    this.fields = const [],
    this.privacyPolicyUrl = '',
    this.consentText = 'By submitting this form, you agree to our privacy policy.',
  });

  LeadFormData copyWith({
    String? headline,
    String? description,
    File? heroImage,
    List<FormFieldData>? fields,
    String? privacyPolicyUrl,
    String? consentText,
    bool clearHeroImage = false,
  }) {
    return LeadFormData(
      headline: headline ?? this.headline,
      description: description ?? this.description,
      heroImage: clearHeroImage ? null : (heroImage ?? this.heroImage),
      fields: fields ?? this.fields,
      privacyPolicyUrl: privacyPolicyUrl ?? this.privacyPolicyUrl,
      consentText: consentText ?? this.consentText,
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
