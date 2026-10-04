/// Brand categories and their subcategories.
///
/// The same taxonomy the web uses (`src/lib/brandCategories.ts`), which brand
/// signup and Settings > Brand details both read. This app had its own
/// eleven-entry list in the signup screen — Technology, Entertainment, Finance
/// and so on — so a category chosen on Android was not one the web offers.
const brandCategoryTree = <String, List<String>>{
  'Retail & Shopping': [
    'Fashion & Apparel',
    'Footwear',
    'Accessories & Jewelry',
    'Cosmetics & Beauty',
    'Eyewear',
    'Electronics & Gadgets',
    'Home Décor & Furnishings',
    'Furniture & Interiors',
    'Stationery & Gifts',
    'Books & Media',
  ],
  'Food & Beverages': [
    'Restaurants & Cafes',
    'Cloud Kitchens',
    'Bakeries & Dessert Shops',
    'Organic & Health Foods',
    'Packaged Foods & Snacks',
    'Beverage Brands (Juices, Coffee, etc.)',
    'Catering Services',
  ],
  'Health & Wellness': [
    'Gyms & Fitness Studios',
    'Yoga & Meditation Centers',
    'Nutrition & Supplements',
    'Skincare & Beauty Clinics',
    'Mental Health & Counseling',
    'Ayurveda & Homeopathy',
  ],
  'Education & Learning': [
    'Schools & Colleges',
    'Coaching Institutes',
    'Online Learning Platforms',
    'Language Training',
    'Skill Development & Workshops',
    'Career Counseling',
  ],
  'Travel & Hospitality': [
    'Hotels & Resorts',
    'Travel Agencies',
    'Adventure & Trekking Tours',
    'Homestays & Rentals',
    'Visa & Passport Services',
  ],
  'Professional & Business Services': [
    'Marketing Agencies',
    'Event Planners',
    'Legal & Financial Services',
    'Architects & Interior Designers',
    'Photography & Videography',
    'Printing & Branding Services',
  ],
  'Automobiles': [
    'Car & Bike Dealers',
    'Auto Accessories',
    'Car Wash & Detailing',
    'Rentals & Ride Services',
    'EV & Sustainable Vehicles',
  ],
  'Real Estate': [
    'Residential Properties',
    'Commercial Spaces',
    'Real Estate Agents',
    'Property Management',
    'Construction & Renovation',
  ],
  'Art, Craft & Culture': [
    'Handmade Crafts',
    'Art Galleries',
    'Art & Craft Supplies',
    'Cultural Events & Shows',
    'Photography Artisans',
  ],
  'Kids & Parenting': [
    'Baby Products',
    'Kids Apparel & Toys',
    'Activity Centers',
    'Playschools & Daycares',
    'Parenting Services',
  ],
  'Pets': [
    'Pet Supplies',
    'Pet Grooming',
    'Veterinary Clinics',
    'Pet Training',
    'Adoption Services',
  ],
  'Local Services': [
    'Plumbing & Electrical',
    'Home Cleaning',
    'Repair Services',
    'Appliance Services',
    'Tailoring & Laundry',
  ],
  'Spiritual & Religious': [
    'Temples & Trusts',
    'Spiritual Retreats',
    'Astrology & Horoscope',
    'Puja Services',
    'Bookstores & Religious Items',
  ],
  'Tech & Startups': [
    'SaaS & Apps',
    'Freelancers & Consultants',
    'Web & App Development',
    'Digital Tools',
    'IT Services',
  ],
  'Others': [
    'Enter your Business Category',
  ],
};

/// The categories, in the order the web lists them.
List<String> get brandCategoryNames => brandCategoryTree.keys.toList();

/// What sits under a category, or nothing when it is not one of ours.
List<String> subCategoriesOf(String? category) =>
    category == null ? const [] : (brandCategoryTree[category] ?? const []);

/// "Others" is the brand's own words rather than a list to pick from.
const otherBrandCategory = 'Others';
