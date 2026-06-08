package com.solivio.api.identity.infrastructure.web.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateProfilBeneficiaireRequest(
    LocalDate dateNaissance,

    @Pattern(regexp = "non_boursier|boursier")
    String statutBoursier,

    @Min(0) @Max(7)
    Integer echelonBourse,

    @Pattern(regexp = "francaise|ressortissant_ue|hors_ue")
    String categorieNationalite,

    @DecimalMin("0") @DecimalMax("99999.99")
    BigDecimal resteAVivreMensuel,

    @Pattern(regexp = "L1|L2|L3|M1|M2|doctorat|BTS|autre")
    String niveauAcademique,

    @Size(max = 255)
    String etablissement,

    @Pattern(regexp = "seul|colocation|chez_parents|residence|sans_domicile_stable|autre")
    String situationLogement,

    Boolean aEmploiEtudiant
) {}
