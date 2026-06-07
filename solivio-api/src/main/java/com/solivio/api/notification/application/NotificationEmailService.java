package com.solivio.api.notification.application;

import com.solivio.api.shared.distribution.DistributionQueryPort.DistributionDetailInfo;

import java.time.LocalTime;

public interface NotificationEmailService {

    void envoyerConfirmationInscription(String email, ContexteEmail contexte);

    void envoyerPromotionListeAttente(String email, ContexteEmail contexte);

    void envoyerAnnulationDistribution(String email, ContexteEmail contexte);

    void envoyerRappelVeille(String email, ContexteEmail contexte);

    void envoyerDesistementTardifBenevole(String emailCoordinateur, String prenomCoordinateur,
                                          String prenomBenevole, String nomBenevole,
                                          DistributionDetailInfo distribution);

    /**
     * Contexte complet pour la generation d'un email de notification.
     * heureDebutCreneau et heureFinCreneau sont null pour les distributions en creneau unique.
     * heureArriveeBenevole est calcule automatiquement (1h30 avant heureDebutCreneau),
     * ou null si pas de creneau.
     */
    record ContexteEmail(
        String prenom,
        boolean estBenevole,
        LocalTime heureDebutCreneau,
        LocalTime heureFinCreneau,
        LocalTime heureArriveeBenevole,
        DistributionDetailInfo distribution
    ) {
        public static ContexteEmail of(
            String prenom,
            String typeInscription,
            LocalTime heureDebutCreneau,
            LocalTime heureFinCreneau,
            DistributionDetailInfo distribution
        ) {
            boolean benevole = "BENEVOLE".equals(typeInscription);
            LocalTime heureArrivee = (benevole && heureDebutCreneau != null)
                ? heureDebutCreneau.minusMinutes(90)
                : null;
            return new ContexteEmail(prenom, benevole,
                heureDebutCreneau, heureFinCreneau, heureArrivee, distribution);
        }
    }
}
