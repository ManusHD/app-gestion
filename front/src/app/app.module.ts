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
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule  } from '@angular/material/snack-bar';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { ToastrModule } from 'ngx-toastr';
import { MatTableModule } from '@angular/material/table';

import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { EntradaServices } from './services/entrada.service';
import { SalidaServices } from './services/salida.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProductoServices } from './services/producto.service';
import { NuevoProductoComponent } from './componentes/productos/nuevo-producto/nuevo-producto.component';
import { DetallesSalidasComponent } from './componentes/detalles-salidas/detalles-salidas.component';
import { DCSService } from './services/dcs.service';
import { DetallesDcsComponent } from './componentes/detalles-dcs/detalles-dcs.component';
import { FormularioEntradaSalidaComponent } from './componentes/formulario-entrada-salida/formulario-entrada-salida.component';
import { FormularioEntradaSalidaService } from './services/formulario-entrada-salida.service';
import { ImportarExcelComponent } from './componentes/importar-excel/importar-excel.component';
import { ImportarExcelService } from './services/importar-excel.service';
import { UbicacionService } from './services/ubicacion.service';
import { UbicacionesComponent } from './componentes/ubicaciones/ubicaciones.component';
import { AgenciasTransporteComponent } from './componentes/agencias-transporte/agencias-transporte.component';
import { AgenciasTransporteService } from './services/agencias-transporte.service';
import { SnackBar } from './services/snackBar.service';
import { DetallesUbicacionComponent } from './componentes/detalles-ubicacion/detalles-ubicacion.component';
import { ListaUbicacionesComponent } from './componentes/lista-ubicaciones/lista-ubicaciones.component';
import { EntradasPrevisionComponent } from './componentes/entradas-prevision/entradas-prevision.component';
import { SalidasPrevisionComponent } from './componentes/salidas-prevision/salidas-prevision.component';
import { DireccionesService } from './services/direcciones.service';
import { PerfumeriasComponent } from './componentes/direcciones/perfumerias/perfumerias.component';
import { PdvsComponent } from './componentes/direcciones/pdvs/pdvs.component';
import { ColaboradoresComponent } from './componentes/direcciones/colaboradores/colaboradores.component';
import { OtrasDireccionesComponent } from './componentes/direcciones/otras-direcciones/otras-direcciones.component';
import { ReubicarProductoComponent } from './componentes/reubicar-producto/reubicar-producto.component';
import { ExportarExcelComponent } from './componentes/exportar-excel/exportar-excel.component';
import { ListaVisualesComponent } from './componentes/lista-visuales/lista-visuales.component';
import { ProductosComponent } from './componentes/productos/productos.component';
import { ListaProductosComponent } from './componentes/lista-productos/lista-productos.component';
import { ReubicarPaletsComponent } from './componentes/reubicar-palets/reubicar-palets.component';
import { ReubicarPaletsService } from './services/reubicar-palets.service';
import { PantallaCargaComponent } from './componentes/pantalla-carga/pantalla-carga.component';
import { PantallaCargaService } from './services/pantalla-carga.service';
import { LoginComponent } from './componentes/login/login.component';
import { AuthService } from './services/auth-service.service';
import { JwtInterceptor } from './interceptors/JwtInterceptor.interceptor';
import { RegistrarComponent } from './componentes/registrar/registrar.component';
import { AuthenticatedDirective } from './directivas/authenticated.directive';
import { HasRoleDirective } from './directivas/has-role.directive';
import { ConfirmDialogComponent } from './componentes/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogService } from './services/confirm-dialog.service';
import { ConfirmDirective } from './directivas/confirm.directive';
import { UsuariosComponent } from './componentes/usuarios/usuarios.component';
import { PerfilComponent } from './componentes/perfil/perfil.component';
import { SalidasEnviospendientesComponent } from './componentes/salidas-enviospendientes/salidas-enviospendientes.component';

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
    DetallesSalidasComponent,
    DetallesDcsComponent,
    FormularioEntradaSalidaComponent,
    ImportarExcelComponent,
    UbicacionesComponent,
    AgenciasTransporteComponent,
    DetallesUbicacionComponent,
    ListaUbicacionesComponent,
    EntradasPrevisionComponent,
    SalidasPrevisionComponent,
    PerfumeriasComponent,
    PdvsComponent,
    ColaboradoresComponent,
    OtrasDireccionesComponent,
    ReubicarProductoComponent,
    ExportarExcelComponent,
    ListaVisualesComponent,
    ProductosComponent,
    ListaProductosComponent,
    ReubicarPaletsComponent,
    PantallaCargaComponent,
    LoginComponent,
    RegistrarComponent,
    HasRoleDirective,
    AuthenticatedDirective,
    ConfirmDialogComponent,
    ConfirmDirective,
    UsuariosComponent,
    PerfilComponent,
    SalidasEnviospendientesComponent,
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
    MatPaginatorModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    ReactiveFormsModule,
    ToastrModule.forRoot(),
  ],
  providers: [
    AuthService,
    AgenciasTransporteService,
    ConfirmDialogService,
    DCSService,
    DireccionesService,
    EntradaServices,
    FormularioEntradaSalidaService,
    ImportarExcelService,
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    ProductoServices,
    ReubicarPaletsService,
    SalidaServices,
    SnackBar,
    UbicacionService,
    PantallaCargaService,
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
