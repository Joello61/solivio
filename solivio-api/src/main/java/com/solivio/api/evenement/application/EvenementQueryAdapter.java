package com.solivio.api.evenement.application;

import com.solivio.api.evenement.domain.ParticipationEvenement;
import com.solivio.api.evenement.infrastructure.persistence.EvenementRepository;
import com.solivio.api.evenement.infrastructure.persistence.ParticipationEvenementRepository;
import com.solivio.api.shared.evenement.EvenementQueryPort;
import com.solivio.api.shared.exception.NotFoundException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Component
@Transactional(readOnly = true)
public class EvenementQueryAdapter implements EvenementQueryPort {

    private final EvenementRepository evenementRepository;
    private final ParticipationEvenementRepository participationRepository;

    public EvenementQueryAdapter(
        EvenementRepository evenementRepository,
        ParticipationEvenementRepository participationRepository
    ) {
        this.evenementRepository = evenementRepository;
        this.participationRepository = participationRepository;
    }

    @Override
    public EvenementInfo trouverEvenementDetails(UUID evenementId) {
        return evenementRepository.findById(evenementId)
            .map(e -> new EvenementInfo(
                e.getId(),
                e.getTitre(),
                e.getDateHeureDebut(),
                e.getLieuAdresseFormatee(),
                e.isABesoiNStaff(),
                e.isOuvertParticipants(),
                e.getPublicParticipants() != null ? e.getPublicParticipants().name() : null,
                e.getModeInscription().name(),
                e.getRaisonAnnulation()
            ))
            .orElseThrow(() -> new NotFoundException("Événement introuvable : " + evenementId));
    }

    @Override
    public List<UUID> trouverInscrits(UUID evenementId) {
        return participationRepository.findByEvenementIdOrderByDateInscriptionAsc(evenementId)
            .stream()
            .map(ParticipationEvenement::getPersonneId)
            .toList();
    }
}
