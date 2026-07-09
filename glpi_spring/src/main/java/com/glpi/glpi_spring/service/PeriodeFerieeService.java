package com.glpi.glpi_spring.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.glpi.glpi_spring.entity.PeriodeFeriee;
import com.glpi.glpi_spring.repository.PeriodeFerieeRepository;

@Service
public class PeriodeFerieeService {

    private final PeriodeFerieeRepository repository;

    public PeriodeFerieeService(PeriodeFerieeRepository repository) {
        this.repository = repository;
    }

    public List<PeriodeFeriee> getAll() {
        return repository.findAll();
    }

    public Optional<PeriodeFeriee> getById(Integer id) {
        return repository.findById(id);
    }

    public PeriodeFeriee save(PeriodeFeriee periode) {
        return repository.save(periode);
    }

    public PeriodeFeriee update(Integer id, PeriodeFeriee periode) {

        PeriodeFeriee exist = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Periode non trouvée"));

        exist.setNom(periode.getNom());
        exist.setDateDebut(periode.getDateDebut());
        exist.setDateFin(periode.getDateFin());

        return repository.save(exist);
    }

    public void delete(Integer id) {
        repository.deleteById(id);
    }

}