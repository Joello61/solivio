package com.solivio.api.reconditionnement.application;

import com.solivio.api.reconditionnement.domain.StatutSessionReconditionnement;
import com.solivio.api.reconditionnement.infrastructure.persistence.InscriptionReconditionnementRepository;
import com.solivio.api.shared.engagement.EngagementsAVenirPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/** Une inscription confirmee a une session publiee ou en cours engage le benevole. */
@Service
@Transactional(readOnly = true)
public class EngagementsReconditionnementAdapter implements EngagementsAVenirPort {

    private static final List<StatutSessionReconditionnement> A_VENIR =
        List.of(StatutSessionReconditionnement.PUBLIEE, StatutSessionReconditionnement.EN_COURS);

    private final InscriptionReconditionnementRepository inscriptionRepository;

    public EngagementsReconditionnementAdapter(InscriptionReconditionnementRepository inscriptionRepository) {
        this.inscriptionRepository = inscriptionRepository;
    }

    @Override
    public boolean aDesEngagementsAVenir(UUID personneId) {
        return inscriptionRepository.existeInscriptionConfirmee(personneId, A_VENIR);
    }
}
