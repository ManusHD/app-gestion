@echo off

:: Ruta al directorio del microservicio
set MICROSERVICIO_ENTRADAS=backend\entradas
set MICROSERVICIO_PRODUCTOS=backend\productos
set MICROSERVICIO_SALIDAS=backend\salidas
set MICROSERVICIO_DCS=backend\dcs
set MICROSERVICIO_UBICACIONES=backend\ubicaciones
set MICROSERVICIO_AGENCIASENVIO=backend\agenciasenvio
set MICROSERVICIO_DIRECCIONES=backend\direcciones

:: Ejecutar entradas en una nueva ventana
start cmd /k "cd %MICROSERVICIO_ENTRADAS% && mvn clean package"

:: Ejecutar productos en una nueva ventana
start cmd /k "cd %MICROSERVICIO_PRODUCTOS% && mvn clean package"

:: Ejecutar salidas en una nueva ventana
start cmd /k "cd %MICROSERVICIO_SALIDAS% && mvn clean package"

:: Ejecutar dcs en una nueva ventana
start cmd /k "cd %MICROSERVICIO_DCS% && mvn clean package"

:: Ejecutar ubicaciones en una nueva ventana
start cmd /k "cd %MICROSERVICIO_UBICACIONES% && mvn clean package"

:: Ejecutar agencias de envío en una nueva ventana
start cmd /k "cd %MICROSERVICIO_AGENCIASENVIO% && mvn clean package"

:: Ejecutar agencias de envío en una nueva ventana
start cmd /k "cd %MICROSERVICIO_DIRECCIONES% && mvn clean package"
