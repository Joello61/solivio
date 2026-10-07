package com.solivio.api;

import com.solivio.api.identity.infrastructure.security.CorsProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableAsync
@EnableConfigurationProperties(CorsProperties.class)
public class SolivioApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(SolivioApiApplication.class, args);
    }
}
