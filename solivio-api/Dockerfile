# Dockerfile - solivio-api (Spring Boot 4 / Java 25)
# Place this file at: solivio-api/Dockerfile
#
# Multi-stage build:
#   build   - compile and package with Maven wrapper
#   extract - extract layered JAR for optimal Docker layer caching
#   final   - minimal JRE image for production
#
# Layered JAR approach: dependencies change rarely and stay cached.
# Only the application layer is rebuilt on code changes.
#
# Requires: the Maven wrapper (mvnw + .mvn/) committed in the repository.
# Requires: output: standalone NOT needed here (that is Next.js only).

# -----------------------------------------------------------------------------
# Stage 1: build
# -----------------------------------------------------------------------------
FROM eclipse-temurin:25-jdk-alpine AS build

RUN apk add --no-cache bash

WORKDIR /build

# copy wrapper first to cache the Maven download step
COPY mvnw .
COPY .mvn .mvn
RUN chmod +x mvnw

# copy pom separately to cache dependency resolution
COPY pom.xml .
RUN ./mvnw dependency:go-offline -B

# copy source and build
COPY src ./src
RUN ./mvnw package -DskipTests -B

# -----------------------------------------------------------------------------
# Stage 2: extract layers
# -----------------------------------------------------------------------------
FROM eclipse-temurin:25-jdk-alpine AS extract

WORKDIR /app

COPY --from=build /build/target/*.jar app.jar

# jarmode=tools is the Spring Boot 4 way to extract layers
# produces: dependencies/ spring-boot-loader/ snapshot-dependencies/ application/
RUN java -Djarmode=tools -jar app.jar extract --layers --destination extracted

# -----------------------------------------------------------------------------
# Stage 3: final runtime image
# -----------------------------------------------------------------------------
FROM eclipse-temurin:25-jre-alpine AS final

WORKDIR /app

# non-root user - never run the application as root
RUN addgroup -S solivio && adduser -S solivio -G solivio

# copy layers in order of least to most frequently changed
# each COPY creates a separate Docker layer for caching efficiency
COPY --from=extract /app/extracted/dependencies/ ./
COPY --from=extract /app/extracted/spring-boot-loader/ ./
COPY --from=extract /app/extracted/snapshot-dependencies/ ./
COPY --from=extract /app/extracted/application/ ./

USER solivio

EXPOSE 8080

# health check uses /actuator/health exposed by Spring Boot Actuator
HEALTHCHECK \
  --interval=30s \
  --timeout=5s \
  --start-period=90s \
  --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health || exit 1

# JAVA_OPTS can be overridden at runtime via the environment variable
# example: JAVA_OPTS="-Xmx512m -XX:+UseZGC"
ENV JAVA_OPTS=""
ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} org.springframework.boot.loader.launch.JarLauncher"]