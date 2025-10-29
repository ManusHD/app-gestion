import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { AuthService } from 'src/app/services/auth-service.service';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
  usuarios: any[] = [];
  selectedUser: any = null;
  userForm: FormGroup;

  constructor(private userService: AuthService, private fb: FormBuilder) {
    this.userForm = this.fb.group({
      newPassword: [''],
      role: ['']
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (users: any[]) => {
        this.usuarios = users;
        console.log(this.usuarios);
      },
      error: (err: any) => {
        console.error('Error al cargar usuarios:', err);
      }
    });
  }

  editUser(user: any) {
    this.selectedUser = user;
    this.userForm.patchValue({
      role: user.roles[0]?.name || ''
    });
  }

  cancelEdit() {
    this.selectedUser = null;
    this.userForm.reset();
  }

  updateUser() {
    if (this.selectedUser) {
      const formData = this.userForm.value;
      this.userService.updateUser(this.selectedUser.username, formData).subscribe({
        next: () => {
          alert('Usuario actualizado correctamente');
          this.loadUsers();
          this.selectedUser = null;
          this.userForm.reset();
        },
        error: (err: any) => {
          alert('Error al actualizar usuario: ' + (err.error?.errorMessage || err.error || 'Error desconocido'));
        }
      });
    }
  }

  deleteUser(username: string) {
    this.userService.deleteUser(username).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (err: any) => {
        alert('Error al eliminar usuario: ' + (err.error?.errorMessage || err.error || 'Error desconocido'));
      }
    });
  }
}