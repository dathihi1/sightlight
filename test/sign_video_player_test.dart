import 'package:flutter_test/flutter_test.dart';
import 'package:sightlight_flutter/presentation/widgets/sign_video_player.dart';

void main() {
  test('adds the current revision to R2 sample videos', () {
    expect(
      withR2VideoRevision('https://pub-example.r2.dev/raw/000732.mp4'),
      'https://pub-example.r2.dev/raw/000732.mp4?v=20261102-cors-v2',
    );
  });

  test('preserves existing query parameters and non-R2 URLs', () {
    expect(
      withR2VideoRevision(
        'https://pub-example.r2.dev/raw/000010.mp4?download=1',
      ),
      'https://pub-example.r2.dev/raw/000010.mp4?download=1&v=20261102-cors-v2',
    );
    expect(
      withR2VideoRevision('https://cdn.example.com/video.mp4'),
      'https://cdn.example.com/video.mp4',
    );
  });
}
