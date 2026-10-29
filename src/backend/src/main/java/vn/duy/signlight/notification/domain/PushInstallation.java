package vn.duy.signlight.notification.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "push_installation")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PushInstallation {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "firebase_installation_id", nullable = false, unique = true, length = 255)
    private String firebaseInstallationId;

    @Column(nullable = false, length = 16)
    private String platform;

    @Column(name = "permission_status", nullable = false, length = 16)
    private String permissionStatus;

    @Column(name = "last_seen_at", nullable = false)
    private Instant lastSeenAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
