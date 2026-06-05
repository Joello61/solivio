package com.solivio.api;

import com.solivio.api.identity.infrastructure.security.cookie.CookieProperties;
import com.solivio.api.identity.infrastructure.security.cookie.CorsProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({CookieProperties.class, CorsProperties.class})
public class SolivioApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(SolivioApiApplication.class, args);
	}

}
