package com.solivio.api.identity.application;

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

import java.util.List;
import java.util.UUID;

@Service
public class AdminCompteService {

    private final CompteRepository compteRepository;
    private final MembreAssociationRepository membreRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    public AdminCompteService(
        CompteRepository compteRepository,
        MembreAssociationRepository membreRepository,
        RefreshTokenRepository refreshTokenRepository
    ) {
        this.compteRepository = compteRepository;
        this.membreRepository = membreRepository;
        this.refreshTokenRepository = refreshTokenRepository;
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
    public CompteAdminResponse mettreAJourStatut(UUID id, boolean actif) {
        Compte compte = compteRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Compte introuvable : " + id));
        compte.setActif(actif);
        if (!actif) {
            // Revoquer toutes les sessions actives lors de la desactivation.
            refreshTokenRepository.revoquerTousParCompte(id);
        }
        return toResponse(compteRepository.save(compte));
    }

    @Transactional
    public CompteAdminResponse mettreAJourSuperAdmin(UUID id, boolean superAdmin) {
        Compte compte = compteRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Compte introuvable : " + id));
        compte.setSuperAdmin(superAdmin);
        return toResponse(compteRepository.save(compte));
    }

    @Transactional
    public void supprimer(UUID id) {
        Compte compte = compteRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Compte introuvable : " + id));
        refreshTokenRepository.revoquerTousParCompte(id);
        compteRepository.delete(compte);
    }

    private CompteAdminResponse toResponse(Compte compte) {
        List<MembreAssociation> affiliations = membreRepository.findActivesByCompteId(compte.getId());
        List<CompteAdminResponse.AffiliationSummary> affiliationSummaries = affiliations.stream()
            .map(a -> new CompteAdminResponse.AffiliationSummary(
                a.getAssociation().getNom(),
                a.getAssociation().getSlug(),
                a.getRole(),
                a.getStatut()
            ))
            .toList();
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
            affiliationSummaries
        );
    }
}
