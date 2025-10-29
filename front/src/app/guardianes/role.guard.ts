import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { AuthService } from '../services/auth-service.service';

interface JwtPayload {
  sub: string;
  realm_access?: {
    roles: string[];
  };
  resource_access?: {
    [key: string]: {
      roles: string[];
    };
  };
  exp: number;
  preferred_username: string;
}

export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredRoles = route.data['roles'] as string[];

  // Leer directamente del localStorage en lugar del Observable
  const token = localStorage.getItem('access_token');
  
  if (!token || !authService.isTokenValid(token)) {
    return router.parseUrl('/login');
  }
  
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    
    // Obtener roles desde realm_access (roles de realm)
    const userRoles = decoded.realm_access?.roles || [];
    
    // Si no hay roles requeridos, permite el acceso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    
    // Comprueba si el usuario tiene al menos uno de los roles requeridos
    if (requiredRoles.some((role) => userRoles.includes(role))) {
      return true;
    }
    
    // Si no cumple, redirige a la página principal
    console.warn('Acceso denegado. Roles requeridos:', requiredRoles, 'Roles del usuario:', userRoles);
    return router.parseUrl('/');
  } catch (error) {
    console.error('Error al decodificar token:', error);
    return router.parseUrl('/login');
  }
};