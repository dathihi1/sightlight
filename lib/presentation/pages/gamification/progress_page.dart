import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/gamification_provider.dart';
import '../../widgets/streak_tracker_widget.dart';
import '../../widgets/activity_chart_widget.dart';

class ProgressPage extends ConsumerWidget {
  const ProgressPage({super.key});

  void _showFreezeConfirmDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.ac_unit, color: Colors.blue),
            SizedBox(width: 8),
            Text('Đóng băng chuỗi Streak'),
          ],
        ),
        content: const Text(
          'Bạn có muốn dùng 1 lượt Đóng băng (Freeze) để bảo vệ chuỗi streak của bạn không bị mất khi nghỉ 1 ngày không?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await ref
                  .read(progressStatsProvider.notifier)
                  .freezeStreak();
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      success
                          ? 'Đã kích hoạt đóng băng streak thành công!'
                          : 'Kích hoạt đóng băng streak thành công!',
                    ),
                  ),
                );
              }
            },
            child: const Text('Đóng băng ngay'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsState = ref.watch(progressStatsProvider);
    final selectedDays = ref.watch(activityDaysRangeProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tiến độ học tập'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () =>
                ref.read(progressStatsProvider.notifier).loadStats(),
          ),
        ],
      ),
      body: statsState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Lỗi: $err'),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () =>
                    ref.read(progressStatsProvider.notifier).loadStats(),
                child: const Text('Thử lại'),
              ),
            ],
          ),
        ),
        data: (stats) {
          return RefreshIndicator(
            onRefresh: () =>
                ref.read(progressStatsProvider.notifier).loadStats(),
            child: ListView(
              padding: const EdgeInsets.all(16.0),
              children: [
                // 1. Streak Tracker Widget (with freeze and calendar dots)
                StreakTrackerWidget(
                  stats: stats,
                  onFreezePressed: () =>
                      _showFreezeConfirmDialog(context, ref),
                ),
                const SizedBox(height: 16),

                // 2. Summary stats grid (Total minutes, Lessons completed, EXP, Mastered signs)
                Row(
                  children: [
                    Expanded(
                      child: _buildStatTile(
                        context,
                        icon: Icons.timer_outlined,
                        iconColor: Colors.blue,
                        value: '${stats.totalMinutesLearned.toInt()} phút',
                        label: 'Tổng thời gian học',
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildStatTile(
                        context,
                        icon: Icons.menu_book,
                        iconColor: Colors.green,
                        value: '${stats.completedLessons}',
                        label: 'Bài học hoàn thành',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildStatTile(
                        context,
                        icon: Icons.sign_language,
                        iconColor: Colors.purple,
                        value: '${stats.signsMastered}',
                        label: 'Ký hiệu thành thạo',
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildStatTile(
                        context,
                        icon: Icons.bolt,
                        iconColor: Colors.amber.shade800,
                        value: '${stats.expBalance}',
                        label: 'Điểm EXP tích lũy',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // 3. Activity Chart (7 / 30 days)
                ActivityChartWidget(
                  activities: stats.recentActivities,
                  selectedDays: selectedDays,
                  dailyGoalMinutes: stats.dailyGoalMinutes,
                  onDaysChanged: (days) {
                    ref.read(activityDaysRangeProvider.notifier).state = days;
                  },
                ),
                const SizedBox(height: 20),

                // 4. Learning Quality Card
                Card(
                  elevation: 1,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.green.withValues(alpha: 0.12),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.auto_graph,
                            color: Colors.green,
                            size: 28,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Điểm chính xác AI trung bình: ${stats.averageScore}%',
                                style: theme.textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Luyện tập mỗi ngày giúp tăng độ chính xác của cử chỉ tay.',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: Colors.grey.shade600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatTile(
    BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required String value,
    required String label,
  }) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(14.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: iconColor, size: 24),
            const SizedBox(height: 10),
            Text(
              value,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
