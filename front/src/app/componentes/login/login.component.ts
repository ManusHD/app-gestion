import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth-service.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: [
    '../registrar/registrar.component.css',
    './login.component.css'
  ]
})
export class LoginComponent {
  registerForm: FormGroup;
  errorMessage: string = '';

  constructor(private authService: AuthService, private fb: FormBuilder, private router: Router) {
    this.registerForm = this.fb.group({
          username: ['', [Validators.required, Validators.minLength(3)]],
          password: ['', [Validators.required, Validators.minLength(5)]],
      });
  }

  onSubmit() {
    this.authService.login(this.registerForm.get('username')!.value, this.registerForm.get('password')!.value).subscribe({
      next: (data) => {
        localStorage.setItem('token', data.token);
        // Redirecciona según el rol o a una ruta protegida
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.errorMessage = 'Usuario o contraseña incorrectos';
      }
    });
  }
}