package com.solivio.api.identity.application;

import com.solivio.api.identity.domain.Personne;
import com.solivio.api.identity.infrastructure.persistence.PersonneRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Cree l'enregistrement Personne d'un compte lors de l'inscription ou a la
 * premiere connexion (JIT). Execute dans la transaction de l'appelant : la cle
 * etrangere personne.compte_email exige que le compte soit visible.
 */
@Service
public class PersonneProvisioningService {

    private static final Logger log = LoggerFactory.getLogger(PersonneProvisioningService.class);

    private final PersonneRepository personneRepository;

    public PersonneProvisioningService(PersonneRepository personneRepository) {
        this.personneRepository = personneRepository;
    }

    @Transactional
    public void provisionner(String email, String nom, String prenom) {
        if (!personneRepository.existsByEmail(email)) {
            Personne personne = personneRepository.save(new Personne(nom, prenom, email));
            log.debug("Personne {} provisionnee", personne.getId());
        }
    }
}
