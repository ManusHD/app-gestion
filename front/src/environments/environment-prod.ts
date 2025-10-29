const direccion = 'https://api.chanel.delim.es';

export const environment = {
  production: true,
  keycloakUrl: 'https://keycloak.delim.es/realms/delim/protocol/openid-connect',
  keycloakClientId: 'delim-app',
  keycloakClientSecret: 'vlXWmhAry7IHqgkTFU4nUFlemosauGFN',
  
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
