@echo off

:: Ruta al directorio del microservicio
set MICROSERVICIO_CORREOS=..\backend\correos

:: Ejecutar correos en una nueva ventana
start cmd /k "cd %MICROSERVICIO_CORREOS% && mvn clean package && mvn spring-boot:run"
