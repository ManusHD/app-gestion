import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth-service.service';
import { UserRoles, RoleService } from 'src/app/services/role.service';

interface JwtPayload {
  sub: string;
  roles: string[];
  exp: number;
}

@Component({
  selector: 'app-panel-lateral',
  templateUrl: './panel-lateral.component.html',
  styleUrls: ['./panel-lateral.component.css']
})
export class PanelLateralComponent implements OnInit, OnDestroy {
  username: string | null = '';
  roles: UserRoles = {
    isLoggedIn: false,
    isAdmin: false,
    isOperador: false
  };
  
  private subscription: Subscription = new Subscription();

  constructor(
    private auth: AuthService,
    private roleService: RoleService, 
    private router: Router
  ) {}

  ngOnInit(): void {
    // Obtener el username cuando cambia el token
    this.subscription.add(
      this.auth.getTokenObservable().subscribe(token => {
        this.username = token ? this.auth.getUsername() : null;
      })
    );

    // Obtener los roles
    this.subscription.add(
      this.roleService.getRoles().subscribe(roles => {
        this.roles = roles;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  isActive(route: string): string {
    return window.location.pathname === route ? 'summary-active' : '';
  }

  onLogout(): void {
    this.auth.logout();
  }

  onEntradasClick(event: Event): void {
    // Si el usuario no es admin, se redirige a /entradas/pendientes
    if (!this.roles.isAdmin) {
      event.preventDefault(); // Previene la navegación al routerLink genérico (/entradas)
      this.router.navigate(['/entradas/pendientes']);
    }
  }

  onSalidasClick(event: Event): void {
    // Si el usuario no es admin, se redirige a /salidas/pendientes
    if (!this.roles.isAdmin) {
      event.preventDefault(); // Previene la navegación al routerLink genérico (/salidas)
      this.router.navigate(['/salidas/pendientes']);
    }
  }
}

