package com.solivio.api.identity.infrastructure.security;

import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Charge ou provisionne un Compte depuis le profil Google apres un OAuth2 reussi.
 * Deux cas : compte Google deja connu (google_id existant) ou
 * email existant sans google_id (merge : on ajoute le google_id au compte).
 * Si ni l'un ni l'autre : compte cree avec email_verifie=true (Google garantit l'email).
 * L'association est assignee lors d'une etape suivante (pas encore connue a ce stade).
 */
@Service
public class GoogleOAuth2UserService extends DefaultOAuth2UserService {

    private static final Logger log = LoggerFactory.getLogger(GoogleOAuth2UserService.class);

    private final CompteRepository compteRepository;

    public GoogleOAuth2UserService(CompteRepository compteRepository) {
        this.compteRepository = compteRepository;
    }

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String googleId = oAuth2User.getName();
        String email = oAuth2User.getAttribute("email");
        String prenom = oAuth2User.getAttribute("given_name");
        String nom = oAuth2User.getAttribute("family_name");
        if (nom == null || nom.isBlank()) {
            nom = oAuth2User.getAttribute("name");
        }
        if (prenom == null) prenom = "";
        if (nom == null) nom = "";

        provisionnerOuMettreAJour(googleId, email, nom, prenom);
        return oAuth2User;
    }

    private void provisionnerOuMettreAJour(String googleId, String email, String nom, String prenom) {
        // Cas 1 : google_id deja connu
        if (compteRepository.findByGoogleId(googleId).isPresent()) {
            return;
        }

        // Cas 2 : email existant sans google_id (merge)
        compteRepository.findByEmail(email).ifPresentOrElse(
            compte -> {
                compte.setGoogleId(googleId);
                compte.setEmailVerifie(true);
                compteRepository.save(compte);
                log.info("Compte existant lie a Google : {}", email);
            },
            () -> {
                // Cas 3 : nouveau compte Google
                Compte compte = new Compte(email, null, nom, prenom);
                compte.setGoogleId(googleId);
                compte.setEmailVerifie(true);
                compteRepository.save(compte);
                log.info("Nouveau compte cree via Google : {}", email);
            }
        );
    }
}
