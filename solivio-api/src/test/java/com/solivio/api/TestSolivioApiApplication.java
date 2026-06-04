package com.solivio.api;

import org.springframework.boot.SpringApplication;

public class TestSolivioApiApplication {

	public static void main(String[] args) {
		SpringApplication.from(SolivioApiApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
