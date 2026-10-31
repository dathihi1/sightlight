import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/user_provider.dart';

class SettingsPage extends ConsumerWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileState = ref.watch(userProfileProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Cài đặt'),
      ),
      body: profileState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Lỗi: $err')),
        data: (profile) {
          final prefs = profile.preferences;

          return ListView(
            padding: const EdgeInsets.all(16.0),
            children: [
              // Section 1: Study Goals
              Text(
                'Mục tiêu học tập',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.primary,
                ),
              ),
              const SizedBox(height: 8),
              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Thời gian học mỗi ngày',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            '${prefs.dailyGoalMinutes} phút',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: theme.colorScheme.primary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Slider(
                        value: prefs.dailyGoalMinutes.toDouble(),
                        min: 5,
                        max: 60,
                        divisions: 11,
                        label: '${prefs.dailyGoalMinutes} phút',
                        onChanged: (val) {
                          ref
                              .read(userProfileProvider.notifier)
                              .updatePreferences(
                                prefs.copyWith(
                                  dailyGoalMinutes: val.toInt(),
                                ),
                              );
                        },
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: const [
                          Text('5m', style: TextStyle(color: Colors.grey)),
                          Text('15m', style: TextStyle(color: Colors.grey)),
                          Text('30m', style: TextStyle(color: Colors.grey)),
                          Text('60m', style: TextStyle(color: Colors.grey)),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Section 2: Notifications
              Text(
                'Thông báo & Nhắc nhở',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.primary,
                ),
              ),
              const SizedBox(height: 8),
              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                child: SwitchListTile(
                  title: const Text('Nhắc nhở học tập hàng ngày'),
                  subtitle: const Text(
                    'Nhận thông báo để duy trì chuỗi ngày streak',
                  ),
                  value: prefs.notificationsEnabled,
                  onChanged: (val) {
                    ref.read(userProfileProvider.notifier).updatePreferences(
                          prefs.copyWith(notificationsEnabled: val),
                        );
                  },
                ),
              ),
              const SizedBox(height: 20),

              // Section 3: App Experience (Language & Video Speed)
              Text(
                'Trải nghiệm học tập',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.primary,
                ),
              ),
              const SizedBox(height: 8),
              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    // Language selection
                    ListTile(
                      leading: const Icon(Icons.language),
                      title: const Text('Ngôn ngữ giao diện'),
                      trailing: DropdownButton<String>(
                        value: prefs.uiLocale == 'en' ? 'en' : 'vi',
                        underline: const SizedBox(),
                        items: const [
                          DropdownMenuItem(
                            value: 'vi',
                            child: Text('Tiếng Việt (vi)'),
                          ),
                          DropdownMenuItem(
                            value: 'en',
                            child: Text('English (en)'),
                          ),
                        ],
                        onChanged: (val) {
                          if (val != null) {
                            ref
                                .read(userProfileProvider.notifier)
                                .updatePreferences(
                                  prefs.copyWith(uiLocale: val),
                                );
                          }
                        },
                      ),
                    ),
                    const Divider(height: 1),
                    // Video playback speed
                    ListTile(
                      leading: const Icon(Icons.speed),
                      title: const Text('Tốc độ phát video ký hiệu'),
                      trailing: DropdownButton<String>(
                        value: ['0.75', '1.0', '1.25', '1.5']
                                .contains(prefs.videoSpeed)
                            ? prefs.videoSpeed
                            : '1.0',
                        underline: const SizedBox(),
                        items: const [
                          DropdownMenuItem(value: '0.75', child: Text('0.75x (Chậm)')),
                          DropdownMenuItem(value: '1.0', child: Text('1.0x (Chuẩn)')),
                          DropdownMenuItem(value: '1.25', child: Text('1.25x')),
                          DropdownMenuItem(value: '1.5', child: Text('1.5x (Nhanh)')),
                        ],
                        onChanged: (val) {
                          if (val != null) {
                            ref
                                .read(userProfileProvider.notifier)
                                .updatePreferences(
                                  prefs.copyWith(videoSpeed: val),
                                );
                          }
                        },
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 30),

              // Save info hint
              Center(
                child: Text(
                  'Tất cả cài đặt sẽ tự động lưu lên máy chủ qua /api/v1/me/preferences',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: Colors.grey.shade500,
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
