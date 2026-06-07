package com.solivio.api.repartition.infrastructure.web.dto;

import java.util.UUID;

public record DotationDenreeDto(
    UUID id,
    String libelle,
    String unite,
    int nombreContenants,
    double quantiteParContenant,
    double quantiteTotale,
    double dotation,
    double reste,
    boolean penurie,
    // Nombre de beneficiaires pouvant etre servis (egal a nb total si pas de penurie).
    int nbPeutRecevoir
) {}
