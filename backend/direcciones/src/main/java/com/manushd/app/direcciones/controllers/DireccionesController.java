package com.manushd.app.direcciones.controllers;

import java.util.HashSet;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;

import com.manushd.app.direcciones.models.Colaborador;
import com.manushd.app.direcciones.models.OtrasDirecciones;
import com.manushd.app.direcciones.models.PDV;
import com.manushd.app.direcciones.models.Perfumeria;
import com.manushd.app.direcciones.repository.ColaboradoresRepository;
import com.manushd.app.direcciones.repository.OtrasDireccionesRepository;
import com.manushd.app.direcciones.repository.PDVrepository;
import com.manushd.app.direcciones.repository.PerfumeriaRepository;

import jakarta.persistence.EntityManager;

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
    @Autowired
    private OtrasDireccionesRepository otrasDireccionesRepository;

    @GetMapping("/colaboradores")
    public Iterable<Colaborador> getAllColaboradores() {
        return colaboradoresRepository.findAllByOrderByNombreAsc();
    }

    @GetMapping("/colaboradores/{nombre}")
    public Colaborador getColaboradorByNombre(@PathVariable String nombre) {
        return colaboradoresRepository.findByNombre(nombre).orElse(null);
    }

    @GetMapping("/colaboradores/byNombre/{nombre}")
    public Iterable<Colaborador> getColaboradoresContainingIgnoreCaseByNombre(@PathVariable String nombre) {
        return colaboradoresRepository.findByNombreContainingIgnoreCase(nombre);
    }

    @PostMapping("/colaboradores")
    public Colaborador createColaborador(@RequestBody Colaborador colaborador) {
        Colaborador colaboradorAux = colaboradoresRepository.findByNombre(colaborador.getNombre()).orElse(null);

        if (colaboradorAux == null) {
            return colaboradoresRepository.save(colaborador);
        }

        throw new IllegalArgumentException("Este coloborador ya existe");
    }

    @PutMapping("/colaboradores/{id}")
    public Colaborador updateColaborador(@PathVariable Long id, @RequestBody Colaborador colaboradorDetails) {
        Colaborador colaborador = colaboradoresRepository.findById(id).orElse(null);
        if (colaborador != null) {
            Colaborador existeColaborador = colaboradoresRepository.findByNombre(colaboradorDetails.getNombre())
                    .orElse(null);
            if (existeColaborador != null) {
                if (colaboradorDetails.getId() != existeColaborador.getId() &&
                        colaboradorDetails.getNombre().equals(existeColaborador.getNombre())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este colaborador ya existe");
                }
            }
            return colaboradoresRepository.save(colaboradorDetails);
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

    @GetMapping("/pdvs/byNombre/{nombre}")
    public Iterable<PDV> getPdvByNombreContainingIgnoreCase(@PathVariable String nombre) {
        return pdvRepository.findByNombreContainingIgnoreCase(nombre);
    }

    @PostMapping("/pdvs")
    @Transactional
    public PDV createPdv(@RequestBody PDV pdv) {
        PDV pdvAux = pdvRepository.findByNombre(pdv.getNombre()).orElse(null);
        if (pdvAux == null) {
            return pdvRepository.save(pdv);
        }
        throw new IllegalArgumentException("Esta perfumería ya existe en el PDV");
    }

    @PutMapping("/pdvs/{id}")
    public PDV updatePdv(@PathVariable Long id, @RequestBody PDV pdvDetails) {
        PDV pdv = pdvRepository.findById(id).orElse(null);
        if (pdv != null) {
            PDV existePDV = pdvRepository.findByNombre(pdvDetails.getNombre()).orElse(null);
            if (existePDV != null) {
                if (pdvDetails.getId() != existePDV.getId() &&
                        pdvDetails.getNombre().equals(existePDV.getNombre())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este PDV ya existe");
                }
            }
            return pdvRepository.save(pdvDetails);
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

    @GetMapping("/perfumerias/byNombre/{nombre}")
    public Iterable<Perfumeria> getPerfumeriaByNombreContainingIgnoreCase(@PathVariable String nombre) {
        return perfumeriaRepository.findByNombreContainingIgnoreCase(nombre);
    }

    @GetMapping("/perfumerias/activas")
    public Iterable<Perfumeria> getPerfumeriaActivas() {
        return perfumeriaRepository.findAllByActivaOrderByNombreAsc(true);
    }

    @GetMapping("/perfumerias/{perfumeriaId}/pdvs")
    public Iterable<PDV> getPDVsByPerfumeria(@PathVariable Long perfumeriaId) {
        return perfumeriaRepository.findPDVsByPerfumeriaId(perfumeriaId);
    }

    @GetMapping("/perfumerias/byNombrePdv/{nombrePdv}")
    public Iterable<Perfumeria> getPerfumeriasByNombrePDV(@PathVariable String nombrePdv) {
        return perfumeriaRepository.findByPdvsNombreOrderByNombreAsc(nombrePdv);
    }

    @GetMapping("/perfumerias/byPdvAttributes")
    public Iterable<Perfumeria> getPerfumeriasByPdvAttributes(
            @RequestParam(required = false) String nombre,
            @RequestParam(required = false) String direccion,
            @RequestParam(required = false) String telefono) {
        return perfumeriaRepository.findByPdvsAttributes(nombre, direccion, telefono);
    }

    @GetMapping("/perfumerias/{nombre}/pdvsPerfumeria")
    public Iterable<PDV> getPDVsPerfumeria(@PathVariable String nombre) {
        System.out.println("Nombre recibido: " + nombre);
        Perfumeria p = perfumeriaRepository.findByNombre(nombre).orElse(null);
        if(p != null) {
            return perfumeriaRepository.findPDVsByPerfumeriaId(p.getId());
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No existe ninguna Perfumería con ese nombre");
    }


    @Autowired
    private EntityManager entityManager;
    
    @PostMapping("/perfumerias")
    @Transactional
    public Perfumeria createPerfumeria(@RequestBody Perfumeria perfumeria) {
        Perfumeria perfumeriaAux = perfumeriaRepository.findByNombre(perfumeria.getNombre()).orElse(null);
        if (perfumeriaAux == null) {
            Perfumeria mergedPerfumeria = entityManager.merge(perfumeria);
            return perfumeriaRepository.save(mergedPerfumeria);
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Esta perfumería ya existe");
    }

    @PutMapping("/perfumerias/{id}/nuevoPDV")
    public ResponseEntity<?> agregarPerfumeria(@PathVariable Long id, @RequestBody PDV pdv) {
        try {
            // Buscar la Perfumeria
            Perfumeria perfumeria = perfumeriaRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("PDV no encontrado con id: " + id));

            // Si el PDV ya existe, lo buscamos, si no, lo creamos
            PDV pdvToAdd;
            if (pdv.getId() != null) {
                pdvToAdd = pdvRepository.findById(pdv.getId())
                        .orElseThrow(() -> new RuntimeException("PDV no encontrado con id: " + pdv.getId()));
            } else {
                pdvToAdd = pdvRepository.save(pdv);
            }

            // Agregar el PDV a la Perfumeria
            perfumeria.getPdvs().add(pdvToAdd);

            // Guardar la Perfumeria actualizada
            pdvRepository.save(pdv);

            return ResponseEntity.ok(perfumeria);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al agregar perfumería: " + e.getMessage());
        }
    }

    @PutMapping("/perfumerias/{id}/eliminarPDV/{pdvId}")
    public ResponseEntity<?> eliminarPerfumeria(@PathVariable Long id, @PathVariable Long pdvId) {
        try {
            // Buscar el PDV
            PDV pdv = pdvRepository.findById(pdvId)
                    .orElseThrow(() -> new RuntimeException("PDV no encontrado con id: " + pdvId));

            // Buscar la perfumería
            Perfumeria perfumeria = perfumeriaRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Perfumeria no encontrada con id: " + id));

            // Remover el PDV de la Perfumería
            if (perfumeria.getPdvs().remove(pdv)) {
                Perfumeria updatedPerfumeria = perfumeriaRepository.save(perfumeria);
                return ResponseEntity.ok(updatedPerfumeria);
            } else {
                return ResponseEntity.badRequest()
                        .body("La perfumería no está asociada a este PDV");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al eliminar perfumería: " + e.getMessage());
        }
    }

    @PutMapping("/perfumerias/{id}")
    public Perfumeria updatePerfumeria(@PathVariable Long id, @RequestBody Perfumeria perfumeriaDetails) {
        Perfumeria perfumeria = perfumeriaRepository.findById(id).orElse(null);
        if (perfumeria != null) {
            Perfumeria existePerfumeria = perfumeriaRepository.findByNombre(perfumeriaDetails.getNombre()).orElse(null);
            if (existePerfumeria != null) {
                if (perfumeriaDetails.getId() != existePerfumeria.getId()
                        && perfumeriaDetails.getNombre().equals(existePerfumeria.getNombre())) {
                    System.out.println("Entro");
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Esta perfumería ya existe");
                }
            }
            return perfumeriaRepository.save(perfumeriaDetails);
        }
        return null;
    }

    @DeleteMapping("/perfumerias/{id}")
    public void deletePerfumeria(@PathVariable Long id) {
        perfumeriaRepository.deleteById(id);
    }

    @GetMapping("/otrasDirecciones")
    public Iterable<OtrasDirecciones> getAllOtrasDirecciones() {
        return otrasDireccionesRepository.findAllByOrderByNombreAsc();
    }

    @GetMapping("/otrasDirecciones/{nombre}")
    public OtrasDirecciones getOtrasDireccionesByNombre(@PathVariable String nombre) {
        return otrasDireccionesRepository.findByNombre(nombre).orElse(null);
    }

    @GetMapping("/otrasDirecciones/byNombre/{nombre}")
    public Iterable<OtrasDirecciones> getOtrasDireccionesByNombreContainingIgnoreCase(@PathVariable String nombre) {
        return otrasDireccionesRepository.findByNombreContainingIgnoreCase(nombre);
    }

    @PostMapping("/otrasDirecciones")
    public OtrasDirecciones createOtrasDirecciones(@RequestBody OtrasDirecciones otrasDirecciones) {
        OtrasDirecciones otrasDireccionesAux = otrasDireccionesRepository.findByNombre(otrasDirecciones.getNombre())
                .orElse(null);
        if (otrasDireccionesAux == null) {
            return otrasDireccionesRepository.save(otrasDirecciones);
        }

        throw new IllegalArgumentException("Esta dirección ya existe");
    }

    @PutMapping("/otrasDirecciones/{id}")
    public OtrasDirecciones updateOtrasDirecciones(@PathVariable Long id,
            @RequestBody OtrasDirecciones otrasDireccionesDetails) {
        OtrasDirecciones otrasDirecciones = otrasDireccionesRepository.findById(id).orElse(null);
        if (otrasDirecciones != null) {
            OtrasDirecciones existeOtrasDirecciones = otrasDireccionesRepository
                    .findByNombre(otrasDireccionesDetails.getNombre()).orElse(null);
            if (existeOtrasDirecciones != null) {
                if (otrasDireccionesDetails.getId() != existeOtrasDirecciones.getId() &&
                        otrasDireccionesDetails.getNombre().equals(existeOtrasDirecciones.getNombre())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Esta dirección ya existe");
                }
            }
            return otrasDireccionesRepository.save(otrasDireccionesDetails);
        }
        return null;
    }

    @DeleteMapping("/otrasDirecciones/{id}")
    public void deleteOtrasDirecciones(@PathVariable Long id) {
        otrasDireccionesRepository.deleteById(id);
    }

}
