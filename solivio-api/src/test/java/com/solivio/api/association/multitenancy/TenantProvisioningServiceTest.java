package com.solivio.api.association.multitenancy;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TenantProvisioningServiceTest {

    @Test
    void schemaNameReplacesHyphensWithUnderscores() {
        assertThat(TenantProvisioningService.schemaName("asso-pilote"))
            .isEqualTo("tenant_asso_pilote");
    }

    @Test
    void schemaNamePrefixesTenant() {
        assertThat(TenantProvisioningService.schemaName("pilote"))
            .isEqualTo("tenant_pilote");
    }

    @Test
    void schemaNameHandlesMultipleHyphens() {
        assertThat(TenantProvisioningService.schemaName("a-b-c"))
            .isEqualTo("tenant_a_b_c");
    }
}
