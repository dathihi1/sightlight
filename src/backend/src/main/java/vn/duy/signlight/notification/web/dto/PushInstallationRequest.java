package vn.duy.signlight.notification.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PushInstallationRequest(
        @NotBlank
        @Size(max = 255)
        String installationId
) {}
