package com.solivio.api.reconditionnement.application;

import com.solivio.api.reconditionnement.domain.InscriptionReconditionnement;
import com.solivio.api.reconditionnement.infrastructure.persistence.InscriptionReconditionnementRepository;
import com.solivio.api.reconditionnement.infrastructure.persistence.SessionReconditionnementRepository;
import com.solivio.api.shared.exception.NotFoundException;
import com.solivio.api.shared.reconditionnement.SessionReconditionnementQueryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class SessionReconditionnementQueryAdapter implements SessionReconditionnementQueryPort {

    private final SessionReconditionnementRepository sessionRepository;
    private final InscriptionReconditionnementRepository inscriptionRepository;

    public SessionReconditionnementQueryAdapter(
        SessionReconditionnementRepository sessionRepository,
        InscriptionReconditionnementRepository inscriptionRepository
    ) {
        this.sessionRepository = sessionRepository;
        this.inscriptionRepository = inscriptionRepository;
    }

    @Override
    public SessionInfo trouverSessionDetails(UUID sessionId) {
        return sessionRepository.findById(sessionId)
            .map(s -> new SessionInfo(
                s.getId(),
                s.getTitre(),
                s.getDateHeureDebut(),
                s.getDateHeureFin(),
                s.getLieu() != null ? s.getLieu().getAdresseFormatee() : null
            ))
            .orElseThrow(() -> new NotFoundException("Session introuvable : " + sessionId));
    }

    @Override
    public List<UUID> trouverPersonnesInscritesConfirmees(UUID sessionId) {
        return inscriptionRepository.findBySessionId(sessionId).stream()
            .filter(i -> "CONFIRMEE".equals(i.getStatut()))
            .map(InscriptionReconditionnement::getPersonneId)
            .toList();
    }
}
