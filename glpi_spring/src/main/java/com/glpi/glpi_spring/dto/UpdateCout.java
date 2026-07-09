package com.glpi.glpi_spring.dto;

public class UpdateCout {

    private Integer idTicket;
    private Integer mode;
    private Double pourcentage;
    private Double supercost;
    private String typeCout;

    // --- CONSTRUCTEURS ---
    
    public UpdateCout() {
    }

    public UpdateCout(Integer idTicket, Integer mode, Double pourcentage, Double supercost,String typeCout) {
        this.idTicket = idTicket;
        this.mode = mode;
        this.pourcentage = pourcentage;
        this.supercost = supercost;
        this.typeCout = typeCout;
    }

    // --- GETTERS & SETTERS ---

    public Integer getIdTicket() {
        return idTicket;
    }

    public void setIdTicket(Integer idTicket) {
        this.idTicket = idTicket;
    }

    public Integer getMode() {
        return mode;
    }

    public void setMode(Integer mode) {
        this.mode = mode;
    }

    public Double getPourcentage() {
        return pourcentage;
    }

    public void setPourcentage(Double pourcentage) {
        this.pourcentage = pourcentage;
    }

    public Double getSupercost() {
        return supercost;
    }

    public void setSupercost(Double supercost) {
        this.supercost = supercost;
    }

    public String getTypecout() {
        return typeCout;
    }

    public void setTypeCout(String typeCout) {
        this.typeCout = typeCout;
    }
}