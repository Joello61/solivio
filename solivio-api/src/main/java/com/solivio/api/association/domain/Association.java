package com.solivio.api.association.domain;

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

/**
 * Registre global des associations. Toujours dans le schema "public",
 * independamment du tenant courant.
 */
@Entity
@Table(name = "association", schema = "public")
@Getter
@Setter
@NoArgsConstructor
public class Association {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 63)
    private String slug;

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @Column(nullable = false)
    private String nom;

    @Column(name = "sous_domaine", unique = true, length = 63)
    private String sousDomaine;

    @Column(nullable = false, length = 20)
    private String statut = "active";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> configuration = Map.of();

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "couleur_primaire", length = 7)
    private String couleurPrimaire = "#16513F";

    @Column(name = "couleur_secondaire", length = 7)
    private String couleurSecondaire = "#1E6B52";

    @Column(name = "fuseau_horaire", length = 50)
    private String fuseauHoraire = "Europe/Paris";

    @Column(name = "frequence_max_par_semaine")
    private Integer frequenceMaxParSemaine;

    @Column(name = "contact_email", length = 255)
    private String contactEmail;

    @Column(name = "contact_telephone", length = 30)
    private String contactTelephone;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private Instant dateCreation = Instant.now();

    public Association(String slug, String nom) {
        this.slug = slug;
        this.nom = nom;
        // Code par defaut derive du slug : majuscules, tirets supprimes, 20 chars max.
        this.code = slug.toUpperCase().replace("-", "").replace("_", "");
        if (this.code.length() > 20) {
            this.code = this.code.substring(0, 20);
        }
    }
}
