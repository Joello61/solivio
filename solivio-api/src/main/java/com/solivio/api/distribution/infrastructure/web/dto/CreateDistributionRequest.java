package com.solivio.api.distribution.infrastructure.web.dto;

import com.solivio.api.shared.lieu.LieuRequest;
import com.solivio.api.shared.web.Assainissement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record CreateDistributionRequest(
    @NotBlank @Size(max = 200) String titre,
    @Size(max = Assainissement.TEXTE_LONG_MAX) String description,
    @Valid LieuRequest lieu,
    @NotNull LocalDate date,
    @Positive int capaciteBeneficiaires,
    @PositiveOrZero Integer capaciteBenevoles,
    @Size(max = 20) String modeCreneau,
    @NotNull @Valid List<AjouterCreneauRequest> creneaux
) {}
