package com.solivio.api.inscription.events;

import java.util.List;
import java.util.UUID;

/**
 * Les inscriptions actives (confirmees et en liste d'attente) d'une distribution
 * annulee ont ete annulees : chaque personne concernee est prevenue (RG6).
 */
public record InscriptionsAnnuleesParDistribution(
    UUID distributionId,
    List<InscriptionAnnulee> inscriptions,
    // Distingue deux annulations de la meme distribution (apres une reactivation).
    UUID occurrenceId
) {

    public record InscriptionAnnulee(UUID inscriptionId, UUID personneId, String typeInscription, UUID creneauId) {}
}
