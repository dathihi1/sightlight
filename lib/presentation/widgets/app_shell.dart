import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/localization/app_localizations.dart';
import '../../core/localization/locale_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/theme_provider.dart';
import '../providers/auth_provider.dart';
import 'brand_logo.dart';
import 'offline_banner.dart';

class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  void _onTap(BuildContext context, int index) {
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final authState = ref.watch(authStateProvider);
    final user = authState.value;
    final isPremium = user?.isPremium ?? false;
    final themeMode = ref.watch(themeModeProvider);
    final locale = ref.watch(localeProvider);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const BrandLogo(size: 30),
            const SizedBox(width: 8),
            const Text(
              'SignLight',
              style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 0.5),
            ),
            if (isPremium) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppTheme.premiumGold,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'VIP',
                  style: TextStyle(
                    color: Colors.black,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ],
        ),
        actions: [
          // Language Switcher
          IconButton(
            tooltip: 'Ngôn ngữ / Language',
            icon: Text(
              locale.languageCode.toUpperCase(),
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            ),
            onPressed: () {
              ref.read(localeProvider.notifier).toggleLocale();
            },
          ),

          // Theme Toggle
          IconButton(
            tooltip: l10n.theme,
            icon: Icon(
              themeMode == ThemeMode.dark
                  ? Icons.dark_mode_rounded
                  : Icons.light_mode_rounded,
              size: 22,
            ),
            onPressed: () {
              ref.read(themeModeProvider.notifier).toggleTheme();
            },
          ),
          const SizedBox(width: 4),
        ],
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            // Drawer Header with User Info
            UserAccountsDrawerHeader(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF1E3A8A), Color(0xFF2563EB)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              currentAccountPicture: CircleAvatar(
                backgroundColor: Colors.white,
                backgroundImage: user?.avatarUrl != null
                    ? NetworkImage(user!.avatarUrl!)
                    : null,
                child: user?.avatarUrl == null
                    ? const Icon(
                        Icons.person,
                        size: 36,
                        color: AppTheme.primaryBlue,
                      )
                    : null,
              ),
              accountName: Row(
                children: [
                  Expanded(
                    child: Text(
                      user?.displayName ?? 'Học viên SignLight',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),
                  if (isPremium)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.premiumGold,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text(
                        'PREMIUM',
                        style: TextStyle(
                          color: Colors.black,
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                ],
              ),
              accountEmail: Text(user?.email ?? ''),
            ),

            ListTile(
              leading: const Icon(Icons.home_outlined),
              title: Text(l10n.home),
              selected: navigationShell.currentIndex == 0,
              onTap: () {
                Navigator.pop(context);
                _onTap(context, 0);
              },
            ),
            ListTile(
              leading: const Icon(Icons.school_outlined),
              title: Text(l10n.courses),
              onTap: () {
                Navigator.pop(context);
                context.push('/courses');
              },
            ),
            ListTile(
              leading: const Icon(Icons.menu_book_outlined),
              title: Text(l10n.dictionary),
              selected: navigationShell.currentIndex == 1,
              onTap: () {
                Navigator.pop(context);
                _onTap(context, 1);
              },
            ),
            ListTile(
              leading: const Icon(Icons.front_hand_outlined),
              title: Text(l10n.practice),
              selected: navigationShell.currentIndex == 2,
              onTap: () {
                Navigator.pop(context);
                _onTap(context, 2);
              },
            ),
            ListTile(
              leading: const Icon(Icons.person_outline),
              title: Text(l10n.profile),
              selected: navigationShell.currentIndex == 3,
              onTap: () {
                Navigator.pop(context);
                _onTap(context, 3);
              },
            ),

            ListTile(
              leading: const Icon(Icons.storefront_outlined),
              title: const Text('Cửa hàng EXP'),
              onTap: () {
                Navigator.pop(context);
                context.push('/shop');
              },
            ),

            const Divider(),

            // Upgrade Tile
            ListTile(
              leading: const Icon(
                Icons.workspace_premium_rounded,
                color: Colors.amber,
              ),
              title: Text(
                l10n.upgrade,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.amber,
                ),
              ),
              onTap: () {
                Navigator.pop(context);
                context.push('/upgrade');
              },
            ),

            const Divider(),

            ListTile(
              leading: const Icon(Icons.logout, color: Colors.redAccent),
              title: Text(
                l10n.logout,
                style: const TextStyle(color: Colors.redAccent),
              ),
              onTap: () async {
                Navigator.pop(context);
                await ref.read(authStateProvider.notifier).logout();
                if (context.mounted) {
                  context.go('/login');
                }
              },
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          const OfflineBanner(),
          Expanded(child: navigationShell),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: (idx) => _onTap(context, idx),
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.home_outlined),
            selectedIcon: const Icon(Icons.home_rounded),
            label: l10n.home,
          ),
          NavigationDestination(
            icon: const Icon(Icons.menu_book_outlined),
            selectedIcon: const Icon(Icons.menu_book_rounded),
            label: l10n.dictionary,
          ),
          NavigationDestination(
            icon: const Icon(Icons.front_hand_outlined),
            selectedIcon: const Icon(Icons.front_hand_rounded),
            label: l10n.practice,
          ),
          NavigationDestination(
            icon: const Icon(Icons.person_outline_rounded),
            selectedIcon: const Icon(Icons.person_rounded),
            label: l10n.profile,
          ),
        ],
      ),
    );
  }
}
