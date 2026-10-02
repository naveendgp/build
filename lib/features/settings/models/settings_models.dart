enum VerificationStatus { notSubmitted, underReview, verified, rejected }

VerificationStatus _verificationStatusFromString(String? status) {
  switch (status) {
    case 'UNDER_REVIEW':
      return VerificationStatus.underReview;
    case 'VERIFIED':
      return VerificationStatus.verified;
    case 'REJECTED':
      return VerificationStatus.rejected;
    case 'NOT_SUBMITTED':
    default:
      return VerificationStatus.notSubmitted;
  }
}

String _verificationStatusToString(VerificationStatus status) {
  switch (status) {
    case VerificationStatus.underReview:
      return 'UNDER_REVIEW';
    case VerificationStatus.verified:
      return 'VERIFIED';
    case VerificationStatus.rejected:
      return 'REJECTED';
    case VerificationStatus.notSubmitted:
      return 'NOT_SUBMITTED';
  }
}

/// User-facing label for a verification status. Keep this separate from
/// the wire format above — "NOT_SUBMITTED" reads oddly to a brand owner
/// who's simply never been through verification yet.
String verificationStatusLabel(VerificationStatus status) {
  switch (status) {
    case VerificationStatus.underReview:
      return 'Under Review';
    case VerificationStatus.verified:
      return 'Verified';
    case VerificationStatus.rejected:
      return 'Rejected';
    case VerificationStatus.notSubmitted:
      return 'Not Verified';
  }
}

bool _parseBool(dynamic value, {bool defaultValue = false}) {
  if (value == null) return defaultValue;
  if (value is bool) return value;
  if (value is String) return value.toLowerCase() == 'true' || value == '1';
  if (value is num) return value > 0;
  return defaultValue;
}

class UserSettings {
  final String id;
  final String userId;
  final bool everyoneCanMessageMe;
  final List<String> categoryInterests;
  final bool pushNotifications;
  final bool appReminders;
  final bool campaignReminders;
  final bool platformReminders;
  final bool followedBrandPosts;
  final bool savedBrandPosts;
  final bool recommendedBrandPosts;

  UserSettings({
    required this.id,
    required this.userId,
    this.everyoneCanMessageMe = true,
    this.categoryInterests = const [],
    this.pushNotifications = true,
    this.appReminders = true,
    this.campaignReminders = true,
    this.platformReminders = true,
    this.followedBrandPosts = true,
    this.savedBrandPosts = true,
    this.recommendedBrandPosts = true,
  });

  factory UserSettings.fromJson(Map<String, dynamic> json) {
    return UserSettings(
      id: (json['id'] ?? '').toString(),
      userId: (json['userId'] ?? '').toString(),
      everyoneCanMessageMe: _parseBool(json['everyoneCanMessageMe'], defaultValue: true),
      categoryInterests:
          (json['categoryInterests'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      pushNotifications: _parseBool(json['pushNotifications'], defaultValue: true),
      appReminders: _parseBool(json['appReminders'], defaultValue: true),
      campaignReminders: _parseBool(json['campaignReminders'], defaultValue: true),
      platformReminders: _parseBool(json['platformReminders'], defaultValue: true),
      followedBrandPosts: _parseBool(json['followedBrandPosts'], defaultValue: true),
      savedBrandPosts: _parseBool(json['savedBrandPosts'], defaultValue: true),
      recommendedBrandPosts: _parseBool(json['recommendedBrandPosts'], defaultValue: true),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'everyoneCanMessageMe': everyoneCanMessageMe,
      'categoryInterests': categoryInterests,
      'pushNotifications': pushNotifications,
      'appReminders': appReminders,
      'campaignReminders': campaignReminders,
      'platformReminders': platformReminders,
      'followedBrandPosts': followedBrandPosts,
      'savedBrandPosts': savedBrandPosts,
      'recommendedBrandPosts': recommendedBrandPosts,
    };
  }

  UserSettings copyWith({
    bool? everyoneCanMessageMe,
    List<String>? categoryInterests,
    bool? pushNotifications,
    bool? appReminders,
    bool? campaignReminders,
    bool? platformReminders,
    bool? followedBrandPosts,
    bool? savedBrandPosts,
    bool? recommendedBrandPosts,
  }) {
    return UserSettings(
      id: id,
      userId: userId,
      everyoneCanMessageMe: everyoneCanMessageMe ?? this.everyoneCanMessageMe,
      categoryInterests: categoryInterests ?? this.categoryInterests,
      pushNotifications: pushNotifications ?? this.pushNotifications,
      appReminders: appReminders ?? this.appReminders,
      campaignReminders: campaignReminders ?? this.campaignReminders,
      platformReminders: platformReminders ?? this.platformReminders,
      followedBrandPosts: followedBrandPosts ?? this.followedBrandPosts,
      savedBrandPosts: savedBrandPosts ?? this.savedBrandPosts,
      recommendedBrandPosts: recommendedBrandPosts ?? this.recommendedBrandPosts,
    );
  }
}

class BrandSettings {
  final String id;
  final String brandId;
  final String? businessDescription;
  final String? website;
  final String? contactEmail;
  final String? contactPhone;
  final String? businessAddress;
  final String? gstVatNumber;

  /// Interests and business categories, saved together the way the user
  /// settings do. A brand picks these in Settings > Preferences too.
  final List<String> categoryInterests;
  final String? instagram;
  final String? facebook;
  final String? twitter;
  final String? whatsapp;
  final VerificationStatus verificationStatus;
  final List<String> businessDocuments;
  final bool newFollowerNotification;
  final bool newMessageNotification;
  final bool newLeadNotification;
  final bool newOrderNotification;
  final bool appReminders;
  final bool pushNotifications;

  BrandSettings({
    required this.id,
    required this.brandId,
    this.businessDescription,
    this.website,
    this.contactEmail,
    this.contactPhone,
    this.businessAddress,
    this.gstVatNumber,
    this.categoryInterests = const [],
    this.instagram,
    this.facebook,
    this.twitter,
    this.whatsapp,
    this.verificationStatus = VerificationStatus.notSubmitted,
    this.businessDocuments = const [],
    this.newFollowerNotification = true,
    this.newMessageNotification = true,
    this.newLeadNotification = true,
    this.newOrderNotification = true,
    this.appReminders = true,
    this.pushNotifications = true,
  });

  factory BrandSettings.fromJson(Map<String, dynamic> json) {
    return BrandSettings(
      id: (json['id'] ?? '').toString(),
      brandId: (json['brandId'] ?? '').toString(),
      businessDescription: json['businessDescription']?.toString(),
      website: json['website']?.toString(),
      contactEmail: json['contactEmail']?.toString(),
      contactPhone: json['contactPhone']?.toString(),
      businessAddress: json['businessAddress']?.toString(),
      gstVatNumber: json['gstVatNumber']?.toString(),
      categoryInterests:
          (json['categoryInterests'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      instagram: json['instagram']?.toString(),
      facebook: json['facebook']?.toString(),
      twitter: json['twitter']?.toString(),
      whatsapp: json['whatsapp']?.toString(),
      verificationStatus: _verificationStatusFromString(json['verificationStatus']?.toString()),
      businessDocuments:
          (json['businessDocuments'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      newFollowerNotification: _parseBool(json['newFollowerNotification'], defaultValue: true),
      newMessageNotification: _parseBool(json['newMessageNotification'], defaultValue: true),
      newLeadNotification: _parseBool(json['newLeadNotification'], defaultValue: true),
      newOrderNotification: _parseBool(json['newOrderNotification'], defaultValue: true),
      appReminders: _parseBool(json['appReminders'], defaultValue: true),
      pushNotifications: _parseBool(json['pushNotifications'], defaultValue: true),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'businessDescription': businessDescription,
      'website': website,
      'contactEmail': contactEmail,
      'contactPhone': contactPhone,
      'businessAddress': businessAddress,
      'gstVatNumber': gstVatNumber,
      'categoryInterests': categoryInterests,
      'instagram': instagram,
      'facebook': facebook,
      'twitter': twitter,
      'whatsapp': whatsapp,
      'verificationStatus': _verificationStatusToString(verificationStatus),
      'businessDocuments': businessDocuments,
      'newFollowerNotification': newFollowerNotification,
      'newMessageNotification': newMessageNotification,
      'newLeadNotification': newLeadNotification,
      'newOrderNotification': newOrderNotification,
      'appReminders': appReminders,
      'pushNotifications': pushNotifications,
    };
  }

  BrandSettings copyWith({
    String? businessDescription,
    String? website,
    String? contactEmail,
    String? contactPhone,
    String? businessAddress,
    String? gstVatNumber,
    List<String>? categoryInterests,
    String? instagram,
    String? facebook,
    String? twitter,
    String? whatsapp,
    VerificationStatus? verificationStatus,
    List<String>? businessDocuments,
    bool? newFollowerNotification,
    bool? newMessageNotification,
    bool? newLeadNotification,
    bool? newOrderNotification,
    bool? appReminders,
    bool? pushNotifications,
  }) {
    return BrandSettings(
      id: this.id,
      brandId: this.brandId,
      businessDescription: businessDescription ?? this.businessDescription,
      website: website ?? this.website,
      contactEmail: contactEmail ?? this.contactEmail,
      contactPhone: contactPhone ?? this.contactPhone,
      businessAddress: businessAddress ?? this.businessAddress,
      gstVatNumber: gstVatNumber ?? this.gstVatNumber,
      categoryInterests: categoryInterests ?? this.categoryInterests,
      instagram: instagram ?? this.instagram,
      facebook: facebook ?? this.facebook,
      twitter: twitter ?? this.twitter,
      whatsapp: whatsapp ?? this.whatsapp,
      verificationStatus: verificationStatus ?? this.verificationStatus,
      businessDocuments: businessDocuments ?? this.businessDocuments,
      newFollowerNotification: newFollowerNotification ?? this.newFollowerNotification,
      newMessageNotification: newMessageNotification ?? this.newMessageNotification,
      newLeadNotification: newLeadNotification ?? this.newLeadNotification,
      newOrderNotification: newOrderNotification ?? this.newOrderNotification,
      appReminders: appReminders ?? this.appReminders,
      pushNotifications: pushNotifications ?? this.pushNotifications,
    );
  }
}

class BlockedBrand {
  final String id;
  final String name;
  final String username;
  final String? logoUrl;
  final String? category;
  final bool isBrandPublic;
  final DateTime blockedAt;

  BlockedBrand({
    required this.id,
    required this.name,
    required this.username,
    this.logoUrl,
    this.category,
    required this.isBrandPublic,
    required this.blockedAt,
  });

  factory BlockedBrand.fromJson(Map<String, dynamic> json) {
    return BlockedBrand(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      username: (json['username'] ?? '').toString(),
      logoUrl: json['logoUrl']?.toString(),
      category: json['category']?.toString(),
      isBrandPublic: _parseBool(json['isBrandPublic'], defaultValue: true),
      blockedAt: DateTime.tryParse(json['blockedAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}
