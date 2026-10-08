package com.solivio.api.identity.infrastructure.security;

import com.solivio.api.TestcontainersConfiguration;
import com.solivio.api.support.NettoyageBaseExtension;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.micrometer.metrics.test.autoconfigure.AutoConfigureMetrics;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalManagementPort;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifie sur de vrais ports HTTP le port de gestion (sondes publiques,
 * metriques reservees a Prometheus) et l'identifiant de requete des erreurs.
 */
@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = "solivio.auth.jwt-secret=test-jwt-secret-key-must-be-at-least-32-bytes-long")
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
// Les tests desactivent l'export des metriques par defaut : on le reactive ici.
@AutoConfigureMetrics
@ExtendWith(NettoyageBaseExtension.class)
class ObservabiliteHttpIntegrationTest {

    private static final String JETON = "test-metrics-scrape-token";

    @LocalServerPort private int port;
    @LocalManagementPort private int managementPort;

    private final HttpClient client = HttpClient.newHttpClient();

    @Test
    void sondesDeSante_publiquesSurLePortDeGestion() throws Exception {
        assertThat(get(managementPort, "/actuator/health/liveness", null).statusCode()).isEqualTo(200);
        assertThat(get(managementPort, "/actuator/health/readiness", null).statusCode()).isEqualTo(200);
    }

    @Test
    void sante_nExposeAucunDetail() throws Exception {
        HttpResponse<String> reponse = get(managementPort, "/actuator/health", null);

        assertThat(reponse.statusCode()).isEqualTo(200);
        assertThat(reponse.body()).doesNotContain("db").doesNotContain("diskSpace");
    }

    @Test
    void metriques_refuseesSansJeton() throws Exception {
        assertThat(get(managementPort, "/actuator/prometheus", null).statusCode()).isEqualTo(401);
    }

    @Test
    void metriques_refuseesAvecUnMauvaisJeton() throws Exception {
        assertThat(get(managementPort, "/actuator/prometheus", "Bearer mauvais-jeton").statusCode()).isEqualTo(401);
    }

    @Test
    void metriques_exposeesAvecLeJeton() throws Exception {
        HttpResponse<String> reponse = get(managementPort, "/actuator/prometheus", "Bearer " + JETON);

        assertThat(reponse.statusCode()).isEqualTo(200);
        assertThat(reponse.body())
            .contains("solivio_inscriptions_confirmees_total")
            .contains("solivio_evenements_publications_echouees")
            .contains("http_server_requests_seconds_bucket")
            .contains("hikaricp_connections");
    }

    @Test
    void metriques_absentesDuPortPublic() throws Exception {
        assertThat(get(port, "/actuator/prometheus", "Bearer " + JETON).statusCode()).isNotEqualTo(200);
    }

    @Test
    void erreurDeLaChaineDeSecurite_porteLeRequestIdDeLaReponse() throws Exception {
        HttpResponse<String> reponse = get(port, "/api/distributions", null);

        String requestId = reponse.headers().firstValue("X-Request-Id").orElseThrow();
        assertThat(reponse.statusCode()).isEqualTo(401);
        assertThat(reponse.body())
            .contains("\"code\":\"UNAUTHENTICATED\"")
            .contains("\"request_id\":\"" + requestId + "\"");
    }

    private HttpResponse<String> get(int cible, String chemin, String autorisation)
            throws IOException, InterruptedException {
        HttpRequest.Builder requete = HttpRequest.newBuilder(URI.create("http://localhost:" + cible + chemin));
        if (autorisation != null) {
            requete.header("Authorization", autorisation);
        }
        return client.send(requete.build(), HttpResponse.BodyHandlers.ofString());
    }
}
