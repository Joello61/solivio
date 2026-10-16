package com.solivio.api.evenement.application;

import com.solivio.api.evenement.domain.StatutEvenement;
import com.solivio.api.evenement.infrastructure.persistence.ParticipationEvenementRepository;
import com.solivio.api.shared.engagement.EngagementsAVenirPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/** Une participation a un evenement publie ou en cours engage la personne. */
@Service
@Transactional(readOnly = true)
public class EngagementsEvenementAdapter implements EngagementsAVenirPort {

    private static final List<StatutEvenement> A_VENIR = List.of(StatutEvenement.PUBLIE, StatutEvenement.EN_COURS);

    private final ParticipationEvenementRepository participationRepository;

    public EngagementsEvenementAdapter(ParticipationEvenementRepository participationRepository) {
        this.participationRepository = participationRepository;
    }

    @Override
    public boolean aDesEngagementsAVenir(UUID personneId) {
        return participationRepository.existeParticipation(personneId, A_VENIR);
    }
}
