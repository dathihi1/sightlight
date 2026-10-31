import 'package:flutter/material.dart';
import '../../core/localization/app_localizations.dart';

class NotificationsPage extends StatelessWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);

    final mockNotifications = [
      {
        'title': 'Chào mừng bạn đến với SignLight!',
        'subtitle': 'Bắt đầu bài học đầu tiên về bảng chữ cái ký hiệu nhé.',
        'time': 'Vừa xong',
        'isRead': false,
        'icon': Icons.celebration_rounded,
      },
      {
        'title': 'Nhắc nhở học tập hàng ngày',
        'subtitle': 'Hãy hoàn thành mục tiêu 10 phút luyện tập hôm nay.',
        'time': '2 giờ trước',
        'isRead': true,
        'icon': Icons.notifications_active_rounded,
      },
      {
        'title': 'Ưu đãi SignLight Premium',
        'subtitle': 'Giảm ngay 15% khi đăng ký gói 6 tháng hôm nay.',
        'time': '1 ngày trước',
        'isRead': true,
        'icon': Icons.workspace_premium_rounded,
      },
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.notifications),
      ),
      body: mockNotifications.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.notifications_none_rounded,
                    size: 64,
                    color: theme.colorScheme.outline,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Không có thông báo mới',
                    style: theme.textTheme.titleMedium,
                  ),
                ],
              ),
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: mockNotifications.length,
              separatorBuilder: (context, index) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final item = mockNotifications[index];
                final isRead = item['isRead'] as bool;
                return Container(
                  decoration: BoxDecoration(
                    color: isRead
                        ? theme.cardTheme.color
                        : theme.colorScheme.primary.withAlpha(12),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isRead
                          ? theme.dividerColor.withAlpha(60)
                          : theme.colorScheme.primary.withAlpha(60),
                    ),
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    leading: CircleAvatar(
                      backgroundColor: theme.colorScheme.primary.withAlpha(25),
                      child: Icon(
                        item['icon'] as IconData,
                        color: theme.colorScheme.primary,
                      ),
                    ),
                    title: Text(
                      item['title'] as String,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight:
                            isRead ? FontWeight.normal : FontWeight.bold,
                      ),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 4),
                        Text(
                          item['subtitle'] as String,
                          style: theme.textTheme.bodySmall,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          item['time'] as String,
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
