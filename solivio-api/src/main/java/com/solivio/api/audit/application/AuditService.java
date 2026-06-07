package com.solivio.api.audit.application;

import com.solivio.api.audit.domain.JournalAudit;
import com.solivio.api.audit.infrastructure.persistence.JournalAuditRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final JournalAuditRepository journalAuditRepository;

    public AuditService(JournalAuditRepository journalAuditRepository) {
        this.journalAuditRepository = journalAuditRepository;
    }

    /**
     * Enregistre une action sensible dans le journal d'audit.
     * S'execute dans sa propre transaction pour ne pas etre annule si la
     * transaction principale echoue (trace meme les tentatives).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void tracer(UUID acteurId, String action, String typeEntite, UUID entiteId) {
        try {
            journalAuditRepository.save(new JournalAudit(acteurId, action, typeEntite, entiteId));
        } catch (Exception e) {
            log.error("Echec enregistrement audit [{} {} {}]: {}", action, typeEntite, entiteId, e.getMessage());
        }
    }
}
