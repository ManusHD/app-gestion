import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { AuthService } from './auth-service.service';

export interface UserRoles {
  isLoggedIn: boolean;
  isAdmin: boolean;
  isOperador: boolean;
  // Puedes añadir más roles según necesites
}

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private rolesSubject = new BehaviorSubject<UserRoles>({
    isLoggedIn: false,
    isAdmin: false,
    isOperador: false,
  });

  constructor(private authService: AuthService) {
    // Suscribirse al token observable del AuthService
    this.authService.getTokenObservable().subscribe((token) => {
      const isValid = token && this.authService.isTokenValid(token);

      if (isValid) {
        this.rolesSubject.next({
          isLoggedIn: true,
          isAdmin: this.authService.hasRole('ROLE_ADMIN'),
          isOperador: this.authService.hasRole('ROLE_OPERADOR'),
        });
      } else {
        this.rolesSubject.next({
          isLoggedIn: false,
          isAdmin: false,
          isOperador: false,
        });
      }
    });
  }

  // Obtener Observable de todos los roles
  getRoles(): Observable<UserRoles> {
    return this.rolesSubject.asObservable();
  }

  // Obtener Observable para un rol específico
  hasRole(role: string): Observable<boolean> {
    return this.getRoles().pipe(
      map((roles) => {
        switch (role) {
          case 'ROLE_ADMIN':
            return roles.isAdmin;
          case 'ROLE_OPERADOR':
            return roles.isOperador;
          default:
            return false;
        }
      })
    );
  }
  
  // Obtener Observable para saber si está logueado
  isLoggedIn(): Observable<boolean> {
    return this.getRoles().pipe(map((roles) => roles.isLoggedIn));
  }

  // Método sincrónico para verificar roles en caso de necesidad inmediata
  hasRoleSync(role: string): boolean {
    const currentRoles = this.rolesSubject.value;
    switch (role) {
      case 'ROLE_ADMIN':
        return currentRoles.isAdmin;
      case 'ROLE_OPERADOR':
        return currentRoles.isOperador;
      default:
        return false;
    }
  }
}
