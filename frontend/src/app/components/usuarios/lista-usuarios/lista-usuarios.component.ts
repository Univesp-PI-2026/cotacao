import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Usuario } from '../../../core/models/usuario.model';
import { UsuarioService } from '../../../core/services/usuario.service';
import {
  ConfirmarDialogComponent,
  DadosConfirmacao,
} from '../../../shared/components/confirmar-dialog/confirmar-dialog.component';

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDialogModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './lista-usuarios.component.html',
  styleUrl: './lista-usuarios.component.scss',
})
export class ListaUsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  termoBusca = '';
  carregando = true;

  constructor(
    private usuarioService: UsuarioService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  async ngOnInit(): Promise<void> {
    await this.carregarUsuarios();
  }

  async carregarUsuarios(): Promise<void> {
    this.carregando = true;
    this.usuarios = await this.usuarioService.listar();
    this.filtrar();
    this.carregando = false;
  }

  filtrar(): void {
    const termo = this.termoBusca.toLowerCase().trim();
    this.usuariosFiltrados = termo
      ? this.usuarios.filter(
          (u) =>
            u.nome.toLowerCase().includes(termo) ||
            u.email.toLowerCase().includes(termo)
        )
      : [...this.usuarios];
  }

  confirmarExclusao(usuario: Usuario): void {
    const dados: DadosConfirmacao = {
      titulo: 'Excluir Usuário',
      mensagem: `Tem certeza que deseja excluir o usuário "${usuario.nome}"? Esta ação não pode ser desfeita.`,
      textoBotaoConfirmar: 'EXCLUIR',
      cor: 'warn',
    };
    this.dialog
      .open(ConfirmarDialogComponent, { data: dados, maxWidth: '420px' })
      .afterClosed()
      .subscribe(async (confirmado) => {
        if (confirmado) {
          await this.usuarioService.excluir(usuario.id);
          this.snackBar.open('Usuário excluído.', 'Fechar', {
            duration: 3000,
            panelClass: 'snack-sucesso',
          });
          await this.carregarUsuarios();
        }
      });
  }
}
