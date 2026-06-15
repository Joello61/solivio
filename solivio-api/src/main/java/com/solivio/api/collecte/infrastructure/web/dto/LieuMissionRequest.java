package com.solivio.api.collecte.infrastructure.web.dto;

import jakarta.validation.constraints.Size;

public record LieuMissionRequest(
    @Size(max = 500) String placeId,
    @Size(max = 500) String adresseFormatee,
    Double latitude,
    Double longitude
) {}
