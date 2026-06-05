package com.solivio.api.identity.domain;

import com.solivio.api.association.domain.Association;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Appartenance d'un Compte a une Association avec un role specifique.
 * Stockee dans le schema public : visible depuis tous les tenants.
 * Un utilisateur peut avoir plusieurs appartenances (une par association).
 * coordo_type : sous-type libre pour les coordinateurs (ex: coordo_sec, coordo_fruit).
 */
@Entity
@Table(name = "affiliation", schema = "public")
@Getter
@Setter
@NoArgsConstructor
public class MembreAssociation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "compte_id", nullable = false)
    private Compte compte;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "association_id", nullable = false)
    private Association association;

    @Column(nullable = false, length = 30)
    private String role;

    @Column(name = "coordo_type", length = 50)
    private String coordoType;

    @Column(nullable = false, length = 25)
    private String statut = "actif";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invite_par")
    private Compte invitePar;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut = LocalDate.now();

    @Column(name = "date_fin")
    private LocalDate dateFin;

    public MembreAssociation(Compte compte, Association association, String role) {
        this.compte = compte;
        this.association = association;
        this.role = role;
    }

    public boolean estActive() {
        return "actif".equals(statut) && (dateFin == null || dateFin.isAfter(LocalDate.now()));
    }
}
