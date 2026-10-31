import 'dart:convert';
import 'dart:math' as math;
import 'dart:typed_data';
import 'package:flutter/services.dart';
import 'package:onnxruntime/onnxruntime.dart';

class LocalInferenceCandidate {
  final String label;
  final double confidence;

  const LocalInferenceCandidate({
    required this.label,
    required this.confidence,
  });
}

class LocalInferenceResult {
  final String predictedLabel;
  final double confidence;
  final List<LocalInferenceCandidate> top3;
  final int latencyMs;

  const LocalInferenceResult({
    required this.predictedLabel,
    required this.confidence,
    required this.top3,
    required this.latencyMs,
  });
}

class LocalRecognizer {
  static final LocalRecognizer instance = LocalRecognizer._();
  LocalRecognizer._();

  static const int sequenceLength = 64;
  static const int featureDim = 327;

  OrtSession? _session;
  List<String> _labels = [];
  String? _loadedModel;
  bool _isInitializing = false;

  bool get isReady => _session != null && _labels.isNotEmpty;
  int get labelCount => _labels.length;
  String? get loadedModel => _loadedModel;

  /// Load ONNX model and labels from bundled assets
  Future<bool> load({int modelSize = 30}) async {
    final modelDir = modelSize == 400
        ? 'assets/models/vsl_mvp400_v2_lite_transformer'
        : 'assets/models/vsl_mvp30_v2_lite_transformer';

    if (_session != null && _loadedModel == modelDir) return true;
    if (_isInitializing) return false;
    _isInitializing = true;

    try {
      // 1. Tải labels.json
      final labelsStr = await rootBundle.loadString('$modelDir/labels.json');
      final labelsJson = jsonDecode(labelsStr) as List<dynamic>;
      _labels = labelsJson.map((e) => e.toString()).toList();

      // 2. Khởi tạo OrtEnv
      OrtEnv.instance.init();

      // 3. Nạp model INT8
      final rawAsset = await rootBundle.load('$modelDir/model.int8.onnx');
      final bytes = rawAsset.buffer.asUint8List();

      final sessionOptions = OrtSessionOptions();
      _session?.release();
      _session = OrtSession.fromBuffer(bytes, sessionOptions);
      sessionOptions.release();

      _loadedModel = modelDir;
      return true;
    } catch (_) {
      return false;
    } finally {
      _isInitializing = false;
    }
  }

  /// Run on-device inference given extracted frame features [num_frames, 327]
  Future<LocalInferenceResult?> infer(List<List<double>> features) async {
    final session = _session;
    if (session == null || _labels.isEmpty) return null;

    final stopwatch = Stopwatch()..start();

    // Chuẩn bị tensor [1, 64, 327]
    final flat = Float32List(sequenceLength * featureDim);
    for (int f = 0; f < sequenceLength; f++) {
      final frame = f < features.length ? features[f] : const <double>[];
      for (int d = 0; d < featureDim; d++) {
        flat[f * featureDim + d] = d < frame.length ? frame[d] : 0.0;
      }
    }

    final inputOrt = OrtValueTensor.createTensorWithDataList(
      flat,
      [1, sequenceLength, featureDim],
    );
    final runOptions = OrtRunOptions();

    try {
      final inputName =
          session.inputNames.isNotEmpty ? session.inputNames.first : 'sequence';
      final inputs = {inputName: inputOrt};

      final outputs = session.run(runOptions, inputs);
      if (outputs.isEmpty || outputs.first == null) {
        return null;
      }

      final rawValue = outputs.first!.value;
      final logits = _flattenDoubles(rawValue);

      // Giải phóng bộ nhớ tensor outputs
      for (final out in outputs) {
        out?.release();
      }

      if (logits.isEmpty) return null;

      final probs = _softmax(logits);

      // Tìm top 3 nhãn có xác suất cao nhất
      final indexed = <MapEntry<int, double>>[];
      for (int i = 0; i < probs.length; i++) {
        indexed.add(MapEntry(i, probs[i]));
      }
      indexed.sort((a, b) => b.value.compareTo(a.value));

      final top3 = indexed.take(3).map((e) {
        final label =
            e.key < _labels.length ? _labels[e.key] : 'Sign #${e.key}';
        return LocalInferenceCandidate(label: label, confidence: e.value);
      }).toList();

      final latencyMs = stopwatch.elapsedMilliseconds;

      return LocalInferenceResult(
        predictedLabel:
            top3.isNotEmpty ? top3.first.label : 'Không xác định',
        confidence: top3.isNotEmpty ? top3.first.confidence : 0.0,
        top3: top3,
        latencyMs: latencyMs,
      );
    } catch (_) {
      return null;
    } finally {
      inputOrt.release();
      runOptions.release();
    }
  }

  List<double> _flattenDoubles(dynamic val) {
    if (val is List) {
      return val.expand((e) => _flattenDoubles(e)).toList();
    } else if (val is num) {
      return [val.toDouble()];
    }
    return [];
  }

  List<double> _softmax(List<double> logits) {
    if (logits.isEmpty) return [];
    final maxVal = logits.reduce(math.max);
    final exps = logits.map((x) => math.exp(x - maxVal)).toList();
    final sum = exps.reduce((a, b) => a + b);
    if (sum == 0) return List.filled(logits.length, 1.0 / logits.length);
    return exps.map((e) => e / sum).toList();
  }

  void release() {
    _session?.release();
    _session = null;
    _loadedModel = null;
    _labels = [];
    OrtEnv.instance.release();
  }
}
