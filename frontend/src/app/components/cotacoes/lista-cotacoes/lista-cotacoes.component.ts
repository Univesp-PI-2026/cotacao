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
import { Cotacao, PRODUTOS_COTACAO, ProdutoCotacao } from '../../../core/models/cotacao.model';
import { CotacaoService } from '../../../core/services/cotacao.service';
import {
  ConfirmarDialogComponent,
  DadosConfirmacao,
} from '../../../shared/components/confirmar-dialog/confirmar-dialog.component';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';

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
    DataBrPipe,
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
          (c) => [c.clienteNome, c.placaVeiculo, c.marca, c.modelo,
            this.rotulaProduto(c.produto), c.logradouroImovel, c.cidadeImovel, c.profissao]
            .some((valor) => valor?.toLowerCase().includes(termo))
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
          await this.cotacaoService.excluir(cotacao.id, cotacao.produto);
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

  rotulaProduto(produto?: ProdutoCotacao): string {
    return PRODUTOS_COTACAO.find((p) => p.valor === (produto ?? 'auto'))?.nome ?? '';
  }

  iconeProduto(produto?: ProdutoCotacao): string {
    return PRODUTOS_COTACAO.find((p) => p.valor === (produto ?? 'auto'))?.icone ?? 'description';
  }

  formatarRenda(valor?: number): string {
    return valor == null ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  }
}
