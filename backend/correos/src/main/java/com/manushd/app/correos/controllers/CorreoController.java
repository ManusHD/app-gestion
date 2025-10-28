package com.manushd.app.correos.controllers;

import com.manushd.app.correos.models.EnviarCorreoRequest;
import com.manushd.app.correos.models.HistorialCorreo;
import com.manushd.app.correos.repository.HistorialCorreoRepository;
import com.manushd.app.correos.services.ImapService;

import jakarta.mail.internet.MimeMessage;
import jakarta.mail.util.ByteArrayDataSource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

import jakarta.activation.DataSource;

@RestController
@RequestMapping("/correos")
@PreAuthorize("hasRole('ADMIN')")
public class CorreoController {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private HistorialCorreoRepository historialRepository;
    
    @Autowired
    private ImapService imapService;

    @GetMapping("/historial")
    public Page<HistorialCorreo> getHistorial(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return historialRepository.findAllByOrderByFechaEnvioDesc(PageRequest.of(page, size));
    }

    @GetMapping("/historial/salida/{salidaId}")
    public List<HistorialCorreo> getHistorialBySalida(@PathVariable Long salidaId) {
        return historialRepository.findBySalidaId(salidaId);
    }

    @GetMapping("/historial/buscar")
    public Page<HistorialCorreo> buscarHistorial(
            @RequestParam String destinatario,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return historialRepository.findByDestinatarioContainingIgnoreCase(
                destinatario, PageRequest.of(page, size));
    }

    @GetMapping("/historial/filtrar")
    public Page<HistorialCorreo> filtrarHistorial(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return historialRepository.findByFechaEnvioBetween(inicio, fin, PageRequest.of(page, size));
    }

    @PostMapping("/enviar")
    public ResponseEntity<?> enviarCorreo(@RequestBody EnviarCorreoRequest request) {
        HistorialCorreo historial = new HistorialCorreo();
        historial.setDestinatario(request.getDestinatario());
        historial.setAsunto(request.getAsunto());
        historial.setCuerpo(request.getCuerpo());
        historial.setSalidaId(request.getSalidaId());
        historial.setColaboradorNombre(request.getColaboradorNombre());

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("noreply@delim.es", "DELIM LOGÍSTICA");
            helper.setTo(request.getDestinatario());
            helper.setSubject(request.getAsunto());

            // Construir HTML preservando saltos de línea
            String htmlContent = construirHtmlConImagenes(
                request.getCuerpo(), 
                request.getImagenesUrls(), 
                request.getImagenesBase64()
            );
            helper.setText(htmlContent, true);

            // Adjuntar imágenes base64 como inline
            if (request.getImagenesBase64() != null && !request.getImagenesBase64().isEmpty()) {
                for (int i = 0; i < request.getImagenesBase64().size(); i++) {
                    EnviarCorreoRequest.ImagenBase64 img = request.getImagenesBase64().get(i);
                    byte[] imageBytes = Base64.getDecoder().decode(img.getContenidoBase64());
                    
                    // Crear DataSource inline
                    DataSource dataSource = new ByteArrayDataSource(imageBytes, img.getContentType());
                    helper.addInline("imagen_" + i, dataSource);
                }
            }

            mailSender.send(message);

            // Guardar copia en Enviados
            imapService.guardarEnEnviados(message);

            historial.setEnviado(true);
            historialRepository.save(historial);

            return ResponseEntity.ok().body("Correo enviado exitosamente");
        } catch (Exception e) {
            historial.setEnviado(false);
            historial.setMensajeError(e.getMessage());
            historialRepository.save(historial);

            return ResponseEntity.status(500).body("Error al enviar correo: " + e.getMessage());
        }
    }

    private String construirHtmlConImagenes(String cuerpo, List<String> imagenesUrls, 
                                           List<EnviarCorreoRequest.ImagenBase64> imagenesBase64) {
        // Convertir saltos de línea a HTML
        String cuerpoFormateado = cuerpo
            .replace("\n", "<br>")
            .replace("\r", "");
        
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>");
        html.append("<html><head><meta charset='UTF-8'>");
        html.append("<style>");
        html.append("body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }");
        html.append(".container { max-width: 600px; margin: 0 auto; background-color: white; }");
        html.append(".header { text-align: center; padding: 20px; background-color: #01081f; }");
        html.append(".header img { max-width: 200px; }");
        html.append(".content { padding: 20px; color: #333; line-height: 1.6; white-space: pre-wrap; }");
        html.append(".footer { text-align: center; padding: 20px; background-color: #f5f5f5; font-size: 12px; color: #777; }");
        html.append(".imagen-adjunta { max-width: 100%; margin: 10px 0; border-radius: 8px; }");
        html.append("</style>");
        html.append("</head><body>");
        html.append("<div class='container'>");

        // Header con logo
        html.append("<div class='header'>");
        html.append("<img src='https://chanel.delim.es/assets/imagenes/delim.jpg' alt='DELIM' />");
        html.append("</div>");

        // Cuerpo del correo con formato preservado
        html.append("<div class='content'>");
        html.append(cuerpoFormateado);
        html.append("</div>");

        // Imágenes URLs
        if (imagenesUrls != null && !imagenesUrls.isEmpty()) {
            html.append("<div style='padding: 20px;'>");
            for (String url : imagenesUrls) {
                html.append("<img src='").append(url).append("' class='imagen-adjunta'/>");
            }
            html.append("</div>");
        }

        // Imágenes Base64 adjuntas
        if (imagenesBase64 != null && !imagenesBase64.isEmpty()) {
            html.append("<div style='padding: 20px;'>");
            for (int i = 0; i < imagenesBase64.size(); i++) {
                html.append("<img src='cid:imagen_").append(i).append("' class='imagen-adjunta'/>");
            }
            html.append("</div>");
        }

        // Footer
        html.append("<div class='footer'>");
        html.append("<p>© 2025 DELIM - Todos los derechos reservados</p>");
        html.append("</div>");

        html.append("</div></body></html>");
        return html.toString();
    }
}