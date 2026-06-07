package com.solivio.api.shared.inscription;

import java.util.List;
import java.util.UUID;

public interface InscriptionQueryPort {

    int compterBeneficiairesInscrits(UUID distributionId);

    int compterBeneficiairesPresents(UUID distributionId);

    /**
     * Retourne tous les inscrits confirmes (beneficiaires et benevoles) pour une distribution.
     * Utilise pour l'envoi des emails de notification (annulation, rappel).
     */
    List<DestinataireMail> trouverInscritsConfirmes(UUID distributionId);

    record DestinataireMail(UUID personneId, String email, String prenom,
                            String typeInscription, UUID creneauId) {}
}
