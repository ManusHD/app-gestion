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
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
