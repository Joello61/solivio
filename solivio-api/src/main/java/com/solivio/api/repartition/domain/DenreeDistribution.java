package com.solivio.api.repartition.domain;

import jakarta.persistence.Column;
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
import java.util.UUID;

@Entity
@Table(name = "denree_distribution")
@Getter
@Setter
@NoArgsConstructor
public class DenreeDistribution {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "distribution_id", nullable = false)
    private UUID distributionId;

    @Column(nullable = false, length = 200)
    private String libelle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UniteConditionnement unite;

    @Column(name = "nombre_contenants", nullable = false)
    private int nombreContenants;

    @Column(name = "quantite_par_contenant", nullable = false)
    private double quantiteParContenant;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private Instant dateCreation = Instant.now();

    public DenreeDistribution(
        UUID distributionId,
        String libelle,
        UniteConditionnement unite,
        int nombreContenants,
        double quantiteParContenant
    ) {
        this.distributionId = distributionId;
        this.libelle = libelle;
        this.unite = unite;
        this.nombreContenants = nombreContenants;
        this.quantiteParContenant = quantiteParContenant;
    }

    public double quantiteTotale() {
        return nombreContenants * quantiteParContenant;
    }
}
