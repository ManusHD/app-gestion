package com.manushd.app.correos.services;

import jakarta.mail.*;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Properties;

@Service
public class ImapService {

    @Value("${spring.mail.host}")
    private String mailHost;

    @Value("${spring.mail.username}")
    private String mailUsername;

    @Value("${spring.mail.password}")
    private String mailPassword;

    public void guardarEnEnviados(MimeMessage mensaje) {
        Session session = null;
        Store store = null;
        Folder sentFolder = null;

        try {
            // Configurar propiedades IMAP
            Properties props = new Properties();
            props.put("mail.store.protocol", "imaps");
            props.put("mail.imaps.host", mailHost);
            props.put("mail.imaps.port", "993");
            props.put("mail.imaps.ssl.enable", "true");
            props.put("mail.imaps.ssl.trust", mailHost);
            props.put("mail.imaps.connectiontimeout", "10000");
            props.put("mail.imaps.timeout", "10000");

            // Crear sesión y conectar
            session = Session.getInstance(props);
            store = session.getStore("imaps");
            store.connect(mailHost, mailUsername, mailPassword);

            System.out.println("✅ Conectado a IMAP correctamente");

            // NUEVO: Listar todas las carpetas disponibles para debug
            listarCarpetas(store);

            // Buscar carpeta de enviados con diferentes nombres posibles
            String[] nombresPosibles = {
                "INBOX.Sent",           // cPanel común
                "Sent",                 // Estándar
                "Sent Items",           // Outlook
                "Sent Messages",        // Algunos servidores
                "Enviados",             // Español
                "INBOX.Enviados",       // cPanel español
                "[Gmail]/Sent Mail"     // Gmail (por si acaso)
            };

            sentFolder = buscarCarpetaEnviados(store, nombresPosibles);

            if (sentFolder == null) {
                // Si no existe ninguna, intentar crear INBOX.Sent (común en cPanel)
                System.out.println("⚠️ No se encontró carpeta Enviados, intentando crear INBOX.Sent");
                sentFolder = store.getFolder("INBOX.Sent");
                if (!sentFolder.exists()) {
                    boolean creada = sentFolder.create(Folder.HOLDS_MESSAGES);
                    if (creada) {
                        System.out.println("✅ Carpeta INBOX.Sent creada exitosamente");
                    } else {
                        throw new MessagingException("No se pudo crear la carpeta INBOX.Sent");
                    }
                }
            }

            // Abrir carpeta y guardar mensaje
            sentFolder.open(Folder.READ_WRITE);
            sentFolder.appendMessages(new Message[]{mensaje});

            System.out.println("✅ Correo guardado en carpeta: " + sentFolder.getFullName());

        } catch (MessagingException e) {
            System.err.println("⚠️ Error al guardar en Enviados: " + e.getMessage());
            e.printStackTrace();
            // NO lanzamos la excepción para que no falle el envío del correo
        } finally {
            // Cerrar recursos
            try {
                if (sentFolder != null && sentFolder.isOpen()) {
                    sentFolder.close(false);
                }
                if (store != null && store.isConnected()) {
                    store.close();
                }
            } catch (MessagingException e) {
                e.printStackTrace();
            }
        }
    }

    private Folder buscarCarpetaEnviados(Store store, String[] nombresPosibles) throws MessagingException {
        for (String nombre : nombresPosibles) {
            try {
                Folder folder = store.getFolder(nombre);
                if (folder.exists()) {
                    System.out.println("✅ Carpeta encontrada: " + nombre);
                    return folder;
                }
            } catch (MessagingException e) {
                // Ignorar y probar siguiente nombre
            }
        }
        return null;
    }

    private void listarCarpetas(Store store) {
        try {
            System.out.println("📁 Listando carpetas disponibles:");
            Folder defaultFolder = store.getDefaultFolder();
            Folder[] folders = defaultFolder.list("*");
            
            for (Folder folder : folders) {
                System.out.println("  - " + folder.getFullName());
                
                // Listar subcarpetas también
                if ((folder.getType() & Folder.HOLDS_FOLDERS) != 0) {
                    Folder[] subfolders = folder.list("*");
                    for (Folder subfolder : subfolders) {
                        System.out.println("    └─ " + subfolder.getFullName());
                    }
                }
            }
        } catch (MessagingException e) {
            System.err.println("Error al listar carpetas: " + e.getMessage());
        }
    }
}