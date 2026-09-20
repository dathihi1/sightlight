package vn.duy.signlight.airecognition.web.dto;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * api-spec §3.12b — vốn ký hiệu AI và thông số schema cho client.
 *
 * <p>Cố ý **không** trả `confidenceThreshold`: ngưỡng là luật nghiệp vụ áp ở backend, lộ ra client là
 * chỉ cho người dùng cách lách (ADR-09).
 */
public record AiCapabilitiesResult(
        String modelVersion,
        int sequenceLength,
        int featureDim,
        String schemaVersion,
        int minFrames,
        int maxFrames,
        List<UUID> recognizableSignIds,
        LandmarkSpec landmarkSpec,
        String attributionText,
        String disclaimerText,
        boolean stubMode) {

    public record LandmarkSpec(
            List<Integer> poseLandmarkIndices,
            Map<String, List<Integer>> slices) {
    }
}
