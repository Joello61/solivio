package com.solivio.api.repartition.infrastructure.web.dto;

import java.util.List;
import java.util.UUID;

public record DotationResponse(
    UUID distributionId,
    String base,
    int nbBeneficiaires,
    List<DotationDenreeDto> denrees
) {}
