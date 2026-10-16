package com.solivio.api.identity.application;

import com.solivio.api.audit.application.AuditService;
import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.MembreAssociation;
import com.solivio.api.identity.domain.Personne;
import com.solivio.api.identity.infrastructure.persistence.MembreAssociationRepository;
import com.solivio.api.identity.infrastructure.persistence.PersonneRepository;
import com.solivio.api.identity.infrastructure.web.dto.MembreResponse;
import com.solivio.api.identity.infrastructure.web.dto.UpdateRolesMembreRequest;
import com.solivio.api.shared.engagement.EngagementsAVenirPort;
import com.solivio.api.shared.exception.ConflictException;
import com.solivio.api.shared.exception.NotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MembreServiceTest {

    @Mock private MembreAssociationRepository membreRepository;
    @Mock private PersonneRepository personneRepository;
    @Mock private EngagementsAVenirPort inscriptions;
    @Mock private EngagementsAVenirPort missions;
    @Mock private GardeMembres garde;
    @Mock private AuditService auditService;

    private MembreService service;
    private final UUID compteId = UUID.randomUUID();
    private final UUID acteur = UUID.randomUUID();
    private final Compte compte = new Compte("lea@test.com", "hash", "Martin", "Lea");
    private final Personne personne = new Personne("Martin", "Lea", "lea@test.com");

    @BeforeEach
    void setUp() {
        service = new MembreService(membreRepository, personneRepository, List.of(inscriptions, missions),
            garde, auditService);
        compte.setId(compteId);
        personne.setId(UUID.randomUUID());
    }

    @Test
    void mettreAJourRoles_cumuleLesRoles() {
        MembreAssociation membre = membre("benevole");

        MembreResponse reponse = service.mettreAJourRoles(compteId,
            new UpdateRolesMembreRequest(List.of("benevole", "beneficiaire", "coordinateur"), "coordo_sec"), acteur);

        assertThat(reponse.roles()).containsExactly("beneficiaire", "benevole", "coordinateur");
        assertThat(membre.getCoordoType()).isEqualTo("coordo_sec");
        verify(auditService).tracer(acteur, "ROLE_MEMBRE_MODIFIE", "compte", compteId);
    }

    @Test
    void mettreAJourRoles_nommeResponsableSansEngagementAVenir() {
        membre("benevole", "beneficiaire");
        when(personneRepository.findByCompteEmail("lea@test.com")).thenReturn(Optional.of(personne));

        MembreResponse reponse = service.mettreAJourRoles(compteId,
            new UpdateRolesMembreRequest(List.of("responsable"), null), acteur);

        assertThat(reponse.roles()).containsExactly("responsable");
    }

    // Un responsable n'a pas d'autre role : ses inscriptions a venir resteraient sans titulaire.
    @Test
    void mettreAJourRoles_refuseResponsableAvecDesEngagementsAVenir() {
        MembreAssociation membre = membre("benevole");
        when(personneRepository.findByCompteEmail("lea@test.com")).thenReturn(Optional.of(personne));
        when(missions.aDesEngagementsAVenir(personne.getId())).thenReturn(true);

        assertThatThrownBy(() -> service.mettreAJourRoles(compteId,
                new UpdateRolesMembreRequest(List.of("responsable"), null), acteur))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("inscriptions à venir");
        assertThat(membre.getRoles()).containsExactly("benevole");
        verify(membreRepository, never()).save(any());
    }

    @Test
    void mettreAJourRoles_retrograderUnResponsableVerifieQuIlEnReste() {
        membre("responsable");

        service.mettreAJourRoles(compteId, new UpdateRolesMembreRequest(List.of("coordinateur"), null), acteur);

        verify(garde).garderUnResponsable(compteId);
    }

    @Test
    void ajouterMonRole_ajouteBeneficiaireAvecAttestation() {
        MembreAssociation membre = new MembreAssociation(compte, "benevole");
        when(membreRepository.findActifByCompteId(compteId)).thenReturn(Optional.of(membre));
        when(membreRepository.save(membre)).thenReturn(membre);

        MembreResponse reponse = service.ajouterMonRole(compteId, "beneficiaire", true);

        assertThat(reponse.roles()).containsExactly("beneficiaire", "benevole");
        verify(auditService).tracer(compteId, "ROLE_AJOUTE_PAR_MEMBRE", "compte", compteId);
    }

    @Test
    void ajouterMonRole_refuseBeneficiaireSansAttestation() {
        assertThatThrownBy(() -> service.ajouterMonRole(compteId, "beneficiaire", false))
            .isInstanceOf(IllegalArgumentException.class);
        verify(membreRepository, never()).save(any());
    }

    @Test
    void ajouterMonRole_refuseUnRoleDeGestion() {
        assertThatThrownBy(() -> service.ajouterMonRole(compteId, "coordinateur", false))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void ajouterMonRole_refuseUnMembreSuspendu() {
        when(membreRepository.findActifByCompteId(compteId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.ajouterMonRole(compteId, "benevole", false))
            .isInstanceOf(NotFoundException.class);
    }

    private MembreAssociation membre(String... roles) {
        MembreAssociation membre = new MembreAssociation(compte, List.of(roles));
        when(membreRepository.findByCompteId(compteId)).thenReturn(Optional.of(membre));
        lenient().when(membreRepository.save(membre)).thenReturn(membre);
        return membre;
    }
}
