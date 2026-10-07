package com.solivio.api.identity.infrastructure.web.dto;

import jakarta.validation.constraints.Email;
import com.solivio.api.identity.infrastructure.web.validation.MotDePasseRobuste;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Inscription beneficiaire autonome.
 * codeAssociation : code court unique de l'association (ex: "PILOTE").
 * tokenInvitation : present si l'utilisateur arrive via un lien d'invitation
 *                   (remplace codeAssociation).
 */
public record RegisterRequest(
    @NotBlank @Email String email,
    @NotBlank @MotDePasseRobuste String motDePasse,
    @NotBlank @Size(max = 100) String nom,
    @NotBlank @Size(max = 100) String prenom,
    String tokenInvitation
) {}
