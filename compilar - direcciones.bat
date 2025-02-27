@echo off

:: Ruta al directorio del microservicio
set MICROSERVICIO_DIRECCIONES=backend\direcciones

:: Ejecutar agencias de envío en una nueva ventana
start cmd /k "cd %MICROSERVICIO_DIRECCIONES% && mvn clean package && mvn spring-boot:run"
