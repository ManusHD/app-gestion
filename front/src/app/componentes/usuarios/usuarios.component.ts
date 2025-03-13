import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { User } from 'src/app/models/user.model';
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
  roles = ['USUARIO', 'ADMINISTRADOR']; // Opciones de roles disponibles

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
    this.userService.getUsers().subscribe(users => {
      this.usuarios = users;
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
  }

  updateUser() {
    if (this.selectedUser) {
      const formData = this.userForm.value;
      this.userService.updateUser(this.selectedUser.username, formData).subscribe(() => {
        alert('Usuario actualizado correctamente');
        this.loadUsers();
        this.selectedUser = null;
      }, err => {
        alert('Error al actualizar usuario: ' + err.error);
      });
    }
  }

  deleteUser(username: string) {
      this.userService.deleteUser(username).subscribe(() => {
        this.loadUsers();
      }, err => {
        alert('Error al eliminar usuario: ' + err.error);
      });
  }
}
