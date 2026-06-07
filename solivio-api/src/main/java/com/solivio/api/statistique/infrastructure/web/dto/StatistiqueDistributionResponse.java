package com.solivio.api.statistique.infrastructure.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record StatistiqueDistributionResponse(
    UUID distributionId,
    LocalDate distributionDate,
    int nbInscritsBeneficiaires,
    int nbInscritsBenevoles,
    int nbPresentsBeneficiaires,
    int nbAbsentsBeneficiaires,
    int nbNonPointes,
    BigDecimal tauxPresence,
    Instant dateCalcul
) {}
