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
      return;
    }

    this.authService.register(this.registerForm.value).subscribe(
      (data) => {
        this.registerForm.reset();
        this.message = 'Usuario registrado con éxito.'
        this.messageType = 'success-message';
        console.log('Usuario registrado con éxito.');
      },
      (error) => {
        this.message = error.error || error
        this.messageType = 'error-result';
      }
    );
  }
}
