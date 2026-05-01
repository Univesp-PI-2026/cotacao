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
import { Cotacao } from '../../../core/models/cotacao.model';
import { CotacaoService } from '../../../core/services/cotacao.service';
import {
  ConfirmarDialogComponent,
  DadosConfirmacao,
} from '../../../shared/components/confirmar-dialog/confirmar-dialog.component';

@Component({
  selector: 'app-lista-cotacoes',
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
  templateUrl: './lista-cotacoes.component.html',
  styleUrl: './lista-cotacoes.component.scss',
})
export class ListaCotacoesComponent implements OnInit {
  cotacoes: Cotacao[] = [];
  cotacoesFiltradas: Cotacao[] = [];
  termoBusca = '';
  carregando = true;

  constructor(
    private cotacaoService: CotacaoService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  async ngOnInit(): Promise<void> {
    await this.carregarCotacoes();
  }

  async carregarCotacoes(): Promise<void> {
    this.carregando = true;
    this.cotacoes = await this.cotacaoService.listar();
    this.filtrar();
    this.carregando = false;
  }

  filtrar(): void {
    const termo = this.termoBusca.toLowerCase().trim();
    this.cotacoesFiltradas = termo
      ? this.cotacoes.filter(
          (c) =>
            c.clienteNome.toLowerCase().includes(termo) ||
            c.placaVeiculo.toLowerCase().includes(termo) ||
            c.marca.toLowerCase().includes(termo) ||
            c.modelo.toLowerCase().includes(termo)
        )
      : [...this.cotacoes];
  }

  confirmarExclusao(cotacao: Cotacao): void {
    const dados: DadosConfirmacao = {
      titulo: 'Excluir Cotação',
      mensagem: `Tem certeza que deseja excluir a cotação de "${cotacao.clienteNome}"? Esta ação não pode ser desfeita.`,
      textoBotaoConfirmar: 'EXCLUIR',
      cor: 'warn',
    };
    this.dialog
      .open(ConfirmarDialogComponent, { data: dados, maxWidth: '420px' })
      .afterClosed()
      .subscribe(async (confirmado) => {
        if (confirmado) {
          await this.cotacaoService.excluir(cotacao.id);
          this.snackBar.open('Cotação excluída.', 'Fechar', {
            duration: 3000,
            panelClass: 'snack-sucesso',
          });
          await this.carregarCotacoes();
        }
      });
  }

  rotulaTipoSeguro(tipo: string): string {
    return tipo === 'renovacao' ? 'Renovação' : 'Novo Seguro';
  }
}
