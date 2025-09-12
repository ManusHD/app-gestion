@echo off

:: Ruta al directorio del microservicio
set MICROSERVICIO_MUEBLES=..\backend\muebles

:: Ejecutar muebles en una nueva ventana
start cmd /k "cd %MICROSERVICIO_MUEBLES% && mvn clean package && mvn spring-boot:run"
