@echo off

:: Ruta al directorio del microservicio
set MICROSERVICIO_ENTRADAS=backend\entradas
set MICROSERVICIO_PRODUCTOS=backend\productos
set MICROSERVICIO_SALIDAS=backend\salidas
set MICROSERVICIO_DCS=backend\dcs

:: Ejecutar entradas en una nueva ventana
start cmd /k "cd %MICROSERVICIO_ENTRADAS% && mvn clean package"

:: Ejecutar productos en una nueva ventana
start cmd /c "cd %MICROSERVICIO_PRODUCTOS% && mvn clean package"

:: Ejecutar productos en una nueva ventana
start cmd /c "cd %MICROSERVICIO_SALIDAS% && mvn clean package"

:: Ejecutar productos en una nueva ventana
start cmd /c "cd %MICROSERVICIO_DCS% && mvn clean package"