package com.solivio.api.distribution.infrastructure.web.dto;

public record LieuResponse(
    String placeId,
    String nom,
    String adresseFormatee,
    Double latitude,
    Double longitude,
    String numeroRue,
    String voie,
    String codePostal,
    String ville
) {}
