package com.solivio.api.association.multitenancy;

import lombok.NonNull;
import org.hibernate.cfg.AvailableSettings;
import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Resout le tenant courant depuis le TenantContext (alimente par TenantResolutionFilter).
 * Retourne "public" comme schema de secours pour les requetes non authentifiees
 * (health check, swagger). Les acces reels aux donnees metier passent toujours
 * par TenantResolutionFilter qui garantit un tenant valide.
 */
@Component
public class SchemaBasedTenantResolver
        implements CurrentTenantIdentifierResolver<String>, HibernatePropertiesCustomizer {

    @Override
    public String resolveCurrentTenantIdentifier() {
        String tenantId = TenantContext.getTenantId();
        if (tenantId != null && !tenantId.isBlank()) {
            return tenantId;
        }
        // Aucun tenant dans le contexte : les requetes non authentifiees
        // ne doivent pas acceder aux tables metier tenant.
        // Retourner "public" est sur car il n'y a pas de table personne/role/etc.
        // dans public (seulement association).
        return "public";
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        return false;
    }

    @Override
    public void customize(@NonNull Map<String, Object> hibernateProperties) {
        hibernateProperties.put(AvailableSettings.MULTI_TENANT_IDENTIFIER_RESOLVER, this);
    }
}
