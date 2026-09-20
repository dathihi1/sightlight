package vn.duy.signlight.identity.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.duy.signlight.identity.domain.AppUser;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {

    /** So khớp không phân biệt hoa thường, khớp với chỉ mục {@code uq_user_email_ci}. */
    @Query("select u from AppUser u where lower(u.email) = lower(:email)")
    Optional<AppUser> findByEmailIgnoreCase(@Param("email") String email);
}
