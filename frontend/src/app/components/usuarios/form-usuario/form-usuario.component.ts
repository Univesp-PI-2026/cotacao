import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UsuarioService } from '../../../core/services/usuario.service';

@Component({
  selector: 'app-form-usuario',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './form-usuario.component.html',
  styleUrl: './form-usuario.component.scss',
})
export class FormUsuarioComponent implements OnInit {
  formulario: FormGroup;
  carregando = false;
  editando = false;
  usuarioId?: number;
  senhaVisivel = false;
  roles: { id: number; nome: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.formulario = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(255)]],
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(8)]],
      roleId: [null, Validators.required],
    });
  }

  async ngOnInit(): Promise<void> {
    this.roles = await this.usuarioService.obterRoles();
    const id = this.route.snapshot.paramMap.get('id');

    if (id && id !== 'novo') {
      this.editando = true;
      this.usuarioId = +id;
      const usuario = await this.usuarioService.buscarPorId(this.usuarioId);
      if (usuario) {
        this.formulario.patchValue({ ...usuario, roleId: usuario.roleId });
        this.formulario.get('senha')?.clearValidators();
        this.formulario.get('senha')?.updateValueAndValidity();
      }
    }
  }

  async salvar(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.carregando = true;
    try {
      const valores = this.formulario.value;
      const role = this.roles.find((r) => r.id === valores.roleId);

      if (this.editando && this.usuarioId) {
        await this.usuarioService.atualizar(this.usuarioId, {
          ...valores,
          roleNome: role?.nome,
        });
        this.snackBar.open('Usuário atualizado com sucesso!', 'Fechar', {
          duration: 3000,
          panelClass: 'snack-sucesso',
        });
      } else {
        await this.usuarioService.criar({
          ...valores,
          roleNome: role?.nome,
          ativo: true,
        });
        this.snackBar.open('Usuário criado com sucesso!', 'Fechar', {
          duration: 3000,
          panelClass: 'snack-sucesso',
        });
      }
      this.router.navigate(['/usuarios']);
    } catch {
      this.snackBar.open('Erro ao salvar usuário.', 'Fechar', {
        duration: 3000,
        panelClass: 'snack-erro',
      });
    } finally {
      this.carregando = false;
    }
  }
}
