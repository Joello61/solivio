package com.solivio.api.identity.application;

import com.solivio.api.audit.application.AuditService;
import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.MembreAssociation;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.MembreAssociationRepository;
import com.solivio.api.identity.infrastructure.persistence.RefreshTokenRepository;
import com.solivio.api.identity.infrastructure.web.dto.CompteAdminResponse;
import com.solivio.api.shared.exception.NotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class AdminCompteService {

    private final CompteRepository compteRepository;
    private final MembreAssociationRepository membreRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final GardeMembres garde;
    private final AuditService auditService;

    public AdminCompteService(
        CompteRepository compteRepository,
        MembreAssociationRepository membreRepository,
        RefreshTokenRepository refreshTokenRepository,
        GardeMembres garde,
        AuditService auditService
    ) {
        this.compteRepository = compteRepository;
        this.membreRepository = membreRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.garde = garde;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<CompteAdminResponse> lister(String recherche, int page, int taille) {
        PageRequest pageable = PageRequest.of(page, taille, Sort.by("nom", "prenom"));
        String filtre = (recherche == null || recherche.isBlank())
            ? null
            : "%" + recherche.strip().toLowerCase() + "%";
        return compteRepository.rechercherComptes(filtre, pageable)
            .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public CompteAdminResponse lireParId(UUID id) {
        Compte compte = compteRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Compte introuvable : " + id));
        return toResponse(compte);
    }

    @Transactional
    public CompteAdminResponse mettreAJourStatut(UUID id, boolean actif, UUID acteurCompteId) {
        garde.interdireSurSoi(acteurCompteId, id);
        Compte compte = compteRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Compte introuvable : " + id));
        if (!actif) {
            garde.garderUnResponsable(id);
        }
        compte.setActif(actif);
        if (!actif) {
            // Revoquer toutes les sessions actives lors de la desactivation.
            refreshTokenRepository.revoquerTousParCompte(id);
        }
        auditService.tracer(acteurCompteId, actif ? "COMPTE_ACTIVE" : "COMPTE_DESACTIVE", "compte", id);
        return toResponse(compteRepository.save(compte));
    }

    @Transactional
    public CompteAdminResponse mettreAJourSuperAdmin(UUID id, boolean superAdmin, UUID acteurCompteId) {
        // Interdire de se retirer soi-meme le drapeau garantit qu'il reste un super admin.
        garde.interdireSurSoi(acteurCompteId, id);
        Compte compte = compteRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Compte introuvable : " + id));
        compte.setSuperAdmin(superAdmin);
        auditService.tracer(acteurCompteId, "SUPER_ADMIN_MODIFIE", "compte", id);
        return toResponse(compteRepository.save(compte));
    }

    @Transactional
    public void supprimer(UUID id, UUID acteurCompteId) {
        garde.interdireSurSoi(acteurCompteId, id);
        Compte compte = compteRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Compte introuvable : " + id));
        garde.garderUnResponsable(id);
        refreshTokenRepository.revoquerTousParCompte(id);
        compteRepository.delete(compte);
        auditService.tracer(acteurCompteId, "COMPTE_SUPPRIME", "compte", id);
    }

    private CompteAdminResponse toResponse(Compte compte) {
        Optional<MembreAssociation> membre = membreRepository.findByCompteId(compte.getId());
        return new CompteAdminResponse(
            compte.getId(),
            compte.getEmail(),
            compte.getNom(),
            compte.getPrenom(),
            compte.getPhotoUrl(),
            compte.isEmailVerifie(),
            compte.isActif(),
            compte.isSuperAdmin(),
            compte.getDateCreation(),
            membre.map(MembreAssociation::getRole).orElse(null),
            membre.map(MembreAssociation::getStatut).orElse(null)
        );
    }
}
