package com.solivio.api.identity.application;

import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.Personne;
import com.solivio.api.identity.domain.ProfilBeneficiaire;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.PersonneRepository;
import com.solivio.api.identity.infrastructure.persistence.ProfilBeneficiaireRepository;
import com.solivio.api.identity.infrastructure.web.dto.ProfilBeneficiaireResponse;
import com.solivio.api.identity.infrastructure.web.dto.UpdateProfilBeneficiaireRequest;
import com.solivio.api.shared.exception.NotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfilBeneficiaireServiceTest {

    @Mock private CompteRepository compteRepository;
    @Mock private PersonneRepository personneRepository;
    @Mock private ProfilBeneficiaireRepository profilRepository;

    private ProfilBeneficiaireService service;
    private UUID compteId;
    private Compte compte;
    private Personne personne;

    @BeforeEach
    void setUp() {
        service = new ProfilBeneficiaireService(compteRepository, personneRepository, profilRepository);
        compteId = UUID.randomUUID();
        compte = new Compte("alice@example.com", "hash", "Dupont", "Alice");
        personne = new Personne("Dupont", "Alice", "alice@example.com");
    }

    @Test
    void lire_retourneProfilExistant() {
        ProfilBeneficiaire profil = new ProfilBeneficiaire(personne);
        profil.setStatutBoursier("boursier");
        profil.setEchelonBourse(5);
        when(compteRepository.findById(compteId)).thenReturn(Optional.of(compte));
        when(personneRepository.findByCompteEmail("alice@example.com")).thenReturn(Optional.of(personne));
        when(profilRepository.findByPersonneId(personne.getId())).thenReturn(Optional.of(profil));

        ProfilBeneficiaireResponse response = service.lire(compteId);

        assertThat(response.statutBoursier()).isEqualTo("boursier");
        assertThat(response.echelonBourse()).isEqualTo(5);
    }

    @Test
    void lire_retourneProfilVideSiAucunProfil() {
        when(compteRepository.findById(compteId)).thenReturn(Optional.of(compte));
        when(personneRepository.findByCompteEmail("alice@example.com")).thenReturn(Optional.of(personne));
        when(profilRepository.findByPersonneId(personne.getId())).thenReturn(Optional.empty());

        ProfilBeneficiaireResponse response = service.lire(compteId);

        assertThat(response.statutBoursier()).isNull();
        assertThat(response.complet()).isFalse();
    }

    @Test
    void mettreAJour_creeProfilSiAbsent() {
        UpdateProfilBeneficiaireRequest request = new UpdateProfilBeneficiaireRequest(
            LocalDate.of(2000, 1, 15),
            "boursier",
            3,
            "francaise",
            BigDecimal.valueOf(500),
            "L3",
            "Universite Paris",
            "colocation",
            true
        );
        when(compteRepository.findById(compteId)).thenReturn(Optional.of(compte));
        when(personneRepository.findByCompteEmail("alice@example.com")).thenReturn(Optional.of(personne));
        when(profilRepository.findByPersonneId(personne.getId())).thenReturn(Optional.empty());
        when(profilRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ProfilBeneficiaireResponse response = service.mettreAJour(compteId, request);

        assertThat(response.statutBoursier()).isEqualTo("boursier");
        assertThat(response.echelonBourse()).isEqualTo(3);
        assertThat(response.etablissement()).isEqualTo("Universite Paris");
        assertThat(response.complet()).isTrue();
        verify(profilRepository).save(any());
    }

    @Test
    void mettreAJour_metAJourChampsPartielsSeulement() {
        ProfilBeneficiaire profil = new ProfilBeneficiaire(personne);
        profil.setStatutBoursier("non_boursier");
        profil.setSituationLogement("seul");
        when(compteRepository.findById(compteId)).thenReturn(Optional.of(compte));
        when(personneRepository.findByCompteEmail("alice@example.com")).thenReturn(Optional.of(personne));
        when(profilRepository.findByPersonneId(personne.getId())).thenReturn(Optional.of(profil));
        when(profilRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.mettreAJour(compteId,
            new UpdateProfilBeneficiaireRequest(null, "boursier", null, null, null, null, null, null, null));

        assertThat(profil.getStatutBoursier()).isEqualTo("boursier");
        assertThat(profil.getSituationLogement()).isEqualTo("seul");
    }

    @Test
    void lire_lancerNotFoundSiCompteAbsent() {
        when(compteRepository.findById(compteId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.lire(compteId))
            .isInstanceOf(NotFoundException.class);
    }

    @Test
    void lire_lancerNotFoundSiPersonneAbsente() {
        when(compteRepository.findById(compteId)).thenReturn(Optional.of(compte));
        when(personneRepository.findByCompteEmail("alice@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.lire(compteId))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining("tenant");
    }
}
