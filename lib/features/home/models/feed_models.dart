// Lyket Feed — Data Models & Mock Data
import '../../../core/network/api_client.dart';

class FeedPost {
  final String id;
  final String brandId;
  final String brandName;
  final String brandAvatar;
  final bool isVerified;
  final String mediaUrl;
  final String? videoUrl;
  final double aspectRatio;
  final String title;
  final String description;
  final List<String> tags;
  final String? objective;
  final String? ctaLabel;
  final String? ctaType;
  final Map<String, dynamic>? ctaPayload;
  final int likeCount;
  final int commentCount;
  final int shareCount;
  final bool isLiked;
  final bool isBookmarked;
  final bool isFollowing;
  final String timestamp;
  final String? aiReason;
  final List<String>? carouselUrls;
  final String? matchType;
  final double? bestFrameTimestamp;
  
  // Highlight Banner
  final bool isHighlighted;
  final String? highlightMessage;
  final String? highlightTheme;
  final String? highlightAnimation;
  final String? highlightIcon;

  const FeedPost({
    required this.id,
    required this.brandId,
    required this.brandName,
    required this.brandAvatar,
    this.isVerified = false,
    required this.mediaUrl,
    this.videoUrl,
    this.aspectRatio = 1.2,
    required this.title,
    required this.description,
    this.tags = const [],
    this.objective,
    this.ctaLabel,
    this.ctaType,
    this.ctaPayload,
    this.likeCount = 0,
    this.commentCount = 0,
    this.shareCount = 0,
    this.isLiked = false,
    this.isBookmarked = false,
    this.isFollowing = false,
    required this.timestamp,
    this.aiReason,
    this.carouselUrls,
    this.matchType,
    this.bestFrameTimestamp,
    this.isHighlighted = false,
    this.highlightMessage,
    this.highlightTheme,
    this.highlightAnimation,
    this.highlightIcon,
  });

  factory FeedPost.fromJson(Map<String, dynamic> json) {
    // Extract primary media
    final mediaList = json['media'] as List<dynamic>? ?? [];
    String mUrl = '';
    String? vUrl;
    List<String> cUrls = [];
    if (mediaList.isNotEmpty) {
      mUrl = mediaList[0]['url'] ?? '';
      if (mediaList[0]['type']?.toString().toUpperCase() == 'VIDEO') vUrl = mUrl;
      cUrls = mediaList.map((e) => (e['url'] ?? '').toString()).toList();
    }

    final brand = json['brand'] ?? {};
    final cta = json['cta'] ?? {};

    return FeedPost(
      id: (json['id'] ?? '').toString(),
      brandId: brand['id'] ?? '',
      brandName: brand['name'] ?? 'Unknown Brand',
      brandAvatar: ApiClient.resolveMediaUrl(brand['logoUrl']),
      isVerified: brand['verificationStatus'] == 'VERIFIED' || brand['verificationStatus'] == 'Verified',
      mediaUrl: ApiClient.resolveMediaUrl(mUrl),
      videoUrl: vUrl != null ? ApiClient.resolveMediaUrl(vUrl) : null,
      aspectRatio: _parseAspectRatio(json['aspectRatio']),
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      tags: List<String>.from(json['tags'] ?? []),
      objective: json['objective'],
      ctaLabel: cta['text'],
      ctaType: cta['action'],
      ctaPayload: cta['payload'],
      likeCount: json['likeCount'] ?? 0,
      commentCount: json['commentCount'] ?? 0,
      shareCount: json['shareCount'] ?? 0,
      isLiked: _parseBool(json['isLiked']),
      isBookmarked: _parseBool(json['isSaved']), // backend uses isSaved
      isFollowing: _parseBool(json['isFollowing']), // may not be in this endpoint directly
      timestamp: json['createdAt'] != null ? _formatTimestamp(json['createdAt']) : 'Just now',
      carouselUrls: cUrls.length > 1 ? cUrls : null,
      matchType: json['matchType'],
      bestFrameTimestamp: json['bestFrameTimestamp'] != null ? (json['bestFrameTimestamp'] as num).toDouble() : null,
      isHighlighted: _parseBool(json['isHighlighted']),
      highlightMessage: json['highlightMessage'],
      highlightTheme: json['highlightTheme'],
      highlightAnimation: json['highlightAnimation'],
      highlightIcon: json['highlightIcon'],
    );
  }

  static double _parseAspectRatio(dynamic val) {
    if (val == null) return 1.2;
    if (val is num) return val.toDouble();
    if (val is String) {
      if (val == 'SQUARE') return 1.0;
      if (val == 'PORTRAIT') return 0.8;
      if (val == 'LANDSCAPE') return 1.77;
      return double.tryParse(val) ?? 1.2;
    }
    return 1.2;
  }

  static bool _parseBool(dynamic val) {
    if (val == null) return false;
    if (val is bool) return val;
    if (val is String) return val.toLowerCase() == 'true' || val == '1';
    if (val is num) return val > 0;
    return false;
  }

  static String _formatTimestamp(String isoDate) {
    // Basic formatter
    final date = DateTime.tryParse(isoDate);
    if (date == null) return 'Just now';
    final diff = DateTime.now().difference(date);
    if (diff.inDays >= 30) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return '${months[date.month - 1]} ${date.day}';
    }
    if (diff.inDays > 0) return '${diff.inDays}d ago';
    if (diff.inHours > 0) return '${diff.inHours}h ago';
    if (diff.inMinutes > 0) return '${diff.inMinutes}m ago';
    return 'Just now';
  }

  FeedPost copyWith({
    String? id,
    String? brandId,
    String? brandName,
    String? brandAvatar,
    bool? isLiked,
    bool? isBookmarked,
    bool? isFollowing,
    int? likeCount,
    int? commentCount,
  }) {
    return FeedPost(
      id: id ?? this.id,
      brandId: brandId ?? this.brandId,
      brandName: brandName ?? this.brandName,
      brandAvatar: brandAvatar ?? this.brandAvatar,
      isVerified: isVerified,
      mediaUrl: mediaUrl,
      videoUrl: videoUrl,
      aspectRatio: aspectRatio,
      title: title,
      description: description,
      tags: tags,
      objective: objective,
      ctaLabel: ctaLabel,
      ctaType: ctaType,
      ctaPayload: ctaPayload,
      likeCount: likeCount ?? this.likeCount,
      // Was `commentCount: commentCount` with no matching parameter above —
      // silently a no-op that always kept the original value, since Dart
      // resolved the unqualified name to `this.commentCount`. copyWith had
      // no way to actually change the comment count.
      commentCount: commentCount ?? this.commentCount,
      shareCount: shareCount,
      isLiked: isLiked ?? this.isLiked,
      isBookmarked: isBookmarked ?? this.isBookmarked,
      isFollowing: isFollowing ?? this.isFollowing,
      timestamp: timestamp,
      aiReason: aiReason,
      carouselUrls: carouselUrls,
      matchType: matchType,
      bestFrameTimestamp: bestFrameTimestamp,
      isHighlighted: isHighlighted,
      highlightMessage: highlightMessage,
      highlightTheme: highlightTheme,
      highlightAnimation: highlightAnimation,
      highlightIcon: highlightIcon,
    );
  }
}

class MockFeedData {
  static const List<String> _imgs = [
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

  static List<FeedPost> generate() {
    return [
      FeedPost(
        id: '1', brandId: 'b1', brandName: 'Maison Noir', brandAvatar: _imgs[0],
        isVerified: true, mediaUrl: _imgs[0], aspectRatio: 1.3,
        title: 'The Art of Minimal Living',
        description: 'Discover our new collection inspired by modern minimalism and Japanese aesthetics.',
        tags: ['Lifestyle', 'Design', 'Minimal'],
        objective: 'Awareness', ctaLabel: 'Shop Now', ctaType: 'shop',
        likeCount: 2847, commentCount: 183, shareCount: 94,
        timestamp: '2h ago', aiReason: 'Because you liked lifestyle brands',
      ),
      FeedPost(
        id: '2', brandId: 'b2', brandName: 'Velvet Studio', brandAvatar: _imgs[1],
        isVerified: true, mediaUrl: _imgs[1], aspectRatio: 0.8,
        title: 'Summer Collection Drop',
        description: 'Bold colors meet sustainable fashion in our latest summer lineup.',
        tags: ['Fashion', 'Sustainable', 'Summer'],
        objective: 'Traffic', ctaLabel: 'Learn More', ctaType: 'learn',
        likeCount: 5291, commentCount: 412, shareCount: 201,
        timestamp: '4h ago', aiReason: 'Trending near you',
      ),
      FeedPost(
        id: '3', brandId: 'b3', brandName: 'Nexus Tech', brandAvatar: _imgs[2],
        isVerified: true, mediaUrl: _imgs[2], aspectRatio: 1.0,
        title: 'AI-Powered Workspace Revolution',
        description: 'How artificial intelligence is reshaping the modern workplace experience.',
        tags: ['Technology', 'AI', 'Workspace'],
        objective: 'Leads', ctaLabel: 'Sign Up', ctaType: 'signup',
        likeCount: 1203, commentCount: 89, shareCount: 67,
        timestamp: '6h ago', aiReason: 'Popular in Tech',
      ),
      FeedPost(
        id: '4', brandId: 'b4', brandName: 'Aurelia', brandAvatar: _imgs[3],
        isVerified: false, mediaUrl: _imgs[3], aspectRatio: 1.4,
        title: 'Evening Elegance Reimagined',
        description: 'Luxury evening wear that tells your story through fabric and form.',
        tags: ['Luxury', 'Evening Wear', 'Fashion'],
        objective: 'Conversions', ctaLabel: 'Book Now', ctaType: 'book',
        likeCount: 8734, commentCount: 567, shareCount: 312,
        timestamp: '8h ago', aiReason: 'Inspired by your searches',
      ),
      FeedPost(
        id: '5', brandId: 'b5', brandName: 'Bloom Cafe', brandAvatar: _imgs[4],
        mediaUrl: _imgs[4], aspectRatio: 1.1,
        title: 'Farm-to-Table Redefined',
        description: 'Experience the finest organic ingredients in every cup and plate.',
        tags: ['Food', 'Organic', 'Cafe'],
        objective: 'Messaging', ctaLabel: 'Get Directions', ctaType: 'directions',
        likeCount: 3456, commentCount: 234, shareCount: 145,
        timestamp: '12h ago',
      ),
      FeedPost(
        id: '6', brandId: 'b6', brandName: 'Apex Fitness', brandAvatar: _imgs[5],
        isVerified: true, mediaUrl: _imgs[5], aspectRatio: 0.9,
        title: 'Transform Your Potential',
        description: 'Join the movement that is redefining what fitness means in the modern era.',
        tags: ['Fitness', 'Health', 'Wellness'],
        ctaLabel: 'Learn More', ctaType: 'learn',
        likeCount: 6120, commentCount: 378, shareCount: 189,
        timestamp: '1d ago', aiReason: 'Because you liked fitness brands',
      ),
      FeedPost(
        id: '7', brandId: 'b7', brandName: 'SoundWave', brandAvatar: _imgs[6],
        mediaUrl: _imgs[6], aspectRatio: 1.2,
        title: 'Immersive Audio Experience',
        description: 'Premium wireless headphones engineered for the audiophile in you.',
        tags: ['Audio', 'Tech', 'Premium'],
        objective: 'Awareness', ctaLabel: 'Shop Now', ctaType: 'shop',
        likeCount: 4532, commentCount: 201, shareCount: 156,
        timestamp: '1d ago',
      ),
      FeedPost(
        id: '8', brandId: 'b8', brandName: 'Vertex Labs', brandAvatar: _imgs[7],
        isVerified: true, mediaUrl: _imgs[7], aspectRatio: 1.0,
        title: 'The Future of Development',
        description: 'Building tools that empower the next generation of developers worldwide.',
        tags: ['Dev Tools', 'SaaS', 'Innovation'],
        ctaLabel: 'Sign Up', ctaType: 'signup',
        likeCount: 2109, commentCount: 156, shareCount: 98,
        timestamp: '2d ago', aiReason: 'Popular in Tech',
      ),
    ];
  }
}
