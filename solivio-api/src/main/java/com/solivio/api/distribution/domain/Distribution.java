package com.solivio.api.distribution.domain;

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
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "distribution")
@Getter
@Setter
@NoArgsConstructor
public class Distribution {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Embedded
    private Lieu lieu;

    @Column(nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutDistribution statut = StatutDistribution.BROUILLON;

    @Column(name = "capacite_beneficiaires", nullable = false)
    private int capaciteBeneficiaires;

    @Column(name = "capacite_benevoles")
    private Integer capaciteBenevoles;

    @Enumerated(EnumType.STRING)
    @Column(name = "mode_creneau", nullable = false, length = 20)
    private ModeCreneauDistribution modeCreneau = ModeCreneauDistribution.CRENEAU_UNIQUE;

    @Enumerated(EnumType.STRING)
    @Column(name = "base_repartition", nullable = false, length = 20)
    private BaseRepartition baseRepartition = BaseRepartition.INSCRITS;

    @Column(name = "motif_annulation", columnDefinition = "TEXT")
    private String motifAnnulation;

    // Statut au moment de l'annulation, pour une reactivation (brouillon ou publiee).
    @Enumerated(EnumType.STRING)
    @Column(name = "statut_avant_annulation", length = 20)
    private StatutDistribution statutAvantAnnulation;

    @Column(name = "cree_par_id", nullable = false)
    private UUID creeParId;

    @Column(name = "unite_organisationnelle_id")
    private UUID uniteOrganisationnelleId;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private Instant dateCreation = Instant.now();

    public Distribution(
        String titre,
        String description,
        Lieu lieu,
        LocalDate date,
        int capaciteBeneficiaires,
        Integer capaciteBenevoles,
        ModeCreneauDistribution modeCreneau,
        UUID creeParId
    ) {
        this.titre = titre;
        this.description = description;
        this.lieu = lieu;
        this.date = date;
        this.capaciteBeneficiaires = capaciteBeneficiaires;
        this.capaciteBenevoles = capaciteBenevoles;
        this.modeCreneau = modeCreneau;
        this.creeParId = creeParId;
    }

    public void transitionnerVers(StatutDistribution cible, String motif) {
        if (!statut.peutTransitionnerVers(cible)) {
            throw new IllegalArgumentException(
                "Transition interdite : " + statut + " -> " + cible
            );
        }
        if (cible == StatutDistribution.ANNULEE) {
            this.motifAnnulation = motif;
            this.statutAvantAnnulation = statut;
        }
        this.statut = cible;
    }

    /** Demarrage accidentel : retour a publiee (le service verifie qu'aucun pointage n'a eu lieu). */
    public void annulerDemarrage() {
        if (statut != StatutDistribution.EN_COURS) {
            throw new IllegalStateException("Seule une distribution en cours peut revenir a publiee");
        }
        this.statut = StatutDistribution.PUBLIEE;
    }

    /**
     * Annulation par erreur : un brouillon redevient brouillon, une distribution publiee
     * ou demarree redevient publiee. Renvoie le statut retrouve.
     */
    public StatutDistribution reactiver() {
        if (statut != StatutDistribution.ANNULEE) {
            throw new IllegalStateException("Seule une distribution annulee peut etre reactivee");
        }
        this.statut = statutAvantAnnulation == StatutDistribution.BROUILLON
            ? StatutDistribution.BROUILLON
            : StatutDistribution.PUBLIEE;
        this.motifAnnulation = null;
        this.statutAvantAnnulation = null;
        return statut;
    }
}
