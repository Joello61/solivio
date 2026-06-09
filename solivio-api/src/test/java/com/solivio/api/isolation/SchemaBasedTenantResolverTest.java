package com.solivio.api.isolation;

import com.solivio.api.association.multitenancy.SchemaBasedTenantResolver;
import com.solivio.api.association.multitenancy.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SchemaBasedTenantResolverTest {

    private final SchemaBasedTenantResolver resolver = new SchemaBasedTenantResolver();

    @AfterEach
    void cleanup() {
        TenantContext.clear();
    }

    @Test
    void returnsPublicWhenNoTenantSet() {
        assertThat(resolver.resolveCurrentTenantIdentifier()).isEqualTo("public");
    }

    @Test
    void returnsPublicWhenTenantIsBlank() {
        TenantContext.setTenantId("  ");
        assertThat(resolver.resolveCurrentTenantIdentifier()).isEqualTo("public");
    }

    @Test
    void returnsTenantIdWhenSet() {
        TenantContext.setTenantId("tenant_pilote");
        assertThat(resolver.resolveCurrentTenantIdentifier()).isEqualTo("tenant_pilote");
    }

    @Test
    void clearedContextFallsBackToPublic() {
        TenantContext.setTenantId("tenant_pilote");
        TenantContext.clear();
        assertThat(resolver.resolveCurrentTenantIdentifier()).isEqualTo("public");
    }
}
