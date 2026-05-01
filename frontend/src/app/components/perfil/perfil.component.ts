import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import {
  ConfirmarDialogComponent,
  DadosConfirmacao,
} from '../../shared/components/confirmar-dialog/confirmar-dialog.component';

function senhasIguais(control: AbstractControl): ValidationErrors | null {
  const nova = control.get('novaSenha')?.value;
  const confirmacao = control.get('confirmacaoSenha')?.value;
  return nova && confirmacao && nova !== confirmacao ? { senhasNaoCoincidem: true } : null;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss',
})
export class PerfilComponent implements OnInit {
  formInfo: FormGroup;
  formSenha: FormGroup;
  carregandoInfo = false;
  carregandoSenha = false;
  senhaAtualVisivel = false;
  novaSenhaVisivel = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.formInfo = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(255)]],
      email: ['', [Validators.required, Validators.email]],
    });

    this.formSenha = this.fb.group(
      {
        senhaAtual: ['', Validators.required],
        novaSenha: ['', [Validators.required, Validators.minLength(8)]],
        confirmacaoSenha: ['', Validators.required],
      },
      { validators: senhasIguais }
    );
  }

  ngOnInit(): void {
    const usuario = this.authService.usuarioAtual();
    if (usuario) {
      this.formInfo.patchValue({ nome: usuario.nome, email: usuario.email });
    }
  }

  salvarInfo(): void {
    if (this.formInfo.invalid) {
      this.formInfo.markAllAsTouched();
      return;
    }
    this.carregandoInfo = true;
    setTimeout(() => {
      this.carregandoInfo = false;
      this.snackBar.open('Informações atualizadas!', 'Fechar', {
        duration: 3000,
        panelClass: 'snack-sucesso',
      });
    }, 500);
  }

  salvarSenha(): void {
    if (this.formSenha.invalid) {
      this.formSenha.markAllAsTouched();
      return;
    }
    this.carregandoSenha = true;
    setTimeout(() => {
      this.carregandoSenha = false;
      this.formSenha.reset();
      this.snackBar.open('Senha atualizada!', 'Fechar', {
        duration: 3000,
        panelClass: 'snack-sucesso',
      });
    }, 500);
  }

  confirmarExclusao(): void {
    const dados: DadosConfirmacao = {
      titulo: 'Excluir Conta',
      mensagem:
        'Tem certeza que deseja excluir sua conta? Esta ação é irreversível e todos os seus dados serão removidos permanentemente.',
      textoBotaoConfirmar: 'EXCLUIR',
      cor: 'warn',
    };

    this.dialog
      .open(ConfirmarDialogComponent, { data: dados, maxWidth: '400px' })
      .afterClosed()
      .subscribe((confirmado) => {
        if (confirmado) {
          this.authService.sair();
        }
      });
  }
}
