@echo off
echo ================================================
echo  Cargando variables de entorno desde .env
echo ================================================

:: Cargar variables de entorno desde .env
if exist .env (
    for /f "tokens=1,2 delims==" %%a in (.env) do (
        set %%a=%%b
    )
    echo Variables de entorno cargadas correctamente
) else (
    echo ERROR: No se encuentra el archivo .env
    pause
    exit /b 1
)

echo.
echo ================================================
echo  Iniciando microservicios...
echo ================================================
echo.

:: Ruta al directorio del microservicio
set MICROSERVICIO_ENTRADAS=..\backend\entradas
set MICROSERVICIO_PRODUCTOS=..\backend\productos
set MICROSERVICIO_SALIDAS=..\backend\salidas
set MICROSERVICIO_DCS=..\backend\dcs
set MICROSERVICIO_UBICACIONES=..\backend\ubicaciones
set MICROSERVICIO_AGENCIASENVIO=..\backend\agenciasenvio
set MICROSERVICIO_DIRECCIONES=..\backend\direcciones
set MICROSERVICIO_AUTH=..\backend\autenticacion
set MICROSERVICIO_ESTADOS=..\backend\estados
set MICROSERVICIO_TRABAJOS=..\backend\trabajos
set MICROSERVICIO_MUEBLES=..\backend\muebles
set MICROSERVICIO_TARIFAS=..\backend\tarifas
set MICROSERVICIO_CORREOS=..\backend\correos

:: Ejecutar cada microservicio en una nueva ventana
start "Productos :8091" cmd /c "cd %MICROSERVICIO_PRODUCTOS% && mvn spring-boot:run"
timeout /t 2 /nobreak >nul

start "Entradas :8092" cmd /c "cd %MICROSERVICIO_ENTRADAS% && mvn spring-boot:run"
timeout /t 2 /nobreak >nul

start "Salidas :8093" cmd /c "cd %MICROSERVICIO_SALIDAS% && mvn spring-boot:run"
timeout /t 2 /nobreak >nul

start "Trabajos :8094" cmd /c "cd %MICROSERVICIO_TRABAJOS% && mvn spring-boot:run"
timeout /t 2 /nobreak >nul

start "Ubicaciones :8095" cmd /c "cd %MICROSERVICIO_UBICACIONES% && mvn spring-boot:run"
timeout /t 2 /nobreak >nul

start "Agencias Envío :8096" cmd /c "cd %MICROSERVICIO_AGENCIASENVIO% && mvn spring-boot:run"
timeout /t 2 /nobreak >nul

start "Direcciones :8097" cmd /c "cd %MICROSERVICIO_DIRECCIONES% && mvn spring-boot:run"
timeout /t 2 /nobreak >nul

start "Autenticación :8098" cmd /c "cd %MICROSERVICIO_AUTH% && mvn spring-boot:run"
timeout /t 2 /nobreak >nul

start "Estados :8099" cmd /c "cd %MICROSERVICIO_ESTADOS% && mvn spring-boot:run"
timeout /t 2 /nobreak >nul

start "Muebles :8101" cmd /c "cd %MICROSERVICIO_MUEBLES% && mvn spring-boot:run"
timeout /t 2 /nobreak >nul

start "Tarifas :8102" cmd /c "cd %MICROSERVICIO_TARIFAS% && mvn spring-boot:run"
timeout /t 2 /nobreak >nul

start "Correos :8103" cmd /c "cd %MICROSERVICIO_CORREOS% && mvn spring-boot:run"

echo.
echo ================================================
echo  Todos los microservicios iniciados
echo ================================================
pause