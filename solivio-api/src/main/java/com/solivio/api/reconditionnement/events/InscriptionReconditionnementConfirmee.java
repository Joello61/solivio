package com.solivio.api.reconditionnement.events;

import java.util.UUID;

/**
 * Une personne s'inscrit (ou se reinscrit) a une session de reconditionnement.
 * L'occurrence distingue deux inscriptions successives de la meme personne : chacune
 * recoit sa confirmation, un rejeu de la meme occurrence n'en renvoie pas.
 */
public record InscriptionReconditionnementConfirmee(UUID sessionId, UUID personneId, UUID occurrenceId) {}
