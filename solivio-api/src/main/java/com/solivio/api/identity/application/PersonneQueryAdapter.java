package com.solivio.api.identity.application;

import com.solivio.api.identity.domain.Personne;
import com.solivio.api.identity.infrastructure.persistence.MembreAssociationRepository;
import com.solivio.api.identity.infrastructure.persistence.PersonneRepository;
import com.solivio.api.shared.exception.NotFoundException;
import com.solivio.api.shared.identity.PersonneQueryPort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class PersonneQueryAdapter implements PersonneQueryPort {

    private final PersonneRepository personneRepository;
    private final MembreAssociationRepository membreRepository;

    public PersonneQueryAdapter(
        PersonneRepository personneRepository,
        MembreAssociationRepository membreRepository
    ) {
        this.personneRepository = personneRepository;
        this.membreRepository = membreRepository;
    }

    @Override
    public PersonneInfo trouverPersonne(String email) {
        Personne p = personneRepository.findByEmail(email)
            .orElseThrow(() -> new NotFoundException("Personne introuvable : " + email));
        return new PersonneInfo(p.getId(), p.getNom(), p.getPrenom());
    }

    @Override
    public PersonneContactInfo trouverPersonneParId(UUID id) {
        Personne p = personneRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Personne introuvable : " + id));
        return new PersonneContactInfo(p.getId(), p.getEmail(), p.getPrenom(), p.getNom());
    }

    @Override
    public List<PersonneContactInfo> trouverContactsParRole(String nomRole) {
        // Le role est porte par le membre (compte) ; le contact par la personne liee.
        List<String> emails = membreRepository.findActifsByRole(nomRole).stream()
            .map(m -> m.getCompte().getEmail())
            .toList();
        if (emails.isEmpty()) {
            return List.of();
        }
        return personneRepository.findByCompteEmailIn(emails).stream()
            .map(p -> new PersonneContactInfo(p.getId(), p.getEmail(), p.getPrenom(), p.getNom()))
            .toList();
    }

    @Override
    public List<PersonneContactInfo> rechercherParNomOuPrenom(String terme) {
        return personneRepository.rechercherParNomOuPrenom(terme).stream()
            .limit(10)
            .map(p -> new PersonneContactInfo(p.getId(), p.getEmail(), p.getPrenom(), p.getNom()))
            .toList();
    }
}
