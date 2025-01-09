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

const routes: Routes = [
  {path: '', component:InicioComponent},
  {path: 'entradas', component:EntradasPendientesComponent},
  {path: 'entradas/recibidas', component:EntradasRecibidasComponent},
  {path: 'entradas/nuevo', component:EntradasNuevoComponent},
  {path: 'salidas', component:SalidasPendientesComponent},
  {path: 'salidas/enviadas', component:SalidasEnviadasComponent},
  {path: 'salidas/nuevo', component:SalidasNuevoComponent},
  {path: 'inventario', component:InventarioComponent},
  {path: 'agencias', component:FormularioEntradaSalidaComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
