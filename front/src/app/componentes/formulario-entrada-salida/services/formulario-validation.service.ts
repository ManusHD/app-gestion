import { Injectable } from '@angular/core';
import { FormGroup, FormArray } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

interface LineaDuplicada {
  indices: number[];
  detalle: string;
}

@Injectable()
export class FormularioValidationService {
  constructor(private snackBar: MatSnackBar) {}

  currentPath: string = window.location.pathname;

  // ============================================
  // VALIDACIONES DE REFERENCIA
  // ============================================

  refValida(ref: string): boolean {
    if (!ref) return false;
    return (
      /^[0-9]{7}$/.test(ref) ||
      /^R[0-9]{7}$/.test(ref) ||
      /^[A-Za-z0-9]{10}$/.test(ref) ||
      ref === 'VISUAL' ||
      ref === 'SIN REFERENCIA'
    );
  }

  esProductoEspecial(referencia: string): boolean {
    if (!referencia) return false;
    return referencia === 'VISUAL' || referencia === 'SIN REFERENCIA';
  }

  // ============================================
  // VALIDACIONES DE DCS
  // ============================================

  dcsValido(dcs: string): boolean {
    if (!dcs) return false;
    return /^[0-9]{10}$/.test(dcs);
  }

  // ============================================
  // VALIDACIONES DE FORMULARIO COMPLETO
  // ============================================

  validarFormularioCompleto(
    form: FormGroup,
    esEntrada: boolean,
    esSalida: boolean,
    pendiente: boolean
  ): { valido: boolean; mensaje?: string } {
    // Validar campos únicos
    const validacionCampos = this.validarCamposUnicos(form);
    if (!validacionCampos.valido) {
      return validacionCampos;
    }

    // Validar productos
    const productos = form.get('productos') as FormArray;
    if (productos.length === 0) {
      return { valido: false, mensaje: 'Debe haber al menos 1 producto' };
    }

    // Validar productos - Previsión
    const validacionProductos = this.validarProductosPrevisio(productos);
    if (!validacionProductos.valido) {
      return validacionProductos;
    }

    // Validar duplicados
    const hayDuplicados = this.hayLineasDuplicadas(productos);
    if (hayDuplicados) {
      const duplicados = this.obtenerLineasDuplicadas(productos);
      const mensajeDuplicados = duplicados
        .map(d => `Líneas ${d.indices.map(i => i + 1).join(', ')}: ${d.detalle}`)
        .join('\n');
      return {
        valido: false,
        mensaje: `Hay líneas duplicadas. Combine las unidades en una sola línea:\n${mensajeDuplicados}`
      };
    }

    // Validar estados
    const estadosValidos = this.validarEstadosProductos(productos);
    if (!estadosValidos) {
      return {
        valido: false,
        mensaje: 'Los productos normales deben tener estado asignado'
      };
    }

    // Si no es pendiente, validar campos finales
    if (!pendiente) {
      const validacionFinal = this.validarProductosFinales(productos);
      if (!validacionFinal.valido) {
        return validacionFinal;
      }

      if (esSalida) {
        const validacionEnvio = this.validarFormasEnvio(productos);
        if (!validacionEnvio.valido) {
          return validacionEnvio;
        }
      }
    }

    return { valido: true };
  }

  // ============================================
  // VALIDACIONES DE CAMPOS ÚNICOS
  // ============================================

  private validarCamposUnicos(form: FormGroup): { valido: boolean; mensaje?: string } {
    const perfumeria = form.get('perfumeria')?.value;
    const pdv = form.get('pdv')?.value;
    const colaborador = form.get('colaborador')?.value;
    const otroOrigenDestino = form.get('otroOrigenDestino')?.value;
    const dcs = form.get('dcs')?.value;

    // Validar Perfumería y PDV juntos
    const perfumeriaPdvValido = (!perfumeria && !pdv) || (perfumeria && pdv);
    if (!perfumeriaPdvValido) {
      return {
        valido: false,
        mensaje: 'Perfumería y PDV deben estar rellenos conjuntamente'
      };
    }

    const tienePerfumeriaPdv = perfumeria && pdv;
    const tieneColaborador = !!colaborador;
    const tieneOtroOrigenDestino = !!otroOrigenDestino;
    const tieneDcs = !!dcs && this.dcsValido(dcs);

    // Verificar combinaciones válidas
    const tieneAlgunOrigen =
      tienePerfumeriaPdv ||
      (tieneColaborador && !tieneOtroOrigenDestino && !tienePerfumeriaPdv) ||
      (tieneOtroOrigenDestino && !tieneColaborador && !tienePerfumeriaPdv) ||
      (tienePerfumeriaPdv && tieneColaborador && !tieneOtroOrigenDestino) ||
      (tienePerfumeriaPdv && tieneOtroOrigenDestino && !tieneColaborador);

    const combinacionValida = (tieneDcs && !tieneAlgunOrigen) || (!tieneDcs && tieneAlgunOrigen);

    if (!combinacionValida) {
      if (tieneDcs && tieneAlgunOrigen) {
        return {
          valido: false,
          mensaje: 'Debe seleccionar DCS o campos de dirección, no ambos'
        };
      }
      if (dcs && !this.dcsValido(dcs)) {
        return { valido: false, mensaje: 'El DCS debe tener 10 dígitos' };
      }
      return {
        valido: false,
        mensaje: 'Faltan campos por rellenar o tiene una combinación inválida de direcciones'
      };
    }

    return { valido: true };
  }

  // ============================================
  // VALIDACIONES DE PRODUCTOS
  // ============================================

  private validarProductosPrevisio(productos: FormArray): { valido: boolean; mensaje?: string } {
    for (let i = 0; i < productos.length; i++) {
      const producto = productos.at(i);
      const ref = producto.get('ref')?.value;
      const description = producto.get('description')?.value;
      const unidades = producto.get('unidades')?.value;
      const unidadesPedidas = producto.get('unidadesPedidas')?.value;

      if (!this.refValida(ref)) {
        return {
          valido: false,
          mensaje: 'Las Referencias deben tener 7 dígitos, R seguida de 7 dígitos o 10 caracteres'
        };
      }

      if (!description || description.trim().length === 0) {
        return { valido: false, mensaje: 'Las descripciones no pueden estar en blanco' };
      }

      if ((!unidades || unidades <= 0) && this.esPrevisionEntrada()) {
        return { valido: false, mensaje: 'Las UNIDADES deben ser mayor que 0' };
      }

      if ((!unidadesPedidas || unidadesPedidas <= 0) && this.esPrevisionSalida()) {
        return { valido: false, mensaje: 'Las UNIDADES PEDIDAS deben ser mayor que 0' };
      }
    }

    return { valido: true };
  }

  private esPrevisionEntrada(): boolean {
    return this.currentPath === '/entradas';
  }

  private esPrevisionSalida(): boolean {
    return this.currentPath === '/salidas';
  }

  private validarProductosFinales(productos: FormArray): { valido: boolean; mensaje?: string } {
    for (let i = 0; i < productos.length; i++) {
      const producto = productos.at(i);
      const palets = producto.get('palets')?.value;
      const bultos = producto.get('bultos')?.value;
      const ubicacion = producto.get('ubicacion')?.value;

      if (palets < 0) {
        return { valido: false, mensaje: 'Los palets deben ser igual o mayor que 0' };
      }

      if (bultos < 0) {
        return { valido: false, mensaje: 'Los bultos deben ser igual o mayor que 0' };
      }

      if (!ubicacion || ubicacion.trim() === '') {
        return { valido: false, mensaje: 'Las ubicaciones son obligatorias' };
      }
    }

    return { valido: true };
  }

  private validarFormasEnvio(productos: FormArray): { valido: boolean; mensaje?: string } {
    for (let i = 0; i < productos.length; i++) {
      const producto = productos.at(i);
      const formaEnvio = producto.get('formaEnvio')?.value;

      if (!formaEnvio || formaEnvio.trim() === '') {
        return { valido: false, mensaje: 'La Forma de Envío es obligatoria' };
      }
    }

    return { valido: true };
  }

  private validarEstadosProductos(productos: FormArray): boolean {
    for (let i = 0; i < productos.length; i++) {
      const producto = productos.at(i);
      const ref = producto.get('ref')?.value;
      const estado = producto.get('estado')?.value;

      // Si es producto especial, el estado puede ser null
      if (this.esProductoEspecial(ref)) {
        continue;
      }

      // Si es producto normal, debe tener estado
      if (!estado || estado.trim() === '') {
        return false;
      }
    }

    return true;
  }

  // ============================================
  // DETECCIÓN DE DUPLICADOS
  // ============================================

  hayLineasDuplicadas(productos: FormArray): boolean {
    const lineasUnicas = new Set<string>();

    for (let i = 0; i < productos.length; i++) {
      const control = productos.at(i);
      const ref = control.get('ref')?.value?.trim();
      const description = control.get('description')?.value?.trim();
      const estado = control.get('estado')?.value;
      const ubicacion = control.get('ubicacion')?.value?.trim();

      if (ref && description && ubicacion) {
        let claveLinea: string;

        if (this.esProductoEspecial(ref)) {
          claveLinea = `${ref}|${description}|${ubicacion}`;
        } else {
          const estadoKey = estado || 'null';
          claveLinea = `${ref}|${estadoKey}|${ubicacion}`;
        }

        if (lineasUnicas.has(claveLinea)) {
          return true;
        }

        lineasUnicas.add(claveLinea);
      }
    }

    return false;
  }

  obtenerLineasDuplicadas(productos: FormArray): LineaDuplicada[] {
    const mapaLineas = new Map<string, number[]>();
    const duplicados: LineaDuplicada[] = [];

    for (let i = 0; i < productos.length; i++) {
      const control = productos.at(i);
      const ref = control.get('ref')?.value?.trim();
      const description = control.get('description')?.value?.trim();
      const estado = control.get('estado')?.value;
      const ubicacion = control.get('ubicacion')?.value?.trim();

      if (ref && description && ubicacion) {
        let claveLinea: string;
        let detalleLinea: string;

        if (this.esProductoEspecial(ref)) {
          claveLinea = `${ref}|${description}|${ubicacion}`;
          detalleLinea = `${ref} - ${description} en ${ubicacion}`;
        } else {
          const estadoKey = estado || 'null';
          claveLinea = `${ref}|${estadoKey}|${ubicacion}`;
          detalleLinea = `${ref}${estado ? ` (${estado})` : ''} en ${ubicacion}`;
        }

        if (!mapaLineas.has(claveLinea)) {
          mapaLineas.set(claveLinea, []);
        }

        mapaLineas.get(claveLinea)!.push(i);

        if (mapaLineas.get(claveLinea)!.length > 1) {
          const duplicadoExistente = duplicados.find(d => d.detalle === detalleLinea);
          if (!duplicadoExistente) {
            duplicados.push({
              indices: mapaLineas.get(claveLinea)!,
              detalle: detalleLinea
            });
          } else {
            duplicadoExistente.indices = mapaLineas.get(claveLinea)!;
          }
        }
      }
    }

    return duplicados;
  }

  validarDuplicadoEnTiempoReal(productos: FormArray, index: number): boolean {
    const controlActual = productos.at(index);
    const refActual = controlActual.get('ref')?.value?.trim();
    const descriptionActual = controlActual.get('description')?.value?.trim();
    const estadoActual = controlActual.get('estado')?.value;
    const ubicacionActual = controlActual.get('ubicacion')?.value?.trim();

    if (!refActual || !descriptionActual || !ubicacionActual) {
      return false;
    }

    let claveActual: string;
    if (this.esProductoEspecial(refActual)) {
      claveActual = `${refActual}|${descriptionActual}|${ubicacionActual}`;
    } else {
      const estadoKey = estadoActual || 'null';
      claveActual = `${refActual}|${estadoKey}|${ubicacionActual}`;
    }

    for (let i = 0; i < productos.length; i++) {
      if (i === index) continue;

      const control = productos.at(i);
      const ref = control.get('ref')?.value?.trim();
      const description = control.get('description')?.value?.trim();
      const estado = control.get('estado')?.value;
      const ubicacion = control.get('ubicacion')?.value?.trim();

      if (ref && description && ubicacion) {
        let clave: string;
        if (this.esProductoEspecial(ref)) {
          clave = `${ref}|${description}|${ubicacion}`;
        } else {
          const estadoKey = estado || 'null';
          clave = `${ref}|${estadoKey}|${ubicacion}`;
        }

        if (clave === claveActual) {
          return true;
        }
      }
    }

    return false;
  }

  // ============================================
  // HELPERS
  // ============================================

  marcarCamposInvalidos(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      control?.markAsTouched();

      if (control instanceof FormArray) {
        control.controls.forEach(grupo => {
          if (grupo instanceof FormGroup) {
            Object.keys(grupo.controls).forEach(k => {
              grupo.get(k)?.markAsTouched();
            });
          }
        });
      }
    });
  }

  mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, '✖', {
      duration: 3000,
      panelClass: 'error'
    });
  }

  mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, '✖', {
      duration: 3000,
      panelClass: 'exito'
    });
  }
}