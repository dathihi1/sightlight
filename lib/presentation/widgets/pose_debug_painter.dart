import 'package:flutter/material.dart';
import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';

/// Debug painter để vẽ pose landmarks lên camera preview
class PoseDebugPainter extends CustomPainter {
  final List<Pose> poses;
  final Size imageSize;
  final Size previewSize;
  final String? error;

  PoseDebugPainter({
    required this.poses,
    required this.imageSize,
    required this.previewSize,
    this.error,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (poses.isEmpty) return;

    final pose = poses.first;
    final scaleX = previewSize.width / imageSize.width;
    final scaleY = previewSize.height / imageSize.height;

    // Paint cho landmarks
    final pointPaint = Paint()
      ..color = Colors.green
      ..strokeWidth = 8
      ..style = PaintingStyle.fill;

    final wristPaint = Paint()
      ..color = Colors.red
      ..strokeWidth = 10
      ..style = PaintingStyle.fill;

    final linePaint = Paint()
      ..color = Colors.blue.withOpacity(0.5)
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;

    // Vẽ skeleton lines
    final connections = [
      [PoseLandmarkType.leftShoulder, PoseLandmarkType.rightShoulder],
      [PoseLandmarkType.leftShoulder, PoseLandmarkType.leftElbow],
      [PoseLandmarkType.leftElbow, PoseLandmarkType.leftWrist],
      [PoseLandmarkType.rightShoulder, PoseLandmarkType.rightElbow],
      [PoseLandmarkType.rightElbow, PoseLandmarkType.rightWrist],
      [PoseLandmarkType.leftShoulder, PoseLandmarkType.leftHip],
      [PoseLandmarkType.rightShoulder, PoseLandmarkType.rightHip],
      [PoseLandmarkType.leftHip, PoseLandmarkType.rightHip],
    ];

    for (final connection in connections) {
      final start = pose.landmarks[connection[0]];
      final end = pose.landmarks[connection[1]];
      if (start != null && end != null) {
        canvas.drawLine(
          Offset(start.x * scaleX, start.y * scaleY),
          Offset(end.x * scaleX, end.y * scaleY),
          linePaint,
        );
      }
    }

    // Vẽ landmarks
    pose.landmarks.forEach((type, landmark) {
      final x = landmark.x * scaleX;
      final y = landmark.y * scaleY;

      // Wrists màu đỏ, còn lại màu xanh
      final paint = (type == PoseLandmarkType.leftWrist ||
              type == PoseLandmarkType.rightWrist)
          ? wristPaint
          : pointPaint;

      canvas.drawCircle(Offset(x, y), 4, paint);
    });

    // Vẽ text debug info
    final status = error != null
        ? 'ERROR: $error'
        : poses.isEmpty
            ? 'No pose detected'
            : 'Pose detected\nWrists: ${_hasWrists(poses.first) ? "YES" : "NO"}';

    final textPainter = TextPainter(
      text: TextSpan(
        text: status,
        style: TextStyle(
          color: error != null ? Colors.red : Colors.white,
          fontSize: 14,
          backgroundColor: Colors.black87,
          fontWeight: FontWeight.bold,
        ),
      ),
      textDirection: TextDirection.ltr,
    );
    textPainter.layout(maxWidth: size.width - 20);
    textPainter.paint(canvas, const Offset(10, 10));
  }

  bool _hasWrists(Pose pose) {
    final leftWrist = pose.landmarks[PoseLandmarkType.leftWrist];
    final rightWrist = pose.landmarks[PoseLandmarkType.rightWrist];
    return leftWrist != null && rightWrist != null;
  }

  @override
  bool shouldRepaint(covariant PoseDebugPainter oldDelegate) {
    return oldDelegate.poses != poses ||
        oldDelegate.imageSize != imageSize ||
        oldDelegate.previewSize != previewSize;
  }
}
