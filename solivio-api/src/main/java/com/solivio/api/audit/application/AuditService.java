package com.solivio.api.audit.application;

import com.solivio.api.audit.domain.JournalAudit;
import com.solivio.api.audit.infrastructure.persistence.JournalAuditRepository;
import com.solivio.api.shared.identity.CompteAuthentifie;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Journal des actions sensibles. La trace est ecrite dans la transaction de
 * l'action, appelee depuis le service metier : elle n'existe que si l'action est
 * validee, et une trace impossible a ecrire annule l'action (tracabilite exigee).
 */
@Service
public class AuditService {

    private final JournalAuditRepository journalAuditRepository;

    public AuditService(JournalAuditRepository journalAuditRepository) {
        this.journalAuditRepository = journalAuditRepository;
    }

    /** Trace au nom du compte authentifie de la requete (null pour un traitement systeme). */
    @Transactional(propagation = Propagation.MANDATORY)
    public void tracer(String action, String typeEntite, UUID entiteId) {
        tracer(acteurCourant(), action, typeEntite, entiteId);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void tracer(UUID acteurId, String action, String typeEntite, UUID entiteId) {
        journalAuditRepository.save(new JournalAudit(acteurId, action, typeEntite, entiteId));
    }

    private static UUID acteurCourant() {
        Authentication authentification = SecurityContextHolder.getContext().getAuthentication();
        if (authentification != null && authentification.getPrincipal() instanceof CompteAuthentifie compte) {
            return compte.getCompteId();
        }
        return null;
    }
}
