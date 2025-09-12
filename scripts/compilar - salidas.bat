@echo off

set MICROSERVICIO_SALIDAS=..\backend\salidas
:: Ejecutar salidas en una nueva ventana

start cmd /k "cd %MICROSERVICIO_SALIDAS% && mvn clean package && mvn spring-boot:run"
