package com.solivio.api.repartition.infrastructure.web.dto;

import jakarta.validation.constraints.NotBlank;

public record CatalogueDenreeRequest(

    @NotBlank(message = "Le libelle est obligatoire")
    String libelle
) {}
