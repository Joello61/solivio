package com.solivio.api.shared.infrastructure.temps;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

/** Horloge injectable, remplacee par Clock.fixed dans les tests. */
@Configuration
public class HorlogeConfiguration {

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }
}
