import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { AuthService } from '../services/auth-service.service';

export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredRoles = route.data['roles'] as string[];

  return authService.getTokenObservable().pipe(
    take(1),
    map((token) => {
      if (!token || !authService.isTokenValid(token)) {
        // Si no hay token, redirige a login.
        return router.parseUrl('/login');
      }
      // Decodifica el token para obtener los roles del usuario.
      const decoded = jwtDecode<any>(token);
      const userRoles = decoded.roles as string[];
      
      // Comprueba si el usuario tiene al menos uno de los roles requeridos.
      if (requiredRoles && requiredRoles.some((role) => userRoles.includes(role))) {
        return true;
      }
      // Si no cumple, redirige a una página de acceso denegado o a otra ruta.
      return router.parseUrl('/');
    })
  );
};
