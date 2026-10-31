import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/localization/app_localizations.dart';
import '../providers/auth_provider.dart';

class CoursesPage extends ConsumerWidget {
  const CoursesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);
    final user = ref.watch(authStateProvider).value;
    final isPremium = user?.isPremium ?? false;

    final courses = [
      {
        'id': 'vsl_basics_101',
        'title': 'Bảng chữ cái & Số đếm VSL',
        'desc': 'Khóa nhập môn: 29 chữ cái ngón tay và số từ 1-100',
        'lessons': 12,
        'progress': 0.8,
        'isLocked': false,
        'color': Colors.blue,
      },
      {
        'id': 'vsl_greetings_102',
        'title': 'Giao tiếp cơ bản & Chào hỏi',
        'desc': 'Các câu xã giao thường ngày, gia đình, sở thích',
        'lessons': 18,
        'progress': 0.35,
        'isLocked': false,
        'color': Colors.teal,
      },
      {
        'id': 'vsl_daily_201',
        'title': 'Đời sống & Mua sắm hàng ngày',
        'desc': 'Hỏi đường, gọi món, đi chợ và các hoạt động thường nhật',
        'lessons': 24,
        'progress': 0.0,
        'isLocked': false,
        'color': Colors.indigo,
      },
      {
        'id': 'vsl_ai_advanced_301',
        'title': 'Chuyên sâu & AI Luyện khẩu hình',
        'desc': 'Khóa chuyên sâu kết hợp cử chỉ và biểu cảm gương mặt AI',
        'lessons': 30,
        'progress': 0.0,
        'isLocked': !isPremium,
        'color': Colors.amber.shade800,
      },
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.courses),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/');
            }
          },
        ),
      ),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: courses.length,
        separatorBuilder: (context, index) => const SizedBox(height: 14),
        itemBuilder: (context, index) {
          final c = courses[index];
          final isLocked = c['isLocked'] as bool;
          final color = c['color'] as Color;
          final progress = c['progress'] as double;

          return Container(
            decoration: BoxDecoration(
              color: theme.cardTheme.color,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: theme.dividerColor.withAlpha(70)),
            ),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: color.withAlpha(25),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        isLocked ? Icons.lock_rounded : Icons.menu_book_rounded,
                        color: color,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            c['title'] as String,
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            '${c['lessons']} bài học',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (isLocked)
                      ElevatedButton(
                        onPressed: () => context.push('/upgrade'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.amber.shade800,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                        ),
                        child: const Text('Mở khóa', style: TextStyle(fontSize: 12)),
                      )
                    else
                      ElevatedButton(
                        onPressed: () => context.push('/practice'),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                        ),
                        child: Text(
                          progress > 0 ? 'Tiếp tục' : 'Bắt đầu',
                          style: const TextStyle(fontSize: 12),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  c['desc'] as String,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                if (!isLocked && progress > 0) ...[
                  const SizedBox(height: 12),
                  LinearProgressIndicator(
                    value: progress,
                    borderRadius: BorderRadius.circular(4),
                    backgroundColor: theme.colorScheme.surfaceContainerHighest,
                  ),
                  const SizedBox(height: 4),
                  Align(
                    alignment: Alignment.centerRight,
                    child: Text(
                      '${(progress * 100).toInt()}% hoàn thành',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}
