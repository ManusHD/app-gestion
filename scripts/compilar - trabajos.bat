@echo off

:: Ruta al directorio del microservicio
set MICROSERVICIO_TRABAJOS=..\backend\trabajos

:: Ejecutar trabajos en una nueva ventana
start cmd /k "cd %MICROSERVICIO_TRABAJOS% && mvn clean package && mvn spring-boot:run"
