package com.solivio.api.identity.application;

import com.solivio.api.identity.SolivioUserDetails;
import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.Personne;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.PersonneRepository;
import com.solivio.api.identity.infrastructure.web.dto.MeResponse;
import com.solivio.api.identity.infrastructure.web.dto.UpdateProfilRequest;
import com.solivio.api.shared.web.Assainissement;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
public class ProfilService {

    private final CompteRepository compteRepository;
    private final PersonneRepository personneRepository;

    public ProfilService(
        CompteRepository compteRepository,
        PersonneRepository personneRepository
    ) {
        this.compteRepository = compteRepository;
        this.personneRepository = personneRepository;
    }

    @Transactional
    public MeResponse mettreAJour(SolivioUserDetails userDetails, UpdateProfilRequest request) {
        Compte compte = compteRepository.findById(userDetails.getCompteId())
            .orElseThrow();

        if (request.nom() != null && !request.nom().isBlank()) {
            compte.setNom(Assainissement.nettoyer(request.nom().strip()));
        }
        if (request.prenom() != null && !request.prenom().isBlank()) {
            compte.setPrenom(Assainissement.nettoyer(request.prenom().strip()));
        }
        compteRepository.save(compte);

        // Propager nom/prenom sur la Personne et mettre a jour le telephone.
        Personne personne = personneRepository.findByCompteEmail(compte.getEmail()).orElse(null);
        if (personne != null) {
            if (request.nom() != null && !request.nom().isBlank()) {
                personne.setNom(Assainissement.nettoyer(request.nom().strip()));
            }
            if (request.prenom() != null && !request.prenom().isBlank()) {
                personne.setPrenom(Assainissement.nettoyer(request.prenom().strip()));
            }
            if (request.telephone() != null) {
                // Chaine vide => suppression du telephone
                personne.setTelephone(request.telephone().isBlank() ? null : request.telephone().strip());
            }
            personneRepository.save(personne);
        }

        List<String> roles = userDetails.getAuthorities()
            .stream()
            .map(GrantedAuthority::getAuthority)
            .filter(Objects::nonNull)
            .map(a -> a.replace("ROLE_", "").toLowerCase())
            .toList();

        String telephone = personne != null ? personne.getTelephone() : null;
        String photoUrl = compte.getPhotoUrl() != null
            ? compte.getPhotoUrl()
            : (personne != null ? personne.getPhotoUrl() : null);

        return new MeResponse(
            compte.getId().toString(),
            compte.getEmail(),
            compte.getNom(),
            compte.getPrenom(),
            telephone,
            photoUrl,
            compte.isSuperAdmin(),
            roles,
            compte.getDateCreation(),
            compte.getDateModification(),
            compte.isEmailVerifie(),
            compte.getGoogleId() != null ? "google" : "password"
        );
    }
}
