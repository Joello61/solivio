package com.solivio.api.shared.lieu;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Lieu {

    @Column(name = "lieu_place_id", length = 255)
    private String placeId;

    @Column(name = "lieu_nom", length = 255)
    private String nom;

    @Column(name = "lieu_adresse_formatee", length = 500)
    private String adresseFormatee;

    @Column(name = "lieu_latitude")
    private Double latitude;

    @Column(name = "lieu_longitude")
    private Double longitude;

    @Column(name = "lieu_numero_rue", length = 20)
    private String numeroRue;

    @Column(name = "lieu_voie", length = 255)
    private String voie;

    @Column(name = "lieu_code_postal", length = 20)
    private String codePostal;

    @Column(name = "lieu_ville", length = 100)
    private String ville;
}
