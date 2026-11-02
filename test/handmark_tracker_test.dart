import 'dart:ui';

import 'package:camera/camera.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';
import 'package:sightlight_flutter/core/ai/handmark_tracker.dart';

void main() {
  PoseLandmark point(PoseLandmarkType type, {double likelihood = 0.9}) =>
      PoseLandmark(type: type, x: 100, y: 100, z: 0, likelihood: likelihood);

  HandmarkSnapshot snapshot(Map<PoseLandmarkType, PoseLandmark> landmarks) =>
      HandmarkSnapshot(
        poses: [Pose(landmarks: landmarks)],
        imageSize: const Size(640, 480),
        rotation: InputImageRotation.rotation90deg,
        lensDirection: CameraLensDirection.front,
      );

  test('reports one visible hand from wrist and finger landmarks', () {
    final frame = snapshot({
      PoseLandmarkType.leftWrist: point(PoseLandmarkType.leftWrist),
      PoseLandmarkType.leftIndex: point(PoseLandmarkType.leftIndex),
    });

    expect(frame.leftVisible, isTrue);
    expect(frame.rightVisible, isFalse);
    expect(frame.visibleHandCount, 1);
  });

  test('reports two hands only when both have reliable landmarks', () {
    final frame = snapshot({
      PoseLandmarkType.leftWrist: point(PoseLandmarkType.leftWrist),
      PoseLandmarkType.leftThumb: point(PoseLandmarkType.leftThumb),
      PoseLandmarkType.rightWrist: point(PoseLandmarkType.rightWrist),
      PoseLandmarkType.rightPinky: point(PoseLandmarkType.rightPinky),
    });

    expect(frame.visibleHandCount, 2);
  });

  test('reports full 21-point MediaPipe hands on Android camera frames', () {
    final points = List.generate(
      21,
      (index) => HandmarkPoint(x: index / 20, y: index / 20, z: 0),
    );
    final frame = HandmarkSnapshot(
      poses: const [],
      mediaPipeHands: [points, points],
      imageSize: const Size(640, 480),
      rotation: InputImageRotation.rotation90deg,
      lensDirection: CameraLensDirection.front,
      sensorOrientation: 90,
    );

    expect(frame.visibleHandCount, 2);
    expect(frame.mediaPipeHands.first, hasLength(21));
  });
}
