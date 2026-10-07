package com.solivio.api.inscription.events;

import java.util.UUID;

/**
 * Une inscription passe de la liste d'attente a confirmee.
 */
public record InscriptionPromue(UUID inscriptionId, UUID distributionId, UUID personneId, String typeInscription, UUID creneauId) {}
