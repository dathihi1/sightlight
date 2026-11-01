import 'package:flutter/material.dart';

import '../../domain/entities/progress_stats.dart';

class ActivityChartWidget extends StatelessWidget {
  const ActivityChartWidget({
    super.key,
    required this.activities,
    required this.selectedDays,
    required this.onDaysChanged,
    this.dailyGoalMinutes = 20,
  });

  final List<ActivityDay> activities;
  final int selectedDays;
  final ValueChanged<int> onDaysChanged;
  final int dailyGoalMinutes;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final displayedList = activities.length > selectedDays
        ? activities.sublist(activities.length - selectedDays)
        : activities;

    double maxMinutes = dailyGoalMinutes.toDouble();
    double totalMinutes = 0;
    for (final a in displayedList) {
      if (a.minutes > maxMinutes) maxMinutes = a.minutes;
      totalMinutes += a.minutes;
    }
    final avgMinutes = displayedList.isNotEmpty
        ? (totalMinutes / displayedList.length)
        : 0.0;

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with 7/30 days switch
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Thời gian học tập',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'TB: ${avgMinutes.toStringAsFixed(1)} phút/ngày',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
                SegmentedButton<int>(
                  segments: const [
                    ButtonSegment(value: 7, label: Text('7 ngày')),
                    ButtonSegment(value: 30, label: Text('30 ngày')),
                  ],
                  selected: {selectedDays},
                  onSelectionChanged: (set) {
                    onDaysChanged(set.first);
                  },
                  style: const ButtonStyle(
                    visualDensity: VisualDensity.compact,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Bar chart area
            SizedBox(
              height: 160,
              child: displayedList.isEmpty
                  ? const Center(child: Text('Chưa có dữ liệu học tập'))
                  : Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: displayedList.map((act) {
                        final ratio = maxMinutes > 0
                            ? (act.minutes / maxMinutes).clamp(0.0, 1.0)
                            : 0.0;
                        final isGoalMet = act.goalMet;
                        final dayLabel = selectedDays <= 7
                            ? '${act.date.day}/${act.date.month}'
                            : (act.date.day % 5 == 0 ? '${act.date.day}' : '');

                        return Expanded(
                          child: Padding(
                            padding: EdgeInsets.symmetric(
                              horizontal: selectedDays <= 7 ? 4.0 : 1.0,
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                if (act.minutes > 0 && selectedDays <= 7)
                                  Text(
                                    '${act.minutes.toInt()}m',
                                    style: const TextStyle(
                                      fontSize: 10,
                                      color: Colors.grey,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                const SizedBox(height: 4),
                                Tooltip(
                                  message:
                                      '${act.date.day}/${act.date.month}: ${act.minutes.toStringAsFixed(1)} phút',
                                  child: Container(
                                    height: (110 * ratio).clamp(4.0, 110.0),
                                    decoration: BoxDecoration(
                                      color: isGoalMet
                                          ? Colors.blue.shade600
                                          : act.minutes > 0
                                          ? Colors.blue.shade200
                                          : Colors.grey.shade200,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 6),
                                SizedBox(
                                  height: 14,
                                  child: Text(
                                    dayLabel,
                                    style: TextStyle(
                                      fontSize: selectedDays <= 7 ? 11 : 9,
                                      color: Colors.grey.shade600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ),
            ),
            const SizedBox(height: 12),
            // Legend
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildLegendItem(
                  color: Colors.blue.shade600,
                  label: 'Đạt mục tiêu ($dailyGoalMinutes phút)',
                ),
                const SizedBox(width: 16),
                _buildLegendItem(
                  color: Colors.blue.shade200,
                  label: 'Có học tập',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLegendItem({required Color color, required String label}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 6),
        Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
      ],
    );
  }
}
