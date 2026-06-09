package com.solivio.api.statistique.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Stats agregees d'une distribution, calculees et persistees a sa cloture.
 * Evite de recalculer les comptes depuis les inscriptions a chaque affichage.
 */
@Entity
@Table(name = "statistique_distribution")
@Getter
@Setter
@NoArgsConstructor
public class StatistiqueDistribution {

    @Id
    @Column(name = "distribution_id")
    private UUID distributionId;

    @Column(name = "distribution_date", nullable = false)
    private LocalDate distributionDate;

    @Column(name = "nb_inscrits_beneficiaires", nullable = false)
    private int nbInscritsBeneficiaires;

    @Column(name = "nb_inscrits_benevoles", nullable = false)
    private int nbInscritsBenevoles;

    @Column(name = "nb_presents_beneficiaires", nullable = false)
    private int nbPresentsBeneficiaires;

    @Column(name = "nb_absents_beneficiaires", nullable = false)
    private int nbAbsentsBeneficiaires;

    @Column(name = "nb_non_pointes", nullable = false)
    private int nbNonPointes;

    @Column(name = "taux_presence", nullable = false, precision = 5, scale = 2)
    private BigDecimal tauxPresence;

    @Column(name = "date_calcul", nullable = false)
    private Instant dateCalcul = Instant.now();

    public StatistiqueDistribution(
        UUID distributionId,
        LocalDate distributionDate,
        int nbInscritsBeneficiaires,
        int nbInscritsBenevoles,
        int nbPresentsBeneficiaires,
        int nbAbsentsBeneficiaires,
        int nbNonPointes
    ) {
        this.distributionId = distributionId;
        this.distributionDate = distributionDate;
        this.nbInscritsBeneficiaires = nbInscritsBeneficiaires;
        this.nbInscritsBenevoles = nbInscritsBenevoles;
        this.nbPresentsBeneficiaires = nbPresentsBeneficiaires;
        this.nbAbsentsBeneficiaires = nbAbsentsBeneficiaires;
        this.nbNonPointes = nbNonPointes;
        this.tauxPresence = calculerTauxPresence(nbInscritsBeneficiaires, nbPresentsBeneficiaires);
        this.dateCalcul = Instant.now();
    }

    private static BigDecimal calculerTauxPresence(int inscrits, int presents) {
        if (inscrits == 0) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(presents * 100.0 / inscrits)
            .setScale(2, java.math.RoundingMode.HALF_UP);
    }
}
