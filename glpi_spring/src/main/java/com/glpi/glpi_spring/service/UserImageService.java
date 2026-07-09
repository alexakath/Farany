package com.glpi.glpi_spring.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.glpi.glpi_spring.entity.UserImage;
import com.glpi.glpi_spring.repository.UserImageRepository;

@Service
public class UserImageService {

    @Autowired
    private UserImageRepository userImageRepository;

    public List<UserImage> getAllImages() {
        return userImageRepository.findAll();
    }

    public List<UserImage> getImagesByUserId(Long userId) {
        return userImageRepository.findByUserId(userId);
    }

    public Optional<UserImage> getImageById(Long id) {
        return userImageRepository.findById(id);
    }

    public UserImage saveImage(UserImage userImage) {
        return userImageRepository.save(userImage);
    }

    public void deleteImage(Long id) {
        userImageRepository.deleteById(id);
    }
}