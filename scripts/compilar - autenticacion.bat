@echo off

:: Ruta al directorio del microservicio
set MICROSERVICIO_AUTENTICACION=..\backend\autenticacion

:: Ejecutar ubicaciones en una nueva ventana
start cmd /k "cd %MICROSERVICIO_AUTENTICACION% && mvn clean package && mvn spring-boot:run"
