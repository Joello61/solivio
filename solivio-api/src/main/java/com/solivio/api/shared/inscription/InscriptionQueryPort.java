package com.solivio.api.shared.inscription;

import java.util.UUID;

public interface InscriptionQueryPort {

    int compterBeneficiairesInscrits(UUID distributionId);

    int compterBeneficiairesPresents(UUID distributionId);
}
