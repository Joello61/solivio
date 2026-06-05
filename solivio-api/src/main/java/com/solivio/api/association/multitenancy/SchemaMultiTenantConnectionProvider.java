package com.solivio.api.association.multitenancy;

import lombok.NonNull;
import org.hibernate.cfg.AvailableSettings;
import org.hibernate.engine.jdbc.connections.spi.MultiTenantConnectionProvider;
import org.hibernate.service.UnknownUnwrapTypeException;
import org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Map;

/**
 * Oriente chaque connexion Hibernate vers le bon schema PostgreSQL via SET search_path.
 * La connexion est remise sur "public" avant d'etre rendue au pool pour eviter les fuites.
 */
@Component
public class SchemaMultiTenantConnectionProvider
        implements MultiTenantConnectionProvider<String>, HibernatePropertiesCustomizer {

    private final DataSource dataSource;

    public SchemaMultiTenantConnectionProvider(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public Connection getAnyConnection() throws SQLException {
        return dataSource.getConnection();
    }

    @Override
    public void releaseAnyConnection(Connection connection) throws SQLException {
        // Reset avant retour au pool : une connexion quelconque peut avoir ete contaminee.
        setSearchPath(connection, "public");
        connection.close();
    }

    @Override
    public Connection getConnection(String schema) throws SQLException {
        Connection connection = dataSource.getConnection();
        setSearchPath(connection, schema);
        return connection;
    }

    @Override
    public void releaseConnection(String schema, Connection connection) throws SQLException {
        // Remise sur public avant retour au pool : evite toute fuite cross-tenant.
        setSearchPath(connection, "public");
        connection.close();
    }

    @Override
    public boolean supportsAggressiveRelease() {
        return true;
    }

    @Override
    public void customize(@NonNull Map<String, Object> hibernateProperties) {
        hibernateProperties.put(AvailableSettings.MULTI_TENANT_CONNECTION_PROVIDER, this);
    }

    @Override
    public boolean isUnwrappableAs(Class<?> unwrapType) {
        return unwrapType.isAssignableFrom(getClass());
    }

    @Override
    public <T> T unwrap(Class<T> unwrapType) {
        if (isUnwrappableAs(unwrapType)) {
            return unwrapType.cast(this);
        }
        throw new UnknownUnwrapTypeException(unwrapType);
    }

    private void setSearchPath(Connection connection, String schema) throws SQLException {
        // Les guillemets protegent les noms de schema contenant des tirets ou des majuscules.
        try (Statement stmt = connection.createStatement()) {
            stmt.execute("SET search_path TO \"" + schema.replace("\"", "") + "\"");
        }
    }
}
