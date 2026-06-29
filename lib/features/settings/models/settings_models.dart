enum VerificationStatus {
  notSubmitted,
  underReview,
  verified,
  rejected,
}

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
      id: json['id'] as String,
      userId: json['userId'] as String,
      everyoneCanMessageMe: json['everyoneCanMessageMe'] as bool? ?? true,
      categoryInterests: (json['categoryInterests'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      pushNotifications: json['pushNotifications'] as bool? ?? true,
      appReminders: json['appReminders'] as bool? ?? true,
      campaignReminders: json['campaignReminders'] as bool? ?? true,
      platformReminders: json['platformReminders'] as bool? ?? true,
      followedBrandPosts: json['followedBrandPosts'] as bool? ?? true,
      savedBrandPosts: json['savedBrandPosts'] as bool? ?? true,
      recommendedBrandPosts: json['recommendedBrandPosts'] as bool? ?? true,
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
  final String? instagram;
  final String? facebook;
  final String? whatsapp;
  final VerificationStatus verificationStatus;
  final List<String> businessDocuments;
  final bool newFollowerNotification;
  final bool newMessageNotification;
  final bool newLeadNotification;
  final bool newOrderNotification;

  BrandSettings({
    required this.id,
    required this.brandId,
    this.businessDescription,
    this.website,
    this.contactEmail,
    this.contactPhone,
    this.businessAddress,
    this.gstVatNumber,
    this.instagram,
    this.facebook,
    this.whatsapp,
    this.verificationStatus = VerificationStatus.notSubmitted,
    this.businessDocuments = const [],
    this.newFollowerNotification = true,
    this.newMessageNotification = true,
    this.newLeadNotification = true,
    this.newOrderNotification = true,
  });

  factory BrandSettings.fromJson(Map<String, dynamic> json) {
    return BrandSettings(
      id: json['id'] as String,
      brandId: json['brandId'] as String,
      businessDescription: json['businessDescription'] as String?,
      website: json['website'] as String?,
      contactEmail: json['contactEmail'] as String?,
      contactPhone: json['contactPhone'] as String?,
      businessAddress: json['businessAddress'] as String?,
      gstVatNumber: json['gstVatNumber'] as String?,
      instagram: json['instagram'] as String?,
      facebook: json['facebook'] as String?,
      whatsapp: json['whatsapp'] as String?,
      verificationStatus: _verificationStatusFromString(json['verificationStatus'] as String?),
      businessDocuments: (json['businessDocuments'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      newFollowerNotification: json['newFollowerNotification'] as bool? ?? true,
      newMessageNotification: json['newMessageNotification'] as bool? ?? true,
      newLeadNotification: json['newLeadNotification'] as bool? ?? true,
      newOrderNotification: json['newOrderNotification'] as bool? ?? true,
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
      'instagram': instagram,
      'facebook': facebook,
      'whatsapp': whatsapp,
      'verificationStatus': _verificationStatusToString(verificationStatus),
      'businessDocuments': businessDocuments,
      'newFollowerNotification': newFollowerNotification,
      'newMessageNotification': newMessageNotification,
      'newLeadNotification': newLeadNotification,
      'newOrderNotification': newOrderNotification,
    };
  }

  BrandSettings copyWith({
    String? businessDescription,
    String? website,
    String? contactEmail,
    String? contactPhone,
    String? businessAddress,
    String? gstVatNumber,
    String? instagram,
    String? facebook,
    String? whatsapp,
    VerificationStatus? verificationStatus,
    List<String>? businessDocuments,
    bool? newFollowerNotification,
    bool? newMessageNotification,
    bool? newLeadNotification,
    bool? newOrderNotification,
  }) {
    return BrandSettings(
      id: id ?? this.id,
      brandId: brandId ?? this.brandId,
      businessDescription: businessDescription ?? this.businessDescription,
      website: website ?? this.website,
      contactEmail: contactEmail ?? this.contactEmail,
      contactPhone: contactPhone ?? this.contactPhone,
      businessAddress: businessAddress ?? this.businessAddress,
      gstVatNumber: gstVatNumber ?? this.gstVatNumber,
      instagram: instagram ?? this.instagram,
      facebook: facebook ?? this.facebook,
      whatsapp: whatsapp ?? this.whatsapp,
      verificationStatus: verificationStatus ?? this.verificationStatus,
      businessDocuments: businessDocuments ?? this.businessDocuments,
      newFollowerNotification: newFollowerNotification ?? this.newFollowerNotification,
      newMessageNotification: newMessageNotification ?? this.newMessageNotification,
      newLeadNotification: newLeadNotification ?? this.newLeadNotification,
      newOrderNotification: newOrderNotification ?? this.newOrderNotification,
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
      id: json['id'] as String,
      name: json['name'] as String,
      username: json['username'] as String,
      logoUrl: json['logoUrl'] as String?,
      category: json['category'] as String?,
      isBrandPublic: json['isBrandPublic'] as bool? ?? true,
      blockedAt: DateTime.parse(json['blockedAt'] as String),
    );
  }
}
