package com.solivio.api.identity.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Individu dans l'association. Donnees de contact uniquement.
 * Les donnees sociales sensibles sont dans ProfilBeneficiaire (acces restreint).
 * Keycloak gere le mot de passe et l'authentification ; keycloakId est le seul pont.
 */
@Entity
@Table(name = "personne")
@Getter
@Setter
@NoArgsConstructor
public class Personne {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "keycloak_id", nullable = false, unique = true, length = 36)
    private String keycloakId;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(nullable = false, length = 100)
    private String prenom;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(length = 30)
    private String telephone;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private Instant dateCreation = Instant.now();

    @Column(name = "date_suppression")
    private Instant dateSuppression;

    public Personne(String keycloakId, String nom, String prenom, String email) {
        this.keycloakId = keycloakId;
        this.nom = nom;
        this.prenom = prenom;
        this.email = email;
    }

    public boolean estSupprimee() {
        return dateSuppression != null;
    }
}
