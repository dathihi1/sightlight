package vn.duy.signlight.common.web;

import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;

/** Lấy người dùng đang đăng nhập từ {@code SecurityContext}. */
public final class CurrentUser {

    private CurrentUser() {
    }

    public static UUID id() {
        return findId().orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHENTICATED));
    }

    public static java.util.Optional<UUID> findId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UUID userId) {
            return java.util.Optional.of(userId);
        }
        return java.util.Optional.empty();
    }

    public static boolean hasRole(String role) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }
        String target = role.startsWith("ROLE_") ? role : "ROLE_" + role;
        return authentication.getAuthorities().stream()
                .anyMatch(granted -> granted.getAuthority().equals(target));
    }
}
