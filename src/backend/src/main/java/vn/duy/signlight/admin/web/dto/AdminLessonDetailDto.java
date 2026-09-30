package vn.duy.signlight.admin.web.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AdminLessonDetailDto(
        UUID id,
        UUID chapterId,
        String title,
        int orderIndex,
        String type,
        short estimatedMinutes,
        String status,
        String stableKey,
        String summary,
        String topic,
        String targetLevel,
        int contentVersion,
        Instant publishedAt,
        List<AdminExerciseDto> exercises,
        List<AdminBlockDto> blocks
) {

    public record AdminExerciseDto(
            UUID id,
            UUID lessonId,
            int orderIndex,
            String type,
            String skill,
            String difficulty,
            String promptText,
            String instructionText,
            String correctAnswerText,
            String acceptedAnswers,
            UUID signId,
            String signName,
            String videoUrl,
            boolean active,
            List<AdminOptionDto> options
    ) {}

    public record AdminOptionDto(
            UUID id,
            int orderIndex,
            String labelText,
            boolean isCorrect,
            UUID signVideoId
    ) {}

    public record AdminBlockDto(
            UUID id,
            UUID lessonId,
            int orderIndex,
            String stableKey,
            String blockType,
            String title,
            String bodyText,
            String mediaRef,
            boolean isRequired,
            String status
    ) {}

    public record ReorderRequest(
            List<UUID> orderedIds
    ) {}

    public record ExerciseUpsertRequest(
            String type,
            String skill,
            String difficulty,
            String promptText,
            String instructionText,
            String correctAnswerText,
            String acceptedAnswers,
            UUID signId,
            List<OptionItem> options
    ) {
        public record OptionItem(
                UUID id,
                String labelText,
                boolean isCorrect,
                int orderIndex
        ) {}
    }

    public record BlockUpsertRequest(
            String blockType,
            String title,
            String bodyText,
            String mediaRef,
            UUID signId,
            boolean isRequired,
            String status,
            String stableKey
    ) {}
}
