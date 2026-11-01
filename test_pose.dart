import 'package:flutter/material.dart';
import 'package:sightlight_flutter/presentation/pages/pose_detection_test.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Pose Detection Test',
      theme: ThemeData.dark(),
      home: const PoseDetectionTest(),
    );
  }
}
