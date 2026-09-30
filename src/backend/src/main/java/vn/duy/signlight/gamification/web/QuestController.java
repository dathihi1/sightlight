package vn.duy.signlight.gamification.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.duy.signlight.common.error.ApiResponses;
import vn.duy.signlight.common.web.CurrentUser;
import vn.duy.signlight.common.web.RequestIdFilter;
import vn.duy.signlight.common.web.TransactionResponse;
import vn.duy.signlight.gamification.application.QuestService;
import vn.duy.signlight.gamification.web.dto.QuestProgressDto;

@RestController
@RequestMapping("/api/v1/quests")
@Tag(name = "quests")
public class QuestController {

    private final QuestService questService;

    public QuestController(QuestService questService) {
        this.questService = questService;
    }

    @GetMapping("/daily")
    @Operation(summary = "Lấy danh sách nhiệm vụ ngày và tiến độ của người học")
    public ResponseEntity<TransactionResponse<List<QuestProgressDto>>> getDailyQuests(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId) {
        List<QuestProgressDto> result = questService.getDailyQuests(CurrentUser.id());
        return ResponseEntity.ok(ApiResponses.ok(requestId, result));
    }

    @PostMapping("/{id}/claim")
    @Operation(summary = "Nhận thưởng hoàn thành nhiệm vụ")
    public ResponseEntity<TransactionResponse<QuestProgressDto>> claimReward(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable("id") UUID id) {
        QuestProgressDto result = questService.claimReward(CurrentUser.id(), id);
        return ResponseEntity.ok(ApiResponses.ok(requestId, result));
    }
}
