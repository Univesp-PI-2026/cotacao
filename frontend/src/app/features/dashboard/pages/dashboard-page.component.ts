import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { SessionService } from '../../../core/services/session.service';

type DashboardShortcut = {
  title: string;
  description: string;
  icon: string;
  accentClass: string;
  path: string;
  actionLabel: string;
};

@Component({
  selector: 'app-dashboard-page',
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css'
})
export class DashboardPageComponent {
  private readonly sessionService = inject(SessionService);

  protected readonly firstName = computed(() => {
    const name = this.sessionService.user()?.name?.trim() ?? '';
    return name ? name.split(/\s+/)[0] : 'Fabio';
  });

  protected readonly shortcuts: DashboardShortcut[] = [
    {
      title: 'Usuarios',
      description: 'Espaco reservado para administracao de acessos, perfis e controle de usuarios do sistema.',
      icon: 'manage_accounts',
      accentClass: 'dashboard-shortcut--users',
      path: '/dashboard',
      actionLabel: 'Em breve',
    },
    {
      title: 'Clientes',
      description: 'Acesse o cadastro e acompanhe a base de clientes já registrada no sistema.',
      icon: 'groups',
      accentClass: 'dashboard-shortcut--customers',
      path: '/customers',
      actionLabel: 'Abrir modulo',
    },
    {
      title: 'Cotacoes',
      description: 'Area preparada para acompanhar cotacoes, propostas e andamento comercial da operacao.',
      icon: 'description',
      accentClass: 'dashboard-shortcut--quotations',
      path: '/dashboard',
      actionLabel: 'Em breve',
    }
  ];
}
