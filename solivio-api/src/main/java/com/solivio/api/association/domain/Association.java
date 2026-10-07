package com.solivio.api.association.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Configuration de l'association. Une seule ligne existe, creee par la
 * migration V2 (ADR-001) : l'application la lit et la modifie, jamais ne la cree.
 */
@Entity
@Table(name = "association")
@Getter
@Setter
@NoArgsConstructor
public class Association {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String nom;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "couleur_primaire", nullable = false, length = 7)
    private String couleurPrimaire;

    @Column(name = "couleur_secondaire", nullable = false, length = 7)
    private String couleurSecondaire;

    @Column(name = "fuseau_horaire", nullable = false, length = 50)
    private String fuseauHoraire;

    @Column(name = "frequence_max_par_semaine")
    private Integer frequenceMaxParSemaine;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "contact_telephone", length = 30)
    private String contactTelephone;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private Instant dateCreation;
}
