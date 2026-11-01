import 'package:flutter/material.dart';

import 'webview_practice_page.dart';

/// Practice hub delegating directly to WebView practice page.
class PracticeHubPage extends StatelessWidget {
  const PracticeHubPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const WebViewPracticePage();
  }
}
