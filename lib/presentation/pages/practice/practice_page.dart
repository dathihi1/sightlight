import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/localization/app_localizations.dart';
import 'fingerspell_page.dart';
import 'numbers_practice_page.dart';
import 'vocabulary_practice_page.dart';

class PracticePage extends ConsumerWidget {
  const PracticePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);

    final modes = [
      {
        'title': 'Luyện tập Từ vựng',
        'subtitle': 'Xem video ký hiệu và chọn nghĩa tiếng Việt chính xác',
        'icon': Icons.menu_book_rounded,
        'color': Colors.blue,
        'action': () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const VocabularyPracticePage()),
          );
        },
        'badge': 'Phổ biến',
        'isLocked': false,
      },
      {
        'title': 'Đánh vần Chữ cái (Fingerspelling)',
        'subtitle': 'Luyện phản xạ ghép từ bằng bảng chữ cái ngón tay',
        'icon': Icons.back_hand_rounded,
        'color': Colors.teal,
        'action': () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const FingerspellPage()),
          );
        },
        'badge': null,
        'isLocked': false,
      },
      {
        'title': 'Nhận diện Số đếm',
        'subtitle': 'Luyện tập đếm số từ 1 đến 100 bằng ký hiệu hai bàn tay',
        'icon': Icons.pin_rounded,
        'color': Colors.indigo,
        'action': () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const NumbersPracticePage()),
          );
        },
        'badge': null,
        'isLocked': false,
      },
      {
        'title': 'Gia sư AI - Nhận diện Camera',
        'subtitle': 'Bật camera trước để AI chấm điểm độ chuẩn xác của bàn tay',
        'icon': Icons.videocam_rounded,
        'color': Colors.amber.shade800,
        'action': () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const FingerspellPage()),
          );
        },
        'badge': 'CAMERA AI',
        'isLocked': false,
      },
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(
          l10n.practice,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Banner
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.indigo.shade600, Colors.blue.shade500],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Luyện tập mỗi ngày',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Chỉ 10 phút luyện tập phản xạ giúp bạn ghi nhớ ký hiệu nhanh hơn gấp 3 lần.',
                        style: TextStyle(
                          color: Colors.white.withAlpha(220),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                const Icon(
                  Icons.psychology_rounded,
                  color: Colors.white,
                  size: 48,
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          Text(
            'Chọn chế độ luyện tập',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),

          ...modes.map((m) {
            final isLocked = m['isLocked'] as bool;
            final color = m['color'] as Color;
            final badge = m['badge'] as String?;

            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: InkWell(
                onTap: m['action'] as VoidCallback,
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: theme.cardTheme.color,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isLocked
                          ? Colors.amber.withAlpha(80)
                          : theme.dividerColor.withAlpha(70),
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: color.withAlpha(25),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Icon(
                          m['icon'] as IconData,
                          color: color,
                          size: 26,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  m['title'] as String,
                                  style: theme.textTheme.titleSmall?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                if (badge != null) ...[
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: badge == 'PREMIUM'
                                          ? Colors.amber.shade200
                                          : Colors.blue.shade100,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      badge,
                                      style: TextStyle(
                                        color: badge == 'PREMIUM'
                                            ? Colors.amber.shade900
                                            : Colors.blue.shade900,
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              m['subtitle'] as String,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Icon(
                        isLocked
                            ? Icons.lock_rounded
                            : Icons.arrow_forward_ios_rounded,
                        size: 16,
                        color: isLocked ? Colors.amber.shade800 : theme.colorScheme.outline,
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}
