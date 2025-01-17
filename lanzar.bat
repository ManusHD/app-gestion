@echo off

:: Ruta al directorio del microservicio
set MICROSERVICIO_ENTRADAS=backend\entradas
set MICROSERVICIO_PRODUCTOS=backend\productos
set MICROSERVICIO_SALIDAS=backend\salidas
set MICROSERVICIO_DCS=backend\dcs
set MICROSERVICIO_UBICACIONES=backend\ubicaciones
set MICROSERVICIO_AGENCIASENVIO=backend\agenciasenvio

:: Ejecutar entradas en una nueva ventana
start cmd /c "cd %MICROSERVICIO_ENTRADAS% && mvn spring-boot:run"

:: Ejecutar productos en una nueva ventana
start cmd /c "cd %MICROSERVICIO_PRODUCTOS% && mvn spring-boot:run"

:: Ejecutar salidas en una nueva ventana
start cmd /c "cd %MICROSERVICIO_SALIDAS% && mvn spring-boot:run"

:: Ejecutar dcs en una nueva ventana
start cmd /c "cd %MICROSERVICIO_DCS% && mvn spring-boot:run"

:: Ejecutar ubicaciones en una nueva ventana
start cmd /c "cd %MICROSERVICIO_UBICACIONES% && mvn spring-boot:run"

:: Ejecutar agencias de envío en una nueva ventana
start cmd /c "cd %MICROSERVICIO_AGENCIASENVIO% && mvn spring-boot:run"