import 'package:flutter/material.dart';
import '../../domain/entities/progress_stats.dart';

class StreakTrackerWidget extends StatelessWidget {
  const StreakTrackerWidget({
    super.key,
    required this.stats,
    required this.onFreezePressed,
  });

  final ProgressStats stats;
  final VoidCallback onFreezePressed;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isMetToday = stats.goalMetToday;

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Streak Header with Flame & Freeze Action
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: isMetToday
                        ? Colors.orange.withValues(alpha: 0.15)
                        : Colors.grey.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.local_fire_department,
                    color: isMetToday ? Colors.deepOrange : Colors.grey,
                    size: 32,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            '${stats.streakDays} ngày',
                            style: theme.textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: isMetToday
                                  ? Colors.deepOrange
                                  : Colors.black87,
                            ),
                          ),
                          const SizedBox(width: 8),
                          if (isMetToday)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.green.shade50,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: Colors.green.shade300,
                                ),
                              ),
                              child: const Text(
                                'Đã hoàn thành',
                                style: TextStyle(
                                  color: Colors.green,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                        ],
                      ),
                      Text(
                        'Kỷ lục: ${stats.longestStreak} ngày liên tục',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
                // Freeze Streak Button
                OutlinedButton.icon(
                  onPressed: onFreezePressed,
                  icon: const Icon(Icons.ac_unit, size: 16, color: Colors.blue),
                  label: Text(
                    'Đóng băng (${stats.freezeCount})',
                    style: const TextStyle(fontSize: 12, color: Colors.blue),
                  ),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    side: const BorderSide(color: Colors.blue),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(height: 1),
            const SizedBox(height: 12),

            // Calendar dots for past 7 days
            Text(
              'Lịch sử 7 ngày gần nhất',
              style: theme.textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 10),
            _buildWeekCalendar(context),
          ],
        ),
      ),
    );
  }

  Widget _buildWeekCalendar(BuildContext context) {
    final now = DateTime.now();
    final days = List.generate(7, (i) {
      return now.subtract(Duration(days: 6 - i));
    });

    final activityMap = <String, ActivityDay>{};
    for (final act in stats.recentActivities) {
      final key = '${act.date.year}-${act.date.month}-${act.date.day}';
      activityMap[key] = act;
    }

    const weekdaysVi = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: days.map((day) {
        final key = '${day.year}-${day.month}-${day.day}';
        final isToday = day.year == now.year &&
            day.month == now.month &&
            day.day == now.day;
        final act = activityMap[key];
        final isMet = act?.goalMet ?? (isToday && stats.goalMetToday);

        final weekdayName = weekdaysVi[day.weekday - 1];

        return Column(
          children: [
            Text(
              weekdayName,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isToday ? FontWeight.bold : FontWeight.normal,
                color: isToday ? Colors.deepOrange : Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 6),
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isMet
                    ? Colors.orange
                    : isToday
                        ? Colors.orange.shade50
                        : Colors.grey.shade200,
                border: isToday
                    ? Border.all(color: Colors.deepOrange, width: 2)
                    : null,
              ),
              child: Center(
                child: isMet
                    ? const Icon(
                        Icons.check,
                        size: 18,
                        color: Colors.white,
                      )
                    : Text(
                        '${day.day}',
                        style: TextStyle(
                          fontSize: 12,
                          color: isToday
                              ? Colors.deepOrange
                              : Colors.grey.shade600,
                          fontWeight:
                              isToday ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
              ),
            ),
            const SizedBox(height: 4),
            // Dot indicating minutes
            Container(
              width: 5,
              height: 5,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: (act != null && act.minutes > 0)
                    ? Colors.green
                    : Colors.transparent,
              ),
            ),
          ],
        );
      }).toList(),
    );
  }
}
