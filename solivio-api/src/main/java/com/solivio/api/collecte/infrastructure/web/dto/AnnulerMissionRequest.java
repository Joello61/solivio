package com.solivio.api.collecte.infrastructure.web.dto;

import com.solivio.api.shared.web.Assainissement;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AnnulerMissionRequest(@NotBlank @Size(max = Assainissement.MOTIF_MAX) String raison) {}
