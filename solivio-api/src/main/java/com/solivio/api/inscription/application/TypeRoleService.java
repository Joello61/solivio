package com.solivio.api.inscription.application;

import com.solivio.api.inscription.domain.TypeRole;
import com.solivio.api.inscription.infrastructure.persistence.TypeRoleRepository;
import com.solivio.api.inscription.infrastructure.web.dto.TypeRoleResponse;
import com.solivio.api.shared.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class TypeRoleService {

    private final TypeRoleRepository typeRoleRepository;

    public TypeRoleService(TypeRoleRepository typeRoleRepository) {
        this.typeRoleRepository = typeRoleRepository;
    }

    @Transactional(readOnly = true)
    public List<TypeRoleResponse> lister() {
        return typeRoleRepository.findByParentIsNullOrderByLibelleAsc()
            .stream()
            .map(this::toResponse)
            .toList();
    }

    public TypeRoleResponse creer(String libelle, UUID parentId) {
        TypeRole parent = null;
        if (parentId != null) {
            parent = typeRoleRepository.findById(parentId)
                .orElseThrow(() -> new NotFoundException("Type de role parent introuvable : " + parentId));
        }
        TypeRole typeRole = new TypeRole(parent, libelle);
        return toResponse(typeRoleRepository.save(typeRole));
    }

    public TypeRoleResponse modifier(UUID id, String libelle) {
        TypeRole typeRole = trouverOuEchouer(id);
        typeRole.setLibelle(libelle);
        return toResponse(typeRoleRepository.save(typeRole));
    }

    public void archiver(UUID id) {
        TypeRole typeRole = trouverOuEchouer(id);
        typeRole.setActif(false);
        typeRoleRepository.save(typeRole);
    }

    private TypeRole trouverOuEchouer(UUID id) {
        return typeRoleRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Type de role introuvable : " + id));
    }

    TypeRoleResponse toResponse(TypeRole t) {
        List<TypeRoleResponse> sousTypes = typeRoleRepository
            .findByParentIdOrderByLibelleAsc(t.getId())
            .stream()
            .map(this::toResponse)
            .toList();
        UUID parentId = t.getParent() != null ? t.getParent().getId() : null;
        return new TypeRoleResponse(t.getId(), parentId, t.getLibelle(), t.isActif(), sousTypes);
    }
}
