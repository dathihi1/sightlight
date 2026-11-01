import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../providers/auth_provider.dart';
import '../widgets/brand_logo.dart';

class SplashPage extends ConsumerStatefulWidget {
  const SplashPage({super.key});

  @override
  ConsumerState<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends ConsumerState<SplashPage> {
  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    // Artificial minimum delay for smooth splash experience
    await Future.delayed(const Duration(milliseconds: 1200));

    if (!mounted) return;

    // Check auth status
    final authState = ref.read(authStateProvider);

    authState.when(
      data: (user) {
        if (!mounted) return;
        if (user != null) {
          context.go('/');
        } else {
          context.go('/login');
        }
      },
      loading: () {
        // Wait for auth to resolve
        ref.listenManual(authStateProvider, (previous, next) {
          next.whenData((user) {
            if (!mounted) return;
            if (user != null) {
              context.go('/');
            } else {
              context.go('/login');
            }
          });
        });
      },
      error: (error, stack) {
        if (!mounted) return;
        context.go('/login');
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.primaryBlue,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const BrandLogo(size: 112, withShadow: true),
            const SizedBox(height: 24),
            const Text(
              'SignLight',
              style: TextStyle(
                color: Colors.white,
                fontSize: 32,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Học Ngôn ngữ Ký hiệu Việt Nam thông minh',
              style: TextStyle(
                color: Colors.white.withAlpha(200),
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 48),
            const SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(
                color: Colors.white,
                strokeWidth: 2.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
