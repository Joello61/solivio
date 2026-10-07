package com.solivio.api.inscription.events;

import java.util.UUID;

/**
 * Un benevole se desiste peu avant la distribution : les coordinateurs sont alertes.
 */
public record DesistementTardifBenevole(UUID inscriptionId, UUID distributionId, UUID personneId) {}
