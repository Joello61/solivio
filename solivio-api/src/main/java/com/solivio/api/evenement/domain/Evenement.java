package com.solivio.api.evenement.domain;

import com.solivio.api.shared.exception.ConflictException;
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
@Table(name = "evenement")
@Getter
@Setter
@NoArgsConstructor
public class Evenement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TypeEvenement type = TypeEvenement.AUTRE;

    @Column(name = "lieu_place_id", length = 500)
    private String lieuPlaceId;

    @Column(name = "lieu_adresse_formatee", length = 500)
    private String lieuAdresseFormatee;

    @Column(name = "lieu_latitude")
    private Double lieuLatitude;

    @Column(name = "lieu_longitude")
    private Double lieuLongitude;

    @Column(name = "date_heure_debut", nullable = false)
    private ZonedDateTime dateHeureDebut;

    @Column(name = "date_heure_fin", nullable = false)
    private ZonedDateTime dateHeureFin;

    @Column(name = "a_besoin_staff", nullable = false)
    private boolean aBesoiNStaff = true;

    @Column(name = "ouvert_participants", nullable = false)
    private boolean ouvertParticipants = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "public_participants", length = 20)
    private PublicCible publicParticipants;

    @Enumerated(EnumType.STRING)
    @Column(name = "mode_inscription", nullable = false, length = 25)
    private ModeInscription modeInscription = ModeInscription.OBLIGATOIRE;

    @Column(name = "capacite_staff")
    private Integer capaciteStaff;

    @Column(name = "capacite_participants")
    private Integer capaciteParticipants;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutEvenement statut = StatutEvenement.BROUILLON;

    @Column(name = "raison_annulation", columnDefinition = "TEXT")
    private String raisonAnnulation;

    @Column(name = "cree_par_id", nullable = false)
    private UUID creeParId;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private Instant dateCreation = Instant.now();

    public Evenement(
        String titre,
        String description,
        TypeEvenement type,
        String lieuPlaceId,
        String lieuAdresseFormatee,
        Double lieuLatitude,
        Double lieuLongitude,
        ZonedDateTime dateHeureDebut,
        ZonedDateTime dateHeureFin,
        boolean aBesoiNStaff,
        boolean ouvertParticipants,
        PublicCible publicParticipants,
        ModeInscription modeInscription,
        Integer capaciteStaff,
        Integer capaciteParticipants,
        UUID creeParId
    ) {
        this.titre = titre;
        this.description = description;
        this.type = type != null ? type : TypeEvenement.AUTRE;
        this.lieuPlaceId = lieuPlaceId;
        this.lieuAdresseFormatee = lieuAdresseFormatee;
        this.lieuLatitude = lieuLatitude;
        this.lieuLongitude = lieuLongitude;
        this.dateHeureDebut = dateHeureDebut;
        this.dateHeureFin = dateHeureFin;
        this.aBesoiNStaff = aBesoiNStaff;
        this.ouvertParticipants = ouvertParticipants;
        this.publicParticipants = publicParticipants;
        this.modeInscription = modeInscription != null ? modeInscription : ModeInscription.OBLIGATOIRE;
        this.capaciteStaff = capaciteStaff;
        this.capaciteParticipants = capaciteParticipants;
        this.creeParId = creeParId;
    }

    public void transitionnerVers(StatutEvenement cible, String raison) {
        if (!statut.peutTransitionnerVers(cible)) {
            throw new ConflictException(
                "Transition impossible de " + statut + " vers " + cible);
        }
        if (cible == StatutEvenement.ANNULE) {
            this.raisonAnnulation = raison;
        }
        this.statut = cible;
    }
}
