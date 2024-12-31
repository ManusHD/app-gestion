import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PanelLateralComponent } from './componentes/panel-lateral/panel-lateral.component';
import { InventarioComponent } from './componentes/inventario/inventario.component';
import { CabeceraEntradasComponent } from './componentes/cabecera-entradas/cabecera-entradas.component';
import { CabeceraSalidasComponent } from './componentes/cabecera-salidas/cabecera-salidas.component';
import { InicioComponent } from './componentes/inicio/inicio.component';
import { EntradasPendientesComponent } from './componentes/entradas-pendientes/entradas-pendientes.component';
import { EntradasRecibidasComponent } from './componentes/entradas-recibidas/entradas-recibidas.component';
import { EntradasNuevoComponent } from './componentes/entradas-nuevo/entradas-nuevo.component';
import { SalidasPendientesComponent } from './componentes/salidas-pendientes/salidas-pendientes.component';
import { SalidasNuevoComponent } from './componentes/salidas-nuevo/salidas-nuevo.component';
import { SalidasEnviadasComponent } from './componentes/salidas-enviadas/salidas-enviadas.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DetallesEntradasComponent } from './componentes/detalles-entradas/detalles-entradas.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule  } from '@angular/material/snack-bar';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { ToastrModule } from 'ngx-toastr';
import { MatTableModule } from '@angular/material/table';

import { HttpClientModule } from '@angular/common/http';
import { EntradaServices } from './services/entrada.service';
import { SalidaServices } from './services/salida.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProductoServices } from './services/producto.service';
import { NuevoProductoComponent } from './componentes/inventario/nuevo-producto/nuevo-producto.component';
import { DetallesSalidasComponent } from './componentes/detalles-salidas/detalles-salidas.component';

@NgModule({
  declarations: [
    AppComponent,
    PanelLateralComponent,
    InventarioComponent,
    CabeceraEntradasComponent,
    CabeceraSalidasComponent,
    InicioComponent,
    EntradasPendientesComponent,
    EntradasRecibidasComponent,
    EntradasNuevoComponent,
    SalidasPendientesComponent,
    SalidasNuevoComponent,
    SalidasEnviadasComponent,
    DetallesEntradasComponent,
    NuevoProductoComponent,
    DetallesSalidasComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatButtonModule,
    MatDialogModule,
    MatDatepickerModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatTableModule,
    ReactiveFormsModule,
    ToastrModule.forRoot(),
  ],
  providers: [
    EntradaServices,
    SalidaServices,
    ProductoServices,
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
