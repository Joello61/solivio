package com.solivio.api.shared.reconditionnement;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

public interface SessionReconditionnementQueryPort {

    SessionInfo trouverSessionDetails(UUID sessionId);

    List<UUID> trouverPersonnesInscritesConfirmees(UUID sessionId);

    record SessionInfo(
        UUID id,
        String titre,
        ZonedDateTime dateHeureDebut,
        ZonedDateTime dateHeureFin,
        String lieu
    ) {}
}
