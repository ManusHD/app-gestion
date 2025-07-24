import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InicioComponent } from './componentes/inicio/inicio.component';
import { EntradasPendientesComponent } from './componentes/entradas-pendientes/entradas-pendientes.component';
import { EntradasRecibidasComponent } from './componentes/entradas-recibidas/entradas-recibidas.component';
import { EntradasNuevoComponent } from './componentes/entradas-nuevo/entradas-nuevo.component';
import { InventarioComponent } from './componentes/inventario/inventario.component';
import { SalidasPendientesComponent } from './componentes/salidas-pendientes/salidas-pendientes.component';
import { SalidasNuevoComponent } from './componentes/salidas-nuevo/salidas-nuevo.component';
import { SalidasEnviadasComponent } from './componentes/salidas-enviadas/salidas-enviadas.component';
import { FormularioEntradaSalidaComponent } from './componentes/formulario-entrada-salida/formulario-entrada-salida.component';
import { AgenciasTransporteComponent } from './componentes/agencias-transporte/agencias-transporte.component';
import { UbicacionesComponent } from './componentes/ubicaciones/ubicaciones.component';
import { EntradasPrevisionComponent } from './componentes/entradas-prevision/entradas-prevision.component';
import { SalidasPrevisionComponent } from './componentes/salidas-prevision/salidas-prevision.component';
import { PerfumeriasComponent } from './componentes/direcciones/perfumerias/perfumerias.component';
import { ColaboradoresComponent } from './componentes/direcciones/colaboradores/colaboradores.component';
import { PdvsComponent } from './componentes/direcciones/pdvs/pdvs.component';
import { OtrasDireccionesComponent } from './componentes/direcciones/otras-direcciones/otras-direcciones.component';
import { ProductosComponent } from './componentes/productos/productos.component';
import { ReubicarPaletsComponent } from './componentes/reubicar-palets/reubicar-palets.component';
import { LoginComponent } from './componentes/login/login.component';
import { authGuard } from './guardianes/auth.guard';
import { roleGuard } from './guardianes/role.guard';
import { RegistrarComponent } from './componentes/registrar/registrar.component';
import { PerfilComponent } from './componentes/perfil/perfil.component';
import { SalidasEnviospendientesComponent } from './componentes/salidas-enviospendientes/salidas-enviospendientes.component';
import { EstadosComponent } from './componentes/estados/estados.component';
import { FacturacionComponent } from './componentes/facturacion/facturacion.component';

const routes: Routes = [
  {path: '', component:InicioComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN', 'ROLE_OPERADOR'] }},
  {path: 'entradas', component:EntradasPrevisionComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN'] }},
  {path: 'entradas/pendientes', component:EntradasPendientesComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN', 'ROLE_OPERADOR'] }},
  {path: 'entradas/recibidas', component:EntradasRecibidasComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN', 'ROLE_OPERADOR'] }},
  {path: 'entradas/nuevo', component:EntradasNuevoComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN'] }},
  {path: 'salidas', component:SalidasPrevisionComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN'] }},
  {path: 'salidas/pendientes', component:SalidasPendientesComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN', 'ROLE_OPERADOR'] }},
  {path: 'salidas/envios', component:SalidasEnviospendientesComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN', 'ROLE_OPERADOR'] }},
  {path: 'salidas/enviadas', component:SalidasEnviadasComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN', 'ROLE_OPERADOR'] }},
  {path: 'salidas/nuevo', component:SalidasNuevoComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN'] }},
  {path: 'inventario', component:InventarioComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN', 'ROLE_OPERADOR'] }},
  {path: 'agencias', component:AgenciasTransporteComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN'] }},
  {path: 'ubicaciones', component:UbicacionesComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN'] }},
  {path: 'perfumerias', component:PerfumeriasComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN'] }},
  {path: 'pdv', component:PdvsComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN'] }},
  {path: 'colaboradores', component:ColaboradoresComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN'] }},
  {path: 'otrasDirecciones', component:OtrasDireccionesComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN'] }},
  {path: 'productos', component:ProductosComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN'] }},
  {path: 'reubicarPalets', component:ReubicarPaletsComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN'] }},
  {path: 'login', component:LoginComponent},
  {path: 'perfil', component:PerfilComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN'] }},
  {path: 'estados', component:EstadosComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN'] }},
  {path: 'facturacion', component:FacturacionComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN'] }},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

// Ahora necesito crear una nueva sección, la cual será para los trabajos de manipulación.

// Debe tener un formulario y estructura similar a las entradas, de ahí a que te haya puesto de ejemplo las entradas y el formulario usado en entradas y salidas, pero con algunas modificaciones, por lo que podrías crear uno nuevo si lo ves más convincente.

// Tendrá 3 subsecciones (a diferencia de las entradas que sólo tiene 3), las cuales serán para una crear la previsión, otra para modificar los trabajos previstos (y actualizarlos) y otra con el historial de trabajos hechos.

// Este nuevo formulario tendrá los siguientes campos: FECHA, CONCEPTO, DIRECCIÓN (puede ser un PDV [PDV + PERFUMERIA] u Otro Origen, pero con las direcciones rellenas como se haría en salidas), HORAS, IMPORTE (debe ser modificable de algún modo, por si en el futuro cambia, actualmente es de 25€/hora) y OBSERVACIONES.
