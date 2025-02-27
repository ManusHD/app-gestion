@echo off

:: Ruta al directorio del microservicio
set MICROSERVICIO_AGENCIASENVIO=backend\agenciasenvio

:: Ejecutar agencias de envío en una nueva ventana
start cmd /k "cd %MICROSERVICIO_AGENCIASENVIO% && mvn clean package && mvn spring-boot:run"
