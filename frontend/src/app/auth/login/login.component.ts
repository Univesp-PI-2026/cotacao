import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  formulario: FormGroup;
  carregando = false;
  senhaVisivel = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.formulario = this.fb.group({
      identifier: ['', Validators.required],
      senha: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async entrar(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.carregando = true;
    try {
      await this.authService.autenticar(this.formulario.value);
      this.router.navigate(['/painel']);
    } catch (err) {
      const mensagem =
        err instanceof HttpErrorResponse && err.status === 401
          ? 'Usuário ou senha inválidos.'
          : 'Erro ao conectar ao servidor.';
      this.snackBar.open(mensagem, 'Fechar', {
        duration: 4000,
        panelClass: 'snack-erro',
      });
    } finally {
      this.carregando = false;
    }
  }
}
