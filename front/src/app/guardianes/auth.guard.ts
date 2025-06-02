import { inject } from '@angular/core';
import {
  Router,
  UrlTree,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  CanActivateFn,
} from '@angular/router';
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
    take(1),
    map(token => {
      if (token && authService.isTokenValid(token)) {
        return true;
      } else {
        return router.parseUrl('/login');
      }
    })
  );
};

