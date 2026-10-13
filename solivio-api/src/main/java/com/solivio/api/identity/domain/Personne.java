package com.solivio.api.identity.domain;

import com.solivio.api.identity.events.PersonneEffacee;
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
 * Profil de contact d'un membre.
 * Les donnees sensibles (situation sociale) sont dans ProfilBeneficiaire.
 * Le lien avec Compte passe par compte_email, cle etrangere vers compte(email).
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

    @Column(name = "compte_email", unique = true)
    private String compteEmail;

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

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    public Personne(String nom, String prenom, String email) {
        this.nom = nom;
        this.prenom = prenom;
        this.email = email;
        this.compteEmail = email;
    }

    public boolean estSupprimee() {
        return dateSuppression != null;
    }

    /**
     * Anonymisation irreversible (RGPD) : la ligne reste pour l'historique des
     * inscriptions et les compteurs, sans plus aucune donnee personnelle. L'email
     * derive de l'identifiant respecte l'unicite sans designer personne.
     */
    public void anonymiser(Instant maintenant) {
        this.nom = PersonneEffacee.NOM_ANONYME;
        this.prenom = PersonneEffacee.PRENOM_ANONYME;
        this.email = "efface-" + id + "@solivio.invalid";
        this.compteEmail = null;
        this.telephone = null;
        this.photoUrl = null;
        this.dateSuppression = maintenant;
    }
}
