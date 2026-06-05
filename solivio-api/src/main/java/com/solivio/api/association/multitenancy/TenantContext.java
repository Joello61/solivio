package com.solivio.api.association.multitenancy;

/**
 * Stocke l'identifiant du tenant courant dans un ThreadLocal.
 * Utilise comme pont entre le filtre de securite et le resolver Hibernate.
 */
public final class TenantContext {

    private static final ThreadLocal<String> CURRENT_TENANT = new ThreadLocal<>();

    private TenantContext() {
    }

    public static void setTenantId(String tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    public static String getTenantId() {
        return CURRENT_TENANT.get();
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }
}
