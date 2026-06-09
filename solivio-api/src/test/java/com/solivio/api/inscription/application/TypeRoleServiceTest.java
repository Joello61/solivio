package com.solivio.api.inscription.application;

import com.solivio.api.inscription.domain.TypeRole;
import com.solivio.api.inscription.infrastructure.persistence.TypeRoleRepository;
import com.solivio.api.inscription.infrastructure.web.dto.TypeRoleResponse;
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
class TypeRoleServiceTest {

    @Mock private TypeRoleRepository typeRoleRepository;

    private TypeRoleService service;

    @BeforeEach
    void setUp() {
        service = new TypeRoleService(typeRoleRepository);
    }

    @Test
    void creer_typeRolePrincipal() {
        TypeRole saved = new TypeRole(null, "Distribution");
        saved.setId(UUID.randomUUID());
        when(typeRoleRepository.save(any())).thenReturn(saved);
        when(typeRoleRepository.findByParentIdOrderByLibelleAsc(saved.getId())).thenReturn(List.of());

        TypeRoleResponse response = service.creer("Distribution", null);

        assertThat(response.libelle()).isEqualTo("Distribution");
        assertThat(response.parentId()).isNull();
        assertThat(response.actif()).isTrue();
    }

    @Test
    void creer_sousTypeAvecParentExistant() {
        UUID parentId = UUID.randomUUID();
        TypeRole parent = new TypeRole(null, "Distribution");
        parent.setId(parentId);

        TypeRole saved = new TypeRole(parent, "Distribution des patates");
        saved.setId(UUID.randomUUID());

        when(typeRoleRepository.findById(parentId)).thenReturn(Optional.of(parent));
        when(typeRoleRepository.save(any())).thenReturn(saved);
        when(typeRoleRepository.findByParentIdOrderByLibelleAsc(saved.getId())).thenReturn(List.of());

        TypeRoleResponse response = service.creer("Distribution des patates", parentId);

        assertThat(response.libelle()).isEqualTo("Distribution des patates");
        assertThat(response.parentId()).isEqualTo(parentId);
    }

    @Test
    void creer_echoueSiParentInexistant() {
        UUID parentId = UUID.randomUUID();
        when(typeRoleRepository.findById(parentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.creer("Sous-type", parentId))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining("parent introuvable");
    }

    @Test
    void modifier_changeLabelLibelle() {
        UUID id = UUID.randomUUID();
        TypeRole typeRole = new TypeRole(null, "Ancien libelle");
        typeRole.setId(id);
        when(typeRoleRepository.findById(id)).thenReturn(Optional.of(typeRole));
        when(typeRoleRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(typeRoleRepository.findByParentIdOrderByLibelleAsc(id)).thenReturn(List.of());

        TypeRoleResponse response = service.modifier(id, "Nouveau libelle");

        assertThat(response.libelle()).isEqualTo("Nouveau libelle");
    }

    @Test
    void archiver_desactiveLeTypeRole() {
        UUID id = UUID.randomUUID();
        TypeRole typeRole = new TypeRole(null, "Distribution");
        typeRole.setId(id);
        when(typeRoleRepository.findById(id)).thenReturn(Optional.of(typeRole));
        when(typeRoleRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.archiver(id);

        verify(typeRoleRepository).save(typeRole);
        assertThat(typeRole.isActif()).isFalse();
    }

    @Test
    void archiver_echoueSiInexistant() {
        UUID id = UUID.randomUUID();
        when(typeRoleRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.archiver(id))
            .isInstanceOf(NotFoundException.class);
    }

    @Test
    void lister_retourneArborescenceRoles() {
        UUID parentId = UUID.randomUUID();
        UUID sousTypeId = UUID.randomUUID();

        TypeRole parent = new TypeRole(null, "Distribution");
        parent.setId(parentId);

        TypeRole sousType = new TypeRole(parent, "Distribution des patates");
        sousType.setId(sousTypeId);

        when(typeRoleRepository.findByParentIsNullOrderByLibelleAsc()).thenReturn(List.of(parent));
        when(typeRoleRepository.findByParentIdOrderByLibelleAsc(parentId)).thenReturn(List.of(sousType));
        when(typeRoleRepository.findByParentIdOrderByLibelleAsc(sousTypeId)).thenReturn(List.of());

        List<TypeRoleResponse> result = service.lister();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).libelle()).isEqualTo("Distribution");
        assertThat(result.get(0).sousTypes()).hasSize(1);
        assertThat(result.get(0).sousTypes().get(0).libelle()).isEqualTo("Distribution des patates");
    }
}
