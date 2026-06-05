package com.solivio.api.identity.domain;

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
 * Lien entre une personne et son role dans l'association.
 * unite_organisationnelle_id est reserve pour la hierarchie multi-antennes (V3),
 * il est volontairement present mais toujours null en V1.
 */
@Entity
@Table(name = "affiliation")
@Getter
@Setter
@NoArgsConstructor
public class Affiliation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "personne_id", nullable = false)
    private Personne personne;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(name = "unite_organisationnelle_id")
    private UUID uniteOrganisationnelleId;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut = LocalDate.now();

    @Column(name = "date_fin")
    private LocalDate dateFin;

    public Affiliation(Personne personne, Role role) {
        this.personne = personne;
        this.role = role;
    }

    public boolean estActive() {
        return dateFin == null || dateFin.isAfter(LocalDate.now());
    }
}
