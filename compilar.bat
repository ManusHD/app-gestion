@echo off

:: Ruta al directorio del microservicio
set MICROSERVICIO_ENTRADAS=backend\entradas
set MICROSERVICIO_PRODUCTOS=backend\productos
set MICROSERVICIO_SALIDAS=backend\salidas
set MICROSERVICIO_DCS=backend\dcs
set MICROSERVICIO_UBICACIONES=backend\ubicaciones

:: Ejecutar entradas en una nueva ventana
start cmd /c "cd %MICROSERVICIO_ENTRADAS% && mvn install clean package"

:: Ejecutar productos en una nueva ventana
start cmd /k "cd %MICROSERVICIO_PRODUCTOS% && mvn install clean package"

:: Ejecutar productos en una nueva ventana
start cmd /c "cd %MICROSERVICIO_SALIDAS% && mvn install clean package"

:: Ejecutar productos en una nueva ventana
start cmd /c "cd %MICROSERVICIO_DCS% && mvn install clean package"
@REM :: Ejecutar entradas en una nueva ventana
@REM start cmd /k "cd %MICROSERVICIO_ENTRADAS% && mvn clean package"

@REM :: Ejecutar productos en una nueva ventana
@REM start cmd /c "cd %MICROSERVICIO_PRODUCTOS% && mvn clean package"

@REM :: Ejecutar salidas en una nueva ventana
@REM start cmd /c "cd %MICROSERVICIO_SALIDAS% && mvn clean package"

@REM :: Ejecutar dcs en una nueva ventana
@REM start cmd /c "cd %MICROSERVICIO_DCS% && mvn clean package"

:: Ejecutar ubicaciones en una nueva ventana
start cmd /c "cd %MICROSERVICIO_UBICACIONES% && mvn clean package"
