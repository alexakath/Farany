package com.glpi.glpi_spring.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.glpi.glpi_spring.entity.PeriodeFeriee;
import com.glpi.glpi_spring.service.PeriodeFerieeService;

@RestController
@RequestMapping("/periodes-ferie")
@CrossOrigin("*")
public class PeriodeFerieeController {

    private final PeriodeFerieeService service;

    public PeriodeFerieeController(PeriodeFerieeService service) {
        this.service = service;
    }

    @GetMapping
    public List<PeriodeFeriee> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public PeriodeFeriee getById(@PathVariable Integer id) {
        return service.getById(id)
                .orElseThrow(() -> new RuntimeException("Periode non trouvée"));
    }

    @PostMapping
    public PeriodeFeriee create(@RequestBody PeriodeFeriee periode) {
        return service.save(periode);
    }

    @PutMapping("/{id}")
    public PeriodeFeriee update(@PathVariable Integer id,
                                @RequestBody PeriodeFeriee periode) {
        return service.update(id, periode);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}