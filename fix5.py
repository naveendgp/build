import os

def main():
    # 1. brand_analytics_section.dart
    path = 'lib/features/brand_profile/widgets/brand_analytics_section.dart'
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            c = f.read()
        c = c.replace("_buildStatCard('Impressions'", "_buildStatCard(context, 'Impressions'")
        c = c.replace("_buildStatCard('Engagement'", "_buildStatCard(context, 'Engagement'")
        c = c.replace("_buildStatCard('Saves'", "_buildStatCard(context, 'Saves'")
        c = c.replace("_buildStatCard('CTR'", "_buildStatCard(context, 'CTR'")
        c = c.replace("_buildAudienceChart()", "_buildAudienceChart(context)")
        c = c.replace("_buildLegendItem('18-24'", "_buildLegendItem(context, '18-24'")
        c = c.replace("_buildLegendItem('25-34'", "_buildLegendItem(context, '25-34'")
        c = c.replace("_buildLegendItem('35-44'", "_buildLegendItem(context, '35-44'")
        c = c.replace("Widget _buildLegendItem(String label, Color color, String percentage)", "Widget _buildLegendItem(BuildContext context, String label, Color color, String percentage)")
        with open(path, 'w', encoding='utf-8') as f:
            f.write(c)

    # 2. brand_hero_header.dart
    path = 'lib/features/brand_profile/widgets/brand_hero_header.dart'
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            c = f.read()
        c = c.replace("_buildStatsRow()", "_buildStatsRow(context)")
        c = c.replace("_buildStatItem('Followers'", "_buildStatItem(context, 'Followers'")
        c = c.replace("_buildStatItem('Posts'", "_buildStatItem(context, 'Posts'")
        c = c.replace("_buildVerticalDivider()", "_buildVerticalDivider(context)")
        with open(path, 'w', encoding='utf-8') as f:
            f.write(c)

if __name__ == '__main__':
    main()
