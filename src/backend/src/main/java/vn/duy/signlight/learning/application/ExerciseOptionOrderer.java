package vn.duy.signlight.learning.application;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import vn.duy.signlight.content.domain.Exercise;
import vn.duy.signlight.content.domain.ExerciseOption;

/**
 * Xáo lựa chọn và phân bổ vị trí đáp án đúng giữa các câu trong một lesson.
 *
 * <p>Vị trí đúng không bao giờ được serialize ra client; lớp này chỉ sắp xếp các entity
 * trước khi chuyển thành DTO công khai.
 */
final class ExerciseOptionOrderer {

    private static final String TYPE_SIGN_TO_MEANING = "SIGN_TO_MEANING";
    private static final String TYPE_MEANING_TO_SIGN = "MEANING_TO_SIGN";

    private ExerciseOptionOrderer() {
    }

    static OrderedOptions order(Exercise exercise, List<ExerciseOption> source,
            int lessonOffset, int choiceOrdinal, int previousCorrectPosition) {
        List<ExerciseOption> ordered = new ArrayList<>(source);
        Collections.shuffle(ordered);

        if (!isChoiceExercise(exercise) || ordered.size() < 2) {
            return new OrderedOptions(ordered, -1);
        }

        ExerciseOption correct = ordered.stream()
                .filter(ExerciseOption::isCorrect)
                .findFirst()
                .orElse(null);
        if (correct == null) {
            return new OrderedOptions(ordered, -1);
        }

        int targetPosition = Math.floorMod(lessonOffset + choiceOrdinal, ordered.size());
        if (targetPosition == previousCorrectPosition) {
            targetPosition = (targetPosition + 1) % ordered.size();
        }

        ordered.remove(correct);
        ordered.add(targetPosition, correct);
        return new OrderedOptions(ordered, targetPosition);
    }

    private static boolean isChoiceExercise(Exercise exercise) {
        return TYPE_SIGN_TO_MEANING.equals(exercise.getType())
                || TYPE_MEANING_TO_SIGN.equals(exercise.getType());
    }

    record OrderedOptions(List<ExerciseOption> options, int correctPosition) {
    }
}
