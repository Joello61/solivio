package com.solivio.api.evenement.domain;

public enum StatutEvenement {
    BROUILLON,
    PUBLIE,
    EN_COURS,
    TERMINE,
    ANNULE;

    public boolean peutTransitionnerVers(StatutEvenement cible) {
        return switch (this) {
            case BROUILLON -> cible == PUBLIE || cible == ANNULE;
            case PUBLIE    -> cible == EN_COURS || cible == ANNULE;
            case EN_COURS  -> cible == TERMINE || cible == ANNULE;
            default        -> false;
        };
    }
}
