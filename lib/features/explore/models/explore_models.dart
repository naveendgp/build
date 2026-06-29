import 'package:flutter/material.dart';
import '../../home/models/feed_models.dart';
export '../../home/models/feed_models.dart' show FeedPost;

// Lyket Explore ✨ Data Models & Mock Data

// ━━━━━━━━━━━━━━━━ Search Suggestion Types ━━━━━━━━━━━━━━━━
enum SuggestionType { brand, category, trending, recent, ai }

class SearchSuggestion {
  final String id;
  final String text;
  final SuggestionType type;
  final String? subtitle;
  final String? imageUrl;

  const SearchSuggestion({
    required this.id,
    required this.text,
    required this.type,
    this.subtitle,
    this.imageUrl,
  });
}

// ━━━━━━━━━━━━━━━━ Explore Category ━━━━━━━━━━━━━━━━
class ExploreCategory {
  final String id;
  final String name;
  final IconData icon;
  final Color color;
  final int postCount;

  const ExploreCategory({
    required this.id,
    required this.name,
    required this.icon,
    required this.color,
    this.postCount = 0,
  });
}

// ━━━━━━━━━━━━━━━━ Explore Brand Profile ━━━━━━━━━━━━━━━━
class ExploreBrand {
  final String id;
  final String name;
  final String avatarUrl;
  final String coverUrl;
  final bool isVerified;
  final int followerCount;
  final String category;
  final bool isFollowing;

  const ExploreBrand({
    required this.id,
    required this.name,
    required this.avatarUrl,
    required this.coverUrl,
    this.isVerified = false,
    required this.followerCount,
    required this.category,
    this.isFollowing = false,
  });
}

// ━━━━━━━━━━━━━━━━ Offer / Campaign ━━━━━━━━━━━━━━━━
class ExploreOffer {
  final String id;
  final String brandName;
  final String title;
  final String description;
  final String mediaUrl;
  final String discount;
  final DateTime expiresAt;
  final String ctaLabel;

  const ExploreOffer({
    required this.id,
    required this.brandName,
    required this.title,
    required this.description,
    required this.mediaUrl,
    required this.discount,
    required this.expiresAt,
    this.ctaLabel = 'Shop Now',
  });
}

// ━━━━━━━━━━━━━━━━ Mock Data ━━━━━━━━━━━━━━━━
class MockExploreData {
  static const _unsplash = [
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

  static List<ExploreCategory> categories() => const [
    ExploreCategory(id: 'fashion', name: 'Fashion', icon: Icons.checkroom_rounded, color: Color(0xFFFF6B81), postCount: 2340),
    ExploreCategory(id: 'food', name: 'Food', icon: Icons.restaurant_rounded, color: Color(0xFFF59E0B), postCount: 1890),
    ExploreCategory(id: 'tech', name: 'Tech', icon: Icons.devices_rounded, color: Color(0xFF00C2FF), postCount: 3120),
    ExploreCategory(id: 'travel', name: 'Travel', icon: Icons.flight_rounded, color: Color(0xFF22C55E), postCount: 1560),
    ExploreCategory(id: 'beauty', name: 'Beauty', icon: Icons.spa_rounded, color: Color(0xFFE879F9), postCount: 2780),
    ExploreCategory(id: 'fitness', name: 'Fitness', icon: Icons.fitness_center_rounded, color: Color(0xFFFF0000), postCount: 1340),
    ExploreCategory(id: 'lifestyle', name: 'Lifestyle', icon: Icons.self_improvement_rounded, color: Color(0xFF818CF8), postCount: 4210),
    ExploreCategory(id: 'home', name: 'Home', icon: Icons.home_rounded, color: Color(0xFF2DD4BF), postCount: 980),
    ExploreCategory(id: 'luxury', name: 'Luxury', icon: Icons.diamond_rounded, color: Color(0xFFFBBF24), postCount: 670),
    ExploreCategory(id: 'auto', name: 'Automotive', icon: Icons.directions_car_rounded, color: Color(0xFF94A3B8), postCount: 890),
  ];

  static List<FeedPost> suggestedPosts() => [
    FeedPost(id: 's1', brandId: 'b1', title: 'The Art of Minimal Living', description: 'Sample', mediaUrl: _unsplash[0], brandName: 'Maison Noir', brandAvatar: _unsplash[0], isVerified: true, aiReason: 'Based on your likes', likeCount: 2847, aspectRatio: 1.3, timestamp: 'Just now'),
    FeedPost(id: 's2', brandId: 'b2', title: 'Summer Collection Drop', description: 'Sample', mediaUrl: _unsplash[1], brandName: 'Velvet Studio', brandAvatar: _unsplash[1], isVerified: true, likeCount: 5291, aspectRatio: 0.8, timestamp: '1h ago'),
    FeedPost(id: 's3', brandId: 'b3', title: 'AI-Powered Workspace', description: 'Sample', mediaUrl: _unsplash[2], brandName: 'Nexus Tech', brandAvatar: _unsplash[2], aiReason: 'Popular in Tech', likeCount: 1203, aspectRatio: 1.0, timestamp: '2h ago'),
    FeedPost(id: 's4', brandId: 'b4', title: 'Evening Elegance', description: 'Sample', mediaUrl: _unsplash[3], brandName: 'Aurelia', brandAvatar: _unsplash[3], likeCount: 8734, aspectRatio: 1.4, timestamp: '4h ago'),
    FeedPost(id: 's5', brandId: 'b5', title: 'Farm-to-Table Redefined', description: 'Sample', mediaUrl: _unsplash[4], brandName: 'Bloom Cafe', brandAvatar: _unsplash[4], likeCount: 3456, aspectRatio: 1.1, timestamp: '5h ago'),
    FeedPost(id: 's6', brandId: 'b6', title: 'Premium Audio Experience', description: 'Sample', mediaUrl: _unsplash[8], brandName: 'SoundWave', brandAvatar: _unsplash[8], aiReason: 'Trending near you', likeCount: 4532, aspectRatio: 1.2, timestamp: '1d ago'),
  ];

  static List<FeedPost> trendingPosts() => [
    FeedPost(id: 't1', brandId: 'b2', title: 'Sustainable Fashion Forward', description: 'Sample', mediaUrl: _unsplash[4], brandName: 'Velvet Studio', brandAvatar: _unsplash[4], isVerified: true, aiReason: 'Trending', likeCount: 12400, aspectRatio: 1.3, timestamp: '1h ago'),
    FeedPost(id: 't2', brandId: 'b7', title: 'Next-Gen Dev Tools', description: 'Sample', mediaUrl: _unsplash[9], brandName: 'Vertex Labs', brandAvatar: _unsplash[9], isVerified: true, likeCount: 8900, aspectRatio: 0.9, timestamp: '2h ago'),
    FeedPost(id: 't3', brandId: 'b8', title: 'Luxury Timepieces 2026', description: 'Sample', mediaUrl: _unsplash[5], brandName: 'Chronos', brandAvatar: _unsplash[5], likeCount: 15600, aspectRatio: 1.0, timestamp: '3h ago'),
    FeedPost(id: 't4', brandId: 'b9', title: 'Organic Beauty Secrets', description: 'Sample', mediaUrl: _unsplash[3], brandName: 'Glow Lab', brandAvatar: _unsplash[3], likeCount: 7200, aspectRatio: 1.4, timestamp: '5h ago'),
    FeedPost(id: 't5', brandId: 'b10', title: 'Urban Architecture', description: 'Sample', mediaUrl: _unsplash[6], brandName: 'Modernist', brandAvatar: _unsplash[6], aiReason: 'Trending', likeCount: 9800, aspectRatio: 0.75, timestamp: '1d ago'),
    FeedPost(id: 't6', brandId: 'b6', title: 'Fitness Revolution', description: 'Sample', mediaUrl: _unsplash[7], brandName: 'Apex Fitness', brandAvatar: _unsplash[7], likeCount: 6100, aspectRatio: 1.1, timestamp: '1d ago'),
    FeedPost(id: 't7', brandId: 'b5', title: 'Artisan Coffee Culture', description: 'Sample', mediaUrl: _unsplash[1], brandName: 'Bloom Cafe', brandAvatar: _unsplash[1], likeCount: 4300, aspectRatio: 1.2, timestamp: '2d ago'),
    FeedPost(id: 't8', brandId: 'b3', title: 'Smart Home Living', description: 'Sample', mediaUrl: _unsplash[2], brandName: 'Nexus Tech', brandAvatar: _unsplash[2], isVerified: true, likeCount: 11200, aspectRatio: 0.85, timestamp: '2d ago'),
  ];

  static List<ExploreBrand> brands() => [
    ExploreBrand(id: 'b1', name: 'Maison Noir', avatarUrl: _unsplash[0], coverUrl: _unsplash[0], isVerified: true, followerCount: 248000, category: 'Lifestyle'),
    ExploreBrand(id: 'b2', name: 'Velvet Studio', avatarUrl: _unsplash[1], coverUrl: _unsplash[4], isVerified: true, followerCount: 182000, category: 'Fashion'),
    ExploreBrand(id: 'b3', name: 'Nexus Tech', avatarUrl: _unsplash[2], coverUrl: _unsplash[9], isVerified: true, followerCount: 534000, category: 'Tech'),
    ExploreBrand(id: 'b4', name: 'Aurelia', avatarUrl: _unsplash[3], coverUrl: _unsplash[3], followerCount: 97000, category: 'Luxury'),
    ExploreBrand(id: 'b5', name: 'Bloom Cafe', avatarUrl: _unsplash[4], coverUrl: _unsplash[1], followerCount: 63000, category: 'Food'),
    ExploreBrand(id: 'b6', name: 'Apex Fitness', avatarUrl: _unsplash[5], coverUrl: _unsplash[7], isVerified: true, followerCount: 321000, category: 'Fitness'),
  ];



  static List<SearchSuggestion> searchSuggestions() => const [
    SearchSuggestion(id: 'sg1', text: 'Maison Noir', type: SuggestionType.brand, subtitle: 'Lifestyle'),
    SearchSuggestion(id: 'sg2', text: 'Velvet Studio', type: SuggestionType.brand, subtitle: 'Fashion'),
    SearchSuggestion(id: 'sg3', text: 'Fashion', type: SuggestionType.category),
    SearchSuggestion(id: 'sg4', text: 'Technology', type: SuggestionType.category),
    SearchSuggestion(id: 'sg5', text: 'summer collection 2026', type: SuggestionType.trending),
    SearchSuggestion(id: 'sg6', text: 'sustainable fashion', type: SuggestionType.trending),
    SearchSuggestion(id: 'sg7', text: 'minimal lifestyle', type: SuggestionType.recent),
    SearchSuggestion(id: 'sg8', text: 'luxury watches', type: SuggestionType.recent),
    SearchSuggestion(id: 'sg9', text: 'You might like organic beauty', type: SuggestionType.ai),
    SearchSuggestion(id: 'sg10', text: 'Explore tech startups', type: SuggestionType.ai),
  ];
}
