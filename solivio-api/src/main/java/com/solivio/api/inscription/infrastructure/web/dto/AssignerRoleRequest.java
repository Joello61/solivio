package com.solivio.api.inscription.infrastructure.web.dto;

import java.util.UUID;

/**
 * typeRoleId : optionnel, pointe vers un type du catalogue de l'association.
 * libelleLibre : requis si typeRoleId est absent.
 * Au moins l'un des deux doit etre fourni (valide en service).
 */
public record AssignerRoleRequest(
    UUID typeRoleId,
    String libelleLibre
) {}
