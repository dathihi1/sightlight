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

    /** Khoá trong object storage (legacy MinIO/S3); để null khi dùng Google Drive. */
    @Column(name = "object_key", length = 512)
    private String objectKey;

    @Column(name = "storage_provider", nullable = false, length = 32)
    @Builder.Default
    private String storageProvider = "GDRIVE";

    @Column(name = "drive_file_id", length = 128)
    private String driveFileId;

    @Column(name = "direct_url", length = 1024)
    private String directUrl;

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
