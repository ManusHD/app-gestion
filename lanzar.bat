@echo off

:: Ruta al directorio del microservicio
set MICROSERVICIO_ENTRADAS=backend\entradas
set MICROSERVICIO_PRODUCTOS=backend\productos
set MICROSERVICIO_SALIDAS=backend\salidas
set MICROSERVICIO_DCS=backend\dcs

:: Ejecutar entradas en una nueva ventana
start cmd /c "cd %MICROSERVICIO_ENTRADAS% && mvn spring-boot:run"

:: Ejecutar productos en una nueva ventana
start cmd /c "cd %MICROSERVICIO_PRODUCTOS% && mvn spring-boot:run"

:: Ejecutar productos en una nueva ventana
start cmd /c "cd %MICROSERVICIO_SALIDAS% && mvn spring-boot:run"

:: Ejecutar productos en una nueva ventana
start cmd /c "cd %MICROSERVICIO_DCS% && mvn spring-boot:run"