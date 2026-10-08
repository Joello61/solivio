package com.solivio.api.reconditionnement.domain;

import com.solivio.api.shared.lieu.Lieu;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "session_reconditionnement")
@Getter
@Setter
@NoArgsConstructor
public class SessionReconditionnement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Embedded
    private Lieu lieu;

    @Column(name = "date_heure_debut", nullable = false)
    private ZonedDateTime dateHeureDebut;

    @Column(name = "date_heure_fin", nullable = false)
    private ZonedDateTime dateHeureFin;

    @Column(name = "capacite")
    private Integer capacite;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutSessionReconditionnement statut = StatutSessionReconditionnement.BROUILLON;

    @Column(name = "motif_annulation", columnDefinition = "TEXT")
    private String motifAnnulation;

    @Column(name = "cree_par_id", nullable = false)
    private UUID creeParId;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private Instant dateCreation = Instant.now();

    public SessionReconditionnement(
        String titre,
        String description,
        Lieu lieu,
        ZonedDateTime dateHeureDebut,
        ZonedDateTime dateHeureFin,
        Integer capacite,
        UUID creeParId
    ) {
        this.titre = titre;
        this.description = description;
        this.lieu = lieu;
        this.dateHeureDebut = dateHeureDebut;
        this.dateHeureFin = dateHeureFin;
        this.capacite = capacite;
        this.creeParId = creeParId;
    }

    public void transitionnerVers(StatutSessionReconditionnement cible, String motif) {
        if (!statut.peutTransitionnerVers(cible)) {
            throw new IllegalArgumentException(
                "Transition interdite : " + statut + " -> " + cible
            );
        }
        if (cible == StatutSessionReconditionnement.ANNULEE) {
            this.motifAnnulation = motif;
        }
        this.statut = cible;
    }
}
