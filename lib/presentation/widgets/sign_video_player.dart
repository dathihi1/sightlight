import 'dart:async';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:sightlight_flutter/core/ai/handmark_tracker.dart';
import 'package:sightlight_flutter/presentation/widgets/handmark_painter.dart';
import 'package:video_player/video_player.dart';

class SignVideoPlayer extends StatefulWidget {
  const SignVideoPlayer({
    super.key,
    required this.videoUrl,
    this.autoPlay = true,
    this.looping = true,
    this.height = 240,
    this.placeholderText,
    this.isPlaceholder = false,
    this.compact = false,
    this.onAspectRatioChanged,
    this.handmarkEnabled = false,
    this.onHandmarkCountChanged,
  });

  final String videoUrl;
  final bool autoPlay;
  final bool looping;
  final double height;
  final String? placeholderText;
  final bool isPlaceholder;
  final bool compact;
  final ValueChanged<double>? onAspectRatioChanged;
  final bool handmarkEnabled;
  final ValueChanged<int>? onHandmarkCountChanged;

  @override
  State<SignVideoPlayer> createState() => _SignVideoPlayerState();
}

class _SignVideoPlayerState extends State<SignVideoPlayer> {
  VideoPlayerController? _controller;
  bool _isInitialized = false;
  bool _hasError = false;
  double _playbackSpeed = 1.0;
  final GlobalKey _videoBoundaryKey = GlobalKey();
  HandmarkTracker? _handmarkTracker;
  HandmarkSnapshot? _handmarkSnapshot;
  Timer? _handmarkTimer;
  bool _capturingHandmark = false;
  File? _handmarkFrameFile;

  @override
  void initState() {
    super.initState();
    _initializeVideo();
  }

  @override
  void didUpdateWidget(SignVideoPlayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.videoUrl != widget.videoUrl) {
      _controller?.dispose();
      _controller = null;
      _isInitialized = false;
      _hasError = false;
      _initializeVideo();
    }
    if (oldWidget.handmarkEnabled != widget.handmarkEnabled) {
      if (widget.handmarkEnabled) {
        _startSampleHandmark();
      } else {
        _stopSampleHandmark();
      }
    }
  }

  Future<void> _initializeVideo() async {
    if (widget.isPlaceholder || widget.videoUrl.trim().isEmpty) {
      return;
    }

    try {
      final uri = Uri.parse(widget.videoUrl);
      _controller = VideoPlayerController.networkUrl(uri);
      await _controller!.initialize();
      final aspectRatio = _controller!.value.aspectRatio;
      if (aspectRatio > 0) {
        widget.onAspectRatioChanged?.call(aspectRatio);
      }
      await _controller!.setLooping(widget.looping);
      await _controller!.setPlaybackSpeed(_playbackSpeed);
      if (widget.autoPlay) {
        await _controller!.play();
      }
      if (mounted) {
        setState(() {
          _isInitialized = true;
          _hasError = false;
        });
        if (widget.handmarkEnabled) _startSampleHandmark();
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _hasError = true;
        });
      }
    }
  }

  void _cycleSpeed() {
    if (_controller == null || !_isInitialized) return;
    const speeds = [0.5, 0.75, 1.0, 1.25];
    final nextIndex = (speeds.indexOf(_playbackSpeed) + 1) % speeds.length;
    final newSpeed = speeds[nextIndex];
    _controller!.setPlaybackSpeed(newSpeed);
    setState(() {
      _playbackSpeed = newSpeed;
    });
  }

  void _startSampleHandmark() {
    if (!mounted || !_isInitialized || !widget.handmarkEnabled) return;
    _handmarkTracker ??= HandmarkTracker();
    _handmarkTimer?.cancel();
    _handmarkTimer = Timer.periodic(
      const Duration(milliseconds: 350),
      (_) => unawaited(_captureSampleHandmark()),
    );
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => unawaited(_captureSampleHandmark()),
    );
  }

  void _stopSampleHandmark() {
    _handmarkTimer?.cancel();
    _handmarkTimer = null;
    _handmarkSnapshot = null;
    widget.onHandmarkCountChanged?.call(0);
    if (mounted) setState(() {});
  }

  Future<void> _captureSampleHandmark() async {
    if (_capturingHandmark || !mounted || !widget.handmarkEnabled) return;
    final controller = _controller;
    final boundary = _videoBoundaryKey.currentContext?.findRenderObject();
    if (controller == null ||
        !controller.value.isInitialized ||
        !controller.value.isPlaying ||
        boundary is! RenderRepaintBoundary) {
      return;
    }

    _capturingHandmark = true;
    try {
      final logicalWidth = boundary.size.width;
      final pixelRatio = logicalWidth > 360 ? 360 / logicalWidth : 1.0;
      final image = await boundary.toImage(pixelRatio: pixelRatio);
      final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
      if (bytes == null) return;
      final file = _handmarkFrameFile ??= File(
        '${Directory.systemTemp.path}${Platform.pathSeparator}'
        'signlight_sample_handmark_${identityHashCode(this)}.png',
      );
      await file.writeAsBytes(bytes.buffer.asUint8List(), flush: false);
      final tracker = _handmarkTracker;
      if (tracker == null) return;
      final snapshot = await tracker.processFile(
        file.path,
        Size(image.width.toDouble(), image.height.toDouble()),
      );
      if (!mounted || !widget.handmarkEnabled || snapshot == null) return;
      setState(() => _handmarkSnapshot = snapshot);
      widget.onHandmarkCountChanged?.call(snapshot.visibleHandCount);
    } catch (_) {
      // Một số GPU/texture không cho chụp frame trong lúc chuyển màn hình.
      // Bỏ qua frame đó và thử lại ở nhịp kế tiếp.
    } finally {
      _capturingHandmark = false;
    }
  }

  @override
  void dispose() {
    _handmarkTimer?.cancel();
    final tracker = _handmarkTracker;
    if (tracker != null) unawaited(tracker.close());
    final frameFile = _handmarkFrameFile;
    if (frameFile != null) {
      unawaited(frameFile.delete().catchError((_) => frameFile));
    }
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (widget.isPlaceholder || widget.videoUrl.trim().isEmpty) {
      if (widget.compact) {
        return Container(
          height: widget.height,
          color: theme.colorScheme.surfaceContainerHighest,
          alignment: Alignment.center,
          child: const Icon(Icons.play_circle_outline_rounded, size: 34),
        );
      }
      return Container(
        height: widget.height,
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerHighest.withAlpha(128),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: theme.colorScheme.outlineVariant.withAlpha(128),
          ),
        ),
        alignment: Alignment.center,
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: theme.colorScheme.primary.withAlpha(25),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.play_circle_outline_rounded,
                size: 32,
                color: theme.colorScheme.primary,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Video ký hiệu mẫu',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              widget.placeholderText ??
                  'Video mẫu sẽ được bổ sung cùng giáo trình chuẩn',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    if (_hasError) {
      if (widget.compact) {
        return Material(
          color: theme.colorScheme.surfaceContainerHighest,
          child: InkWell(
            onTap: () {
              setState(() {
                _hasError = false;
                _isInitialized = false;
              });
              _initializeVideo();
            },
            child: SizedBox(
              height: widget.height,
              child: Icon(
                Icons.refresh_rounded,
                size: 30,
                color: theme.colorScheme.error,
              ),
            ),
          ),
        );
      }
      return Container(
        height: widget.height,
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerHighest.withAlpha(128),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: theme.colorScheme.error.withAlpha(76)),
        ),
        alignment: Alignment.center,
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline_rounded,
              size: 40,
              color: theme.colorScheme.error,
            ),
            const SizedBox(height: 10),
            Text(
              'Không thể phát video này',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            TextButton.icon(
              onPressed: () {
                setState(() {
                  _hasError = false;
                  _isInitialized = false;
                });
                _initializeVideo();
              },
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('Thử lại'),
            ),
          ],
        ),
      );
    }

    if (!_isInitialized || _controller == null) {
      return Container(
        height: widget.height,
        decoration: BoxDecoration(
          color: Colors.black12,
          borderRadius: BorderRadius.circular(16),
        ),
        alignment: Alignment.center,
        child: const SizedBox(
          width: 32,
          height: 32,
          child: CircularProgressIndicator(strokeWidth: 2.5),
        ),
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: Container(
        height: widget.height,
        color: Colors.black,
        child: Stack(
          alignment: Alignment.center,
          children: [
            RepaintBoundary(
              key: _videoBoundaryKey,
              child: AspectRatio(
                aspectRatio: _controller!.value.aspectRatio > 0
                    ? _controller!.value.aspectRatio
                    : 16 / 9,
                child: VideoPlayer(_controller!),
              ),
            ),
            if (widget.handmarkEnabled)
              Positioned.fill(
                child: IgnorePointer(
                  child: CustomPaint(
                    painter: HandmarkPainter(
                      _handmarkSnapshot,
                      fit: BoxFit.contain,
                    ),
                  ),
                ),
              ),
            // Play / Pause Tap Overlay
            GestureDetector(
              behavior: HitTestBehavior.translucent,
              onTap: () {
                setState(() {
                  _controller!.value.isPlaying
                      ? _controller!.pause()
                      : _controller!.play();
                });
              },
              child: AnimatedOpacity(
                opacity: _controller!.value.isPlaying ? 0.0 : 0.8,
                duration: const Duration(milliseconds: 200),
                child: Container(
                  decoration: const BoxDecoration(
                    color: Colors.black38,
                    shape: BoxShape.circle,
                  ),
                  padding: const EdgeInsets.all(12),
                  child: const Icon(
                    Icons.play_arrow_rounded,
                    color: Colors.white,
                    size: 48,
                  ),
                ),
              ),
            ),
            // Speed indicator & controls bar
            if (!widget.compact)
              Positioned(
                bottom: 8,
                right: 8,
                child: InkWell(
                  onTap: _cycleSpeed,
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.black54,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.speed, color: Colors.white, size: 14),
                        const SizedBox(width: 4),
                        Text(
                          '${_playbackSpeed}x',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
