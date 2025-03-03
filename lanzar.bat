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

:: Ejecutar entradas en una nueva ventana 8091
start cmd /c "cd %MICROSERVICIO_ENTRADAS% && mvn spring-boot:run"

:: Ejecutar productos en una nueva ventana 8092
start cmd /c "cd %MICROSERVICIO_PRODUCTOS% && mvn spring-boot:run"

:: Ejecutar salidas en una nueva ventana 8093
start cmd /c "cd %MICROSERVICIO_SALIDAS% && mvn spring-boot:run"

:: Ejecutar ubicaciones en una nueva ventana 8095
start cmd /c "cd %MICROSERVICIO_UBICACIONES% && mvn spring-boot:run"

:: Ejecutar agencias de envío en una nueva ventana 8096
start cmd /c "cd %MICROSERVICIO_AGENCIASENVIO% && mvn spring-boot:run"

:: Ejecutar agencias de envío en una nueva ventana 8097
start cmd /c "cd %MICROSERVICIO_DIRECCIONES% && mvn spring-boot:run"

:: Ejecutar dcs en una nueva ventana 8098
start cmd /c "cd %MICROSERVICIO_AUTH% && mvn spring-boot:run"