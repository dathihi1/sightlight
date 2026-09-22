package vn.duy.signlight.identity.domain;

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

/** Định danh đăng nhập qua các nhà cung cấp bên ngoài (Google OIDC). */
@Entity
@Table(name = "auth_identity")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthIdentity {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 20)
    private String provider;

    @Column(name = "provider_user_id", nullable = false, length = 255)
    private String providerUserId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
