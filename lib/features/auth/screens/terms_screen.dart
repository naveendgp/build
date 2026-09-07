import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';

enum TermsType { brand, user }

class TermsScreen extends StatelessWidget {
  final TermsType type;
  const TermsScreen({super.key, required this.type});

  @override
  Widget build(BuildContext context) {
    final sections = type == TermsType.brand ? _brandSections : _userSections;
    final title = type == TermsType.brand
        ? 'Brand Terms & Conditions'
        : 'User Terms & Conditions';

    return Scaffold(
      backgroundColor: context.colors.background,
      appBar: AppBar(
        backgroundColor: context.colors.background,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded,
              color: context.colors.textPrimary, size: 20),
          onPressed: () => context.pop(),
        ),
        title: Text(title,
            style: AppTypography.titleMedium.copyWith(
                color: context.colors.textPrimary,
                fontWeight: FontWeight.bold)),
      ),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: context.colors.primaryAccent.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                      color:
                          context.colors.primaryAccent.withValues(alpha: 0.2)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline_rounded,
                        color: context.colors.primaryAccent, size: 18),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Please read these terms carefully before creating your account.',
                        style: AppTypography.bodySmall.copyWith(
                            color: context.colors.primaryAccent, height: 1.4),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 40),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, i) {
                  if (i < sections.length) {
                    return _SectionCard(
                        section: sections[i], index: i + 1);
                  }
                  return _AcknowledgementCard(type: type);
                },
                childCount: sections.length + 1,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionCard extends StatefulWidget {
  final _TermsSection section;
  final int index;
  const _SectionCard({required this.section, required this.index});

  @override
  State<_SectionCard> createState() => _SectionCardState();
}

class _SectionCardState extends State<_SectionCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: context.colors.surfaceSecondary,
        borderRadius: BorderRadius.circular(14),
        clipBehavior: Clip.hardEdge,
        child: InkWell(
          onTap: () => setState(() => _expanded = !_expanded),
          child: Column(
            children: [
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                child: Row(
                  children: [
                    Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        color: context.colors.primaryAccent
                            .withValues(alpha: 0.12),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          '${widget.index}',
                          style: AppTypography.labelSmall.copyWith(
                              color: context.colors.primaryAccent,
                              fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        widget.section.title,
                        style: AppTypography.bodyMedium.copyWith(
                            color: context.colors.textPrimary,
                            fontWeight: FontWeight.w600),
                      ),
                    ),
                    Icon(
                      _expanded
                          ? Icons.keyboard_arrow_up_rounded
                          : Icons.keyboard_arrow_down_rounded,
                      color: context.colors.textTertiary,
                      size: 20,
                    ),
                  ],
                ),
              ),
              if (_expanded)
                Container(
                  width: double.infinity,
                  padding:
                      const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Divider(
                          color: context.colors.borderLight
                              .withValues(alpha: 0.3),
                          height: 1),
                      const SizedBox(height: 12),
                      if (widget.section.body != null)
                        Text(
                          widget.section.body!,
                          style: AppTypography.bodySmall.copyWith(
                              color: context.colors.textSecondary,
                              height: 1.6),
                        ),
                      if (widget.section.bullets != null) ...[
                        if (widget.section.body != null)
                          const SizedBox(height: 8),
                        ...widget.section.bullets!
                            .map((b) => _BulletItem(text: b)),
                      ],
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BulletItem extends StatelessWidget {
  final String text;
  const _BulletItem({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Container(
              width: 5,
              height: 5,
              decoration: BoxDecoration(
                  color: context.colors.primaryAccent, shape: BoxShape.circle),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(text,
                style: AppTypography.bodySmall.copyWith(
                    color: context.colors.textSecondary, height: 1.5)),
          ),
        ],
      ),
    );
  }
}

class _AcknowledgementCard extends StatelessWidget {
  final TermsType type;
  const _AcknowledgementCard({required this.type});

  @override
  Widget build(BuildContext context) {
    final text = type == TermsType.brand
        ? 'By registering a brand account, you acknowledge that you have read, understood, and agree to be bound by these Brand Terms & Conditions.'
        : 'By creating an account or using the Platform, you acknowledge that you have read, understood, and agree to these User Terms & Conditions, the Privacy Policy, and all other applicable Platform policies.';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.colors.surfaceSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
            color: context.colors.primaryAccent.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.verified_outlined,
                  color: context.colors.primaryAccent, size: 18),
              const SizedBox(width: 8),
              Text(
                'Acceptance',
                style: AppTypography.labelLarge.copyWith(
                    color: context.colors.primaryAccent,
                    fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(text,
              style: AppTypography.bodySmall.copyWith(
                  color: context.colors.textSecondary, height: 1.6)),
        ],
      ),
    );
  }
}

class _TermsSection {
  final String title;
  final String? body;
  final List<String>? bullets;
  const _TermsSection({required this.title, this.body, this.bullets});
}

const _brandSections = [
  _TermsSection(
    title: 'Eligibility',
    body:
        'You must be at least 18 years old and legally authorized to represent the business registering on the Platform. You are responsible for ensuring that all information provided during registration is accurate and up to date.',
  ),
  _TermsSection(
    title: 'Business Verification',
    body:
        'The Platform may require verification documents, including but not limited to GST registration, business registration certificates, government-issued identification, address proof, or any other documents deemed necessary. Failure to provide requested information may result in rejection, suspension, or termination of your account.',
  ),
  _TermsSection(
    title: 'Accurate Information',
    body:
        'You agree to provide truthful, complete, and accurate information regarding your business, products, services, pricing, offers, and contact details. Misrepresentation is strictly prohibited.',
  ),
  _TermsSection(
    title: 'Advertising Standards',
    body: 'All advertisements and promotional content must be lawful, truthful, and not misleading. You must not:',
    bullets: [
      'Make false or exaggerated claims.',
      'Advertise fake discounts or misleading offers.',
      'Misrepresent pricing, availability, or product features.',
      'Use deceptive marketing practices.',
    ],
  ),
  _TermsSection(
    title: 'Prohibited Content',
    body: 'You may not promote or publish content relating to:',
    bullets: [
      'Illegal products or services.',
      'Counterfeit or stolen goods.',
      'Fraudulent schemes or scams.',
      'Adult or sexually explicit content.',
      'Hate speech, violence, or discriminatory content.',
      'Content that infringes intellectual property rights.',
      'Any product or service prohibited by applicable law.',
    ],
  ),
  _TermsSection(
    title: 'Intellectual Property',
    body:
        'You confirm that you own or have obtained all necessary rights, licenses, and permissions to use any content uploaded to the Platform, including logos, trademarks, images, videos, text, and other materials. You agree to indemnify the Platform against any claims arising from intellectual property infringement.',
  ),
  _TermsSection(
    title: 'Customer Responsibility',
    body: 'You are solely responsible for:',
    bullets: [
      'Product or service quality.',
      'Pricing and promotional offers.',
      'Customer communication.',
      'Order fulfillment.',
      'Returns, refunds, warranties, and after-sales support.',
      'Compliance with applicable consumer protection laws.',
    ],
  ),
  _TermsSection(
    title: 'Customer Data',
    body:
        'Any customer information obtained through the Platform must be used solely for legitimate business purposes. You must not sell, misuse, disclose, or share customer data without proper authorization or legal basis.',
  ),
  _TermsSection(
    title: 'Reviews and Ratings',
    body: 'You must not:',
    bullets: [
      'Purchase or generate fake reviews.',
      'Manipulate ratings.',
      'Threaten or intimidate customers regarding reviews.',
      'Post misleading testimonials.',
    ],
  ),
  _TermsSection(
    title: 'Fraud and Abuse',
    body: 'You agree not to engage in activities including but not limited to:',
    bullets: [
      'Fake orders or leads.',
      'Fake clicks or traffic.',
      'Spam messaging.',
      'Account impersonation.',
      'Payment fraud.',
      'Any attempt to manipulate Platform metrics or algorithms.',
    ],
  ),
  _TermsSection(
    title: 'Platform Rights',
    body: 'The Platform reserves the right to:',
    bullets: [
      'Verify business information at any time.',
      'Reject, edit, suspend, or remove any advertisement or content.',
      'Suspend or permanently terminate accounts violating these Terms.',
      'Restrict access to Platform features.',
      'Cooperate with law enforcement authorities where required by law.',
    ],
  ),
  _TermsSection(
    title: 'Account Security',
    body:
        'You are responsible for maintaining the confidentiality of your login credentials and for all activities conducted through your account. You must notify the Platform immediately of any unauthorized use.',
  ),
  _TermsSection(
    title: 'Payments',
    body:
        'Where applicable, all Platform fees are payable as specified. Failure to make payment may result in suspension of services. Unless otherwise stated or required by law, fees paid are non-refundable.',
  ),
  _TermsSection(
    title: 'Limitation of Liability',
    body:
        'The Platform acts solely as a marketing and promotional platform. The Platform does not guarantee sales, leads, conversions, revenue, or business performance. The Platform shall not be liable for any direct, indirect, incidental, or consequential damages arising from your use of the Platform.',
  ),
  _TermsSection(
    title: 'Indemnification',
    body:
        'You agree to indemnify and hold harmless the Platform, its owners, employees, affiliates, and partners from any claims, losses, liabilities, damages, costs, or legal expenses arising from your advertisements or content, your products or services, your violation of these Terms, or your violation of any applicable law or third-party rights.',
  ),
  _TermsSection(
    title: 'Suspension and Termination',
    body:
        'The Platform may suspend or permanently terminate your account without prior notice if you provide false information, engage in fraudulent or illegal activity, receive repeated verified customer complaints, violate these Terms or Platform policies, or pose a security or reputational risk to the Platform or its users.',
  ),
  _TermsSection(
    title: 'Changes to the Terms',
    body:
        'The Platform may modify these Terms at any time. Continued use of the Platform after updated Terms are published constitutes acceptance of those changes.',
  ),
  _TermsSection(
    title: 'Governing Law',
    body:
        'These Terms shall be governed by and interpreted in accordance with the laws of the jurisdiction in which the Platform operates. Any disputes shall be subject to the exclusive jurisdiction of the competent courts in that jurisdiction.',
  ),
];

const _userSections = [
  _TermsSection(
    title: 'Eligibility',
    body:
        'You must be at least 18 years old, or the minimum legal age required in your jurisdiction, to create an account or use the Platform. By registering, you confirm that the information you provide is accurate and complete.',
  ),
  _TermsSection(
    title: 'User Account',
    body: 'You are responsible for maintaining the security of your account and login credentials. You must not:',
    bullets: [
      'Share your account with others.',
      'Create multiple accounts to bypass Platform restrictions.',
      'Impersonate another person or business.',
      'Provide false or misleading information.',
    ],
  ),
  _TermsSection(
    title: 'Acceptable Use',
    body: 'You agree to use the Platform only for lawful purposes. You must not:',
    bullets: [
      'Violate any applicable law or regulation.',
      'Interfere with the operation or security of the Platform.',
      'Attempt to gain unauthorized access to any account or system.',
      'Upload viruses, malware, or harmful code.',
      'Use automated tools, bots, or scripts without permission.',
      'Collect or misuse another user\'s personal information.',
    ],
  ),
  _TermsSection(
    title: 'Marketing Content',
    body:
        'The Platform displays advertisements, promotions, and marketing content created by registered Brands. The Platform does not guarantee the accuracy, quality, legality, availability, or performance of any product or service promoted by a Brand. Users should exercise their own judgment before making any purchase or engaging with any Brand.',
  ),
  _TermsSection(
    title: 'User Responsibility',
    body: 'You are responsible for:',
    bullets: [
      'Evaluating products and services before making a purchase.',
      'Verifying prices, offers, and promotions directly with the Brand where necessary.',
      'Keeping your account information up to date.',
    ],
  ),
  _TermsSection(
    title: 'Messaging',
    body: 'If you contact a Brand through the Platform, you agree to communicate respectfully and lawfully. You must not:',
    bullets: [
      'Send spam or unsolicited messages.',
      'Harass, threaten, or abuse other users or Brands.',
      'Share illegal, offensive, or harmful content.',
    ],
  ),
  _TermsSection(
    title: 'Reviews and Ratings',
    body:
        'If the Platform allows reviews or ratings, you agree that your feedback will be honest and based on your genuine experience, will not contain false, defamatory, abusive, or misleading information, and will not be used to threaten or extort a Brand. The Platform may remove reviews that violate these Terms.',
  ),
  _TermsSection(
    title: 'Saved Content',
    body:
        'The Platform may allow you to save advertisements, collections, or follow Brands. Saved content may be removed if the Brand deletes it or if it violates Platform policies.',
  ),
  _TermsSection(
    title: 'Privacy',
    body:
        'Your personal information will be handled in accordance with the Platform\'s Privacy Policy. By using the Platform, you consent to the collection, use, and processing of your information as described in that policy.',
  ),
  _TermsSection(
    title: 'Intellectual Property',
    body:
        'All Platform content, including logos, trademarks, software, designs, and features, belongs to the Platform or its licensors unless otherwise stated. You may not copy, modify, distribute, reproduce, or exploit any Platform content without prior written permission.',
  ),
  _TermsSection(
    title: 'Prohibited Activities',
    body: 'You must not:',
    bullets: [
      'Create fake accounts.',
      'Submit false reports or complaints.',
      'Manipulate reviews or ratings.',
      'Attempt to deceive Brands or other users.',
      'Use the Platform for fraudulent or illegal purposes.',
      'Infringe the intellectual property rights of others.',
    ],
  ),
  _TermsSection(
    title: 'Platform Administration',
    body:
        'The Platform reserves the right to access and manage user accounts where reasonably necessary, review reports and account activity, remove content that violates these Terms, restrict or disable access to features, and suspend or permanently terminate accounts for violations. Such actions may be taken without prior notice where necessary to protect the Platform, its users, or comply with legal obligations.',
  ),
  _TermsSection(
    title: 'Third-Party Transactions',
    body:
        'Any purchase, booking, inquiry, or transaction made with a Brand is solely between you and the Brand. The Platform is not a party to such transactions and is not responsible for product quality, service quality, delivery, returns or refunds, warranties, customer support, or disputes between users and Brands.',
  ),
  _TermsSection(
    title: 'Disclaimer',
    body:
        'The Platform is provided on an "as is" and "as available" basis. The Platform does not guarantee the accuracy of Brand advertisements, product availability, business performance, user satisfaction, or continuous Platform availability.',
  ),
  _TermsSection(
    title: 'Limitation of Liability',
    body:
        'To the maximum extent permitted by law, the Platform shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from your use of the Platform, your interactions with Brands, purchases or transactions with Brands, or errors, interruptions, or technical issues.',
  ),
  _TermsSection(
    title: 'Suspension and Termination',
    body:
        'The Platform may suspend or permanently terminate your account if you violate these Terms, engage in fraudulent, abusive, or illegal activities, misuse Platform features, or pose a security risk to the Platform or other users.',
  ),
  _TermsSection(
    title: 'Changes to These Terms',
    body:
        'The Platform may update these Terms & Conditions from time to time. Continued use of the Platform after updated Terms are published constitutes your acceptance of the revised Terms.',
  ),
  _TermsSection(
    title: 'Contact',
    body:
        'If you have any questions regarding these Terms, you may contact the Platform through the official support channels provided within the Platform.',
  ),
];
