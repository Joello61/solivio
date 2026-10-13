package com.solivio.api.repartition.infrastructure.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record SaisirDenreeRequest(

    @NotBlank(message = "Le libelle est obligatoire")
    @Size(max = 200)
    String libelle,

    @NotBlank(message = "L'unite est obligatoire")
    @Size(max = 20)
    String unite,

    @Positive(message = "Le nombre de contenants doit etre positif")
    int nombreContenants,

    @NotNull
    @Positive(message = "La quantite par contenant doit etre positive")
    Double quantiteParContenant
) {}
