package com.solivio.api.identity.domain;

import java.util.Collection;
import java.util.Set;

/** Roles d'un membre de l'association (ADR-012), en minuscules comme dans la base. */
public final class RolesMembre {

    public static final String RESPONSABLE = "responsable";
    public static final String COORDINATEUR = "coordinateur";
    public static final String BENEVOLE = "benevole";
    public static final String BENEFICIAIRE = "beneficiaire";

    /** Roles qu'une personne choisit seule, a l'inscription ou depuis son espace. */
    public static final Set<String> LIBRES = Set.of(BENEVOLE, BENEFICIAIRE);

    /** Roles cumulables ; responsable ne se cumule avec aucun autre. */
    public static final Set<String> CUMULABLES = Set.of(COORDINATEUR, BENEVOLE, BENEFICIAIRE);

    /**
     * Roles choisis seul : benevole, beneficiaire ou les deux. Etre beneficiaire
     * suppose d'etre etudiant inscrit, ce que la personne atteste.
     */
    public static Set<String> choisisSeul(Collection<String> roles, boolean attestationEtudiant) {
        if (roles == null || roles.isEmpty()) {
            throw new IllegalArgumentException("Choisissez d'être bénévole, bénéficiaire, ou les deux.");
        }
        Set<String> choisis = Set.copyOf(roles);
        if (!LIBRES.containsAll(choisis)) {
            throw new IllegalArgumentException("Seuls les rôles bénévole et bénéficiaire se choisissent.");
        }
        if (choisis.contains(BENEFICIAIRE) && !attestationEtudiant) {
            throw new IllegalArgumentException(
                "Pour être bénéficiaire, confirmez être étudiant inscrit, avec votre carte étudiante.");
        }
        return choisis;
    }

    private RolesMembre() {
    }
}
