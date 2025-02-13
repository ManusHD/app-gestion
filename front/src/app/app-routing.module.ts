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

const routes: Routes = [
  {path: '', component:InicioComponent},
  {path: 'entradas', component:EntradasPrevisionComponent},
  {path: 'entradas/pendientes', component:EntradasPendientesComponent},
  {path: 'entradas/recibidas', component:EntradasRecibidasComponent},
  {path: 'entradas/nuevo', component:EntradasNuevoComponent},
  {path: 'salidas', component:SalidasPrevisionComponent},
  {path: 'salidas/pendientes', component:SalidasPendientesComponent},
  {path: 'salidas/enviadas', component:SalidasEnviadasComponent},
  {path: 'salidas/nuevo', component:SalidasNuevoComponent},
  {path: 'inventario', component:InventarioComponent},
  {path: 'agencias', component:AgenciasTransporteComponent},
  {path: 'ubicaciones', component:UbicacionesComponent},
  {path: 'perfumerias', component:PerfumeriasComponent},
  {path: 'pdv', component:PdvsComponent},
  {path: 'colaboradores', component:ColaboradoresComponent},
  {path: 'otrasDirecciones', component:OtrasDireccionesComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
