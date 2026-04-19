import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../auth.service';
import { CustomerService } from '../customer.service';
import { QuotationService } from '../quotation.service';
import { UserService } from '../user.service';

type DashboardCard = {
  title: string;
  value: number;
  subtitle: string;
  link: string;
  linkLabel: string;
  secondaryLink?: string;
  secondaryLabel?: string;
  tone: 'indigo' | 'pink' | 'teal';
};

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="dashboard-page">
      <header class="dashboard-hero">
        <h2>Olá, {{ firstName }}!</h2>
        <p>Bem-vindo ao sistema de gestão de seguros.</p>
      </header>

      <div class="dashboard-grid">
        <article class="dashboard-card" *ngFor="let card of cards" [class]="'dashboard-card tone-' + card.tone">
          <div class="card-icon" aria-hidden="true">
            <svg *ngIf="card.title === 'CLIENTES'" viewBox="0 0 24 24">
              <path d="M12 12a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 12 12Z"/>
              <path d="M5 19a7 7 0 0 1 14 0"/>
              <path d="M4.5 12.5a2.5 2.5 0 1 0-2.5-2.5 2.5 2.5 0 0 0 2.5 2.5Z"/>
              <path d="M19.5 12.5A2.5 2.5 0 1 0 17 10a2.5 2.5 0 0 0 2.5 2.5Z"/>
            </svg>
            <svg *ngIf="card.title === 'COTAÇÕES'" viewBox="0 0 24 24">
              <path d="M8 3.5h6l4 4V20a1 1 0 0 1-1 1H8a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2Z"/>
              <path d="M14 3.5v4h4"/>
              <path d="M9 12h6"/>
              <path d="M9 15h6"/>
            </svg>
            <svg *ngIf="card.title === 'USUÁRIOS'" viewBox="0 0 24 24">
              <path d="M12 12a3.2 3.2 0 1 0-3.2-3.2A3.2 3.2 0 0 0 12 12Z"/>
              <path d="M6.5 18.5a5.5 5.5 0 0 1 11 0"/>
              <path d="M5.5 13.5a2.2 2.2 0 1 0-2.2-2.2 2.2 2.2 0 0 0 2.2 2.2Z"/>
              <path d="M18.5 13.5a2.2 2.2 0 1 0-2.2-2.2 2.2 2.2 0 0 0 2.2 2.2Z"/>
            </svg>
          </div>

          <p class="card-title">{{ card.title }}</p>
          <strong class="card-value">{{ card.value }}</strong>
          <p class="card-subtitle">{{ card.subtitle }}</p>
          <div class="card-links">
            <a [routerLink]="card.link" class="card-link">
              <span aria-hidden="true">➜</span>
              {{ card.linkLabel }}
            </a>
            <a *ngIf="card.secondaryLink && card.secondaryLabel" [routerLink]="card.secondaryLink" class="card-link secondary">
              <span aria-hidden="true">＋</span>
              {{ card.secondaryLabel }}
            </a>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .dashboard-page { display: grid; gap: 18px; }
    .dashboard-hero h2 { margin: 0; font-size: 1.85rem; color: #21263f; }
    .dashboard-hero p { margin: 6px 0 0; color: #767b91; font-size: 0.96rem; }
    .dashboard-grid { display: grid; gap: 18px; }
    .dashboard-card {
      background: #ffffff;
      border: 1px solid #e6e8f2;
      border-radius: 12px;
      padding: 22px 18px;
      box-shadow: 0 8px 22px rgba(29, 35, 92, 0.06);
      display: grid;
      justify-items: center;
      text-align: center;
      gap: 8px;
    }
    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      margin-bottom: 4px;
    }
    .card-icon svg {
      width: 24px;
      height: 24px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .tone-indigo .card-icon { background: #eceeff; color: #4b57c5; }
    .tone-pink .card-icon { background: #ffe9f3; color: #ea4c89; }
    .tone-teal .card-icon { background: #e4f7f6; color: #1da39b; }
    .card-title {
      margin: 0;
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #626985;
    }
    .card-value {
      font-size: 2.2rem;
      line-height: 1;
      color: #3341b2;
    }
    .tone-pink .card-value { color: #ea4c89; }
    .tone-teal .card-value { color: #1da39b; }
    .card-subtitle {
      margin: 0;
      color: #8b90a5;
      font-size: 0.84rem;
    }
    .card-link {
      margin-top: 4px;
      color: inherit;
      text-decoration: none;
      font-size: 0.82rem;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .card-links {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      flex-wrap: wrap;
    }
    .card-link.secondary {
      opacity: 0.92;
    }
    .tone-indigo .card-link { color: #4b57c5; }
    .tone-pink .card-link { color: #ea4c89; }
    .tone-teal .card-link { color: #1da39b; }
    @media (min-width: 900px) {
      .dashboard-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
  `]
})
export class DashboardPageComponent {
  private readonly authService = inject(AuthService);
  private readonly customerService = inject(CustomerService);
  private readonly quotationService = inject(QuotationService);
  private readonly userService = inject(UserService);

  protected firstName = this.authService.currentUser()?.name?.split(' ')[0] || 'teste';
  protected cards: DashboardCard[] = this.buildCards();

  constructor() {
    this.loadMetrics();
  }

  private buildCards(): DashboardCard[] {
    const cards: DashboardCard[] = [
      {
        title: 'CLIENTES',
        value: 0,
        subtitle: 'Cadastros de clientes',
        link: '/customers',
        linkLabel: 'Ver lista',
        secondaryLink: '/customers/new',
        secondaryLabel: 'Novo',
        tone: 'indigo'
      },
      {
        title: 'COTAÇÕES',
        value: 0,
        subtitle: 'Cotações de seguro',
        link: '/quotations',
        linkLabel: 'Ver lista',
        tone: 'pink'
      }
    ];

    if (this.authService.currentUser()?.role_name === 'admin') {
      cards.push({
        title: 'USUÁRIOS',
        value: 0,
        subtitle: 'Usuários do sistema',
        link: '/users',
        linkLabel: 'Ver lista',
        tone: 'teal'
      });
    }

    return cards;
  }

  private loadMetrics(): void {
    this.customerService.count('active').subscribe({
      next: (response) => {
        this.updateCard('CLIENTES', response.total);
      }
    });

    this.quotationService.count({ active: 'active' }).subscribe({
      next: (response) => {
        this.updateCard('COTAÇÕES', response.total);
      }
    });

    if (this.authService.currentUser()?.role_name === 'admin') {
      this.userService.count({ active: 'active' }).subscribe({
        next: (response) => {
          this.updateCard('USUÁRIOS', response.total);
        }
      });
    }
  }

  private updateCard(title: DashboardCard['title'], value: number): void {
    this.cards = this.cards.map((card) =>
      card.title === title ? { ...card, value } : card
    );
  }
}
