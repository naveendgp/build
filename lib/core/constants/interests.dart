/// The lists behind Settings → Preferences, matching the web app's
/// `src/lib/interests.ts` so a person sees the same choices on both.

/// Personal interests. Up to [maxInterests] of these, and they show on the
/// profile.
const personalTags = <String>[
  'Tech',
  'Fashion',
  'Food',
  'Travel',
  'Fitness',
  'Art',
  'Music',
  'Sports',
  'Gaming',
  'Photography',
  'Books',
  'Movies',
  'Nature',
  'DIY',
  'Pets',
  'Beauty',
  'Health',
  'Education',
  'Finance',
  'Automotive',
];

/// Business categories to follow. Any number, saved alongside the interests.
const brandCategories = <String>[
  'Fashion & Apparel',
  'Electronics & Gadgets',
  'Food & Beverage',
  'Health & Wellness',
  'Beauty & Personal Care',
  'Home & Living',
  'Education & Learning',
  'Travel & Tourism',
  'Real Estate',
  'Automotive',
  'Sports & Outdoors',
  'Entertainment',
  'Finance & Banking',
  'Technology & Software',
  'Art & Design',
];

const maxInterests = 5;

/// Only the personal interests from a saved list, with the categories left
/// out — what the profile shows.
List<String> interestsOnly(List<String>? tags) =>
    (tags ?? const []).where(personalTags.contains).take(maxInterests).toList();
