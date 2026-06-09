package com.solivio.api.identity.application;

import com.solivio.api.association.multitenancy.TenantContext;
import com.solivio.api.association.multitenancy.TenantProvisioningService;
import com.solivio.api.identity.domain.Personne;
import com.solivio.api.identity.infrastructure.persistence.PersonneRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Cree l'enregistrement Personne dans le schema tenant lors de l'inscription
 * ou a la premiere connexion (JIT).
 *
 * Utilise TransactionTemplate PROPAGATION_REQUIRES_NEW (et non @Transactional)
 * pour garantir que TenantContext est positionne AVANT le demarrage de la
 * transaction : Hibernate lit le tenant identifier a l'ouverture de la
 * connexion, donc un @Transactional REQUIRES_NEW sur la methode elle-meme
 * lirait TenantContext avant que le corps de methode ait pu le renseigner.
 */
@Service
public class PersonneProvisioningService {

    private static final Logger log = LoggerFactory.getLogger(PersonneProvisioningService.class);

    private final PersonneRepository personneRepository;
    private final TransactionTemplate requiresNewTemplate;

    public PersonneProvisioningService(
        PersonneRepository personneRepository,
        PlatformTransactionManager transactionManager
    ) {
        this.personneRepository = personneRepository;
        this.requiresNewTemplate = new TransactionTemplate(transactionManager);
        this.requiresNewTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    public void provisionner(String associationSlug, String email, String nom, String prenom) {
        String schema = TenantProvisioningService.schemaName(associationSlug);
        // TenantContext positionne avant execute() : Hibernate le lit a l'ouverture
        // de la connexion dans la nouvelle transaction.
        TenantContext.setTenantId(schema);
        try {
            requiresNewTemplate.execute(status -> {
                if (!personneRepository.existsByEmail(email)) {
                    Personne personne = new Personne(nom, prenom, email);
                    personneRepository.save(personne);
                    log.debug("Personne provisionnee dans {} pour {}", schema, email);
                }
                return null;
            });
        } finally {
            TenantContext.clear();
        }
    }
}
