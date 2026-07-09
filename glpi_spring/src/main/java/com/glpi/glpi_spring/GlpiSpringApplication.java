package com.glpi.glpi_spring;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GlpiSpringApplication {

	public static void main(String[] args) {
		SpringApplication.run(GlpiSpringApplication.class, args);
		System.err.println("Application started successfully!");
	}

}
