package vn.duy.signlight.learning.application;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import vn.duy.signlight.content.domain.Exercise;
import vn.duy.signlight.content.domain.ExerciseOption;

class ExerciseOptionOrdererTest {

    @Test
    void distributesCorrectAnswersWithoutRepeatingAdjacentPositions() {
        Exercise exercise = Exercise.builder()
                .id(UUID.randomUUID())
                .type("SIGN_TO_MEANING")
                .build();
        List<ExerciseOption> source = List.of(
                option(true), option(false), option(false), option(false));

        int previousPosition = -1;
        Set<Integer> usedPositions = new HashSet<>();
        for (int ordinal = 0; ordinal < 8; ordinal++) {
            var result = ExerciseOptionOrderer.order(
                    exercise, source, 0, ordinal, previousPosition);

            assertThat(result.correctPosition()).isNotEqualTo(previousPosition);
            assertThat(result.options().get(result.correctPosition()).isCorrect()).isTrue();
            usedPositions.add(result.correctPosition());
            previousPosition = result.correctPosition();
        }

        assertThat(usedPositions).containsExactlyInAnyOrder(0, 1, 2, 3);
        assertThat(source.get(0).isCorrect()).isTrue();
    }

    private ExerciseOption option(boolean correct) {
        return ExerciseOption.builder()
                .id(UUID.randomUUID())
                .correct(correct)
                .build();
    }
}
