package com.solivio.api.shared.lieu;

import jakarta.validation.constraints.Size;

public record LieuRequest(
    @Size(max = 255) String placeId,
    @Size(max = 255) String nom,
    @Size(max = 500) String adresseFormatee,
    Double latitude,
    Double longitude,
    @Size(max = 20) String numeroRue,
    @Size(max = 255) String voie,
    @Size(max = 20) String codePostal,
    @Size(max = 100) String ville
) {}
