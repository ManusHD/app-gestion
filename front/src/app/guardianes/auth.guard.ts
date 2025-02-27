import { inject } from '@angular/core';
import { Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateFn } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth-service.service';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  return authService.getTokenObservable().pipe(
    take(1), // Tomamos el valor actual del token
    map(token => {
      if (token) {
        return true;
      } else {
        // Redirigir a la ruta de login si no hay token
        return router.parseUrl('/login');
      }
    })
  );
};
