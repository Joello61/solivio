package com.solivio.api.statistique.infrastructure.web.dto;

import java.time.LocalDate;

public record StatistiquePeriodeResponse(
    LocalDate debut,
    LocalDate fin,
    long nbDistributions,
    long nbBeneficiairesDistinctsServis,
    long nbBenevolesDistincts
) {}
