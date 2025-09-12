@echo off

:: Ruta al directorio del microservicio
set MICROSERVICIO_ENTRADAS=..\backend\entradas

:: Ejecutar entradas en una nueva ventana
start cmd /k "cd %MICROSERVICIO_ENTRADAS% && mvn clean package && mvn spring-boot:run"
