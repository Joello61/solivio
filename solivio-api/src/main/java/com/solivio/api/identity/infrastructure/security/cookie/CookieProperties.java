package com.solivio.api.identity.infrastructure.security.cookie;

import org.springframework.boot.context.properties.ConfigurationProperties;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

/**
 * Proprietes de configuration des cookies securises.
 * La cle de chiffrement est injectee depuis OpenBao via Spring Cloud Vault Config.
 */
@ConfigurationProperties(prefix = "solivio.cookie")
public class CookieProperties {

    /**
     * Cle AES-256 encodee en Base64 (32 octets).
     * En dev : valeur dans application-dev.yml.
     * En prod : injectee depuis OpenBao (secret/solivio-api, cle cookie.encryption-key).
     */
    private String encryptionKey;

    public String getEncryptionKey() {
        return encryptionKey;
    }

    public void setEncryptionKey(String encryptionKey) {
        this.encryptionKey = encryptionKey;
    }

    public SecretKey toSecretKey() {
        byte[] keyBytes = Base64.getDecoder().decode(encryptionKey);
        if (keyBytes.length != 32) {
            throw new IllegalStateException(
                "La cle cookie.encryption-key doit etre de 32 octets (AES-256). "
                + "Longueur recue : " + keyBytes.length);
        }
        return new SecretKeySpec(keyBytes, "AES");
    }
}
