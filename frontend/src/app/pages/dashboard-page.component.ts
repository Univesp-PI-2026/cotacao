import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of, type Observable } from 'rxjs';

import { AuthService } from '../auth.service';
import { CustomerService } from '../customer.service';
import { QuotationService } from '../quotation.service';
import { RoleService } from '../role.service';
import { UserService } from '../user.service';

type DashboardCard = {
  title: string;
  route: string;
  icon: string;
  color: string;
  description: string;
  actionLabel: string;
  total: number | null;
};

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="dashboard-shell">
      <header class="dashboard-hero">
        <p class="eyebrow">Menu principal</p>
        <h2>Olá, {{ firstName() }}.</h2>
        <p class="subtitle">
          Acompanhe os módulos principais do sistema e entre direto na área que você precisa.
        </p>
      </header>

      <p class="message error" *ngIf="loadError">
        Não foi possível carregar todos os indicadores do painel.
      </p>

      <section class="cards-grid">
        <a
          *ngFor="let card of cards"
          class="shortcut-card"
          [routerLink]="card.route"
        >
          <div class="card-icon" [style.background]="card.color + '22'">
            <span class="card-icon-symbol" [style.color]="card.color">{{ card.icon }}</span>
          </div>

          <div class="card-content">
            <p class="card-title">{{ card.title }}</p>
            <p class="card-total" [style.color]="card.color">
              {{ card.total === null ? '...' : card.total }}
            </p>
            <p class="card-description">{{ card.description }}</p>
          </div>

          <div class="card-footer">
            <span class="card-link" [style.color]="card.color">
              {{ card.actionLabel }}
            </span>
          </div>
        </a>
      </section>
    </section>
  `,
  styles: [`
    .dashboard-shell { display: grid; gap: 24px; }
    .dashboard-hero { display: grid; gap: 8px; }
    .eyebrow { margin: 0; text-transform: uppercase; letter-spacing: 0.18em; color: var(--accent); font-size: 6px; font-weight: 700; }
    h2 { margin: 0; font-size: clamp(1rem, 2vw, 1.6rem); line-height: 0.95; letter-spacing: -0.05em; }
    .subtitle { margin: 0; color: var(--muted); max-width: 62ch; line-height: 1.6; }
    .cards-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
    .shortcut-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      text-decoration: none;
      color: inherit;
      background: var(--surface-panel);
      border: 1px solid var(--line-strong);
      border-radius: 28px;
      padding: 22px;
      box-shadow: var(--shadow);
      transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
    }
    .shortcut-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 26px 70px rgba(31, 42, 46, 0.16);
      border-color: var(--accent-line);
    }
    .card-icon {
      width: 64px;
      height: 64px;
      border-radius: 18px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 18px;
    }
    .card-icon-symbol {
      font-size: 3.6rem;
      line-height: 1;
    }
    .card-content { display: grid; gap: 4px; justify-items: center; }
    .card-title {
      margin: 0;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.82rem;
      font-weight: 700;
    }
    .card-total {
      margin: 0;
      font-size: clamp(2rem, 5vw, 3rem);
      font-weight: 800;
      line-height: 1;
    }
    .card-description {
      margin: 0;
      color: var(--muted);
      line-height: 1.5;
      min-height: 2.8em;
      max-width: 28ch;
    }
    .card-footer {
      margin-top: 18px;
      padding-top: 14px;
      border-top: 1px solid var(--line);
      width: 100%;
      display: flex;
      justify-content: center;
    }
    .card-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
    }
    .card-link::after {
      content: '→';
      font-size: 1rem;
    }
    .message.error {
      margin: 0;
      padding: 12px 14px;
      border-radius: 14px;
      font-size: 0.92rem;
      background: rgba(187, 62, 62, 0.1);
      color: var(--danger);
    }
    @media (min-width: 640px) {
      .cards-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (min-width: 1024px) {
      .cards-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    }
  `]
})
export class DashboardPageComponent {
  private readonly authService = inject(AuthService);
  private readonly customerService = inject(CustomerService);
  private readonly quotationService = inject(QuotationService);
  private readonly roleService = inject(RoleService);
  private readonly userService = inject(UserService);

  protected loadError = false;
  protected readonly firstName = computed(() => {
    const name = this.authService.currentUser()?.name?.trim() ?? '';
    return name ? name.split(/\s+/)[0] : 'Usuário';
  });

  protected readonly cards: DashboardCard[] = [
    {
      title: 'Clientes',
      route: '/customers',
      icon: '👥',
      color: '#3366cc',
      description: 'Cadastros de clientes e consulta rápida da base.',
      actionLabel: 'Ver lista',
      total: null
    },
    {
      title: 'Cotações',
      route: '/quotations',
      icon: '🧾',
      color: '#d94f70',
      description: 'Acompanhe propostas, solicitações e andamento comercial.',
      actionLabel: 'Ver lista',
      total: null
    },
    {
      title: 'Usuários',
      route: '/users',
      icon: '🛡',
      color: '#138a72',
      description: 'Gerencie acessos, perfis e situação dos usuários.',
      actionLabel: 'Ver lista',
      total: null
    },
    {
      title: 'Roles',
      route: '/roles',
      icon: '⚙',
      color: '#a06a00',
      description: 'Organize papéis, permissões e estrutura de acesso.',
      actionLabel: 'Ver lista',
      total: null
    }
  ];

  constructor() {
    const withFallback = <T>(stream$: Observable<T>, markError = true) =>
      stream$.pipe(
        catchError(() => {
          if (markError) {
            this.loadError = true;
          }
          return of([] as unknown as T);
        })
      );

    forkJoin({
      customers: withFallback(this.customerService.list('all')),
      quotations: withFallback(this.quotationService.list({ active: 'all', customerId: null })),
      users: withFallback(this.userService.list({ active: 'all', roleId: null })),
      roles: withFallback(this.roleService.list())
    }).subscribe({
      next: ({ customers, quotations, users, roles }) => {
        this.cards[0].total = customers.length;
        this.cards[1].total = quotations.length;
        this.cards[2].total = users.length;
        this.cards[3].total = roles.length;
      }
    });
  }
}
