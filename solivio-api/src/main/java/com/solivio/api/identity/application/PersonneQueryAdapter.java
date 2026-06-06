package com.solivio.api.identity.application;

import com.solivio.api.identity.domain.Personne;
import com.solivio.api.identity.infrastructure.persistence.PersonneRepository;
import com.solivio.api.shared.exception.NotFoundException;
import com.solivio.api.shared.identity.PersonneQueryPort;
import org.springframework.stereotype.Service;

@Service
public class PersonneQueryAdapter implements PersonneQueryPort {

    private final PersonneRepository personneRepository;

    public PersonneQueryAdapter(PersonneRepository personneRepository) {
        this.personneRepository = personneRepository;
    }

    @Override
    public PersonneInfo trouverPersonne(String email) {
        Personne p = personneRepository.findByEmail(email)
            .orElseThrow(() -> new NotFoundException("Personne introuvable : " + email));
        return new PersonneInfo(p.getId(), p.getNom(), p.getPrenom());
    }
}
