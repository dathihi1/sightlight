package vn.duy.signlight.learning.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import vn.duy.signlight.content.domain.Exercise;
import vn.duy.signlight.content.domain.ExerciseOption;
import vn.duy.signlight.learning.web.dto.AnswerRequest;

class ExerciseGradingServiceTest {

    private final ExerciseGradingService gradingService = new ExerciseGradingService(new ObjectMapper());

    @Test
    void matchingAcceptsOnlyPairsWithTheSamePromptAndMeaningId() {
        UUID firstId = UUID.randomUUID();
        UUID secondId = UUID.randomUUID();
        Exercise exercise = Exercise.builder()
                .id(UUID.randomUUID())
                .type("MATCH_SIGN_MEANING")
                .build();
        List<ExerciseOption> options = List.of(
                option(firstId, "Anh"),
                option(secondId, "Cháu"));

        AnswerRequest correct = request(pair(firstId, firstId), pair(secondId, secondId));
        AnswerRequest swapped = request(pair(firstId, secondId), pair(secondId, firstId));

        assertThat(gradingService.grade(exercise, options, correct)).isTrue();
        assertThat(gradingService.grade(exercise, options, swapped)).isFalse();
    }

    private ExerciseOption option(UUID id, String label) {
        return ExerciseOption.builder().id(id).labelText(label).build();
    }

    private AnswerRequest.MatchPair pair(UUID promptId, UUID optionId) {
        AnswerRequest.MatchPair pair = new AnswerRequest.MatchPair();
        pair.setPromptId(promptId.toString());
        pair.setOptionId(optionId);
        return pair;
    }

    private AnswerRequest request(AnswerRequest.MatchPair... pairs) {
        AnswerRequest request = new AnswerRequest();
        request.setAnswerType("MATCH_SIGN_MEANING");
        request.setMatches(List.of(pairs));
        return request;
    }
}
