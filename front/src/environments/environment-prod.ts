const direccion = 'https://api.chanel.delim.es';

export const environment = {
  production: true,
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
};
