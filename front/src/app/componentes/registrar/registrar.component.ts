import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth-service.service';

@Component({
  selector: 'app-registrar',
  templateUrl: './registrar.component.html',
  styleUrls: ['./registrar.component.css']
})
export class RegistrarComponent {
  registerForm: FormGroup;
  message: string = '';
  messageType: string = '';

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(5)]],
      role: ['ROLE_OPERADOR', [Validators.required]]
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.message = 'Por favor, completa todos los campos correctamente.';
      this.messageType = 'error-result';
      return;
    }

    this.authService.register(this.registerForm.value).subscribe({
      next: (data: any) => {
        this.registerForm.reset();
        this.registerForm.patchValue({ role: 'ROLE_OPERADOR' });
        this.message = data.message || 'Usuario registrado con éxito.';
        this.messageType = 'success-message';
      },
      error: (error: any) => {
        console.error('Error completo:', error);
        
        // Intentar extraer el mensaje de error de diferentes posibles ubicaciones
        if (error.error) {
          if (typeof error.error === 'string') {
            this.message = error.error;
          } else if (error.error.error) {
            this.message = error.error.error;
          } else if (error.error.message) {
            this.message = error.error.message;
          } else {
            this.message = 'Error al registrar usuario';
          }
        } else if (error.message) {
          this.message = error.message;
        } else {
          this.message = 'Error al registrar usuario';
        }
        
        this.messageType = 'error-result';
      }
    });
  }
}