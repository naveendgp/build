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
      ],
    ).animate().fadeIn(duration: 500.ms, delay: 200.ms).slideY(begin: 0.05, end: 0);
  }

  Widget _buildReachChart(BuildContext context) {
    final trend = data.reachTrend;
    final total = trend.fold<int>(0, (sum, e) => sum + e.value);
    final hasData = trend.isNotEmpty && total > 0;

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
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
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
                    if (hasData) ...[
                      const SizedBox(height: 2),
                      Text(
                        '${_formatNumber(total)} total this period',
                        style: AppTypography.labelSmall.copyWith(
                          color: context.colors.textSecondary,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Expanded(child: hasData ? _buildLineChart(context, trend) : _buildEmptyState(context)),
        ],
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.show_chart_rounded,
            size: 32,
            color: context.colors.textTertiary.withOpacity(0.5),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'No reach data yet for this period',
            style: AppTypography.bodySmall.copyWith(color: context.colors.textSecondary),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildLineChart(BuildContext context, List<TimeSeriesData> trend) {
    return LineChart(
      LineChartData(
        minY: 0,
        maxY: _calculateMaxY(trend),
        clipData: const FlClipData.all(),
        gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          getDrawingHorizontalLine: (value) => FlLine(
            color: context.colors.borderLight.withOpacity(0.15),
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
              reservedSize: 30,
              interval: _calculateXInterval(trend.length),
              getTitlesWidget: (value, meta) {
                final idx = value.toInt();
                if (idx < 0 || idx >= trend.length) return const SizedBox.shrink();
                final dateStr = trend[idx].date;
                final dateParts = dateStr.split('-');
                final formatted = dateParts.length == 3
                    ? '${dateParts[2]}/${dateParts[1]}'
                    : dateStr;
                return Padding(
                  padding: const EdgeInsets.only(top: 8.0),
                  child: Text(
                    formatted,
                    style: AppTypography.labelSmall.copyWith(
                      color: context.colors.textSecondary,
                      fontSize: 10,
                    ),
                  ),
                );
              },
            ),
          ),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              // A fixed 40 reserved most of that width as blank gutter
              // whenever labels were short (e.g. single digits like "0"/
              // "1") — size it to what the widest label on this chart
              // actually needs instead, so the plot isn't pushed right by
              // space nothing is using.
              reservedSize: _leftAxisReservedSize(trend),
              interval: _calculateYInterval(trend),
              getTitlesWidget: (value, meta) {
                // Skip the very top label to avoid crowding the corner —
                // the bottom (0) stays since it anchors the axis visually.
                if (value == meta.max) return const SizedBox.shrink();
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: Text(
                    _formatNumber(value.toInt()),
                    style: AppTypography.labelSmall.copyWith(
                      color: context.colors.textSecondary,
                      fontSize: 10,
                    ),
                    textAlign: TextAlign.right,
                  ),
                );
              },
            ),
          ),
        ),
        borderData: FlBorderData(show: false),
        lineTouchData: LineTouchData(
          handleBuiltInTouches: true,
          touchTooltipData: LineTouchTooltipData(
            getTooltipColor: (_) => context.colors.card,
            tooltipBorder: BorderSide(color: context.colors.borderLight),
            tooltipRoundedRadius: 10,
            getTooltipItems: (spots) => spots.map((spot) {
              final idx = spot.x.toInt();
              if (idx < 0 || idx >= trend.length) return null;
              final dateParts = trend[idx].date.split('-');
              final label = dateParts.length == 3
                  ? '${dateParts[2]}/${dateParts[1]}'
                  : trend[idx].date;
              return LineTooltipItem(
                '${_formatNumber(spot.y.toInt())}\n',
                AppTypography.labelMedium.copyWith(
                  color: context.colors.textPrimary,
                  fontWeight: FontWeight.w700,
                ),
                children: [
                  TextSpan(
                    text: label,
                    style: AppTypography.labelSmall.copyWith(color: context.colors.textSecondary),
                  ),
                ],
              );
            }).toList(),
          ),
          getTouchedSpotIndicator: (barData, spotIndexes) => spotIndexes.map((_) {
            return TouchedSpotIndicatorData(
              FlLine(
                color: context.colors.primaryAccent.withOpacity(0.4),
                strokeWidth: 1.5,
                dashArray: [4, 4],
              ),
              FlDotData(
                getDotPainter: (spot, percent, bar, index) => FlDotCirclePainter(
                  radius: 5,
                  color: context.colors.primaryAccent,
                  strokeWidth: 2,
                  strokeColor: context.colors.card,
                ),
              ),
            );
          }).toList(),
        ),
        lineBarsData: [
          LineChartBarData(
            spots: trend.asMap().entries.map((e) {
              return FlSpot(e.key.toDouble(), e.value.value.toDouble());
            }).toList(),
            isCurved: true,
            preventCurveOverShooting: true,
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
    );
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

  /// Width the left axis gutter needs for its widest label (e.g. "0" needs
  /// far less room than "12.5k") instead of a fixed reservation that leaves
  /// unused blank space whenever the numbers are small.
  double _leftAxisReservedSize(List<TimeSeriesData> data) {
    final maxLabel = _formatNumber(_calculateMaxY(data).toInt());
    return (maxLabel.length * 7.0 + 12).clamp(24.0, 44.0);
  }

  double _calculateMaxY(List<TimeSeriesData> data) {
    if (data.isEmpty) return 10;
    final maxVal = data.map((e) => e.value).reduce((a, b) => a > b ? a : b);
    if (maxVal <= 0) return 10; // all zeros — show a clean empty chart up to 10
    final interval = _calculateYInterval(data);
    // +1 interval of headroom above the peak — without it, whenever the
    // highest point lands exactly on a grid step (very common with small,
    // spiky counts) the line touches the very top edge with nothing above
    // it, which reads as the chart being cut off rather than framed.
    return ((maxVal / interval).ceilToDouble() + 1) * interval;
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
