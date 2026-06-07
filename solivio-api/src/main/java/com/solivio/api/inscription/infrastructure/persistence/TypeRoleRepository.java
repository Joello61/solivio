package com.solivio.api.inscription.infrastructure.persistence;

import com.solivio.api.inscription.domain.TypeRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TypeRoleRepository extends JpaRepository<TypeRole, UUID> {

    List<TypeRole> findByParentIsNullOrderByLibelleAsc();

    List<TypeRole> findByParentIdOrderByLibelleAsc(UUID parentId);
}
