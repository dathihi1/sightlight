package vn.duy.signlight.identity.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.duy.signlight.identity.domain.AppUser;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {

    /** So khớp không phân biệt hoa thường, khớp với chỉ mục {@code uq_user_email_ci}. */
    @Query("select u from AppUser u where lower(u.email) = lower(:email)")
    Optional<AppUser> findByEmailIgnoreCase(@Param("email") String email);

    org.springframework.data.domain.Page<AppUser> findByEmailContainingIgnoreCase(
            String email, org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<AppUser> findByStatus(
            String status, org.springframework.data.domain.Pageable pageable);

    @Query(value = """
            select distinct u from AppUser u
            left join UserProfile p on p.userId = u.id
            left join u.roles r
            where (cast(:search as string) is null or lower(u.email) like lower(concat('%', cast(:search as string), '%'))
                   or lower(p.displayName) like lower(concat('%', cast(:search as string), '%')))
              and (:status is null or u.status = :status)
              and (:role is null or r = :role)
            """,
            countQuery = """
            select count(distinct u.id) from AppUser u
            left join UserProfile p on p.userId = u.id
            left join u.roles r
            where (cast(:search as string) is null or lower(u.email) like lower(concat('%', cast(:search as string), '%'))
                   or lower(p.displayName) like lower(concat('%', cast(:search as string), '%')))
              and (:status is null or u.status = :status)
              and (:role is null or r = :role)
            """)
    Page<AppUser> adminSearch(
            @Param("search") String search,
            @Param("status") String status,
            @Param("role") String role,
            Pageable pageable);

    Optional<AppUser> findByReferralCode(String referralCode);

    long countByReferredByUserId(UUID referredByUserId);

    java.util.List<AppUser> findByReferredByUserId(UUID referredByUserId);
}
