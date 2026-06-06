package com.solivio.api.distribution.domain;

public enum StatutDistribution {
    BROUILLON,
    PUBLIEE,
    EN_COURS,
    TERMINEE,
    ANNULEE;

    public boolean peutTransitionnerVers(StatutDistribution cible) {
        return switch (this) {
            case BROUILLON -> cible == PUBLIEE || cible == ANNULEE;
            case PUBLIEE -> cible == EN_COURS || cible == ANNULEE;
            case EN_COURS -> cible == TERMINEE || cible == ANNULEE;
            case TERMINEE, ANNULEE -> false;
        };
    }
}
