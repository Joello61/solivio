package com.solivio.api.identity.application;

import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.Personne;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.PersonneRepository;
import com.solivio.api.identity.infrastructure.security.SolivioUserDetails;
import com.solivio.api.identity.infrastructure.web.dto.MeResponse;
import com.solivio.api.identity.infrastructure.web.dto.UpdateProfilRequest;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
            compte.setNom(Jsoup.clean(request.nom().strip(), Safelist.none()));
        }
        if (request.prenom() != null && !request.prenom().isBlank()) {
            compte.setPrenom(Jsoup.clean(request.prenom().strip(), Safelist.none()));
        }
        compteRepository.save(compte);

        // Propager nom/prenom sur la Personne tenant et mettre a jour le telephone.
        Personne personne = personneRepository.findByCompteEmail(compte.getEmail()).orElse(null);
        if (personne != null) {
            if (request.nom() != null && !request.nom().isBlank()) {
                personne.setNom(Jsoup.clean(request.nom().strip(), Safelist.none()));
            }
            if (request.prenom() != null && !request.prenom().isBlank()) {
                personne.setPrenom(Jsoup.clean(request.prenom().strip(), Safelist.none()));
            }
            if (request.telephone() != null) {
                // Chaine vide => suppression du telephone
                personne.setTelephone(request.telephone().isBlank() ? null : request.telephone().strip());
            }
            personneRepository.save(personne);
        }

        List<String> roles = userDetails.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
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
            userDetails.getTenantSlug(),
            roles,
            compte.getDateCreation(),
            compte.getDateModification(),
            compte.isEmailVerifie(),
            compte.getGoogleId() != null ? "google" : "password"
        );
    }
}
