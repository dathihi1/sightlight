import 'dart:io';
import 'dart:math' as math;

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';
import 'package:sightlight_flutter/core/ai/handmark_tracker.dart';

class HandmarkPainter extends CustomPainter {
  const HandmarkPainter(this.snapshot, {this.fit = BoxFit.cover});

  final HandmarkSnapshot? snapshot;
  final BoxFit fit;

  @override
  void paint(Canvas canvas, Size size) {
    final value = snapshot;
    if (value == null) return;
    if (value.mediaPipeHands.isNotEmpty) {
      _drawMediaPipeHands(canvas, size, value);
      return;
    }
    if (value.poses.isEmpty) return;
    final landmarks = value.poses.first.landmarks;
    _drawHand(canvas, size, value, landmarks, const [
      PoseLandmarkType.leftWrist,
      PoseLandmarkType.leftThumb,
      PoseLandmarkType.leftIndex,
      PoseLandmarkType.leftPinky,
    ], const Color(0xFF38BDF8));
    _drawHand(canvas, size, value, landmarks, const [
      PoseLandmarkType.rightWrist,
      PoseLandmarkType.rightThumb,
      PoseLandmarkType.rightIndex,
      PoseLandmarkType.rightPinky,
    ], const Color(0xFFFBBF24));
  }

  static const _mediaPipeConnections = <(int, int)>[
    (0, 1),
    (1, 2),
    (2, 3),
    (3, 4),
    (0, 5),
    (5, 6),
    (6, 7),
    (7, 8),
    (5, 9),
    (9, 10),
    (10, 11),
    (11, 12),
    (9, 13),
    (13, 14),
    (14, 15),
    (15, 16),
    (13, 17),
    (0, 17),
    (17, 18),
    (18, 19),
    (19, 20),
  ];

  void _drawMediaPipeHands(
    Canvas canvas,
    Size viewport,
    HandmarkSnapshot frame,
  ) {
    final image = frame.imageSize;
    final quarterTurn =
        frame.sensorOrientation == 90 || frame.sensorOrientation == 270;
    final orientedWidth = quarterTurn ? image.height : image.width;
    final orientedHeight = quarterTurn ? image.width : image.height;
    final scale = fit == BoxFit.contain
        ? math.min(
            viewport.width / orientedWidth,
            viewport.height / orientedHeight,
          )
        : math.max(
            viewport.width / orientedWidth,
            viewport.height / orientedHeight,
          );

    canvas.save();
    canvas.translate(viewport.width / 2, viewport.height / 2);
    canvas.rotate(frame.sensorOrientation * math.pi / 180);
    if (frame.lensDirection == CameraLensDirection.front) {
      canvas.scale(-1, 1);
      canvas.rotate(math.pi);
    }
    canvas.scale(scale);

    for (
      var handIndex = 0;
      handIndex < frame.mediaPipeHands.length;
      handIndex++
    ) {
      final hand = frame.mediaPipeHands[handIndex];
      if (hand.length < 21) continue;
      final color = handIndex.isEven
          ? const Color(0xFF38BDF8)
          : const Color(0xFFFBBF24);
      final linePaint = Paint()
        ..color = color
        ..strokeWidth = 3 / scale
        ..strokeCap = StrokeCap.round
        ..style = PaintingStyle.stroke;
      final pointPaint = Paint()
        ..color = Colors.white
        ..style = PaintingStyle.fill;
      final borderPaint = Paint()
        ..color = color
        ..strokeWidth = 2 / scale
        ..style = PaintingStyle.stroke;

      Offset pointAt(int index) => Offset(
        (hand[index].x - 0.5) * image.width,
        (hand[index].y - 0.5) * image.height,
      );

      for (final (start, end) in _mediaPipeConnections) {
        canvas.drawLine(pointAt(start), pointAt(end), linePaint);
      }
      for (var index = 0; index < 21; index++) {
        final point = pointAt(index);
        canvas.drawCircle(point, 4.5 / scale, pointPaint);
        canvas.drawCircle(point, 4.5 / scale, borderPaint);
      }
    }
    canvas.restore();
  }

  void _drawHand(
    Canvas canvas,
    Size viewport,
    HandmarkSnapshot frame,
    Map<PoseLandmarkType, PoseLandmark> landmarks,
    List<PoseLandmarkType> types,
    Color color,
  ) {
    final points = <Offset>[];
    for (final type in types) {
      final landmark = landmarks[type];
      if (landmark == null || landmark.likelihood < 0.35) continue;
      points.add(_project(landmark, frame, viewport));
    }
    if (points.length < 2) return;

    final linePaint = Paint()
      ..color = color
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;
    final pointPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
    final borderPaint = Paint()
      ..color = color
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    final wrist = points.first;
    for (final point in points.skip(1)) {
      canvas.drawLine(wrist, point, linePaint);
    }
    for (var index = 1; index < points.length - 1; index++) {
      canvas.drawLine(points[index], points[index + 1], linePaint);
    }
    for (final point in points) {
      canvas.drawCircle(point, 5, pointPaint);
      canvas.drawCircle(point, 5, borderPaint);
    }
  }

  Offset _project(
    PoseLandmark landmark,
    HandmarkSnapshot frame,
    Size viewport,
  ) {
    final image = frame.imageSize;
    final rotation = frame.rotation;
    late double normalizedX;
    late double normalizedY;
    switch (rotation) {
      case InputImageRotation.rotation90deg:
        normalizedX =
            landmark.x / (Platform.isIOS ? image.width : image.height);
        normalizedY =
            landmark.y / (Platform.isIOS ? image.height : image.width);
      case InputImageRotation.rotation270deg:
        normalizedX =
            1 - landmark.x / (Platform.isIOS ? image.width : image.height);
        normalizedY =
            landmark.y / (Platform.isIOS ? image.height : image.width);
      case InputImageRotation.rotation0deg:
      case InputImageRotation.rotation180deg:
        normalizedX = landmark.x / image.width;
        if (frame.lensDirection != CameraLensDirection.back) {
          normalizedX = 1 - normalizedX;
        }
        normalizedY = landmark.y / image.height;
    }

    final orientedWidth =
        rotation == InputImageRotation.rotation90deg ||
            rotation == InputImageRotation.rotation270deg
        ? image.height
        : image.width;
    final orientedHeight =
        rotation == InputImageRotation.rotation90deg ||
            rotation == InputImageRotation.rotation270deg
        ? image.width
        : image.height;
    final scale = fit == BoxFit.contain
        ? math.min(
            viewport.width / orientedWidth,
            viewport.height / orientedHeight,
          )
        : math.max(
            viewport.width / orientedWidth,
            viewport.height / orientedHeight,
          );
    final renderedWidth = orientedWidth * scale;
    final renderedHeight = orientedHeight * scale;
    return Offset(
      (viewport.width - renderedWidth) / 2 + normalizedX * renderedWidth,
      (viewport.height - renderedHeight) / 2 + normalizedY * renderedHeight,
    );
  }

  @override
  bool shouldRepaint(covariant HandmarkPainter oldDelegate) =>
      oldDelegate.snapshot != snapshot || oldDelegate.fit != fit;
}
