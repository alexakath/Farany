package com.glpi.glpi_spring.conf;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration // 2. Spring détecte automatiquement cette classe comme une configuration
               // globale
public class MvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Expose le dossier XAMPP sur l'URL
        // http://localhost:8080/dolibarr-documents/...
        registry.addResourceHandler("/dolibarr-documents/**")
                .addResourceLocations("file:E:/logiciel/xamp/htdocs/dolibarr-23.0.3/documents/users/");
    }
}