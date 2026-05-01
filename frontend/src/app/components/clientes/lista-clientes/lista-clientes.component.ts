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
import { Cliente } from '../../../core/models/cliente.model';
import { ClienteService } from '../../../core/services/cliente.service';
import {
  ConfirmarDialogComponent,
  DadosConfirmacao,
} from '../../../shared/components/confirmar-dialog/confirmar-dialog.component';

@Component({
  selector: 'app-lista-clientes',
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
  templateUrl: './lista-clientes.component.html',
  styleUrl: './lista-clientes.component.scss',
})
export class ListaClientesComponent implements OnInit {
  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  termoBusca = '';
  carregando = true;

  constructor(
    private clienteService: ClienteService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  async ngOnInit(): Promise<void> {
    await this.carregarClientes();
  }

  async carregarClientes(): Promise<void> {
    this.carregando = true;
    this.clientes = await this.clienteService.listar();
    this.filtrar();
    this.carregando = false;
  }

  filtrar(): void {
    const termo = this.termoBusca.toLowerCase().trim();
    this.clientesFiltrados = termo
      ? this.clientes.filter(
          (c) =>
            c.nome.toLowerCase().includes(termo) ||
            c.email.toLowerCase().includes(termo) ||
            (c.cpf ?? '').includes(termo)
        )
      : [...this.clientes];
  }

  confirmarExclusao(cliente: Cliente): void {
    const dados: DadosConfirmacao = {
      titulo: 'Excluir Cliente',
      mensagem: `Tem certeza que deseja excluir o cliente "${cliente.nome}"? Esta ação não pode ser desfeita.`,
      textoBotaoConfirmar: 'EXCLUIR',
      cor: 'warn',
    };
    this.dialog
      .open(ConfirmarDialogComponent, { data: dados, maxWidth: '420px' })
      .afterClosed()
      .subscribe(async (confirmado) => {
        if (confirmado) {
          await this.clienteService.excluir(cliente.id);
          this.snackBar.open('Cliente excluído.', 'Fechar', {
            duration: 3000,
            panelClass: 'snack-sucesso',
          });
          await this.carregarClientes();
        }
      });
  }
}
