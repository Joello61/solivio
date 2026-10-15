package com.solivio.api.distribution.infrastructure.web.dto;

import java.time.LocalDate;
import java.time.LocalTime;

/** Prochaine distribution annoncee sur la page publique : aucun effectif ni donnee personnelle. */
public record DistributionPubliqueResponse(
    LocalDate date,
    LocalTime heureDebut,
    LocalTime heureFin,
    String lieuNom,
    String lieuAdresse,
    boolean complet
) {}
