package vn.duy.signlight.content.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Biến thể video của một ký hiệu (vùng miền, người ký hiệu) — BR-A43. */
@Entity
@Table(name = "sign_video")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignVideo {

    @Id
    private UUID id;

    @Column(name = "sign_id", nullable = false)
    private UUID signId;

    /** Khoá trong object storage; URL phát cho client luôn là URL ký hạn 15 phút (BR-A17). */
    @Column(name = "object_key", nullable = false, length = 512)
    private String objectKey;

    @Column(name = "hls_manifest_key", length = 512)
    private String hlsManifestKey;

    @Column(nullable = false, length = 16)
    private String status;

    @Column(name = "region_label", length = 64)
    private String regionLabel;

    @Column(name = "signer_label", length = 64)
    private String signerLabel;

    @Column(name = "is_primary", nullable = false)
    private boolean primaryVariant;

    @Column(name = "duration_ms")
    private Integer durationMs;

    @Column(name = "is_seed", nullable = false)
    private boolean seed;
}
