package com.solivio.api.identity.application;

import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.VerificationCode;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.security.SolivioUserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Reinitialisation et changement de mot de passe.
 */
@Service
public class PasswordService {

    private final CompteRepository compteRepository;
    private final VerificationCodeService verificationCodeService;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public PasswordService(
            CompteRepository compteRepository,
            VerificationCodeService verificationCodeService,
            PasswordEncoder passwordEncoder,
            EmailService emailService) {
        this.compteRepository = compteRepository;
        this.verificationCodeService = verificationCodeService;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @Transactional
    public void demanderReset(String email) {
        // Reponse identique que le compte existe ou non (anti-enumeration)
        compteRepository.findByEmail(email).ifPresent(compte -> {
            VerificationCode vc = verificationCodeService.generer(compte, VerificationCode.TYPE_PASSWORD_RESET);
            emailService.envoyerResetMotDePasse(compte, vc.getCode());
        });
    }

    @Transactional
    public void resetMotDePasse(String email, String code, String nouveauMotDePasse) {
        Compte compte = compteRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("Code invalide ou expire"));

        boolean valide = verificationCodeService.valider(
            compte, code, VerificationCode.TYPE_PASSWORD_RESET);

        if (!valide) {
            throw new IllegalArgumentException("Code invalide ou expire");
        }

        compte.setPasswordHash(passwordEncoder.encode(nouveauMotDePasse));
        compteRepository.save(compte);
        emailService.envoyerConfirmationChangementMotDePasse(compte);
    }

    @Transactional
    public void changerMotDePasse(SolivioUserDetails userDetails,
                                  String motDePasseActuel, String nouveauMotDePasse) {
        Compte compte = compteRepository.findById(userDetails.getCompteId())
            .orElseThrow();

        if (compte.getPasswordHash() == null) {
            throw new IllegalArgumentException(
                "Ce compte utilise la connexion Google et n'a pas de mot de passe local");
        }
        if (!passwordEncoder.matches(motDePasseActuel, compte.getPasswordHash())) {
            throw new IllegalArgumentException("Mot de passe actuel incorrect");
        }

        compte.setPasswordHash(passwordEncoder.encode(nouveauMotDePasse));
        compteRepository.save(compte);
        emailService.envoyerConfirmationChangementMotDePasse(compte);
    }
}
