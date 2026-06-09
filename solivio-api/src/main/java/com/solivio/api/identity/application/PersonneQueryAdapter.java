package com.solivio.api.identity.application;

import com.solivio.api.identity.domain.Personne;
import com.solivio.api.identity.infrastructure.persistence.AffiliationRepository;
import com.solivio.api.identity.infrastructure.persistence.PersonneRepository;
import com.solivio.api.shared.exception.NotFoundException;
import com.solivio.api.shared.identity.PersonneQueryPort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class PersonneQueryAdapter implements PersonneQueryPort {

    private final PersonneRepository personneRepository;
    private final AffiliationRepository affiliationRepository;

    public PersonneQueryAdapter(
        PersonneRepository personneRepository,
        AffiliationRepository affiliationRepository
    ) {
        this.personneRepository = personneRepository;
        this.affiliationRepository = affiliationRepository;
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
        return affiliationRepository.findPersonnesActivesByRoleNom(nomRole).stream()
            .map(p -> new PersonneContactInfo(p.getId(), p.getEmail(), p.getPrenom(), p.getNom()))
            .toList();
    }
}
