@echo off

:: Ruta al directorio del microservicio
set MICROSERVICIO_PRODUCTOS=backend\productos

:: Ejecutar productos en una nueva ventana
start cmd /k "cd %MICROSERVICIO_PRODUCTOS% && mvn clean package && mvn spring-boot:run"
