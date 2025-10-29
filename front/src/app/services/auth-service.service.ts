import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { environment } from 'src/environments/environment-dev';

interface KeycloakTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
}

interface JwtPayload {
  sub: string;
  realm_access: {
    roles: string[];
  };
  exp: number;
  preferred_username: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private keycloakUrl = environment.keycloakUrl;
  private clientId = environment.keycloakClientId;
  private clientSecret = environment.keycloakClientSecret;
  private apiAuth = environment.apiAutenticacion; // URL del microservicio proxy

  private tokenSubject = new BehaviorSubject<string | null>(
    localStorage.getItem('access_token')
  );

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<KeycloakTokenResponse> {
    const body = new URLSearchParams();
    body.set('client_id', this.clientId);
    body.set('client_secret', this.clientSecret);
    body.set('grant_type', 'password');
    body.set('username', username);
    body.set('password', password);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    return this.http
      .post<KeycloakTokenResponse>(`${this.keycloakUrl}/token`, body.toString(), { headers })
      .pipe(
        tap((response) => {
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);
          this.tokenSubject.next(response.access_token);
        })
      );
  }

  // CAMBIO: Ahora llama al microservicio proxy
  register(userData: { username: string; password: string; role: string }): Observable<any> {
    return this.http.post(`${this.apiAuth}/registrar`, userData);
  }

  // CAMBIO: Ahora llama al microservicio proxy
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiAuth}/usuarios`);
  }

  // CAMBIO: Ahora llama al microservicio proxy
  updateUser(username: string, userData: { newPassword?: string; role?: string }): Observable<any> {
    return this.http.put(`${this.apiAuth}/actualizar/${username}`, userData);
  }

  // CAMBIO: Ahora llama al microservicio proxy
  deleteUser(username: string): Observable<any> {
    return this.http.delete(`${this.apiAuth}/eliminar/${username}`);
  }

  logout(): void {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (refreshToken) {
      const body = new URLSearchParams();
      body.set('client_id', this.clientId);
      body.set('client_secret', this.clientSecret);
      body.set('refresh_token', refreshToken);

      const headers = new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded',
      });

      this.http
        .post(`${this.keycloakUrl}/logout`, body.toString(), { headers })
        .subscribe({
          complete: () => this.clearSession(),
          error: () => this.clearSession(),
        });
    } else {
      this.clearSession();
    }
  }

  private clearSession(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.tokenSubject.next(null);
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<KeycloakTokenResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const body = new URLSearchParams();
    body.set('client_id', this.clientId);
    body.set('client_secret', this.clientSecret);
    body.set('grant_type', 'refresh_token');
    body.set('refresh_token', refreshToken);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    return this.http
      .post<KeycloakTokenResponse>(`${this.keycloakUrl}/token`, body.toString(), { headers })
      .pipe(
        tap((response) => {
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);
          this.tokenSubject.next(response.access_token);
        })
      );
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  getUsername(): string | null {
    const token = this.getToken();
    if (token) {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.preferred_username;
    }
    return null;
  }

  getTokenObservable(): Observable<string | null> {
    return this.tokenSubject.asObservable();
  }

  isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp;
      const now = Math.floor(Date.now() / 1000);
      return expiry > now;
    } catch (e) {
      return false;
    }
  }

  hasRole(role: string): boolean {
    const token = localStorage.getItem('access_token');
    if (token) {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.realm_access.roles.includes(role);
    }
    return false;
  }
}