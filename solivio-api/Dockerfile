# Image du backend Solivio (Spring Boot 4, Java 25).
#
# Construction en trois etapes : compilation Maven, extraction des couches du
# JAR (les dependances changent rarement et restent en cache), puis image JRE
# minimale executee sans root. Les tests ne tournent pas ici : la CI lance
# ./mvnw verify avant de construire l'image.

FROM eclipse-temurin:25-jdk-alpine AS build

RUN apk add --no-cache bash

WORKDIR /build

COPY mvnw .
COPY .mvn .mvn
RUN chmod +x mvnw

COPY pom.xml .
RUN ./mvnw dependency:go-offline -B

COPY src ./src
RUN ./mvnw package -DskipTests -B

FROM eclipse-temurin:25-jdk-alpine AS extract

WORKDIR /app

COPY --from=build /build/target/*.jar app.jar
RUN java -Djarmode=tools -jar app.jar extract --layers --launcher --destination extracted

FROM eclipse-temurin:25-jre-alpine AS final

WORKDIR /app

RUN addgroup -S solivio && adduser -S solivio -G solivio

# Un volume nomme monte ici herite de ce proprietaire a sa creation : sans lui,
# l'application (non root) ne pourrait pas ecrire les logos et avatars.
RUN mkdir -p /var/solivio/uploads && chown solivio:solivio /var/solivio/uploads

COPY --from=extract /app/extracted/dependencies/ ./
COPY --from=extract /app/extracted/spring-boot-loader/ ./
COPY --from=extract /app/extracted/snapshot-dependencies/ ./
COPY --from=extract /app/extracted/application/ ./

USER solivio

# 8080 : API, routee par Traefik. 8081 : port de gestion (sondes, metriques),
# jamais route, joignable uniquement depuis les reseaux Docker.
EXPOSE 8080 8081

# Traefik ne route que vers un conteneur sain : la sonde suit donc la readiness, pas
# la liveness. /tmp/drain est cree avant l'arret lors d'un deploiement (docker-rollout,
# label docker-rollout.pre-stop-hook) : le conteneur devient malsain, Traefik cesse de
# lui envoyer du trafic, puis il est arrete. L'intervalle court borne cette attente.
HEALTHCHECK --interval=5s --timeout=3s --start-period=120s --start-interval=5s --retries=2 \
  CMD [ ! -f /tmp/drain ] && wget -qO- http://localhost:8081/actuator/health/readiness || exit 1

# JAVA_OPTS se regle a l'execution, par exemple "-XX:MaxRAMPercentage=75".
ENV JAVA_OPTS=""
ENTRYPOINT ["sh", "-c", "exec java ${JAVA_OPTS} org.springframework.boot.loader.launch.JarLauncher"]
