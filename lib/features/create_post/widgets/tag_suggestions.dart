/// Curated tag suggestions, grouped by the brand's own business category
/// (set during brand signup) so the chips shown while adding tags stay
/// relevant to what the brand and post are actually about.
class TagSuggestions {
  TagSuggestions._();

  // Keys match the business category labels used during brand signup
  // (see lib/features/auth/widgets/category_selector.dart), lower-cased.
  static const Map<String, List<String>> byCategory = {
    'fashion & apparel': ['fashion', 'style', 'ootd', 'outfitinspo', 'streetwear', 'newcollection', 'fashionista', 'trendy'],
    'technology': ['tech', 'technology', 'innovation', 'gadgets', 'startup', 'ai', 'software', 'techtrends'],
    'food & beverage': ['food', 'foodie', 'recipe', 'tasty', 'foodporn', 'homemade', 'delicious', 'cooking'],
    'health & wellness': ['wellness', 'fitness', 'workout', 'healthylifestyle', 'selfcare', 'mindfulness', 'nutrition', 'fitfam'],
    'education': ['education', 'learning', 'tips', 'knowledge', 'tutorial', 'study', 'skills', 'growth'],
    'entertainment': ['entertainment', 'music', 'movies', 'gaming', 'fun', 'event', 'liveshow', 'mustwatch'],
    'real estate': ['realestate', 'property', 'homesweethome', 'interiordesign', 'newlisting', 'dreamhome', 'investment', 'realty'],
    'automotive': ['automotive', 'cars', 'carsofinstagram', 'autonews', 'driving', 'vehicle', 'newmodel', 'roadtrip'],
    'finance': ['finance', 'investing', 'money', 'fintech', 'savings', 'financialfreedom', 'business', 'wealth'],
    'retail': ['retail', 'shopping', 'sale', 'newarrival', 'musthave', 'shoplocal', 'deals', 'storefront'],
  };

  /// Generic fallback used regardless of category, and when no category is
  /// recognized yet.
  static const List<String> general = [
    'new', 'launch', 'sale', 'offer', 'trending', 'mustsee', 'exclusive', 'limitededition',
    'discount', 'giveaway', 'promo', 'special', 'best', 'top', 'favorite', 'deal', 'comingsoon',
    'shopping', 'onlineshopping', 'lifestyle', 'brand', 'marketing', 'business', 'growth',
  ];

  /// Suggestions relevant to the brand's [categoryId] (its business category,
  /// pulled from the brand's profile), excluding anything already in
  /// [existingTags] and filtered by [query] (prefix/substring match).
  static List<String> forQuery({
    String? categoryId,
    required List<String> existingTags,
    String query = '',
  }) {
    final key = categoryId?.trim().toLowerCase();
    final pool = <String>{
      ...(key != null ? byCategory[key] ?? const [] : const []),
      ...general,
    };

    final existing = existingTags.map((t) => t.toLowerCase()).toSet();
    final q = query.trim().toLowerCase();

    final filtered = pool.where((tag) {
      if (existing.contains(tag)) return false;
      if (q.isEmpty) return true;
      return tag.contains(q);
    }).toList();

    // Prioritize tags that start with the query.
    filtered.sort((a, b) {
      if (q.isNotEmpty) {
        final aStarts = a.startsWith(q);
        final bStarts = b.startsWith(q);
        if (aStarts != bStarts) return aStarts ? -1 : 1;
      }
      return a.compareTo(b);
    });

    return filtered.take(8).toList();
  }
}
