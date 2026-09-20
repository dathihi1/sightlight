package vn.duy.signlight.content.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.content.domain.SignVideo;

public interface SignVideoRepository extends JpaRepository<SignVideo, UUID> {

    List<SignVideo> findBySignIdInOrderByPrimaryVariantDesc(Collection<UUID> signIds);

    List<SignVideo> findBySignId(UUID signId);
}
