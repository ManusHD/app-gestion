@echo off

:: Ruta al directorio del microservicio
set MICROSERVICIO_UBICACIONES=..\backend\ubicaciones

:: Ejecutar ubicaciones en una nueva ventana
start cmd /k "cd %MICROSERVICIO_UBICACIONES% && mvn clean package && mvn spring-boot:run"
