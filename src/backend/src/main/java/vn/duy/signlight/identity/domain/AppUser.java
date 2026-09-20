package vn.duy.signlight.identity.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Tài khoản người dùng. Entity <b>không</b> rời khỏi tầng service (package-structure §5). */
@Entity
@Table(name = "app_user")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppUser {

    @Id
    private UUID id;

    /** Luôn lưu chữ thường; chỉ mục UNIQUE đặt trên {@code lower(email)}. */
    @Column(nullable = false, length = 254)
    private String email;

    @Column(name = "email_verified_at")
    private Instant emailVerifiedAt;

    /** Argon2id. NULL khi tài khoản chỉ đăng nhập bằng Google (FR-03). */
    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Column(nullable = false, length = 24)
    private String status;

    @Column(name = "deletion_requested_at")
    private Instant deletionRequestedAt;

    @Column(name = "failed_login_count", nullable = false)
    private short failedLoginCount;

    @Column(name = "locked_until")
    private Instant lockedUntil;

    /** R-07: dưới 16 tuổi vẫn học đầy đủ nhưng không được bật góp dữ liệu (BR-A137). */
    @Column(name = "birth_year")
    private Short birthYear;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_role", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role", nullable = false, length = 24)
    @Builder.Default
    private Set<String> roles = new LinkedHashSet<>();
}
