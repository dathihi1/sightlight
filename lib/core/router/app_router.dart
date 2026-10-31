import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../presentation/pages/courses_page.dart';
import '../../presentation/pages/dictionary/dictionary_page.dart';
import '../../presentation/pages/forgot_password_page.dart';
import '../../presentation/pages/home_page.dart';
import '../../presentation/pages/login_page.dart';
import '../../presentation/pages/notifications_page.dart';
import '../../presentation/pages/payment_result_page.dart';
import '../../presentation/pages/practice/practice_page.dart';
import '../../presentation/pages/profile/profile_page.dart';
import '../../presentation/pages/profile/settings_page.dart';
import '../../presentation/pages/gamification/progress_page.dart';
import '../../presentation/pages/gamification/awards_page.dart';
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
      final isAuthRoute = location == '/login' ||
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
        path: '/courses',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const CoursesPage(),
      ),
      GoRoute(
        path: '/upgrade',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const UpgradePage(),
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
        path: '/notifications',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const NotificationsPage(),
      ),
      GoRoute(
        path: '/settings',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const SettingsPage(),
      ),
      GoRoute(
        path: '/progress',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const ProgressPage(),
      ),
      GoRoute(
        path: '/awards',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const AwardsPage(),
      ),

      // App Shell with Stateful Navigation
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return AppShell(navigationShell: navigationShell);
        },
        branches: [
          // Branch 0: Home
          StatefulShellBranch(
            routes: [
              GoRoute(path: '/', builder: (context, state) => const HomePage()),
            ],
          ),

          // Branch 1: Dictionary
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/dictionary',
                builder: (context, state) => const DictionaryPage(),
              ),
            ],
          ),

          // Branch 2: Practice
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/practice',
                builder: (context, state) => const PracticePage(),
              ),
            ],
          ),

          // Branch 3: Profile
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/profile',
                builder: (context, state) => const ProfilePage(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
});
