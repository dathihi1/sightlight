import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sightlight_flutter/presentation/pages/practice/fingerspell_page.dart';
import 'package:sightlight_flutter/presentation/pages/practice/numbers_practice_page.dart';
import 'package:sightlight_flutter/presentation/pages/practice/vocabulary_practice_page.dart';
import 'package:sightlight_flutter/presentation/providers/practice_provider.dart';

class PracticeHubPage extends ConsumerWidget {
  const PracticeHubPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final stats = ref.watch(practiceStatsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Trung tâm Luyện tập',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Practice Statistics Card
            _buildStatsCard(context, stats, ref),
            const SizedBox(height: 24),

            Text(
              'Chọn chế độ luyện tập',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),

            // Mode 1: Vocabulary Trainer
            _buildModeCard(
              context: context,
              title: 'Luyện Từ vựng (Vocabulary Trainer)',
              subtitle:
                  'Xem video ký hiệu VSL và chọn nghĩa từ vựng tiếng Việt chính xác.',
              icon: Icons.school_rounded,
              color: Colors.blue,
              badge: 'Phổ biến',
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const VocabularyPracticePage(),
                  ),
                );
              },
            ),
            const SizedBox(height: 12),

            // Mode 2: Fingerspell Practice
            _buildModeCard(
              context: context,
              title: 'Đánh vần Ngón tay (Fingerspell Practice)',
              subtitle:
                  'Học và ghép từng ký hiệu chữ cái ngón tay theo từ vựng mục tiêu, hỗ trợ Camera AI.',
              icon: Icons.front_hand_rounded,
              color: Colors.orange,
              badge: 'Camera AI',
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const FingerspellPage(),
                  ),
                );
              },
            ),
            const SizedBox(height: 12),

            // Mode 3: Numbers Practice
            _buildModeCard(
              context: context,
              title: 'Luyện Số đếm (Numbers Practice)',
              subtitle:
                  'Nhận diện các con số từ 0 - 100 qua ngôn ngữ ký hiệu một cách nhanh chóng.',
              icon: Icons.pin_rounded,
              color: Colors.green,
              badge: 'Cơ bản',
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const NumbersPracticePage(),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsCard(
    BuildContext context,
    dynamic stats,
    WidgetRef ref,
  ) {
    final theme = Theme.of(context);
    final accuracyStr = stats.accuracy.toStringAsFixed(1);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.primary,
            theme.colorScheme.primary.withBlue(220),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: theme.colorScheme.primary.withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.insights_rounded, color: Colors.white, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'Thống kê học tập của bạn',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
              if (stats.totalAnswered > 0)
                IconButton(
                  icon: const Icon(Icons.refresh, color: Colors.white70, size: 18),
                  tooltip: 'Đặt lại thống kê',
                  onPressed: () =>
                      ref.read(practiceStatsProvider.notifier).reset(),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildStatItem('Chuỗi ngày', '${stats.streakDays} ngày', Icons.local_fire_department, Colors.orangeAccent),
              Container(width: 1, height: 40, color: Colors.white24),
              _buildStatItem('Đã luyện', '${stats.totalAnswered} câu', Icons.check_circle_outline, Colors.lightGreenAccent),
              Container(width: 1, height: 40, color: Colors.white24),
              _buildStatItem('Chính xác', '$accuracyStr%', Icons.track_changes, Colors.amberAccent),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(
    String label,
    String value,
    IconData icon,
    Color iconColor,
  ) {
    return Column(
      children: [
        Icon(icon, color: iconColor, size: 22),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 11,
          ),
        ),
      ],
    );
  }

  Widget _buildModeCard({
    required BuildContext context,
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required String badge,
    required VoidCallback onTap,
  }) {
    final theme = Theme.of(context);

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: theme.colorScheme.outlineVariant.withValues(alpha: 0.5),
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Center(
                  child: Icon(icon, color: color, size: 28),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: color.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            badge,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: color,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      subtitle,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Icon(
                Icons.chevron_right,
                color: theme.colorScheme.outline,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
