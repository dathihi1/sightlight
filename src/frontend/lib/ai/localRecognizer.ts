/**
 * Bộ suy luận AI trực tiếp trên trình duyệt bằng ONNX Runtime Web (WASM).
 *
 * Mô hình INT8 siêu nhẹ (~0.45MB cho 400 nhãn, ~0.42MB cho 30 nhãn).
 * Phản hồi tức thì <20ms mà không phụ thuộc vào kết nối mạng tới server AI.
 */

import * as ort from "onnxruntime-web";
import { FEATURE_DIM, SEQUENCE_LENGTH } from "../holistic/featureSchema";

export interface PredictionCandidate {
  label: string;
  confidence: number;
}

export interface LocalInferenceResult {
  predictedLabel: string;
  confidence: number;
  top3: PredictionCandidate[];
  latencyMs: number;
}

class LocalRecognizer {
  private session: ort.InferenceSession | null = null;
  private labels: string[] = [];
  private inputName: string = "";
  private isLoading = false;
  private currentModelType: string | null = null;

  async load(modelType: "vsl_mvp400_v2_lite_transformer" | "vsl_mvp30_v2_lite_transformer" | string = "vsl_mvp400_v2_lite_transformer"): Promise<boolean> {
    const normalizedType = modelType.includes("30")
      ? "vsl_mvp30_v2_lite_transformer"
      : "vsl_mvp400_v2_lite_transformer";

    if (this.session && this.currentModelType === normalizedType) return true;
    if (this.isLoading) return false;

    this.isLoading = true;
    try {
      if (this.session && this.currentModelType !== normalizedType) {
        this.session = null;
        this.labels = [];
      }

      // 1. Tải danh mục nhãn
      const labelsRes = await fetch(`/models/${normalizedType}/labels.json`);
      if (labelsRes.ok) {
        this.labels = await labelsRes.json();
      } else {
        throw new Error(`Failed to load labels: ${labelsRes.status}`);
      }

      // 2. Cấu hình ONNX WebAssembly đường dẫn cục bộ
      ort.env.wasm.wasmPaths = "/wasm/ort/";
      // 1 luồng: tránh SharedArrayBuffer đòi COOP/COEP mà môi trường trình duyệt thường không có.
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.simd = true;

      // 3. Nạp mô hình INT8
      const modelUrl = `/models/${normalizedType}/model.int8.onnx`;
      this.session = await ort.InferenceSession.create(modelUrl, {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all",
      });

      this.inputName = this.session.inputNames[0] ?? "sequence";
      this.currentModelType = normalizedType;
      return true;
    } catch (err) {
      console.warn("Không thể nạp mô hình ONNX tại client, sẽ rơi về backend API:", err);
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  get isReady(): boolean {
    return this.session !== null && this.labels.length > 0;
  }

  get labelCount(): number {
    return this.labels.length;
  }

  infer(features: number[][]): LocalInferenceResult | null {
    if (!this.session || this.labels.length === 0) return null;

    const started = performance.now();

    // Chuẩn bị tensor đầu vào 1 × 64 × 327
    const flat = new Float32Array(SEQUENCE_LENGTH * FEATURE_DIM);
    for (let f = 0; f < SEQUENCE_LENGTH; f++) {
      const frame = features[f] ?? [];
      for (let d = 0; d < FEATURE_DIM; d++) {
        flat[f * FEATURE_DIM + d] = frame[d] ?? 0.0;
      }
    }

    const tensor = new ort.Tensor("float32", flat, [1, SEQUENCE_LENGTH, FEATURE_DIM]);

    // Đồng bộ gọi suy luận
    // Lưu ý: session.run là Promise, nên hàm này xử lý bất đồng bộ
    return null; // Interface stub - xem inferAsync bên dưới
  }

  async inferAsync(features: number[][]): Promise<LocalInferenceResult | null> {
    if (!this.session || this.labels.length === 0) return null;

    const started = performance.now();

    // Chuẩn bị tensor đầu vào 1 × 64 × 327
    const flat = new Float32Array(SEQUENCE_LENGTH * FEATURE_DIM);
    for (let f = 0; f < SEQUENCE_LENGTH; f++) {
      const frame = features[f] ?? [];
      for (let d = 0; d < FEATURE_DIM; d++) {
        flat[f * FEATURE_DIM + d] = frame[d] ?? 0.0;
      }
    }

    const inputTensor = new ort.Tensor("float32", flat, [1, SEQUENCE_LENGTH, FEATURE_DIM]);
    const outputMap = await this.session.run({ [this.inputName]: inputTensor });

    const outputTensor = outputMap[this.session.outputNames[0]];
    if (!outputTensor) return null;

    const outputData = outputTensor.data as Float32Array;
    const probs = softmax(Array.from(outputData));

    // Tìm top 3
    const indexed = probs.map((p, i) => ({ label: this.labels[i] ?? `Sign #${i}`, confidence: p }));
    indexed.sort((a, b) => b.confidence - a.confidence);

    const top3 = indexed.slice(0, 3);
    const latencyMs = performance.now() - started;

    return {
      predictedLabel: top3[0]?.label ?? "Không xác định",
      confidence: top3[0]?.confidence ?? 0,
      top3,
      latencyMs,
    };
  }
}

function softmax(arr: number[]): number[] {
  const max = Math.max(...arr);
  const exps = arr.map((x) => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export const localRecognizer = new LocalRecognizer();
