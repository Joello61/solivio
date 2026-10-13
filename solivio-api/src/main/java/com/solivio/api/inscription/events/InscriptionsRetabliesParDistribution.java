package com.solivio.api.inscription.events;

import java.util.List;
import java.util.UUID;

/**
 * Inscriptions d'une distribution reactivee : celles qui ont ete retablies, et celles
 * qui ne l'ont pas ete parce que la personne s'est inscrite ailleurs la meme semaine
 * (RG1). Chaque personne est prevenue.
 */
public record InscriptionsRetabliesParDistribution(
    UUID distributionId,
    List<InscriptionConcernee> retablies,
    List<InscriptionConcernee> nonRetablies,
    UUID occurrenceId
) {

    public record InscriptionConcernee(UUID inscriptionId, UUID personneId, String typeInscription, UUID creneauId) {}
}
