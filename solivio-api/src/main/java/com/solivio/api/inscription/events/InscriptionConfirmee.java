package com.solivio.api.inscription.events;

import java.util.UUID;

/**
 * Une inscription est confirmee (place obtenue a l'inscription). occurrenceId est
 * propre a chaque publication : il sert de cle d'idempotence aux notifications,
 * une meme inscription pouvant etre confirmee de nouveau apres une desinscription.
 */
public record InscriptionConfirmee(
    UUID inscriptionId,
    UUID distributionId,
    UUID personneId,
    String typeInscription,
    UUID creneauId,
    UUID occurrenceId
) {}
