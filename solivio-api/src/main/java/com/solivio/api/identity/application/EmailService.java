package com.solivio.api.identity.application;

import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.Invitation;

public interface EmailService {

    void envoyerBienvenue(Compte compte);

    void envoyerVerificationEmail(Compte compte, String code);

    void envoyerResetMotDePasse(Compte compte, String code);

    void envoyerConfirmationChangementMotDePasse(Compte compte);

    void envoyerInvitation(Invitation invitation);
}
