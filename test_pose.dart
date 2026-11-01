import 'package:flutter/material.dart';
import 'presentation/pages/pose_detection_test.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Pose Detection Test',
      theme: ThemeData.dark(),
      home: const PoseDetectionTest(),
    );
  }
}
