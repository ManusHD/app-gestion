@echo off

:: Ruta al directorio del microservicio
set MICROSERVICIO_ESTADOS=backend\estados

:: Ejecutar estados en una nueva ventana
start cmd /k "cd %MICROSERVICIO_ESTADOS% && mvn clean package && mvn spring-boot:run"
