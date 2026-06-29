import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';

// ─── Brand Profile ──────────────────────────────────────────
class BrandProfile {
  final String id;
  final String username;
  final String name;
  final String? tagline;
  final String? bio;
  final String logoUrl;
  final String coverUrl;
  final String category;
  final bool isVerified;
  final bool isFollowing;
  final bool isOwner;
  final int followerCount;
  final int postCount;
  final double engagementRate;
  final String? websiteUrl;
  
  // Settings / Profile Edit Fields
  final String? email;
  final String? contactNumber;
  final String? whatsapp;
  final String? instagram;
  final String? facebook;
  final String? businessType;
  final String? industry;
  final String? gstNumber;
  final bool isGalleryEnabled;
  final bool isBrandPublic;
  final bool showContactInfo;
  final bool allowDMs;
  final bool allowNotifications;
  final bool allowEmailNotifications;

  String? get website => websiteUrl;

  const BrandProfile({
    required this.id,
    required this.username,
    required this.name,
    this.tagline,
    this.bio,
    required this.logoUrl,
    required this.coverUrl,
    required this.category,
    this.isVerified = false,
    this.isFollowing = false,
    this.isOwner = false,
    this.followerCount = 0,
    this.postCount = 0,
    this.engagementRate = 0,
    this.websiteUrl,
    this.email,
    this.contactNumber,
    this.whatsapp,
    this.instagram,
    this.facebook,
    this.businessType,
    this.industry,
    this.gstNumber,
    this.isGalleryEnabled = true,
    this.isBrandPublic = true,
    this.showContactInfo = true,
    this.allowDMs = true,
    this.allowNotifications = true,
    this.allowEmailNotifications = true,
  });

  BrandProfile copyWith({bool? isFollowing, int? followerCount, String? logoUrl, String? coverUrl, String? bio}) {
    return BrandProfile(
      id: id, username: username, name: name, tagline: tagline, bio: bio ?? this.bio,
      logoUrl: logoUrl ?? this.logoUrl, coverUrl: coverUrl ?? this.coverUrl, category: category,
      isVerified: isVerified,
      isFollowing: isFollowing ?? this.isFollowing,
      isOwner: isOwner,
      followerCount: followerCount ?? this.followerCount,
      postCount: postCount, engagementRate: engagementRate,
      websiteUrl: websiteUrl,
      email: email, contactNumber: contactNumber, whatsapp: whatsapp,
      instagram: instagram, facebook: facebook, businessType: businessType,
      industry: industry, gstNumber: gstNumber,
      isGalleryEnabled: isGalleryEnabled, isBrandPublic: isBrandPublic,
      showContactInfo: showContactInfo, allowDMs: allowDMs,
      allowNotifications: allowNotifications, allowEmailNotifications: allowEmailNotifications,
    );
  }

  factory BrandProfile.fromJson(Map<String, dynamic> json) {
    return BrandProfile(
      id: json['id'] ?? '',
      username: json['username'] ?? '',
      name: json['name'] ?? 'Brand',
      tagline: json['tagline'],
      bio: json['bio'],
      logoUrl: json['logoUrl'] ?? '',
      coverUrl: json['coverImageUrl'] ?? 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
      category: json['category'] ?? '',
      isVerified: json['verificationStatus'] == 'VERIFIED' || json['verificationStatus'] == 'Verified',
      isFollowing: json['isFollowing'] ?? false,
      isOwner: json['isOwner'] ?? false,
      followerCount: json['followerCount'] ?? 0,
      postCount: json['postCount'] ?? 0,
      engagementRate: 0,
      websiteUrl: json['website'],
      email: json['email'],
      contactNumber: json['contactNumber'],
      whatsapp: json['whatsapp'],
      instagram: json['instagram'],
      facebook: json['facebook'],
      businessType: json['businessType'],
      industry: json['industry'],
      gstNumber: json['gstNumber'],
      isGalleryEnabled: json['isGalleryEnabled'] ?? true,
      isBrandPublic: json['isBrandPublic'] ?? true,
      showContactInfo: json['showContactInfo'] ?? true,
      allowDMs: json['allowDMs'] ?? true,
      allowNotifications: json['allowNotifications'] ?? true,
      allowEmailNotifications: json['allowEmailNotifications'] ?? true,
    );
  }


}

// ─── Brand Post (for Posts tab) ─────────────────────────────
class BrandPost {
  final String id;
  final String imageUrl;
  final String? mediaType;
  final String title;
  final int likeCount;
  final int commentCount;
  final String? objectiveLabel;
  final double aspectRatio;
  final String publishStatus;

  const BrandPost({
    required this.id,
    required this.imageUrl,
    this.mediaType,
    required this.title,
    this.likeCount = 0,
    this.commentCount = 0,
    this.objectiveLabel,
    this.aspectRatio = 1.0,
    this.publishStatus = 'PUBLISHED',
  });

  factory BrandPost.fromJson(Map<String, dynamic> json) {
    List<dynamic> parseList(dynamic data) {
      if (data == null) return [];
      if (data is List) return data;
      if (data is String) return [data];
      return [];
    }

    final media = parseList(json['media']).firstOrNull;
    return BrandPost(
      id: (json['id'] ?? '').toString(),
      imageUrl: media != null && media is Map ? (media['url'] ?? '').toString() : '',
      mediaType: media != null && media is Map ? (media['type'] ?? 'IMAGE').toString() : 'IMAGE',
      title: (json['title'] ?? '').toString(),
      likeCount: json['likeCount'] ?? 0,
      commentCount: json['commentCount'] ?? 0,
      objectiveLabel: json['objective']?.toString(),
      aspectRatio: media != null && media is Map ? (media['aspectRatio'] as num?)?.toDouble() ?? 1.0 : 1.0,
      publishStatus: (json['publishStatus'] ?? 'PUBLISHED').toString(),
    );
  }
}

// ─── Gallery Item ───────────────────────────────────────────
class BrandGalleryItem {
  final String id;
  final String imageUrl;
  final double aspectRatio;

  const BrandGalleryItem({
    required this.id,
    required this.imageUrl,
    this.aspectRatio = 1.0,
  });

  factory BrandGalleryItem.fromJson(Map<String, dynamic> json) {
    return BrandGalleryItem(
      id: json['id'] ?? '',
      imageUrl: ApiClient.resolveMediaUrl(json['url'] as String?),
      aspectRatio: (json['aspectRatio'] as num?)?.toDouble() ?? 1.0,
    );
  }
}

// ─── Quicksite ──────────────────────────────────────────────
class BrandQuicksiteData {
  final String about;
  final List<BrandService> services;
  final List<BrandProduct> products;
  final BrandContactInfo contact;
  final Map<String, String> socialLinks;

  const BrandQuicksiteData({
    required this.about,
    this.services = const [],
    this.products = const [],
    required this.contact,
    this.socialLinks = const {},
  });

  factory BrandQuicksiteData.fromJson(Map<String, dynamic> json) {
    List<dynamic> parseList(dynamic data) {
      if (data == null) return [];
      if (data is List) return data;
      return [];
    }
    
    Map<String, dynamic>? qs;
    if (json['quicksite'] is Map) {
      qs = Map<String, dynamic>.from(json['quicksite'] as Map);
    }
    return BrandQuicksiteData(
      about: qs?['about'] ?? json['bio'] ?? '', 
      services: parseList(qs?['services']).map((e) => BrandService.fromJson(e)).toList(),
      products: parseList(qs?['products']).map((e) => BrandProduct.fromJson(e)).toList(),
      contact: BrandContactInfo(
        email: qs?['email'] ?? json['email'],
        phone: qs?['phone'] ?? json['contactNumber'],
        address: qs?['address'] ?? json['location'],
        hours: json['businessHours']?.toString(), // Safely convert Json object to string
      ),
      socialLinks: <String, String>{
        if (qs?['instagram'] ?? json['instagram'] != null) 'instagram': (qs?['instagram'] ?? json['instagram']).toString(),
        if (qs?['facebook'] ?? json['facebook'] != null) 'facebook': (qs?['facebook'] ?? json['facebook']).toString(),
        if (qs?['twitter'] ?? json['twitter'] != null) 'twitter': (qs?['twitter'] ?? json['twitter']).toString(),
        if (qs?['linkedin'] ?? json['linkedin'] != null) 'linkedin': (qs?['linkedin'] ?? json['linkedin']).toString(),
        if (qs?['youtube'] ?? json['youtube'] != null) 'youtube': (qs?['youtube'] ?? json['youtube']).toString(),
        if (qs?['whatsapp'] ?? json['whatsapp'] != null) 'whatsapp': (qs?['whatsapp'] ?? json['whatsapp']).toString(),
        if (qs?['tiktok'] ?? json['tiktok'] != null) 'tiktok': (qs?['tiktok'] ?? json['tiktok']).toString(),
        if (qs?['website'] ?? json['website'] != null) 'website': (qs?['website'] ?? json['website']).toString(),
      },
    );
  }
}

class BrandService {
  final String name;
  final String description;
  final IconData icon;

  const BrandService({required this.name, required this.description, required this.icon});

  factory BrandService.fromJson(Map<String, dynamic> json) {
    return BrandService(
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      icon: Icons.style_rounded, // Default icon or parse from string
    );
  }
}

class BrandProduct {
  final String name;
  final String imageUrl;
  final String price;

  const BrandProduct({required this.name, required this.imageUrl, required this.price});

  factory BrandProduct.fromJson(Map<String, dynamic> json) {
    return BrandProduct(
      name: json['name'] ?? '',
      imageUrl: json['imageUrl'] ?? '',
      price: json['price'] ?? '',
    );
  }
}

class BrandContactInfo {
  final String? email;
  final String? phone;
  final String? address;
  final String? hours;

  const BrandContactInfo({this.email, this.phone, this.address, this.hours});
}

// ─── Review ─────────────────────────────────────────────────
class BrandReview {
  final String id;
  final String authorName;
  final String? authorAvatarUrl;
  final String authorId;
  final double rating;
  final String? title;
  final String description;
  final bool verifiedInteraction;
  final String status;
  final String? brandResponse;
  final DateTime? brandResponseDate;
  final DateTime createdAt;

  const BrandReview({
    required this.id,
    required this.authorName,
    this.authorAvatarUrl,
    required this.authorId,
    required this.rating,
    this.title,
    required this.description,
    this.verifiedInteraction = false,
    this.status = 'APPROVED',
    this.brandResponse,
    this.brandResponseDate,
    required this.createdAt,
  });

  factory BrandReview.fromJson(Map<String, dynamic> json) {
    return BrandReview(
      id: json['id'] ?? '',
      authorName: json['user']?['name'] ?? 'Anonymous',
      authorAvatarUrl: json['user']?['profilePic'],
      authorId: json['user']?['id'] ?? json['userId'] ?? '',
      rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
      title: json['title'],
      description: json['description'] ?? '',
      verifiedInteraction: json['verifiedInteraction'] ?? false,
      status: json['status'] ?? 'APPROVED',
      brandResponse: json['brandResponse'],
      brandResponseDate: json['brandResponseDate'] != null ? DateTime.parse(json['brandResponseDate']) : null,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
    );
  }
}

class ReviewStats {
  final double averageRating;
  final int totalReviews;
  final Map<int, int> distribution;

  const ReviewStats({
    this.averageRating = 0.0,
    this.totalReviews = 0,
    this.distribution = const {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
  });

  factory ReviewStats.fromJson(Map<String, dynamic> json) {
    return ReviewStats(
      averageRating: (json['averageRating'] as num?)?.toDouble() ?? 0.0,
      totalReviews: json['totalReviews'] ?? 0,
      distribution: {
        1: json['distribution']?['1'] ?? 0,
        2: json['distribution']?['2'] ?? 0,
        3: json['distribution']?['3'] ?? 0,
        4: json['distribution']?['4'] ?? 0,
        5: json['distribution']?['5'] ?? 0,
      },
    );
  }
}

// ─── Testimonial ────────────────────────────────────────────
class BrandTestimonial {
  final String id;
  final String authorName;
  final String? authorTitle;
  final String? authorAvatarUrl;
  final String quote;
  final String? mediaUrl;
  final bool isVideo;

  const BrandTestimonial({
    required this.id,
    required this.authorName,
    this.authorTitle,
    this.authorAvatarUrl,
    required this.quote,
    this.mediaUrl,
    this.isVideo = false,
  });

  factory BrandTestimonial.fromJson(Map<String, dynamic> json) {
    return BrandTestimonial(
      id: json['id'] ?? '',
      authorName: json['authorName'] ?? '',
      authorTitle: json['authorTitle'],
      authorAvatarUrl: json['authorAvatarUrl'],
      quote: json['quote'] ?? '',
      mediaUrl: json['mediaUrl'],
      isVideo: json['isVideo'] ?? false,
    );
  }
}

// ─── Analytics ──────────────────────────────────────────────
class BrandAnalytics {
  final int impressions;
  final int profileViews;
  final double ctr;
  final int totalSaves;
  final int totalShares;
  final double avgEngagement;
  final Map<String, double> audienceSplit; // e.g. {'18-24': 0.35, '25-34': 0.45}

  const BrandAnalytics({
    required this.impressions,
    required this.profileViews,
    required this.ctr,
    required this.totalSaves,
    required this.totalShares,
    required this.avgEngagement,
    this.audienceSplit = const {},
  });

  factory BrandAnalytics.fromJson(Map<String, dynamic> json) {
    return BrandAnalytics(
      impressions: json['impressions'] ?? 0,
      profileViews: json['profileViews'] ?? 0,
      ctr: (json['ctr'] as num?)?.toDouble() ?? 0.0,
      totalSaves: json['totalSaves'] ?? 0,
      totalShares: json['totalShares'] ?? 0,
      avgEngagement: (json['avgEngagement'] as num?)?.toDouble() ?? 0.0,
      audienceSplit: (json['audienceSplit'] as Map<String, dynamic>?)?.map((k, v) => MapEntry(k, (v as num).toDouble())) ?? {},
    );
  }
}

// ─── Mock Data ──────────────────────────────────────────────
class MockBrandData {
  static const _img = [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
    'https://images.unsplash.com/photo-1526178613552-2b45c6c302f0?w=800',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800',
    'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800',
    'https://images.unsplash.com/photo-1492684223f8-e1940d1cb221?w=800',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
  ];

  static BrandProfile getProfile(String id) {
    return BrandProfile(
      id: id,
      name: 'Velvet Studio',
      username: 'velvetstudio',
      tagline: 'Where luxury meets modernity',
      bio: 'Premium fashion house redefining contemporary elegance. Handcrafted pieces, sustainable materials, timeless design.',
      logoUrl: _img[1],
      coverUrl: _img[4],
      category: 'Fashion & Luxury',
      isVerified: true,
      isFollowing: false,
      isOwner: false,
      followerCount: 182400,
      postCount: 247,
      engagementRate: 8.4,
      websiteUrl: 'velvetstudio.com',
    );
  }

  static List<BrandPost> getPosts() => [
    BrandPost(id: 'bp1', imageUrl: _img[1], title: 'Summer Collection Drop', likeCount: 5291, objectiveLabel: 'Launch', aspectRatio: 0.8),
    BrandPost(id: 'bp2', imageUrl: _img[4], title: 'Sustainable Fashion Forward', likeCount: 12400, aspectRatio: 1.2),
    BrandPost(id: 'bp3', imageUrl: _img[3], title: 'Evening Elegance Lookbook', likeCount: 8734, objectiveLabel: 'Awareness', aspectRatio: 0.75),
    BrandPost(id: 'bp4', imageUrl: _img[0], title: 'Behind the Scenes', likeCount: 3200, aspectRatio: 1.0),
    BrandPost(id: 'bp5', imageUrl: _img[7], title: 'Artisan Craftsmanship', likeCount: 6100, aspectRatio: 1.3),
    BrandPost(id: 'bp6', imageUrl: _img[5], title: 'Studio Tour Experience', likeCount: 4800, objectiveLabel: 'Engagement', aspectRatio: 0.9),
    BrandPost(id: 'bp7', imageUrl: _img[8], title: 'Accessories Preview', likeCount: 2300, aspectRatio: 1.1),
    BrandPost(id: 'bp8', imageUrl: _img[2], title: 'Workspace Aesthetic', likeCount: 1900, aspectRatio: 0.85),
  ];

  static List<BrandGalleryItem> getGallery() => [
    BrandGalleryItem(id: 'g1', imageUrl: _img[4], aspectRatio: 0.75),
    BrandGalleryItem(id: 'g2', imageUrl: _img[1], aspectRatio: 1.2),
    BrandGalleryItem(id: 'g3', imageUrl: _img[3], aspectRatio: 0.8),
    BrandGalleryItem(id: 'g4', imageUrl: _img[0], aspectRatio: 1.0),
    BrandGalleryItem(id: 'g5', imageUrl: _img[7], aspectRatio: 1.3),
    BrandGalleryItem(id: 'g6', imageUrl: _img[5], aspectRatio: 0.9),
    BrandGalleryItem(id: 'g7', imageUrl: _img[8], aspectRatio: 1.1),
    BrandGalleryItem(id: 'g8', imageUrl: _img[2], aspectRatio: 0.85),
    BrandGalleryItem(id: 'g9', imageUrl: _img[6], aspectRatio: 1.0),
    BrandGalleryItem(id: 'g10', imageUrl: _img[9], aspectRatio: 0.7),
  ];

  static BrandQuicksiteData getQuicksite() => const BrandQuicksiteData(
    about: 'Founded in 2018, Velvet Studio has grown from a boutique atelier in Milan to a globally recognized luxury fashion house. Our commitment to sustainable craftsmanship and modern aesthetics drives everything we create.\n\nEvery piece tells a story of meticulous attention to detail, ethically sourced materials, and timeless design philosophy.',
    services: [
      BrandService(name: 'Personal Styling', description: 'One-on-one luxury styling sessions', icon: Icons.style_rounded),
      BrandService(name: 'Custom Tailoring', description: 'Bespoke garments crafted to perfection', icon: Icons.content_cut_rounded),
      BrandService(name: 'Virtual Showroom', description: 'Immersive digital experience', icon: Icons.view_in_ar_rounded),
      BrandService(name: 'Corporate Events', description: 'Premium fashion events & shows', icon: Icons.event_rounded),
    ],
    products: [
      BrandProduct(name: 'Summer Dress', imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400', price: '\$480'),
      BrandProduct(name: 'Silk Blazer', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400', price: '\$720'),
      BrandProduct(name: 'Leather Tote', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', price: '\$340'),
    ],
    contact: BrandContactInfo(
      email: 'hello@velvetstudio.com',
      phone: '+1 (555) 234-5678',
      address: 'Via Monte Napoleone 12, Milan, Italy',
      hours: 'Mon–Sat: 10:00 AM – 8:00 PM',
    ),
    socialLinks: {'instagram': 'instagram.com/velvetstudio', 'twitter': 'twitter.com/velvetstudio'},
  );

  static List<BrandReview> getReviews() => [
    BrandReview(
      id: 'r1', authorName: 'Sophia Chen', authorId: 'u1', rating: 5.0,
      authorAvatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      description: 'Absolutely stunning quality. The silk blazer exceeded all my expectations — the craftsmanship is impeccable and the fit is divine.',
      createdAt: DateTime.now().subtract(const Duration(days: 3)),
    ),
    BrandReview(
      id: 'r2', authorName: 'James Porter', authorId: 'u2', rating: 4.5,
      description: 'Great brand with exceptional attention to detail. Shipping was a bit slow to the US but the product quality more than makes up for it.',
      createdAt: DateTime.now().subtract(const Duration(days: 12)),
    ),
    BrandReview(
      id: 'r3', authorName: 'Amara Obi', authorId: 'u3', rating: 5.0,
      authorAvatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
      description: 'My go-to brand for every special occasion. The personal styling service is worth every penny — they truly understand modern elegance.',
      createdAt: DateTime.now().subtract(const Duration(days: 21)),
    ),
  ];

  static List<BrandTestimonial> getTestimonials() => [
    const BrandTestimonial(
      id: 't1',
      authorName: 'Elena Voss',
      authorTitle: 'Fashion Editor, VOGUE Italia',
      quote: 'Velvet Studio represents the future of sustainable luxury. Their commitment to ethical fashion without compromising on elegance is extraordinary.',
      mediaUrl: 'https://images.unsplash.com/photo-1526178613552-2b45c6c302f0?w=600',
    ),
    const BrandTestimonial(
      id: 't2',
      authorName: 'David Kim',
      authorTitle: 'Creative Director',
      quote: 'Every collection feels like a curated art exhibition. The attention to texture, draping, and silhouette is unmatched in contemporary fashion.',
    ),
    const BrandTestimonial(
      id: 't3',
      authorName: 'Isabella Laurent',
      authorTitle: 'Celebrity Stylist',
      quote: 'I dress A-list clients in Velvet Studio because their pieces photograph beautifully and feel incredible. That\'s a rare combination.',
      mediaUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600',
    ),
  ];

  static BrandAnalytics getAnalytics() => const BrandAnalytics(
    impressions: 1240000,
    profileViews: 89400,
    ctr: 6.2,
    totalSaves: 34200,
    totalShares: 12800,
    avgEngagement: 8.4,
    audienceSplit: {'18-24': 0.22, '25-34': 0.45, '35-44': 0.21, '45+': 0.12},
  );
}
