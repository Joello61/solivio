package com.solivio.api.identity.application;

import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.MembreAssociation;
import com.solivio.api.identity.domain.Personne;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.MembreAssociationRepository;
import com.solivio.api.identity.infrastructure.persistence.PersonneRepository;
import com.solivio.api.shared.identity.PersonneQueryPort;
import com.solivio.api.shared.identity.PersonneQueryPort.PersonneContactInfo;
import com.solivio.api.support.SolivioIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SolivioIntegrationTest
class PersonneQueryAdapterIntegrationTest {

    @Autowired private PersonneQueryPort personneQueryPort;
    @Autowired private CompteRepository compteRepository;
    @Autowired private MembreAssociationRepository membreRepository;
    @Autowired private PersonneRepository personneRepository;

    // Non-regression : ces contacts etaient lus dans une table jamais alimentee,
    // si bien que l'alerte de desistement tardif ne partait vers aucun coordinateur.
    @Test
    void trouverContactsParRole_retourneSeulementLesMembresActifsDuRole() {
        creerMembre("coord.actif@test.com", "coordinateur", "actif");
        creerMembre("coord.suspendu@test.com", "coordinateur", "suspendu");
        creerMembre("benevole@test.com", "benevole", "actif");

        List<PersonneContactInfo> contacts = personneQueryPort.trouverContactsParRole("coordinateur");

        assertThat(contacts).extracting(PersonneContactInfo::email).containsExactly("coord.actif@test.com");
    }

    @Test
    void trouverContactsParRole_retourneVideSansMembreDuRole() {
        creerMembre("benevole@test.com", "benevole", "actif");

        assertThat(personneQueryPort.trouverContactsParRole("coordinateur")).isEmpty();
    }

    private void creerMembre(String email, String role, String statut) {
        Compte compte = compteRepository.save(new Compte(email, "hash", "Nom", "Prenom"));
        MembreAssociation membre = new MembreAssociation(compte, role);
        membre.setStatut(statut);
        membreRepository.save(membre);
        personneRepository.save(new Personne("Nom", "Prenom", email));
    }
}
