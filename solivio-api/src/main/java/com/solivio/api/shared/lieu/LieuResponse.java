package com.solivio.api.shared.lieu;

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
