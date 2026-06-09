package com.solivio.api.notification.domain;

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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notification")
@Getter
@NoArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "personne_id", nullable = false)
    private UUID personneId;

    @Column(name = "distribution_id")
    private UUID distributionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_evenement", nullable = false, length = 35)
    private TypeEvenementNotification typeEvenement;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private CanalNotification canal = CanalNotification.EMAIL;

    @Column(nullable = false, length = 255)
    private String sujet;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private StatutNotification statut;

    @Column(columnDefinition = "TEXT")
    private String erreur;

    @Column(name = "date_envoi", nullable = false)
    private Instant dateEnvoi = Instant.now();

    public static Notification envoye(
        UUID personneId,
        UUID distributionId,
        TypeEvenementNotification typeEvenement,
        String sujet
    ) {
        Notification n = new Notification();
        n.personneId = personneId;
        n.distributionId = distributionId;
        n.typeEvenement = typeEvenement;
        n.sujet = sujet;
        n.statut = StatutNotification.ENVOYE;
        return n;
    }

    public static Notification echec(
        UUID personneId,
        UUID distributionId,
        TypeEvenementNotification typeEvenement,
        String sujet,
        String erreur
    ) {
        Notification n = new Notification();
        n.personneId = personneId;
        n.distributionId = distributionId;
        n.typeEvenement = typeEvenement;
        n.sujet = sujet;
        n.statut = StatutNotification.ECHEC;
        n.erreur = erreur;
        return n;
    }
}
