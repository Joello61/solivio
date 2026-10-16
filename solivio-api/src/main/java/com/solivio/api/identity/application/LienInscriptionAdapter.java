package com.solivio.api.identity.application;

import com.solivio.api.shared.identity.LienInscriptionPort;
import org.springframework.stereotype.Service;

@Service
public class LienInscriptionAdapter implements LienInscriptionPort {

    private final EmailService emailService;

    public LienInscriptionAdapter(EmailService emailService) {
        this.emailService = emailService;
    }

    @Override
    public void envoyerLienInscription(String email) {
        emailService.envoyerLienInscription(email);
    }
}
