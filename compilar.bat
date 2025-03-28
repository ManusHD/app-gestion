@echo off

:: Ruta al directorio del microservicio
set MICROSERVICIO_ENTRADAS=backend\entradas
set MICROSERVICIO_PRODUCTOS=backend\productos
set MICROSERVICIO_SALIDAS=backend\salidas
set MICROSERVICIO_DCS=backend\dcs
set MICROSERVICIO_UBICACIONES=backend\ubicaciones
set MICROSERVICIO_AGENCIASENVIO=backend\agenciasenvio
set MICROSERVICIO_DIRECCIONES=backend\direcciones
set MICROSERVICIO_AUTH=backend\autenticacion

:: Ejecutar productos en una nueva ventana   PORT = 8091
start cmd /k "cd %MICROSERVICIO_PRODUCTOS% && mvn clean package"

:: Ejecutar entradas en una nueva ventana   PORT = 8092
start cmd /k "cd %MICROSERVICIO_ENTRADAS% && mvn clean package"

:: Ejecutar salidas en una nueva ventana   PORT = 8093
start cmd /k "cd %MICROSERVICIO_SALIDAS% && mvn clean package"

:: Ejecutar ubicaciones en una nueva ventana   PORT = 8095
start cmd /k "cd %MICROSERVICIO_UBICACIONES% && mvn clean package"

:: Ejecutar agencias de envío en una nueva ventana   PORT = 8096
start cmd /k "cd %MICROSERVICIO_AGENCIASENVIO% && mvn clean package"

:: Ejecutar agencias de envío en una nueva ventana   PORT = 8097
start cmd /k "cd %MICROSERVICIO_DIRECCIONES% && mvn clean package"

:: Ejecutar dcs en una nueva ventana   PORT = 8098
start cmd /k "cd %MICROSERVICIO_AUTH% && mvn clean package" 
