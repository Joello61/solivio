package com.solivio.api.distribution.infrastructure.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record CreateDistributionRequest(
    @NotBlank @Size(max = 200) String titre,
    String description,
    @Size(max = 255) String lieu,
    @NotNull LocalDate date,
    @Positive int capaciteBeneficiaires,
    Integer capaciteBenevoles,
    String modeCreneau,
    @NotNull @Valid List<AjouterCreneauRequest> creneaux
) {}
