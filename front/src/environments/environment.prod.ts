const direccion = 'http://212.227.235.56:';

export const environment = {
  production: true,
  apiAgenciasTransporte: direccion + '8096/agenciasEnvio',
  apiDirecciones: direccion + '8097/direcciones',
  apiEntradas: direccion + '8092/entradas',
  apiSalidas: direccion + '8093/salidas',
  apiUbicaciones: direccion + '8095/ubicaciones',
  apiProductos: direccion + '8091/productos',
  apiAutenticacion: direccion + '8098/auth',
};
