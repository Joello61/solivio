package com.solivio.api.inscription.application;

import com.solivio.api.inscription.domain.Inscription;
import com.solivio.api.inscription.domain.RoleBenevoleInscription;
import com.solivio.api.inscription.domain.TypeRole;
import com.solivio.api.inscription.infrastructure.persistence.InscriptionRepository;
import com.solivio.api.inscription.infrastructure.persistence.RoleBenevoleInscriptionRepository;
import com.solivio.api.inscription.infrastructure.persistence.TypeRoleRepository;
import com.solivio.api.inscription.infrastructure.web.dto.RoleBenevoleResponse;
import com.solivio.api.shared.exception.ConflictException;
import com.solivio.api.shared.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class RoleBenevoleService {

    private final RoleBenevoleInscriptionRepository roleRepository;
    private final InscriptionRepository inscriptionRepository;
    private final TypeRoleRepository typeRoleRepository;

    public RoleBenevoleService(
        RoleBenevoleInscriptionRepository roleRepository,
        InscriptionRepository inscriptionRepository,
        TypeRoleRepository typeRoleRepository
    ) {
        this.roleRepository = roleRepository;
        this.inscriptionRepository = inscriptionRepository;
        this.typeRoleRepository = typeRoleRepository;
    }

    @Transactional(readOnly = true)
    public List<RoleBenevoleResponse> lister(UUID inscriptionId) {
        trouverInscriptionOuEchouer(inscriptionId);
        return roleRepository.listerParInscription(inscriptionId)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    public RoleBenevoleResponse assigner(UUID inscriptionId, UUID typeRoleId, String libelleLibre) {
        if (typeRoleId == null && (libelleLibre == null || libelleLibre.isBlank())) {
            throw new IllegalArgumentException(
                "typeRoleId ou libelleLibre est requis pour assigner un rôle."
            );
        }

        Inscription inscription = trouverInscriptionOuEchouer(inscriptionId);

        TypeRole typeRole = null;
        if (typeRoleId != null) {
            typeRole = typeRoleRepository.findById(typeRoleId)
                .orElseThrow(() -> new NotFoundException("Type de rôle introuvable : " + typeRoleId));
            // Un role archive reste dans l'historique mais ne s'attribue plus.
            if (!typeRole.isActif()) {
                throw new ConflictException("Ce rôle est archivé et ne peut plus être attribué.");
            }
        }

        RoleBenevoleInscription role = new RoleBenevoleInscription(
            inscription, typeRole, libelleLibre
        );
        return toResponse(roleRepository.save(role));
    }

    public void retirer(UUID inscriptionId, UUID roleId) {
        trouverInscriptionOuEchouer(inscriptionId);
        RoleBenevoleInscription role = roleRepository.findById(roleId)
            .orElseThrow(() -> new NotFoundException("Rôle introuvable : " + roleId));

        if (!role.getInscription().getId().equals(inscriptionId)) {
            throw new NotFoundException("Ce rôle n'appartient pas à l'inscription : " + inscriptionId);
        }
        roleRepository.delete(role);
    }

    private Inscription trouverInscriptionOuEchouer(UUID inscriptionId) {
        return inscriptionRepository.findById(inscriptionId)
            .orElseThrow(() -> new NotFoundException("Inscription introuvable : " + inscriptionId));
    }

    RoleBenevoleResponse toResponse(RoleBenevoleInscription r) {
        UUID typeRoleId = r.getTypeRole() != null ? r.getTypeRole().getId() : null;
        return new RoleBenevoleResponse(r.getId(), typeRoleId, r.libelleEffectif());
    }
}
