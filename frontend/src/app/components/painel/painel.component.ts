import { Component, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import { ClienteService } from '../../core/services/cliente.service';
import { CotacaoService } from '../../core/services/cotacao.service';
import { UsuarioService } from '../../core/services/usuario.service';

interface CartaoAtalho {
  titulo: string;
  icone: string;
  cor: string;
  rota: string;
  total: number;
  descricao: string;
}

@Component({
  selector: 'app-painel',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatDividerModule],
  templateUrl: './painel.component.html',
  styleUrl: './painel.component.scss',
})
export class PainelComponent implements OnInit {
  primeiroNome = computed(() => {
    const nome = this.authService.usuarioAtual()?.nome ?? '';
    return nome.split(' ')[0];
  });

  cartoes: CartaoAtalho[] = [
    { titulo: 'Clientes', icone: 'people', cor: '#3949ab', rota: '/clientes', total: 0, descricao: 'Cadastros de clientes' },
    { titulo: 'Cotações', icone: 'description', cor: '#e91e63', rota: '/cotacoes', total: 0, descricao: 'Cotações de seguro' },
    { titulo: 'Usuários', icone: 'manage_accounts', cor: '#00897b', rota: '/usuarios', total: 0, descricao: 'Usuários do sistema' },
  ];

  constructor(
    private authService: AuthService,
    private clienteService: ClienteService,
    private cotacaoService: CotacaoService,
    private usuarioService: UsuarioService
  ) {}

  async ngOnInit(): Promise<void> {
    const [clientes, cotacoes, usuarios] = await Promise.all([
      this.clienteService.contarTotal(),
      this.cotacaoService.contarTotal(),
      this.usuarioService.contarTotal(),
    ]);
    this.cartoes[0].total = clientes;
    this.cartoes[1].total = cotacoes;
    this.cartoes[2].total = usuarios;
  }
}
