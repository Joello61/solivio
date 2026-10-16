package com.solivio.api.identity.infrastructure.web.dto;

import jakarta.validation.constraints.Email;
import com.solivio.api.identity.infrastructure.web.validation.MotDePasseRobuste;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Creation d'un compte.
 * roles : benevole, beneficiaire ou les deux ; ignores avec une invitation, qui fixe le role.
 * attestationEtudiant : la personne atteste etre etudiante inscrite (requis pour beneficiaire).
 * tokenInvitation : present si l'utilisateur arrive via un lien d'invitation.
 */
public record RegisterRequest(
    @NotBlank @Email String email,
    @NotBlank @MotDePasseRobuste String motDePasse,
    @NotBlank @Size(max = 100) String nom,
    @NotBlank @Size(max = 100) String prenom,
    @Size(max = 2) List<@NotBlank String> roles,
    boolean attestationEtudiant,
    String tokenInvitation
) {}
