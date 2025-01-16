package com.manushd.app.dcs.controllers;

import com.manushd.app.dcs.models.DCS;
import com.manushd.app.dcs.repository.DCSRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@Controller
@RestController
@CrossOrigin(value = "http://localhost:4200")
public class DCSController {
    @Autowired
    private DCSRepository dcsRepository;

    @GetMapping("/dcs")
    public Iterable<DCS> getDCSs() {
        return dcsRepository.findAll();
    }

    @GetMapping("/dcs/{id}")
    public DCS getDCSById(@PathVariable Long id) {
        return dcsRepository.findById(id).orElse(null);
    }

    @PostMapping("/dcs")
    public ResponseEntity<?> addDCS(@RequestBody DCS dcs) {
        DCS dcsAux = dcsRepository.findByDcs(dcs.getDcs()).orElse(null);
        
        if(dcsAux == null) {
            Entrada savedDcs =
            return dcsRepository.save(dcs);
        }

        return null;
    }   

    @PutMapping("/dcs/{id}")
    public DCS updateDCS(@PathVariable Long id, @RequestBody DCS dcs) {
        DCS dcsAux = dcsRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "DCS no encontrada"));
        if (dcsAux != null) {
            return dcsRepository.save(dcs);
        } else {
            throw new IllegalArgumentException("El DCS " + dcsAux.getDcs() + " ya existe");
        }
    }

    @DeleteMapping("/dcs/{id}")
    public void deleteById(@PathVariable Long id) {
        dcsRepository.deleteById(id);
    }










}
