package com.glpi.glpi_spring.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.glpi.glpi_spring.entity.UserImage;
import com.glpi.glpi_spring.service.UserImageService;

@RestController
@RequestMapping("/user-images")
@CrossOrigin(origins = "*") // À ajuster selon votre configuration de sécurité
public class UserImageController {

    @Autowired
    private UserImageService userImageService;

    // Récupérer toutes les images
    @GetMapping
    public List<UserImage> getAll() {
        return userImageService.getAllImages();
    }

    // Récupérer les images d'un utilisateur spécifique
    @GetMapping("/user/{userId}")
    public List<UserImage> getByUserId(@PathVariable Long userId) {
        return userImageService.getImagesByUserId(userId);
    }

    // Ajouter une image
    @PostMapping
    public UserImage create(@RequestBody UserImage userImage) {
        return userImageService.saveImage(userImage);
    }

    // Supprimer une image
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return userImageService.getImageById(id)
                .map(image -> {
                    userImageService.deleteImage(id);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}