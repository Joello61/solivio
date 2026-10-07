package com.solivio.api.identity.infrastructure.web.dto;

import jakarta.validation.constraints.Email;
import com.solivio.api.identity.infrastructure.web.validation.MotDePasseRobuste;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ResetPasswordRequest(
    @NotBlank @Email String email,
    @NotBlank @Pattern(regexp = "\\d{6}") String code,
    @NotBlank @MotDePasseRobuste String nouveauMotDePasse
) {}
