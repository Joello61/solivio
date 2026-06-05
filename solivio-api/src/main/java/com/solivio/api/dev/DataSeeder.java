package com.solivio.api.dev;

import com.solivio.api.association.domain.Association;
import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.association.multitenancy.TenantContext;
import com.solivio.api.association.multitenancy.TenantProvisioningService;
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
 * Seeder de donnees de test. Active uniquement avec le profil "seed".
 *
 * Usage :
 *   SPRING_CLOUD_VAULT_TOKEN=root SPRING_PROFILES_ACTIVE=dev,seed ./mvnw spring-boot:run
 *
 * Idempotent : si le super-admin existe deja, le seeder ne fait rien.
 * Les identifiants crees sont affiches dans les logs au niveau INFO.
 */
@Component
@Profile("seed")
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    // Mot de passe commun a tous les comptes seedes (8 chars min, 1 maj, 1 chiffre).
    private static final String MDP_DEFAULT = "Solivio2026!";

    private final AssociationRepository associationRepo;
    private final CompteRepository compteRepo;
    private final MembreAssociationRepository membreRepo;
    private final PersonneRepository personneRepo;
    private final PasswordEncoder passwordEncoder;
    private final TenantProvisioningService provisioningService;

    public DataSeeder(
            AssociationRepository associationRepo,
            CompteRepository compteRepo,
            MembreAssociationRepository membreRepo,
            PersonneRepository personneRepo,
            PasswordEncoder passwordEncoder,
            TenantProvisioningService provisioningService) {
        this.associationRepo = associationRepo;
        this.compteRepo = compteRepo;
        this.membreRepo = membreRepo;
        this.personneRepo = personneRepo;
        this.passwordEncoder = passwordEncoder;
        this.provisioningService = provisioningService;
    }

    @Override
    public void run(String... args) {
        if (compteRepo.existsByEmail("superadmin@solivio.app")) {
            log.info("Donnees de seed deja presentes - seeder ignore.");
            return;
        }

        log.info("Demarrage du seeder de donnees de test...");

        String hash = passwordEncoder.encode(MDP_DEFAULT);
        List<String> rapport = new ArrayList<>();

        // ------------------------------------------------------------------ //
        //  SUPER ADMIN                                                          //
        // ------------------------------------------------------------------ //
        Compte superAdmin = creerCompte("superadmin@solivio.app", hash, "Admin", "Super", true);
        rapport.add("SUPER ADMIN");
        rapport.add("  superadmin@solivio.app / " + MDP_DEFAULT);

        // ------------------------------------------------------------------ //
        //  ASSOCIATIONS                                                         //
        // ------------------------------------------------------------------ //
        // creerAssociation commite la transaction avant que provision() soit appele.
        // Si provision() etait appele dans la meme transaction, Flyway (nouvelles
        // connexions) bloquerait en attente du schema non encore visible - deadlock.
        Association paris = creerAssociation("pilote-paris", "PARIS01", "Association Pilote Paris");
        provisioningService.provision(paris);
        Association toulouse = creerAssociation("toulouse", "TLSE01", "Association Toulouse");
        provisioningService.provision(toulouse);

        // ------------------------------------------------------------------ //
        //  ADMINS D'ASSOCIATION                                                 //
        // ------------------------------------------------------------------ //
        Compte adminParis = creerCompte("admin.paris@solivio.app", hash, "Paris", "Admin", false);
        affilifier(adminParis, paris, "admin", null);

        Compte adminToulouse = creerCompte("admin.toulouse@solivio.app", hash, "Toulouse", "Admin", false);
        affilifier(adminToulouse, toulouse, "admin", null);

        rapport.add("\nASSOCIATION : " + paris.getNom() + " (code : " + paris.getCode() + ")");
        rapport.add("  Admin        : admin.paris@solivio.app / " + MDP_DEFAULT);

        rapport.add("\nASSOCIATION : " + toulouse.getNom() + " (code : " + toulouse.getCode() + ")");
        rapport.add("  Admin        : admin.toulouse@solivio.app / " + MDP_DEFAULT);

        // ------------------------------------------------------------------ //
        //  RESPONSABLES (aucun ne partage les deux assos)                      //
        // ------------------------------------------------------------------ //
        for (int i = 1; i <= 3; i++) {
            Compte r = creerCompte("resp" + i + ".paris@solivio.app", hash, "Resp" + i, "Paris", false);
            affilifier(r, paris, "responsable", null);
        }
        for (int i = 1; i <= 3; i++) {
            Compte r = creerCompte("resp" + i + ".toulouse@solivio.app", hash, "Resp" + i, "Toulouse", false);
            affilifier(r, toulouse, "responsable", null);
        }

        rapport.add("\n  Responsables Paris    : resp1.paris@solivio.app .. resp3.paris@solivio.app / "
            + MDP_DEFAULT);
        rapport.add("  Responsables Toulouse : resp1.toulouse@solivio.app .. resp3.toulouse@solivio.app / "
            + MDP_DEFAULT);

        // ------------------------------------------------------------------ //
        //  COORDINATEURS                                                        //
        // Sous-types utilises : coordo_generale, coordo_sec,                   //
        //   coordo_fruit_legume, coordo_exterieur                               //
        // ------------------------------------------------------------------ //
        String[] coordoTypes = {"coordo_generale", "coordo_sec", "coordo_fruit_legume", "coordo_exterieur"};

        // 4 coordos propres a Paris
        for (int i = 0; i < coordoTypes.length; i++) {
            Compte c = creerCompte("coordo" + (i + 1) + ".paris@solivio.app", hash, "Coordo" + (i + 1), "Paris", false);
            affilifier(c, paris, "coordinateur", coordoTypes[i]);
        }
        // 4 coordos propres a Toulouse
        for (int i = 0; i < coordoTypes.length; i++) {
            Compte c = creerCompte("coordo" + (i + 1) + ".toulouse@solivio.app",
                hash, "Coordo" + (i + 1), "Toulouse", false);
            affilifier(c, toulouse, "coordinateur", coordoTypes[i]);
        }
        // 1 coordo dans les DEUX assos
        Compte coordoBoth = creerCompte("coordo.commun@solivio.app", hash, "Commun", "Coordo", false);
        affilifier(coordoBoth, paris, "coordinateur", "coordo_generale");
        affilifier(coordoBoth, toulouse, "coordinateur", "coordo_sec");

        rapport.add("  Coordos Paris (x4)    : coordo1.paris@solivio.app .. coordo4.paris@solivio.app / "
            + MDP_DEFAULT);
        rapport.add("  Coordos Toulouse (x4) : coordo1.toulouse@solivio.app .. coordo4.toulouse@solivio.app / "
            + MDP_DEFAULT);
        rapport.add("  Coordo commun (2 assos): coordo.commun@solivio.app / " + MDP_DEFAULT);

        // ------------------------------------------------------------------ //
        //  BENEFICIAIRES                                                        //
        // 7 propres a Paris + 7 propres a Toulouse + 3 dans les deux = 10 par  //
        // ------------------------------------------------------------------ //
        for (int i = 1; i <= 7; i++) {
            Compte b = creerCompte("benef" + i + ".paris@solivio.app", hash, "Benef" + i, "Paris", false);
            affilifier(b, paris, "beneficiaire", null);
        }
        for (int i = 1; i <= 7; i++) {
            Compte b = creerCompte("benef" + i + ".toulouse@solivio.app", hash, "Benef" + i, "Toulouse", false);
            affilifier(b, toulouse, "beneficiaire", null);
        }
        // 3 beneficiaires dans les deux assos
        for (int i = 1; i <= 3; i++) {
            Compte b = creerCompte("benef.commun" + i + "@solivio.app", hash, "Commun" + i, "Benef", false);
            affilifier(b, paris, "beneficiaire", null);
            affilifier(b, toulouse, "beneficiaire", null);
        }

        rapport.add("  Benefs Paris (x7)     : benef1.paris@solivio.app .. benef7.paris@solivio.app / "
            + MDP_DEFAULT);
        rapport.add("  Benefs Toulouse (x7)  : benef1.toulouse@solivio.app .. benef7.toulouse@solivio.app / "
            + MDP_DEFAULT);
        rapport.add("  Benefs communs (x3)   : benef.commun1@solivio.app .. benef.commun3@solivio.app / "
            + MDP_DEFAULT);

        // ------------------------------------------------------------------ //
        //  PERSONNE dans les schemas tenant (profil metier)                    //
        // ------------------------------------------------------------------ //
        seederPersonnesTenant(paris);
        seederPersonnesTenant(toulouse);

        // ------------------------------------------------------------------ //
        //  RAPPORT                                                              //
        // ------------------------------------------------------------------ //
        afficherRapport(rapport);
    }

    /**
     * Cree les enregistrements Personne dans le schema tenant a partir des
     * affiliations actives pour cette association. Necessite que le schema
     * existe deja (provisionne par TenantProvisioningService).
     */
    /**
     * Cree un enregistrement Personne dans le schema tenant pour chaque membre actif
     * de l'association. Appelable apres que le schema soit provisionne.
     */
    @Transactional
    public void seederPersonnesTenant(Association association) {
        String schema = TenantProvisioningService.schemaName(association.getSlug());
        TenantContext.setTenantId(schema);
        try {
            List<MembreAssociation> membres =
                membreRepo.findActivesByAssociationId(association.getId());
            for (MembreAssociation m : membres) {
                Compte c = m.getCompte();
                if (!personneRepo.existsByEmail(c.getEmail())) {
                    Personne p = new Personne(c.getNom(), c.getPrenom(), c.getEmail());
                    personneRepo.save(p);
                }
            }
            log.info("Personne records crees dans {} : {} entrees", schema, membres.size());
        } finally {
            TenantContext.clear();
        }
    }

    // ------------------------------------------------------------------ //
    //  Helpers                                                              //
    // ------------------------------------------------------------------ //

    @Transactional
    public Association creerAssociation(String slug, String code, String nom) {
        Association asso = new Association(slug, nom);
        asso.setCode(code);
        return associationRepo.save(asso);
    }

    @Transactional
    public Compte creerCompte(String email, String passwordHash, String nom,
                              String prenom, boolean superAdmin) {
        Compte c = new Compte(email, passwordHash, nom, prenom);
        c.setEmailVerifie(true);
        c.setSuperAdmin(superAdmin);
        return compteRepo.save(c);
    }

    @Transactional
    public void affilifier(Compte compte, Association association, String role, String coordoType) {
        MembreAssociation m = new MembreAssociation(compte, association, role);
        m.setCoordoType(coordoType);
        membreRepo.save(m);
    }

    private void afficherRapport(List<String> lignes) {
        String sep = "=".repeat(65);
        log.info("\n{}\n  SOLIVIO - Donnees de test crees avec succes\n{}", sep, sep);
        for (String ligne : lignes) {
            log.info(ligne);
        }
        log.info("{}\n  Tous les mots de passe : {}\n{}", sep, MDP_DEFAULT, sep);
    }
}
