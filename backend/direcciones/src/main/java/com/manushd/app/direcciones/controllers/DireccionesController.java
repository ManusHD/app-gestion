package com.manushd.app.direcciones.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;

import com.manushd.app.direcciones.models.Colaborador;
import com.manushd.app.direcciones.models.PDV;
import com.manushd.app.direcciones.models.Perfumeria;
import com.manushd.app.direcciones.repository.ColaboradoresRepository;
import com.manushd.app.direcciones.repository.PDVrepository;
import com.manushd.app.direcciones.repository.PerfumeriaRepository;


@Controller
@RestController
@CrossOrigin(value = "http://localhost:4200")
public class DireccionesController {
    
    @Autowired
    private ColaboradoresRepository colaboradoresRepository;
    @Autowired
    private PDVrepository pdvRepository;
    @Autowired
    private PerfumeriaRepository perfumeriaRepository;

    @GetMapping("/colaboradores")
    public Iterable<Colaborador> getAllColaboradores() {
        return colaboradoresRepository.findAllByOrderByNombreAsc();
    }

    @GetMapping("/colaboradores/{nombre}")
    public Colaborador getColaboradorByNombre(@PathVariable String nombre) {
        return colaboradoresRepository.findByNombre(nombre).orElse(null);
    }

    @GetMapping("/colaboradores/byNombre")
    public Iterable<Colaborador> getColaboradoresContainingIgnoreCaseByNombre(@RequestBody String nombre) {
        return colaboradoresRepository.findByNombreContainingIgnoreCase(nombre);
    }

    @PostMapping("/colaboradores")
    public Colaborador createColaborador(@RequestBody Colaborador colaborador) {
        Colaborador colaboradorAux = colaboradoresRepository.findById(colaborador.getId()).orElse(null);

        if(colaboradorAux == null) {
            return colaboradoresRepository.save(colaborador);
        }
        return null;
    }

    @PutMapping("/colaboradores/{id}")
    public Colaborador updateColaborador(@PathVariable Long id, @RequestBody Colaborador colaboradorDetails) {
        Colaborador colaborador = colaboradoresRepository.findById(id).orElse(null);
        if (colaborador != null) {
            
            return colaboradoresRepository.save(colaborador);
        }
        return null;
    }

    @DeleteMapping("/colaboradores/{id}")
    public void deleteColaborador(@PathVariable Long id) {
        colaboradoresRepository.deleteById(id);
    }


    @GetMapping("/pdvs")
    public Iterable<PDV> getAllPdvs() {
        return pdvRepository.findAllByOrderByNombreAsc();
    }

    @GetMapping("/pdvs/{nombre}")
    public PDV getPdvByNombre(@PathVariable String nombre) {
        return pdvRepository.findByNombre(nombre).orElse(null);
    }

    @GetMapping("/pdvs/byNombre")
    public Iterable<PDV> getPdvByNombreContainingIgnoreCase(@RequestBody String nombre) {
        return pdvRepository.findByNombreContainingIgnoreCase(nombre);
    }

    @PostMapping("/pdvs")
    public PDV createPdv(@RequestBody PDV pdv) {
        PDV pdvAux = pdvRepository.findById(pdv.getId()).orElse(null);
        if (pdvAux == null) {
            return pdvRepository.save(pdv);
        }
        return null;
    }

    @PutMapping("/pdvs/{id}/nuevaPerfumeria")
    public PDV nuevaPerfumeriaPDV(@PathVariable Long id, @RequestBody Perfumeria perfumeria) {
        PDV pdv = pdvRepository.findById(id).orElse(null);
        if (pdv != null) {
            pdv.getPerfumerias().add(perfumeria);
            return pdvRepository.save(pdv);
        }
        return null;
    }

    @DeleteMapping("/pdvs/{id}/eliminarPerfumeria")
    public PDV eliminarPerfumeriaPDV(@PathVariable Long id, @RequestBody Perfumeria perfumeria) {
        PDV pdv = pdvRepository.findById(id).orElse(null);
        if (pdv != null) {
            pdv.getPerfumerias().remove(perfumeria);
            return pdvRepository.save(pdv);
        }
        return null;
    }


    @PutMapping("/pdvs/{id}")
    public PDV updatePdv(@PathVariable Long id, @RequestBody PDV pdvDetails) {
        PDV pdv = pdvRepository.findById(id).orElse(null);
        if (pdv != null) {
            return pdvRepository.save(pdv);
        }
        return null;
    }

    @DeleteMapping("/pdvs/{id}")
    public void deletePdv(@PathVariable Long id) {
        pdvRepository.deleteById(id);
    }
    

    @GetMapping("/perfumerias")
    public Iterable<Perfumeria> getAllPerfumerias() {
        return perfumeriaRepository.findAllByOrderByNombreAsc();
    }

    @GetMapping("/perfumerias/{nombre}")
    public Perfumeria getPerfumeriaByNombre(@PathVariable String nombre) {
        return perfumeriaRepository.findByNombre(nombre).orElse(null);
    }

    @GetMapping("/perfumerias/byNombre")
    public Iterable<Perfumeria> getPerfumeriaByNombreContainingIgnoreCase(@RequestBody String nombre) {
        return perfumeriaRepository.findByNombreContainingIgnoreCase(nombre);
    }

    @PostMapping("/perfumerias")
    public Perfumeria createPerfumeria(@RequestBody Perfumeria perfumeria) {
        Perfumeria perfumeriaAux = perfumeriaRepository.findById(perfumeria.getId()).orElse(null);
        if (perfumeriaAux == null) {
            return perfumeriaRepository.save(perfumeria);
        }
        return null;
    }

    @PutMapping("/perfumerias/{id}")
    public Perfumeria updatePerfumeria(@PathVariable Long id, @RequestBody Perfumeria perfumeriaDetails) {
        Perfumeria perfumeria = perfumeriaRepository.findById(id).orElse(null);
        if (perfumeria != null) {
            return perfumeriaRepository.save(perfumeria);
        }
        return null;
    }

    @DeleteMapping("/perfumerias/{id}")
    public void deletePerfumeria(@PathVariable Long id) {
        perfumeriaRepository.deleteById(id);
    }
}
