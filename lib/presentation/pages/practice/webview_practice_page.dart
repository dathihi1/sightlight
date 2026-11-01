import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:webview_flutter/webview_flutter.dart';
// ignore: depend_on_referenced_packages
import 'package:webview_flutter_android/webview_flutter_android.dart';

import '../../../core/storage/token_storage.dart';

class WebViewPracticePage extends ConsumerStatefulWidget {
  const WebViewPracticePage({super.key});

  @override
  ConsumerState<WebViewPracticePage> createState() =>
      _WebViewPracticePageState();
}

class _WebViewPracticePageState extends ConsumerState<WebViewPracticePage> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0x00000000))
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            setState(() => _isLoading = true);
          },
          onPageFinished: (String url) async {
            await _syncPage();
            if (mounted) setState(() => _isLoading = false);
          },
          onWebResourceError: (WebResourceError error) {
            debugPrint('[WebView] Error: ${error.description}');
          },
        ),
      );

    if (_controller.platform is AndroidWebViewController) {
      final androidController =
          _controller.platform as AndroidWebViewController;
      androidController.setOnPlatformPermissionRequest((request) {
        request.grant();
      });
      AndroidWebViewController.enableDebugging(true);
    }

    _loadPage();
  }

  Future<void> _loadPage() async {
    final tokenStorage = ref.read(tokenStorageProvider);
    final token = await tokenStorage.getAccessToken();
    final refreshToken = await tokenStorage.getRefreshToken();

    if (token != null && token.isNotEmpty) {
      final url = Uri.https('signlight.id.vn', '/luyen-ai', {
        '_token': token,
        if (refreshToken != null) '_refresh': refreshToken,
      });
      await _controller.loadRequest(url);
    } else {
      await _controller.loadRequest(
        Uri.parse('https://signlight.id.vn/luyen-ai'),
      );
    }
  }

  Future<void> _syncPage() async {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final tokenStorage = ref.read(tokenStorageProvider);
    final token = await tokenStorage.getAccessToken();
    final refreshToken = await tokenStorage.getRefreshToken();

    final script = '''
      (function() {
        try {
          // 1. Inject Token
          const params = new URLSearchParams(window.location.search);
          const urlToken = params.get('_token') || '${token ?? ''}';
          const urlRefresh = params.get('_refresh') || '${refreshToken ?? ''}';

          if (urlToken) {
            localStorage.setItem('signlight.accessToken', urlToken);
            if (urlRefresh) {
              localStorage.setItem('signlight.refreshToken', urlRefresh);
            }
            window.dispatchEvent(new Event('signlight:auth-change'));
          }

          // 2. Hide sidebar, header, navigation, and maximize practice container
          let styleEl = document.getElementById('flutter-embed-style');
          if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'flutter-embed-style';
            document.head.appendChild(styleEl);
          }

          const darkModeCss = ${isDark ? true : false} ? `
            html {
              filter: invert(0.9) hue-rotate(180deg) !important;
              background-color: #121212 !important;
            }
            img, video, canvas {
              filter: invert(1) hue-rotate(180deg) !important;
            }
          ` : '';

          styleEl.textContent = `
            /* Hide chrome */
            aside, header, [role="navigation"], nav, footer, button[aria-label="Mở menu"] {
              display: none !important;
            }
            main, [id="noi-dung-chinh"] {
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
            }
            body {
              overflow-x: hidden !important;
              background-color: #F8FAFC !important;
            }

            /* Match Flutter theme - simpler, less playful */
            .card, .card-flat {
              border-radius: 16px !important;
              border: 1px solid #E2E8F0 !important;
              box-shadow: none !important;
            }
            .btn {
              border-radius: 12px !important;
              height: 48px !important;
              padding-left: 20px !important;
              padding-right: 20px !important;
              font-weight: 600 !important;
              box-shadow: none !important;
            }
            .btn-sm {
              height: 40px !important;
              padding-left: 16px !important;
              padding-right: 16px !important;
            }
            .btn-primary {
              background-color: #2563EB !important;
              box-shadow: none !important;
            }
            .btn-primary:hover {
              background-color: #1D4ED8 !important;
            }
            .btn-secondary {
              background-color: white !important;
              border: 1px solid #CBD5E1 !important;
              color: #334155 !important;
            }
            .input {
              border-radius: 12px !important;
              border: 1px solid #CBD5E1 !important;
            }
            .chip {
              border-radius: 8px !important;
            }

            /* Reduce visual noise */
            .animate-float-slow,
            .animate-float-reverse,
            .animate-wave-hand,
            .animate-sign-pulse {
              animation: none !important;
            }

            /* Fix camera idle mascot size - hide video controls */
            video::-webkit-media-controls {
              display: none !important;
            }
            video::-webkit-media-controls-enclosure {
              display: none !important;
            }
            video::-webkit-media-controls-panel {
              display: none !important;
            }
            video {
              pointer-events: none !important;
            }
            /* Only Mascot inside camera container - NOT IconShield below */
            .relative.mx-auto.w-full.overflow-hidden .absolute.inset-0 svg {
              width: 85% !important;
              height: 85% !important;
              max-width: none !important;
              max-height: none !important;
            }
            /* Keep IconShield normal size */
            svg.text-brand-500, svg:has(path[d*="shield"]), p svg {
              width: 16px !important;
              height: 16px !important;
              max-width: 16px !important;
              max-height: 16px !important;
            }

            \${darkModeCss}
          `;

          // Xóa params token trên thanh URL cho sạch
          if (params.get('_token')) {
            window.history.replaceState({}, '', window.location.pathname);
          }
        } catch(e) {
          console.error('[Flutter] Sync failed:', e);
        }
      })();
    ''';

    await _controller.runJavaScript(script);
    debugPrint('[WebView] Page synced in app');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Stack(
          children: [
            WebViewWidget(controller: _controller),
            if (_isLoading) const Center(child: CircularProgressIndicator()),
          ],
        ),
      ),
    );
  }
}
