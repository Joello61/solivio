package com.solivio.api.repartition.infrastructure.web.dto;

import java.time.Instant;
import java.util.UUID;

public record CatalogueDenreeResponse(
    UUID id,
    String libelle,
    Instant dateCreation,
    Instant dateModification
) {}
