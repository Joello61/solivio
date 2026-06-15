package com.solivio.api.shared.evenement;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

public interface EvenementQueryPort {

    EvenementInfo trouverEvenementDetails(UUID evenementId);

    List<UUID> trouverInscrits(UUID evenementId);

    record EvenementInfo(
        UUID id,
        String titre,
        ZonedDateTime dateHeureDebut,
        String lieuAdresseFormatee,
        boolean aBesoiNStaff,
        boolean ouvertParticipants,
        String publicParticipants,
        String modeInscription,
        String raisonAnnulation
    ) {}
}
