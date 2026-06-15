package com.solivio.api.collecte.infrastructure.web.dto;

public record LieuMissionResponse(
    String placeId,
    String adresseFormatee,
    Double latitude,
    Double longitude
) {}
