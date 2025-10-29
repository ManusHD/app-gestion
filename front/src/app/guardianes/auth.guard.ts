import { inject } from '@angular/core';
import {
  Router,
  UrlTree,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  CanActivateFn,
} from '@angular/router';
import { AuthService } from '../services/auth-service.service';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Leer directamente del localStorage en lugar del Observable
  const token = localStorage.getItem('access_token');
  
  if (token && authService.isTokenValid(token)) {
    return true;
  } else {
    return router.parseUrl('/login');
  }
};