package com.solivio.api.collecte.domain;

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
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "mission_collecte")
@Getter
@Setter
@NoArgsConstructor
public class MissionCollecte {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "lieu_collecte_place_id", length = 500)
    private String lieuCollectePlaceId;

    @Column(name = "lieu_collecte_adresse", length = 500)
    private String lieuCollecteAdresse;

    @Column(name = "lieu_collecte_latitude")
    private Double lieuCollecteLatitude;

    @Column(name = "lieu_collecte_longitude")
    private Double lieuCollecteLongitude;

    @Column(name = "lieu_depot_place_id", length = 500)
    private String lieuDepotPlaceId;

    @Column(name = "lieu_depot_adresse", length = 500)
    private String lieuDepotAdresse;

    @Column(name = "lieu_depot_latitude")
    private Double lieuDepotLatitude;

    @Column(name = "lieu_depot_longitude")
    private Double lieuDepotLongitude;

    @Column(name = "date_heure", nullable = false)
    private ZonedDateTime dateHeure;

    @Column(name = "capacite_personnes", nullable = false)
    private int capacitePersonnes = 6;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatutMission statut = StatutMission.DISPONIBLE;

    @Column(name = "benevole_id")
    private UUID benevoleId;

    @Column(name = "date_prise_en_charge")
    private ZonedDateTime datePriseEnCharge;

    @Column(name = "date_collecte_effectuee")
    private ZonedDateTime dateCollecteEffectuee;

    @Column(name = "date_depot_valide")
    private ZonedDateTime dateDepotValide;

    @Column(name = "annulee_par")
    private UUID annuleePar;

    @Column(name = "raison_annulation", columnDefinition = "TEXT")
    private String raisonAnnulation;

    @Column(name = "cree_par_id", nullable = false)
    private UUID creeParId;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private Instant dateCreation = Instant.now();

    public MissionCollecte(
        String titre,
        String description,
        String lieuCollectePlaceId,
        String lieuCollecteAdresse,
        Double lieuCollecteLatitude,
        Double lieuCollecteLongitude,
        String lieuDepotPlaceId,
        String lieuDepotAdresse,
        Double lieuDepotLatitude,
        Double lieuDepotLongitude,
        ZonedDateTime dateHeure,
        int capacitePersonnes,
        UUID creeParId
    ) {
        this.titre = titre;
        this.description = description;
        this.lieuCollectePlaceId = lieuCollectePlaceId;
        this.lieuCollecteAdresse = lieuCollecteAdresse;
        this.lieuCollecteLatitude = lieuCollecteLatitude;
        this.lieuCollecteLongitude = lieuCollecteLongitude;
        this.lieuDepotPlaceId = lieuDepotPlaceId;
        this.lieuDepotAdresse = lieuDepotAdresse;
        this.lieuDepotLatitude = lieuDepotLatitude;
        this.lieuDepotLongitude = lieuDepotLongitude;
        this.dateHeure = dateHeure;
        this.capacitePersonnes = capacitePersonnes;
        this.creeParId = creeParId;
    }

    public void prendreEnCharge(UUID benevoleId) {
        transitionner(StatutMission.PRISE_EN_CHARGE);
        this.benevoleId = benevoleId;
        this.datePriseEnCharge = ZonedDateTime.now();
    }

    public void liberer() {
        transitionner(StatutMission.DISPONIBLE);
        this.benevoleId = null;
        this.datePriseEnCharge = null;
    }

    public void validerCollecte() {
        transitionner(StatutMission.COLLECTE_EFFECTUEE);
        this.dateCollecteEffectuee = ZonedDateTime.now();
    }

    public void validerDepot(UUID benevoleIdDemandeur) {
        if (!benevoleIdDemandeur.equals(this.benevoleId)) {
            throw new IllegalArgumentException(
                "Seul le bénévole assigné peut valider le dépôt"
            );
        }
        transitionner(StatutMission.DEPOT_VALIDE);
        this.dateDepotValide = ZonedDateTime.now();
    }

    public void annuler(UUID parId, String raison) {
        transitionner(StatutMission.ANNULEE);
        this.annuleePar = parId;
        this.raisonAnnulation = raison;
    }

    private void transitionner(StatutMission cible) {
        if (!statut.peutTransitionnerVers(cible)) {
            throw new IllegalArgumentException(
                "Transition interdite : " + statut + " -> " + cible
            );
        }
        this.statut = cible;
    }
}
