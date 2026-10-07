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
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

/**
 * Identite de connexion d'un utilisateur. Son role dans l'association est
 * porte par MembreAssociation.
 * password_hash : null pour les comptes crees uniquement via Google.
 * google_id     : null pour les comptes email/mot de passe.
 */
@Entity
@Table(name = "compte")
@Getter
@Setter
@NoArgsConstructor
public class Compte {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "google_id", unique = true)
    private String googleId;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(nullable = false, length = 100)
    private String prenom;

    @Column(name = "email_verifie", nullable = false)
    private boolean emailVerifie = false;

    @Column(nullable = false)
    private boolean actif = true;

    @Column(name = "is_super_admin", nullable = false)
    private boolean superAdmin = false;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private Instant dateCreation = Instant.now();

    @UpdateTimestamp
    @Column(name = "date_modification", nullable = false)
    private Instant dateModification = Instant.now();

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @Column(name = "echecs_connexion", nullable = false)
    private int echecsConnexion = 0;

    @Column(name = "verrouille_jusqu_a")
    private Instant verrouilleJusqua;

    public Compte(String email, String passwordHash, String nom, String prenom) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.nom = nom;
        this.prenom = prenom;
    }

    public boolean estVerrouille(Instant maintenant) {
        return verrouilleJusqua != null && maintenant.isBefore(verrouilleJusqua);
    }

    /**
     * Compte un echec de connexion ; au seuil, verrouille le compte pour la
     * duree donnee et repart de zero.
     */
    public void enregistrerEchecConnexion(Instant maintenant, int seuil, Duration duree) {
        echecsConnexion++;
        if (echecsConnexion >= seuil) {
            verrouilleJusqua = maintenant.plus(duree);
            echecsConnexion = 0;
        }
    }

    public void reinitialiserEchecsConnexion() {
        echecsConnexion = 0;
        verrouilleJusqua = null;
    }
}
