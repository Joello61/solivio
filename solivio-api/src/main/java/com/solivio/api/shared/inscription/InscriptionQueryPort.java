package com.solivio.api.shared.inscription;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface InscriptionQueryPort {

    int compterBeneficiairesInscrits(UUID distributionId);

    int compterBeneficiairesPresents(UUID distributionId);

    /**
     * Retourne tous les inscrits confirmes (beneficiaires et benevoles) pour une distribution.
     * Utilise pour l'envoi des emails de notification (annulation, rappel).
     */
    List<DestinataireMail> trouverInscritsConfirmes(UUID distributionId);

    /** Inscrits confirmes et en liste d'attente, prevenus d'une modification de la distribution. */
    List<DestinataireMail> trouverInscritsActifs(UUID distributionId);

    /** Nombre d'inscriptions confirmees d'un type (BENEFICIAIRE, BENEVOLE). */
    int compterConfirmes(UUID distributionId, String typeInscription);

    /**
     * Par creneau : inscriptions beneficiaires confirmees, et inscriptions de tout
     * statut (une inscription annulee reference encore son creneau).
     */
    Map<UUID, ComptesCreneau> compterParCreneau(UUID distributionId);

    /** Presences deja pointees, inscrits et visiteurs ponctuels confondus. */
    long compterPointages(UUID distributionId);

    record ComptesCreneau(int confirmes, int total) {}

    record DestinataireMail(UUID personneId, String email, String prenom,
                            String typeInscription, UUID creneauId) {}
}
