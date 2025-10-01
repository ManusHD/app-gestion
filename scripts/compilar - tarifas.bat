@echo off

:: Ruta al directorio del microservicio
set MICROSERVICIO_TARIFAS=..\backend\tarifas

:: Ejecutar tarifas en una nueva ventana
start cmd /k "cd %MICROSERVICIO_TARIFAS% && mvn clean package && mvn spring-boot:run"
