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

import java.time.Instant;
import java.util.UUID;

/**
 * Identite unifiee d'un utilisateur, independante des tenants.
 * Un compte peut etre lie a plusieurs associations (via public.affiliation).
 * password_hash : null pour les comptes crees uniquement via Google.
 * google_id     : null pour les comptes email/mot de passe.
 */
@Entity
@Table(name = "compte", schema = "public")
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

    public Compte(String email, String passwordHash, String nom, String prenom) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.nom = nom;
        this.prenom = prenom;
    }
}
