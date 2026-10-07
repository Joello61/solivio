package com.solivio.api;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.docs.Documenter;

/**
 * Verifie les frontieres entre modules (ADR-002) et regenere leur documentation.
 * Un echec signale un acces aux internes d'un autre module ou un cycle : il se
 * corrige par un port ou un evenement, jamais en assouplissant la verification.
 */
class ModularityTest {

    private final ApplicationModules modules = ApplicationModules.of(SolivioApiApplication.class);

    @Test
    void lesModulesRespectentLeursFrontieres() {
        modules.verify();
    }

    @Test
    void genereLaDocumentationDesModules() {
        new Documenter(modules, Documenter.Options.defaults().withOutputFolder("../docs/modules"))
            .writeDocumentation();
    }
}
