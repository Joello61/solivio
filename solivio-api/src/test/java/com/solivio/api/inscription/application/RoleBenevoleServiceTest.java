package com.solivio.api.inscription.application;

import com.solivio.api.inscription.domain.Inscription;
import com.solivio.api.inscription.domain.RoleBenevoleInscription;
import com.solivio.api.inscription.domain.TypeInscription;
import com.solivio.api.inscription.domain.TypeRole;
import com.solivio.api.inscription.infrastructure.persistence.InscriptionRepository;
import com.solivio.api.inscription.infrastructure.persistence.RoleBenevoleInscriptionRepository;
import com.solivio.api.inscription.infrastructure.persistence.TypeRoleRepository;
import com.solivio.api.inscription.infrastructure.web.dto.RoleBenevoleResponse;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RoleBenevoleServiceTest {

    @Mock private RoleBenevoleInscriptionRepository roleRepository;
    @Mock private InscriptionRepository inscriptionRepository;
    @Mock private TypeRoleRepository typeRoleRepository;

    private RoleBenevoleService service;

    private UUID inscriptionId;
    private Inscription inscription;

    @BeforeEach
    void setUp() {
        service = new RoleBenevoleService(roleRepository, inscriptionRepository, typeRoleRepository);
        inscriptionId = UUID.randomUUID();
        inscription = new Inscription(
            UUID.randomUUID(), null, UUID.randomUUID(), "Dupont", "Paul", TypeInscription.BENEVOLE
        );
        inscription.setId(inscriptionId);
    }

    @Test
    void assigner_avecTypeRoleCatalogue() {
        UUID typeRoleId = UUID.randomUUID();
        TypeRole typeRole = new TypeRole(null, "Distribution");
        typeRole.setId(typeRoleId);

        when(inscriptionRepository.findById(inscriptionId)).thenReturn(Optional.of(inscription));
        when(typeRoleRepository.findById(typeRoleId)).thenReturn(Optional.of(typeRole));
        when(roleRepository.save(any())).thenAnswer(inv -> {
            RoleBenevoleInscription r = inv.getArgument(0);
            r.setId(UUID.randomUUID());
            return r;
        });

        RoleBenevoleResponse response = service.assigner(inscriptionId, typeRoleId, null);

        assertThat(response.libelle()).isEqualTo("Distribution");
        assertThat(response.typeRoleId()).isEqualTo(typeRoleId);
    }

    @Test
    void assigner_avecLibelleLibre() {
        when(inscriptionRepository.findById(inscriptionId)).thenReturn(Optional.of(inscription));
        when(roleRepository.save(any())).thenAnswer(inv -> {
            RoleBenevoleInscription r = inv.getArgument(0);
            r.setId(UUID.randomUUID());
            return r;
        });

        RoleBenevoleResponse response = service.assigner(inscriptionId, null, "accueil");

        assertThat(response.libelle()).isEqualTo("accueil");
        assertThat(response.typeRoleId()).isNull();
    }

    @Test
    void assigner_echoueSiNiTypeRoleNiLibelleLibre() {
        // La validation se produit avant la recherche en base : aucun stub necessaire.
        assertThatThrownBy(() -> service.assigner(inscriptionId, null, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("requis");
    }

    @Test
    void assigner_echoueSiTypeRoleInexistant() {
        UUID typeRoleId = UUID.randomUUID();
        when(inscriptionRepository.findById(inscriptionId)).thenReturn(Optional.of(inscription));
        when(typeRoleRepository.findById(typeRoleId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.assigner(inscriptionId, typeRoleId, null))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining("Type de role introuvable");
    }

    @Test
    void assigner_echoueSiInscriptionInexistante() {
        when(inscriptionRepository.findById(inscriptionId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.assigner(inscriptionId, null, "accueil"))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining("Inscription introuvable");
    }

    @Test
    void retirer_supprimeLRole() {
        UUID roleId = UUID.randomUUID();
        RoleBenevoleInscription role = new RoleBenevoleInscription(inscription, null, "accueil");
        role.setId(roleId);

        when(inscriptionRepository.findById(inscriptionId)).thenReturn(Optional.of(inscription));
        when(roleRepository.findById(roleId)).thenReturn(Optional.of(role));

        service.retirer(inscriptionId, roleId);

        verify(roleRepository).delete(role);
    }

    @Test
    void retirer_echoueSiRoleNAppartientPasALInscription() {
        UUID roleId = UUID.randomUUID();
        Inscription autreInscription = new Inscription(
            UUID.randomUUID(), null, UUID.randomUUID(), "Martin", "Lea", TypeInscription.BENEVOLE
        );
        autreInscription.setId(UUID.randomUUID());

        RoleBenevoleInscription role = new RoleBenevoleInscription(autreInscription, null, "logistique");
        role.setId(roleId);

        when(inscriptionRepository.findById(inscriptionId)).thenReturn(Optional.of(inscription));
        when(roleRepository.findById(roleId)).thenReturn(Optional.of(role));

        assertThatThrownBy(() -> service.retirer(inscriptionId, roleId))
            .isInstanceOf(NotFoundException.class);
    }

    @Test
    void lister_retourneRolesDeLInscription() {
        TypeRole typeRole = new TypeRole(null, "Distribution");
        typeRole.setId(UUID.randomUUID());

        RoleBenevoleInscription r1 = new RoleBenevoleInscription(inscription, typeRole, null);
        r1.setId(UUID.randomUUID());
        RoleBenevoleInscription r2 = new RoleBenevoleInscription(inscription, null, "accueil");
        r2.setId(UUID.randomUUID());

        when(inscriptionRepository.findById(inscriptionId)).thenReturn(Optional.of(inscription));
        when(roleRepository.listerParInscription(inscriptionId)).thenReturn(List.of(r1, r2));

        List<RoleBenevoleResponse> result = service.lister(inscriptionId);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).libelle()).isEqualTo("Distribution");
        assertThat(result.get(1).libelle()).isEqualTo("accueil");
    }
}
