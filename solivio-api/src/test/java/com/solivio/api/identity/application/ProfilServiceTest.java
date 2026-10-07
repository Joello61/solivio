package com.solivio.api.identity.application;

import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.Personne;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.PersonneRepository;
import com.solivio.api.identity.SolivioUserDetails;
import com.solivio.api.identity.infrastructure.web.dto.MeResponse;
import com.solivio.api.identity.infrastructure.web.dto.UpdateProfilRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfilServiceTest {

    @Mock private CompteRepository compteRepository;
    @Mock private PersonneRepository personneRepository;

    private ProfilService service;
    private UUID compteId;
    private Compte compte;
    private Personne personne;

    @BeforeEach
    void setUp() {
        service = new ProfilService(compteRepository, personneRepository);
        compteId = UUID.randomUUID();
        compte = new Compte("alice@example.com", "hash", "Dupont", "Alice");
        ReflectionTestUtils.setField(compte, "id", compteId);
        personne = new Personne("Dupont", "Alice", "alice@example.com");
        personne.setTelephone("0600000000");
    }

    @Test
    void mettreAJour_modifieNomPrenomEtTelephone() {
        when(compteRepository.findById(compteId)).thenReturn(Optional.of(compte));
        when(personneRepository.findByCompteEmail("alice@example.com")).thenReturn(Optional.of(personne));
        when(compteRepository.save(any())).thenReturn(compte);
        when(personneRepository.save(any())).thenReturn(personne);
        SolivioUserDetails userDetails = new SolivioUserDetails(
            compteId, "alice@example.com", null, false,
            List.of(new SimpleGrantedAuthority("ROLE_BENEFICIAIRE")), true);

        MeResponse response = service.mettreAJour(userDetails,
            new UpdateProfilRequest("Martin", "Bob", "0700000001"));

        assertThat(response.nom()).isEqualTo("Martin");
        assertThat(response.prenom()).isEqualTo("Bob");
        assertThat(compte.getNom()).isEqualTo("Martin");
        assertThat(personne.getTelephone()).isEqualTo("0700000001");
        verify(compteRepository).save(compte);
        verify(personneRepository).save(personne);
    }

    @Test
    void mettreAJour_telephoneVideSupprimeLeTelephone() {
        when(compteRepository.findById(compteId)).thenReturn(Optional.of(compte));
        when(personneRepository.findByCompteEmail("alice@example.com")).thenReturn(Optional.of(personne));
        when(compteRepository.save(any())).thenReturn(compte);
        when(personneRepository.save(any())).thenReturn(personne);
        SolivioUserDetails userDetails = new SolivioUserDetails(
            compteId, "alice@example.com", null, false, List.of(), true);

        service.mettreAJour(userDetails, new UpdateProfilRequest(null, null, ""));

        assertThat(personne.getTelephone()).isNull();
    }

    @Test
    void mettreAJour_sansPersonne_modifieSeulementLeCompte() {
        when(compteRepository.findById(compteId)).thenReturn(Optional.of(compte));
        when(personneRepository.findByCompteEmail("alice@example.com")).thenReturn(Optional.empty());
        when(compteRepository.save(any())).thenReturn(compte);
        SolivioUserDetails userDetails = new SolivioUserDetails(
            compteId, "alice@example.com", null, false, List.of(), true);

        MeResponse response = service.mettreAJour(userDetails,
            new UpdateProfilRequest("Durand", null, null));

        assertThat(response.nom()).isEqualTo("Durand");
        assertThat(compte.getNom()).isEqualTo("Durand");
    }

    @Test
    void mettreAJour_champsNulls_neModifieRien() {
        when(compteRepository.findById(compteId)).thenReturn(Optional.of(compte));
        when(personneRepository.findByCompteEmail("alice@example.com")).thenReturn(Optional.of(personne));
        when(compteRepository.save(any())).thenReturn(compte);
        when(personneRepository.save(any())).thenReturn(personne);
        SolivioUserDetails userDetails = new SolivioUserDetails(
            compteId, "alice@example.com", null, false, List.of(), true);

        service.mettreAJour(userDetails, new UpdateProfilRequest(null, null, null));

        assertThat(compte.getNom()).isEqualTo("Dupont");
        assertThat(compte.getPrenom()).isEqualTo("Alice");
        assertThat(personne.getTelephone()).isEqualTo("0600000000");
    }
}
