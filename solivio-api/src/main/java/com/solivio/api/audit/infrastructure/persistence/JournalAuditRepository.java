package com.solivio.api.audit.infrastructure.persistence;

import com.solivio.api.audit.domain.JournalAudit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface JournalAuditRepository extends JpaRepository<JournalAudit, UUID> {

    List<JournalAudit> findByTypeEntiteAndEntiteIdOrderByDateDesc(String typeEntite, UUID entiteId);
}
