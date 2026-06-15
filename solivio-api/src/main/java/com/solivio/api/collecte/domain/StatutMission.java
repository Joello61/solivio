package com.solivio.api.collecte.domain;

public enum StatutMission {
    DISPONIBLE,
    PRISE_EN_CHARGE,
    COLLECTE_EFFECTUEE,
    DEPOT_VALIDE,
    ANNULEE;

    public boolean peutTransitionnerVers(StatutMission cible) {
        return switch (this) {
            case DISPONIBLE -> cible == PRISE_EN_CHARGE || cible == ANNULEE;
            // liberer = PRISE_EN_CHARGE → DISPONIBLE
            case PRISE_EN_CHARGE -> cible == DISPONIBLE || cible == COLLECTE_EFFECTUEE || cible == ANNULEE;
            case COLLECTE_EFFECTUEE -> cible == DEPOT_VALIDE || cible == ANNULEE;
            default -> false;
        };
    }
}
