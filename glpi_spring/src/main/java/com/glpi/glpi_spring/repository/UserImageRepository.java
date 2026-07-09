package com.glpi.glpi_spring.repository;

import com.glpi.glpi_spring.entity.UserImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserImageRepository extends JpaRepository<UserImage, Long> {
    // Permet de récupérer toutes les images d'un utilisateur spécifique
    List<UserImage> findByUserId(Long userId);
}