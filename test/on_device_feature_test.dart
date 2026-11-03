import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';
import 'package:sightlight_flutter/core/ai/handmark_tracker.dart';
import 'package:sightlight_flutter/core/ai/local_recognizer.dart';
import 'package:sightlight_flutter/core/ai/mediapipe_extractor.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('handmark snapshots create a real 64x327 on-device tensor', () async {
    final extractor = MediaPipeExtractor()..start();

    for (var frame = 0; frame < 12; frame++) {
      extractor.addHandmarkSnapshot(
        HandmarkSnapshot(
          poses: const [],
          mediaPipeHands: [
            List.generate(
              21,
              (point) => HandmarkPoint(
                x: 0.2 + point * 0.01 + frame * 0.002,
                y: 0.3 + point * 0.005,
                z: point * 0.001,
              ),
            ),
          ],
          imageSize: const Size(640, 480),
          rotation: InputImageRotation.rotation90deg,
          lensDirection: CameraLensDirection.front,
          sensorOrientation: 90,
        ),
      );
    }

    final result = extractor.finish();

    expect(result.features, hasLength(MediaPipeExtractor.SEQUENCE_LENGTH));
    expect(
      result.features.every(
        (frame) => frame.length == MediaPipeExtractor.FEATURE_DIM,
      ),
      isTrue,
    );
    expect(result.frameCount, 12);
    expect(result.quality.handFrameRatio, 1);
    expect(
      result.features.expand((frame) => frame).any((value) => value != 0),
      isTrue,
    );

    expect(await LocalRecognizer.instance.load(modelSize: 30), isTrue);
    final inference = await LocalRecognizer.instance.infer(result.features);
    expect(inference, isNotNull);
    expect(inference!.top3, hasLength(3));
  });
}
