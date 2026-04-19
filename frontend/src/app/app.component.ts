import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <main class="page-shell">
      <header class="topbar" *ngIf="authService.isAuthenticated()">
        <div>
          <p class="eyebrow">Cotacao V02</p>
          <h1>Painel operacional</h1>
          <p class="session-user" *ngIf="authService.currentUser() as user">
            {{ user.name }} · {{ user.role_name || 'sem role' }}
          </p>
        </div>

        <nav class="nav">
          <a routerLink="/customers" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            Clientes
          </a>
          <a routerLink="/roles" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            Roles
          </a>
          <a routerLink="/users" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            Usuários
          </a>
          <a routerLink="/customers/new" routerLinkActive="active">
            Novo cliente
          </a>
          <a routerLink="/quotations" routerLinkActive="active">
            Cotações
          </a>
          <button type="button" class="logout" (click)="logout()">Sair</button>
        </nav>
      </header>

      <router-outlet />
    </main>
  `,
  styles: [`
    .page-shell {
      padding: 32px;
      max-width: 1360px;
      margin: 0 auto;
    }

    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 24px;
      margin-bottom: 28px;
    }

    .eyebrow {
      margin: 0 0 8px;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      color: var(--accent);
      font-size: 12px;
      font-weight: 700;
    }

    h1 {
      font-size: clamp(2rem, 4vw, 4rem);
      margin: 0;
      line-height: 0.95;
      letter-spacing: -0.05em;
    }

    .session-user {
      margin: 10px 0 0;
      color: var(--muted);
    }

    .nav {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .nav a, .logout {
      text-decoration: none;
      color: var(--ink);
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 12px 18px;
      background: rgba(255, 255, 255, 0.7);
      transition: transform 180ms ease, background 180ms ease;
      font: inherit;
      cursor: pointer;
    }

    .nav a.active {
      background: var(--ink);
      color: white;
      box-shadow: var(--shadow);
    }

    .nav a:hover, .logout:hover {
      transform: translateY(-1px);
    }

    @media (max-width: 960px) {
      .page-shell {
        padding: 20px;
      }

      .topbar {
        align-items: start;
        flex-direction: column;
      }
    }
  `]
})
export class AppComponent {
  protected readonly authService = inject(AuthService);

  protected logout(): void {
    this.authService.logout();
  }
}
