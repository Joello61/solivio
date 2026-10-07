package com.solivio.api.identity.infrastructure.dev;

import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.MembreAssociation;
import com.solivio.api.identity.domain.Personne;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.MembreAssociationRepository;
import com.solivio.api.identity.infrastructure.persistence.PersonneRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Seeder de donnees de test pour Linkee Toulouse. Active uniquement avec le profil "seed".
 *
 * Usage :
 *   SPRING_PROFILES_ACTIVE=dev,seed ./mvnw spring-boot:run
 *
 * Idempotent : si le super-admin existe deja, le seeder ne fait rien.
 * Les identifiants crees sont affiches dans les logs au niveau INFO.
 */
@Component
@Profile("seed")
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    // Mot de passe commun a tous les comptes seedes, sans valeur hors developpement.
    private static final String MDP_DEFAULT = "Solivio2026!";
    private static final String DOMAINE = "@solivio.app";
    private static final String[] COORDO_TYPES = {
        "coordo_generale", "coordo_sec", "coordo_fruit_legume", "coordo_exterieur"
    };

    private final CompteRepository compteRepo;
    private final MembreAssociationRepository membreRepo;
    private final PersonneRepository personneRepo;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
            CompteRepository compteRepo,
            MembreAssociationRepository membreRepo,
            PersonneRepository personneRepo,
            PasswordEncoder passwordEncoder) {
        this.compteRepo = compteRepo;
        this.membreRepo = membreRepo;
        this.personneRepo = personneRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (compteRepo.existsByEmail("superadmin" + DOMAINE)) {
            log.info("Donnees de seed deja presentes - seeder ignore.");
            return;
        }

        log.info("Demarrage du seeder de donnees de test...");
        String hash = passwordEncoder.encode(MDP_DEFAULT);
        List<String> rapport = new ArrayList<>();

        creerCompte("superadmin", hash, "Admin", "Super", null, null, true);
        rapport.add("Super admin   : superadmin" + DOMAINE);

        creerCompte("admin", hash, "Admin", "Linkee", "admin", null, false);
        rapport.add("Admin         : admin" + DOMAINE);

        for (int i = 1; i <= 3; i++) {
            creerCompte("resp" + i, hash, "Resp" + i, "Linkee", "responsable", null, false);
        }
        rapport.add("Responsables  : resp1" + DOMAINE + " .. resp3" + DOMAINE);

        for (int i = 0; i < COORDO_TYPES.length; i++) {
            creerCompte("coordo" + (i + 1), hash, "Coordo" + (i + 1), "Linkee", "coordinateur", COORDO_TYPES[i], false);
        }
        rapport.add("Coordinateurs : coordo1" + DOMAINE + " .. coordo" + COORDO_TYPES.length + DOMAINE);

        for (int i = 1; i <= 5; i++) {
            creerCompte("benevole" + i, hash, "Benevole" + i, "Linkee", "benevole", null, false);
        }
        rapport.add("Benevoles     : benevole1" + DOMAINE + " .. benevole5" + DOMAINE);

        for (int i = 1; i <= 10; i++) {
            creerCompte("benef" + i, hash, "Benef" + i, "Linkee", "beneficiaire", null, false);
        }
        rapport.add("Beneficiaires : benef1" + DOMAINE + " .. benef10" + DOMAINE);

        log.info("SOLIVIO - donnees de test creees (mot de passe commun : {})", MDP_DEFAULT);
        rapport.forEach(log::info);
    }

    private void creerCompte(String identifiant, String passwordHash, String nom, String prenom,
                             String role, String coordoType, boolean superAdmin) {
        String email = identifiant + DOMAINE;
        Compte compte = new Compte(email, passwordHash, nom, prenom);
        compte.setEmailVerifie(true);
        compte.setSuperAdmin(superAdmin);
        compteRepo.save(compte);

        if (role != null) {
            MembreAssociation membre = new MembreAssociation(compte, role);
            membre.setCoordoType(coordoType);
            membreRepo.save(membre);
        }
        personneRepo.save(new Personne(nom, prenom, email));
    }
}
