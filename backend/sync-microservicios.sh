#!/bin/bash

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Archivos comunes maestros
COMMON_DEV="application-common.properties"
COMMON_PROD="application-common-prod.properties"

echo -e "${BLUE}=== Verificando archivos maestros ===${NC}\n"

# Verificar que existan los archivos maestros
if [ ! -f "$COMMON_DEV" ]; then
    echo -e "${RED}✗ ERROR: No existe $COMMON_DEV en /backend/${NC}"
    echo -e "${YELLOW}Crea primero el archivo maestro en /backend/${NC}"
    exit 1
fi

if [ ! -f "$COMMON_PROD" ]; then
    echo -e "${RED}✗ ERROR: No existe $COMMON_PROD en /backend/${NC}"
    echo -e "${YELLOW}Crea primero el archivo maestro en /backend/${NC}"
    exit 1
fi

# Microservicios
MICROSERVICES=("agenciasenvio" "autenticacion" "correos" "direcciones" "entradas" "estados" "muebles" "productos" "salidas" "tarifas" "trabajos" "ubicaciones")

echo -e "${BLUE}=== Sincronizando propiedades comunes ===${NC}\n"

# Copiar archivos comunes a cada microservicio
for service in "${MICROSERVICES[@]}"; do
    RESOURCES_DIR="$service/src/main/resources"
    
    if [ -d "$RESOURCES_DIR" ]; then
        # Copiar desarrollo (crea si no existe, sobreescribe si existe)
        cp "$COMMON_DEV" "$RESOURCES_DIR/$COMMON_DEV"
        
        # Copiar producción (crea si no existe, sobreescribe si existe)
        cp "$COMMON_PROD" "$RESOURCES_DIR/$COMMON_PROD"
        
        echo -e "${GREEN}✓${NC} Sincronizado: $service"
    else
        echo -e "${RED}✗${NC} No existe el directorio: $RESOURCES_DIR"
    fi
done

echo -e "\n${GREEN}=== Sincronización completada ✓ ===${NC}"
echo -e "${BLUE}Archivos copiados a cada microservicio:${NC}"
echo -e "  - $COMMON_DEV"
echo -e "  - $COMMON_PROD"