// backend/correos/src/main/java/com/manushd/app/correos/controllers/PlantillaCorreoController.java
package com.manushd.app.correos.controllers;

import com.manushd.app.correos.models.PlantillaCorreo;
import com.manushd.app.correos.repository.PlantillaCorreoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/plantillas-correo")
@PreAuthorize("hasRole('ADMIN')")
public class PlantillaCorreoController {

    @Autowired
    private PlantillaCorreoRepository plantillaRepository;

    @GetMapping
    public Page<PlantillaCorreo> getPlantillas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return plantillaRepository.findAll(PageRequest.of(page, size, Sort.by("alias")));
    }

    @GetMapping("/activas")
    public List<PlantillaCorreo> getPlantillasActivas() {
        return plantillaRepository.findByActivaTrue();
    }

    @GetMapping("/activas/paginado")
    public Page<PlantillaCorreo> getPlantillasActivasPaginado(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return plantillaRepository.findByActivaTrue(PageRequest.of(page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlantillaCorreo> getPlantillaById(@PathVariable Long id) {
        return plantillaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/alias/{alias}")
    public ResponseEntity<PlantillaCorreo> getPlantillaByAlias(@PathVariable String alias) {
        return plantillaRepository.findByAlias(alias)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/buscar")
    public Page<PlantillaCorreo> buscarPlantillas(
            @RequestParam String alias,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return plantillaRepository.findByAliasContainingIgnoreCase(alias, PageRequest.of(page, size));
    }

    @PostMapping
    public ResponseEntity<?> crearPlantilla(@RequestBody PlantillaCorreo plantilla) {
        if (plantillaRepository.existsByAlias(plantilla.getAlias())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Ya existe una plantilla con ese alias");
        }
        PlantillaCorreo saved = plantillaRepository.save(plantilla);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarPlantilla(
            @PathVariable Long id,
            @RequestBody PlantillaCorreo plantilla) {
        return plantillaRepository.findById(id)
                .map(existente -> {
                    // Verificar alias duplicado solo si cambió
                    if (!existente.getAlias().equals(plantilla.getAlias()) &&
                            plantillaRepository.existsByAlias(plantilla.getAlias())) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body("Ya existe una plantilla con ese alias");
                    }
                    plantilla.setId(id);
                    plantilla.setFechaCreacion(existente.getFechaCreacion());
                    PlantillaCorreo updated = plantillaRepository.save(plantilla);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarPlantilla(@PathVariable Long id) {
        if (!plantillaRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        plantillaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}