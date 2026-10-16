package com.solivio.api.identity.domain;

import com.solivio.api.shared.exception.ConflictException;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** ADR-012 : roles cumulables, responsable exclusif, toujours au moins un role. */
class MembreAssociationTest {

    private final Compte compte = new Compte("membre@test.com", "hash", "Nom", "Prenom");

    @Test
    void cumuleBenevoleBeneficiaireEtCoordinateur() {
        MembreAssociation membre = new MembreAssociation(compte, List.of("coordinateur", "benevole", "beneficiaire"));

        assertThat(membre.rolesTries()).containsExactly("beneficiaire", "benevole", "coordinateur");
        assertThat(membre.aLeRole("benevole")).isTrue();
        assertThat(membre.estResponsable()).isFalse();
    }

    @Test
    void refuseUnResponsableAvecUnAutreRole() {
        assertThatThrownBy(() -> new MembreAssociation(compte, List.of("responsable", "benevole")))
            .isInstanceOf(ConflictException.class);
    }

    @Test
    void refuseDeRetirerTousLesRoles() {
        MembreAssociation membre = new MembreAssociation(compte, "benevole");

        assertThatThrownBy(() -> membre.remplacerRoles(Set.of()))
            .isInstanceOf(ConflictException.class);
        assertThat(membre.getRoles()).containsExactly("benevole");
    }

    @Test
    void refuseUnRoleInconnu() {
        assertThatThrownBy(() -> new MembreAssociation(compte, "admin"))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void ajouterRole_completeLesRolesExistants() {
        MembreAssociation membre = new MembreAssociation(compte, "benevole");

        membre.ajouterRole("beneficiaire");

        assertThat(membre.getRoles()).containsExactlyInAnyOrder("benevole", "beneficiaire");
    }

    @Test
    void ajouterRole_refuseAUnResponsable() {
        MembreAssociation membre = new MembreAssociation(compte, "responsable");

        assertThatThrownBy(() -> membre.ajouterRole("benevole"))
            .isInstanceOf(ConflictException.class);
    }

    @Test
    void perdreLeRoleCoordinateurEffaceLeSousType() {
        MembreAssociation membre = new MembreAssociation(compte, List.of("coordinateur", "benevole"));
        membre.setCoordoType("coordo_sec");

        membre.remplacerRoles(Set.of("benevole"));

        assertThat(membre.getCoordoType()).isNull();
    }

    @Test
    void choisisSeul_accepteBenevoleEtBeneficiaireAvecAttestation() {
        assertThat(RolesMembre.choisisSeul(List.of("benevole", "beneficiaire"), true))
            .containsExactlyInAnyOrder("benevole", "beneficiaire");
        assertThat(RolesMembre.choisisSeul(List.of("benevole"), false)).containsExactly("benevole");
    }
}
