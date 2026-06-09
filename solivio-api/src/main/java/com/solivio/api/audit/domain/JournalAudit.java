package com.solivio.api.audit.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "journal_audit")
@Getter
@Setter
@NoArgsConstructor
public class JournalAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "acteur_id")
    private UUID acteurId;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(name = "type_entite", nullable = false, length = 50)
    private String typeEntite;

    @Column(name = "entite_id")
    private UUID entiteId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "donnees_avant", columnDefinition = "jsonb")
    private Map<String, Object> donneesAvant;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "donnees_apres", columnDefinition = "jsonb")
    private Map<String, Object> donneesApres;

    @Column(name = "adresse_ip", length = 45)
    private String adresseIp;

    @Column(nullable = false, updatable = false)
    private Instant date = Instant.now();

    public JournalAudit(UUID acteurId, String action, String typeEntite, UUID entiteId) {
        this.acteurId = acteurId;
        this.action = action;
        this.typeEntite = typeEntite;
        this.entiteId = entiteId;
    }
}
