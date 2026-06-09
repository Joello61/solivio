package com.solivio.api.identity.infrastructure.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ProfilBeneficiaireResponse(
    LocalDate dateNaissance,
    String statutBoursier,
    Integer echelonBourse,
    String categorieNationalite,
    BigDecimal resteAVivreMensuel,
    String niveauAcademique,
    String etablissement,
    String situationLogement,
    Boolean aEmploiEtudiant,
    boolean complet
) {}
