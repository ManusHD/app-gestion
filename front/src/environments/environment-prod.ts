const direccion = 'https://delim.duckdns.org';

export const environment = {
  production: true,
  keycloakUrl: direccion + '/keycloak/realms/delim/protocol/openid-connect',
  keycloakClientId: 'delim-app',
  keycloakClientSecret: 'lww5hYdRzFD0JUfPww7KDyymnsACBQ2r',
  
  apiAgenciasTransporte: direccion + '/agenciasEnvio',
  apiDirecciones: direccion + '/direcciones',
  apiEntradas: direccion + '/entradas',
  apiSalidas: direccion + '/salidas',
  apiUbicaciones: direccion + '/ubicaciones',
  apiProductos: direccion + '/productos',
  apiAutenticacion: direccion + '/auth',
  apiEstados: direccion + '/estados',
  apiTrabajos: direccion + '/trabajos',
  apiMuebles: direccion + '/muebles',
  apiTarifas: direccion + '/tarifas',
  apiCorreos: direccion + '/correos',
  apiPlantillasCorreos: direccion + '/plantillas-correo',
};