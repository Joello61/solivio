package com.solivio.api.reconditionnement.infrastructure.web.dto;

import com.solivio.api.shared.web.Assainissement;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AnnulerSessionRequest(@NotBlank @Size(max = Assainissement.MOTIF_MAX) String motif) {}
