import { Component, ViewChild, OnInit, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import { TemaService } from '../../core/services/tema.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnInit {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  isMobile = false;
  temaEscuro = computed(() => this.temaService.temaEscuro());
  usuario = computed(() => this.authService.usuarioAtual());

  inicialLetras = computed(() => {
    const nome = this.authService.usuarioAtual()?.nome ?? '';
    return nome
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  });

  menuItens = [
    { rotulo: 'Painel', rota: '/painel', icone: 'dashboard' },
    { rotulo: 'Clientes', rota: '/clientes', icone: 'people' },
    { rotulo: 'Cotações', rota: '/cotacoes', icone: 'description' },
    { rotulo: 'Usuários', rota: '/usuarios', icone: 'manage_accounts' },
    { rotulo: 'Perfil', rota: '/perfil', icone: 'account_circle' },
  ];

  constructor(
    private breakpointObserver: BreakpointObserver,
    public authService: AuthService,
    public temaService: TemaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe((result) => {
      this.isMobile = result.matches;
    });
  }

  alternarSidenav(): void {
    this.sidenav.toggle();
  }

  fecharSidenavMobile(): void {
    if (this.isMobile) {
      this.sidenav.close();
    }
  }

  sair(): void {
    this.authService.sair();
  }
}
