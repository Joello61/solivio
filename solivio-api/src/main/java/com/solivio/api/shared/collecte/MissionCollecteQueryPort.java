package com.solivio.api.shared.collecte;

import java.time.ZonedDateTime;
import java.util.UUID;

public interface MissionCollecteQueryPort {

    MissionInfo trouverMissionDetails(UUID missionId);

    record MissionInfo(
        UUID id,
        String titre,
        ZonedDateTime dateHeure,
        String lieuCollecteAdresse,
        String lieuDepotAdresse
    ) {}
}
