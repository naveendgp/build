import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_spacing.dart';
import '../models/dashboard_models.dart';

class DashboardCharts extends StatelessWidget {
  final DashboardChartsData data;

  const DashboardCharts({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Performance Overview',
          style: AppTypography.titleLarge.copyWith(
            color: context.colors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        _buildReachChart(context),
        const SizedBox(height: AppSpacing.xl),
        _buildTrafficDonut(context),
      ],
    ).animate().fadeIn(duration: 500.ms, delay: 200.ms).slideY(begin: 0.05, end: 0);
  }

  Widget _buildReachChart(BuildContext context) {
    return Container(
      height: 300,
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: context.colors.surfaceSecondary,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.colors.borderLight.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Reach Trend',
            style: AppTypography.titleMedium.copyWith(
              color: context.colors.textPrimary,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          Expanded(
            child: LineChart(
              LineChartData(
                minY: 0,
                maxY: _calculateMaxY(data.reachTrend),
                clipData: const FlClipData.all(),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (value) => FlLine(
                    color: context.colors.borderLight.withOpacity(0.1),
                    strokeWidth: 1,
                    dashArray: [5, 5],
                  ),
                ),
                titlesData: FlTitlesData(
                  show: true,
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 28,
                      interval: _calculateXInterval(data.reachTrend.length),
                      getTitlesWidget: (value, meta) {
                        final idx = value.toInt();
                        if (idx < 0 || idx >= data.reachTrend.length) return const SizedBox.shrink();
                        final dateStr = data.reachTrend[idx].date;
                        final dateParts = dateStr.split('-');
                        final formatted = dateParts.length == 3 ? '${dateParts[2]}/${dateParts[1]}' : dateStr;
                        return Padding(
                          padding: const EdgeInsets.only(top: 6.0),
                          child: Text(
                            formatted,
                            style: AppTypography.labelSmall.copyWith(
                              color: context.colors.textSecondary,
                              fontSize: 9,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 48,
                      interval: _calculateYInterval(data.reachTrend),
                      getTitlesWidget: (value, meta) {
                        // Skip the very top and bottom labels to avoid overlap
                        if (value == meta.min || value == meta.max) return const SizedBox.shrink();
                        return Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: Text(
                            _formatNumber(value.toInt()),
                            style: AppTypography.labelSmall.copyWith(
                              color: context.colors.textSecondary,
                              fontSize: 9,
                            ),
                            textAlign: TextAlign.right,
                          ),
                        );
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: data.reachTrend.isEmpty 
                      ? [const FlSpot(0, 0)] 
                      : data.reachTrend.asMap().entries.map((e) {
                          return FlSpot(e.key.toDouble(), e.value.value.toDouble());
                        }).toList(),
                    isCurved: true,
                    color: context.colors.primaryAccent,
                    barWidth: 3,
                    isStrokeCapRound: true,
                    dotData: const FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        colors: [
                          context.colors.primaryAccent.withOpacity(0.3),
                          context.colors.primaryAccent.withOpacity(0.0),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTrafficDonut(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: context.colors.surfaceSecondary,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.colors.borderLight.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Traffic Sources',
            style: AppTypography.titleMedium.copyWith(
              color: context.colors.textPrimary,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              SizedBox(
                height: 160,
                width: 160,
                child: PieChart(
                  PieChartData(
                    sectionsSpace: 2,
                    centerSpaceRadius: 50,
                    sections: _getDonutSections(context),
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.xl),
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: data.trafficSources.asMap().entries.map((e) {
                    final color = _getColorForIndex(context, e.key);
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8.0),
                      child: Row(
                        children: [
                          Container(
                            width: 12,
                            height: 12,
                            decoration: BoxDecoration(
                              color: color,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              e.value.source,
                              style: AppTypography.bodySmall.copyWith(color: context.colors.textSecondary),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Text(
                            '${e.value.percentage.toInt()}%',
                            style: AppTypography.labelLarge.copyWith(
                              color: context.colors.textPrimary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  List<PieChartSectionData> _getDonutSections(BuildContext context) {
    return data.trafficSources.asMap().entries.map((e) {
      final color = _getColorForIndex(context, e.key);
      return PieChartSectionData(
        color: color,
        value: e.value.percentage,
        title: '',
        radius: 20,
      );
    }).toList();
  }

  Color _getColorForIndex(BuildContext context, int index) {
    final colors = [
      context.colors.primaryAccent,
      context.colors.secondaryAccent,
      const Color(0xFF10B981), // Green
      const Color(0xFFF59E0B), // Amber
    ];
    return colors[index % colors.length];
  }

  String _formatNumber(int number) {
    if (number >= 1000000) return '${(number / 1000000).toStringAsFixed(1)}M';
    if (number >= 1000) return '${(number / 1000).toStringAsFixed(1)}k';
    return number.toString();
  }

  double _calculateYInterval(List<TimeSeriesData> data) {
    if (data.isEmpty) return 1;
    final maxVal = data.map((e) => e.value).reduce((a, b) => a > b ? a : b);
    if (maxVal <= 0) return 1;
    if (maxVal <= 5) return 1;
    if (maxVal <= 25) return 5;
    if (maxVal <= 50) return 10;
    if (maxVal <= 100) return 20;
    if (maxVal <= 250) return 50;
    if (maxVal <= 500) return 100;
    if (maxVal <= 1000) return 200;
    if (maxVal <= 2500) return 500;
    if (maxVal <= 5000) return 1000;
    if (maxVal <= 10000) return 2000;
    if (maxVal <= 25000) return 5000;
    return (maxVal / 5).roundToDouble();
  }

  double _calculateMaxY(List<TimeSeriesData> data) {
    if (data.isEmpty) return 10;
    final maxVal = data.map((e) => e.value).reduce((a, b) => a > b ? a : b);
    if (maxVal <= 0) return 10; // all zeros — show a clean empty chart up to 10
    final interval = _calculateYInterval(data);
    return (maxVal / interval).ceilToDouble() * interval;
  }

  /// Returns an X-axis interval that targets ~5 visible date labels.
  double _calculateXInterval(int length) {
    if (length <= 1) return 1;
    if (length <= 5) return 1;
    if (length <= 10) return 2;
    if (length <= 15) return 3;
    if (length <= 20) return 4;
    if (length <= 30) return 6;
    if (length <= 60) return 12;
    if (length <= 90) return 18;
    return (length / 5).ceilToDouble();
  }
}

