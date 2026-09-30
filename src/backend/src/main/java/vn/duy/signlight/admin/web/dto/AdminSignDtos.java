package vn.duy.signlight.admin.web.dto;

import java.util.List;
import java.util.UUID;

public class AdminSignDtos {

    public record AdminSignItemDto(
            UUID id,
            String word,
            String meaning,
            String topic,
            String wordClass,
            String cefrLevel,
            String description,
            String status,
            UUID videoId,
            String videoUrl,
            String directUrl,
            String driveFileId,
            String storageProvider,
            String regionLabel,
            String signerLabel,
            Integer durationMs
    ) {}

    public record AdminSignListResponse(
            List<AdminSignItemDto> items,
            int totalPages,
            long totalElements,
            int currentPage
    ) {}

    public record AdminSignUpsertRequest(
            String word,
            String meaning,
            String topic,
            String wordClass,
            String cefrLevel,
            String description,
            String status,
            String directUrl,
            String driveFileId,
            String regionLabel,
            String signerLabel
    ) {}
}
