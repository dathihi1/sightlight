import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../presentation/pages/dictionary/dictionary_page.dart';
import '../../presentation/pages/forgot_password_page.dart';
import '../../presentation/pages/home_page.dart';
import '../../presentation/pages/login_page.dart';
import '../../presentation/pages/payment_result_page.dart';
import '../../presentation/pages/practice/practice_page.dart';
import '../../presentation/pages/profile/profile_page.dart';
import '../../presentation/pages/profile/settings_page.dart';
import '../../presentation/pages/gamification/progress_page.dart';
import '../../presentation/pages/gamification/awards_page.dart';
import '../../presentation/pages/referral_page.dart';
import '../../presentation/pages/shop_page.dart';
import '../../presentation/pages/register_page.dart';
import '../../presentation/pages/splash_page.dart';
import '../../presentation/pages/upgrade_page.dart';
import '../../presentation/providers/auth_provider.dart';
import '../../presentation/widgets/app_shell.dart';

final rootNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'rootNav');
final shellNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'shellNav');

class RouterNotifier extends ChangeNotifier {
  RouterNotifier(this._ref) {
    _ref.listen(authStateProvider, (_, _) {
      notifyListeners();
    });
  }

  final Ref _ref;
}

final routerNotifierProvider = Provider<RouterNotifier>((ref) {
  return RouterNotifier(ref);
});

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = ref.watch(routerNotifierProvider);

  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/splash',
    refreshListenable: notifier,
    redirect: (context, state) {
      final authState = ref.read(authStateProvider);
      final isLoggedIn = authState.value != null;
      final isLoading = authState.isLoading;

      final location = state.matchedLocation;
      final isAuthRoute =
          location == '/login' ||
          location == '/register' ||
          location == '/forgot-password';
      final isSplashRoute = location == '/splash';
      final isPaymentResultRoute = location.startsWith('/payment-result');

      // Still resolving initial auth state from splash
      if (isLoading && isSplashRoute) {
        return null;
      }

      // Not authenticated -> redirect to login
      if (!isLoggedIn &&
          !isAuthRoute &&
          !isSplashRoute &&
          !isPaymentResultRoute) {
        return '/login';
      }

      // Authenticated but on auth route -> redirect to home
      if (isLoggedIn && isAuthRoute) {
        return '/';
      }

      return null;
    },
    routes: [
      // Splash
      GoRoute(path: '/splash', builder: (context, state) => const SplashPage()),

      // Auth routes
      GoRoute(path: '/login', builder: (context, state) => const LoginPage()),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterPage(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordPage(),
      ),

      // Standalone full-screen routes
      GoRoute(
        path: '/upgrade',
        redirect: (context, state) => '/profile/premium',
      ),
      GoRoute(
        path: '/payment-result',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) {
          final query = state.uri.queryParameters;
          return PaymentResultPage(
            orderCode: query['orderCode'] ?? query['orderId'],
            status: query['status'] ?? query['code'],
            cancel: query['cancel'],
          );
        },
      ),
      GoRoute(
        path: '/settings',
        redirect: (context, state) => '/profile/settings',
      ),
      GoRoute(
        path: '/progress',
        redirect: (context, state) => '/profile/progress',
      ),
      GoRoute(
        path: '/awards',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const AwardsPage(),
      ),
      GoRoute(
        path: '/shop',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const ShopPage(),
      ),
      GoRoute(
        path: '/referral',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const ReferralPage(),
      ),

      // App Shell with Stateful Navigation
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return AppShell(navigationShell: navigationShell);
        },
        branches: [
          // Branch 0: Tổng quan (Home)
          StatefulShellBranch(
            routes: [
              GoRoute(path: '/', builder: (context, state) => const HomePage()),
            ],
          ),

          // Branch 1: Từ điển (Dictionary)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/dictionary',
                builder: (context, state) => const DictionaryPage(),
              ),
            ],
          ),

          // Branch 2: Luyện tập (Practice)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/practice',
                builder: (context, state) => const PracticePage(),
              ),
            ],
          ),

          // Branch 3: Hồ sơ (Profile)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/profile',
                builder: (context, state) => const ProfilePage(),
                routes: [
                  GoRoute(
                    path: 'progress',
                    builder: (context, state) => const ProgressPage(),
                  ),
                  GoRoute(
                    path: 'premium',
                    builder: (context, state) => const UpgradePage(),
                  ),
                  GoRoute(
                    path: 'upgrade',
                    builder: (context, state) => const UpgradePage(),
                  ),
                  GoRoute(
                    path: 'settings',
                    builder: (context, state) => const SettingsPage(),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  );
});
