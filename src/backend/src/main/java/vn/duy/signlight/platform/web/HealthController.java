package vn.duy.signlight.platform.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * api-spec §2 endpoint 1 — healthcheck công khai, dùng cho Docker healthcheck và trang trạng thái.
 *
 * <p>Cố ý trả <b>rất ít</b> thông tin: chỉ UP/DOWN từng phụ thuộc, không phiên bản, không cấu hình
 * (rủi ro DR-03 — lộ thông tin nội bộ).
 */
@RestController
@Tag(name = "platform")
@SecurityRequirements
public class HealthController {

    private static final Logger log = LoggerFactory.getLogger(HealthController.class);

    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/health")
    @Operation(summary = "Healthcheck")
    public ResponseEntity<Map<String, String>> health() {
        boolean databaseUp = checkDatabase();
        Map<String, String> body = new LinkedHashMap<>();
        body.put("status", databaseUp ? "UP" : "DOWN");
        body.put("db", databaseUp ? "UP" : "DOWN");
        return ResponseEntity.status(databaseUp ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
                .body(body);
    }

    private boolean checkDatabase() {
        try (var connection = dataSource.getConnection()) {
            return connection.isValid(2);
        } catch (java.sql.SQLException ex) {
            log.warn("health_db_down reason={}", ex.getClass().getSimpleName());
            return false;
        }
    }
}
