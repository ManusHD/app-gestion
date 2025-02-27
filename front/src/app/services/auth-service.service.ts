import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { User } from '../models/user.model';

interface LoginResponse {
  token: string;
}

interface JwtPayload {
  sub: string;
  roles: string[];
  exp: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8098/auth';
  
  // BehaviorSubject para almacenar el token (inicialmente desde localStorage)
  private tokenSubject = new BehaviorSubject<string | null>(localStorage.getItem('token'));
  
  constructor(private http: HttpClient, private router: Router) {}

  register(user: User): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/registrar`, user);
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        this.tokenSubject.next(response.token); // Notificar a los suscriptores
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.tokenSubject.next(null); // Notificar que el usuario cerró sesión
    this.router.navigate(["/login"]);
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  // Método para obtener el usuario a partir del token
  getUsername(): string | null {
    const token = this.getToken();
    if (token) {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.sub;
    }
    return null;
  }

  // Observable para que otros componentes puedan suscribirse al token
  getTokenObservable(): Observable<string | null> {
    return this.tokenSubject.asObservable();
  }

  // Función para verificar si el usuario tiene un rol específico
  hasRole(role: string): boolean {
      const token = localStorage.getItem('token');
      if (token) {
          const decoded = jwtDecode<JwtPayload>(token);
          return decoded.roles.includes(role);
      }
      return false;
  }
}