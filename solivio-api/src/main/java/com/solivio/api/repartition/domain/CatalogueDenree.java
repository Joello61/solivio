package com.solivio.api.repartition.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "catalogue_denree")
@Getter
@Setter
@NoArgsConstructor
public class CatalogueDenree {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String libelle;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private Instant dateCreation = Instant.now();

    @Column(name = "date_modification", nullable = false)
    private Instant dateModification = Instant.now();

    public CatalogueDenree(String libelle) {
        this.libelle = libelle;
    }

    @PreUpdate
    void rafraichirDateModification() {
        this.dateModification = Instant.now();
    }
}
