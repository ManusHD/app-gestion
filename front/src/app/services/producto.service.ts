import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto } from '../models/producto.model';
import { environment } from '../../environments/environment-dev';
import { Estado } from '../models/estado.model';
import { TransferirEstadoDTO } from '../models/TransferirEstadoDTO.interface';
import { MigrarEstadoDTO } from '../models/MigrarEstadoDTO';

@Injectable()
export class ProductoServices {
  private apiUrl = environment.apiProductos;
  private apiUrlEstados = environment.apiEstados;

  constructor(private http: HttpClient) {}

  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}`);
  }

  getProductosPaginado(page: number, size: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/byReferencia?page=${page}&size=${size}`
    );
  }

  getProductoPorReferencia(referencia: String): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/referencia/${referencia}`);
  }

  // Nuevo método para obtener estados disponibles
  getEstadosDisponiblesPorReferencia(referencia: string): Observable<string[]> {
    return this.http.get<string[]>(
      `${this.apiUrl}/referencia/${referencia}/estados`
    );
  }

  // Nuevo método para obtener stock disponible real
  getStockDisponibleReal(referencia: string, estado: string, ubicacion: string): Observable<{stockTotal: number, unidadesEnUso: number, stockDisponible: number}> {
    return this.http.get<{stockTotal: number, unidadesEnUso: number, stockDisponible: number}>(
      `${this.apiUrl}/stock-disponible/${referencia}/estado/${estado}/ubicacion/${ubicacion}`
    );
  }

  // Método para obtener stock disponible en envíos (excluyendo la salida actual)
  getStockDisponibleEnvios(referencia: string, estado: string, ubicacion: string, salidaId: number): Observable<{stockTotal: number, unidadesEnUsoOtros: number, stockDisponible: number}> {
    return this.http.get<{stockTotal: number, unidadesEnUsoOtros: number, stockDisponible: number}>(
      `${this.apiUrl}/stock-disponible-envios/${referencia}/estado/${estado}/ubicacion/${ubicacion}/excluir/${salidaId}`
    );
  }

  // Nuevo método para obtener producto específico por referencia y estado
  getProductoPorReferenciaYEstado(
    referencia: string,
    estado: string
  ): Observable<Producto> {
    return this.http.get<Producto>(
      `${this.apiUrl}/referencia/${referencia}/estado/${estado}`
    );
  }

  getVisualesPaginado(page: number, size: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/visuales?page=${page}&size=${size}`
    );
  }

  getVisualesPorDescripcionPaginado(
    descripcion: string,
    page: number,
    size: number
  ): Observable<any> {
    console.log(
      `${this.apiUrl}/visuales/descripcion/${descripcion}?page=${page}&size=${size}`
    );
    return this.http.get<any>(
      `${this.apiUrl}/visuales/descripcion/${descripcion}?page=${page}&size=${size}`
    );
  }

  getProductosSinReferenciaPaginado(
    page: number,
    size: number
  ): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/sinreferencia?page=${page}&size=${size}`
    );
  }

  getProductosSinReferenciaPorDescripcionPaginado(
    description: string,
    page: number,
    size: number
  ): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/sinreferencia/descripcion/${description}?page=${page}&size=${size}`
    );
  }

  getProductosPorDescripcionPaginado(
    descripcion: String,
    page: number,
    size: number
  ): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/description/${descripcion}/paginado?page=${page}&size=${size}`
    );
  }

  getProductosPorReferenciaPaginado(
    referencia: String,
    page: number,
    size: number
  ): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/referencia/${referencia}/buscar/paginado?page=${page}&size=${size}`
    );
  }

  getProductosPorDescripcion(descripcion: String): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/description/${descripcion}`);
  }

  getProductosPorReferencia(referencia: String): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/referencia/${referencia}/buscar`);
  }

  // En producto.service.ts - Nuevos métodos
  getProductosUnicosPaginado(page: number, size: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/uniqueProducts?page=${page}&size=${size}`
    );
  }

  getProductosUnicosPorReferenciaPaginado(
    referencia: string,
    page: number,
    size: number
  ): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/uniqueProducts/referencia/${referencia}?page=${page}&size=${size}`
    );
  }

  getProductosUnicosPorDescripcionPaginado(
    descripcion: string,
    page: number,
    size: number
  ): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/uniqueProducts/descripcion/${descripcion}?page=${page}&size=${size}`
    );
  }

  postProducto(producto: Producto): Observable<Producto> {
    producto.stock = 0;
    return this.http.post<Producto>(`${this.apiUrl}`, producto);
  }

  putProducto(id: number, producto: Producto): Observable<Producto> {
    console.log(producto.description);
    return this.http.put<Producto>(
      `${this.apiUrl}/${id}`,
      producto.description
    );
  }

  deleteProducto(id: number): Observable<Producto> {
    return this.http.delete<Producto>(`${this.apiUrl}/${id}`);
  }

  transferirEstado(dto: TransferirEstadoDTO): Observable<string> {
    return this.http.put(`${this.apiUrl}/transferir-estado`, dto, {
      responseType: 'text',
    });
  }

  // AGREGAR en ProductoServices
  eliminarGrupoProductos(referencia: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/grupo/${referencia}`);
  }

  migrarProductosSinEstado(dto: MigrarEstadoDTO): Observable<string> {
    return this.http.post(`${this.apiUrl}/migrar-sin-estado`, dto, {
      responseType: 'text',
    });
  }

  sincronizarProductosDesdeUbicaciones(): Observable<string> {
    return this.http.post(
      `${this.apiUrl}/sincronizar-desde-ubicaciones`,
      {},
      {
        responseType: 'text',
      }
    );
  }
}
