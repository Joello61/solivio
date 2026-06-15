package com.solivio.api.reconditionnement.domain;

public enum StatutSessionReconditionnement {
    BROUILLON,
    PUBLIEE,
    EN_COURS,
    TERMINEE,
    ANNULEE;

    public boolean peutTransitionnerVers(StatutSessionReconditionnement cible) {
        return switch (this) {
            case BROUILLON -> cible == PUBLIEE || cible == ANNULEE;
            case PUBLIEE -> cible == EN_COURS || cible == ANNULEE;
            case EN_COURS -> cible == TERMINEE || cible == ANNULEE;
            case TERMINEE, ANNULEE -> false;
        };
    }
}
