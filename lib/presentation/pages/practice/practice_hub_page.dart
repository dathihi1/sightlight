import 'package:flutter/material.dart';

import 'practice_page.dart';

/// Practice hub delegating directly to [PracticePage] (AI Camera Practice).
class PracticeHubPage extends StatelessWidget {
  const PracticeHubPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const PracticePage();
  }
}
