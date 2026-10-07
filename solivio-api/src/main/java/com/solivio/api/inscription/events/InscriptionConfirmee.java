package com.solivio.api.inscription.events;

import java.util.UUID;

/**
 * Une inscription est confirmee (place obtenue a l'inscription).
 */
public record InscriptionConfirmee(
    UUID inscriptionId,
    UUID distributionId,
    UUID personneId,
    String typeInscription,
    UUID creneauId
) {}
