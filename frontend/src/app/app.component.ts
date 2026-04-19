import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <ng-container *ngIf="authService.isAuthenticated(); else publicShell">
      <main class="app-layout" [class.theme-dark]="theme === 'dark'" [class.font-large]="largeText">
        <aside class="sidebar">
          <div class="brand-side">
            <span class="brand-badge" aria-hidden="true"></span>
            <strong>Grupo05</strong>
          </div>

          <nav class="sidebar-nav">
            <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
              <span aria-hidden="true">▦</span>
              Painel
            </a>
            <a routerLink="/customers" routerLinkActive="active">
              <span aria-hidden="true">👥</span>
              Clientes
            </a>
            <a routerLink="/quotations" routerLinkActive="active">
              <span aria-hidden="true">📄</span>
              Cotações
            </a>
            <a routerLink="/users" routerLinkActive="active">
              <span aria-hidden="true">👤</span>
              Usuários
            </a>
            <a routerLink="/profile" routerLinkActive="active">
              <span aria-hidden="true">⚙</span>
              Perfil
            </a>
          </nav>

          <button type="button" class="logout-side" (click)="logout()">
            <span aria-hidden="true">↩</span>
            Sair
          </button>
        </aside>

        <section class="content-shell">
          <header class="topbar">
            <div class="topbar-brand">
              <button type="button" class="menu-dot" aria-label="Menu">☰</button>
              <strong>Grupo05 Seguros</strong>
            </div>

            <div class="topbar-actions">
              <button
                type="button"
                class="icon-button"
                [attr.aria-label]="theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'"
                [attr.title]="theme === 'dark' ? 'Tema claro' : 'Tema escuro'"
                (click)="toggleTheme()"
              >
                <svg *ngIf="theme === 'light'" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.8 6.8 0 0 0 9.8 9.8Z"/>
                </svg>
                <svg *ngIf="theme === 'dark'" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3"/>
                </svg>
              </button>
              <button
                type="button"
                class="icon-button"
                [attr.aria-label]="largeText ? 'Reduzir tamanho da letra' : 'Aumentar tamanho da letra'"
                [attr.title]="largeText ? 'Reduzir letra' : 'Aumentar letra'"
                [class.active]="largeText"
                (click)="toggleFontSize()"
              >
                <span class="font-icon" aria-hidden="true">A</span>
              </button>
              <span class="avatar-chip" *ngIf="authService.currentUser() as user">
                {{ getInitial(user.name) }}
              </span>
            </div>
          </header>

          <div class="content-body">
            <router-outlet />
          </div>
        </section>
      </main>
    </ng-container>

    <ng-template #publicShell>
      <main class="public-layout" [class.theme-dark]="theme === 'dark'" [class.font-large]="largeText">
        <router-outlet />
      </main>
    </ng-template>
  `,
  styles: [`
    .public-layout { min-height: 100vh; }
    .app-layout {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 108px 1fr;
      background: #f3f4f8;
      color: #1f2340;
    }
    .sidebar {
      background: #ffffff;
      border-right: 1px solid #e5e8f3;
      padding: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .brand-side {
      height: 30px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 10px;
      border-bottom: 1px solid #eceef7;
      color: #3140b0;
      font-size: 0.82rem;
      font-weight: 800;
    }
    .brand-badge {
      width: 14px;
      height: 14px;
      display: inline-block;
      background: linear-gradient(180deg, #4b57c5, #2e37ad);
      clip-path: polygon(50% 0%, 100% 22%, 100% 68%, 50% 100%, 0% 68%, 0% 22%);
    }
    .sidebar-nav {
      display: grid;
      align-content: start;
      padding: 8px 0;
    }
    .sidebar-nav a,
    .logout-side {
      min-height: 42px;
      display: grid;
      grid-template-columns: 22px 1fr;
      align-items: center;
      gap: 8px;
      padding: 0 14px;
      border: 0;
      background: transparent;
      color: #5f657e;
      text-decoration: none;
      font: inherit;
      font-size: 0.78rem;
      cursor: pointer;
    }
    .sidebar-nav a.active {
      background: #eef0fa;
      color: #3f4ab8;
      font-weight: 700;
    }
    .logout-side {
      color: #d14f5d;
      margin: 10px 0;
    }
    .content-shell {
      display: grid;
      grid-template-rows: 30px 1fr;
      min-width: 0;
    }
    .topbar {
      background: linear-gradient(180deg, #4d59c7 0%, #3f4ab8 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 12px;
      box-shadow: inset 0 -1px 0 rgba(255,255,255,0.12);
    }
    .topbar-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.78rem;
      font-weight: 700;
    }
    .menu-dot,
    .icon-button {
      width: 24px;
      height: 24px;
      display: grid;
      place-items: center;
      border: 0;
      border-radius: 999px;
      background: rgba(255,255,255,0.14);
      color: white;
      cursor: pointer;
      padding: 0;
      transition: background 160ms ease, transform 160ms ease;
    }
    .menu-dot:hover,
    .icon-button:hover,
    .icon-button.active {
      background: rgba(255,255,255,0.22);
    }
    .icon-button svg {
      width: 14px;
      height: 14px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .font-icon {
      font-size: 0.84rem;
      font-weight: 800;
      line-height: 1;
    }
    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .avatar-chip {
      width: 24px;
      height: 24px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      background: rgba(255,255,255,0.18);
      color: white;
      font-size: 0.72rem;
      font-weight: 800;
      line-height: 1;
      text-align: center;
    }
    .content-body {
      padding: 18px 22px 24px;
      min-width: 0;
    }
    .app-layout.font-large,
    .public-layout.font-large {
      font-size: 1.08rem;
    }
    .app-layout.theme-dark {
      background: #111528;
      color: #eef1ff;
    }
    .app-layout.theme-dark .sidebar {
      background: #171c34;
      border-right-color: #2a3159;
    }
    .app-layout.theme-dark .brand-side {
      border-bottom-color: #293158;
      color: #d9defd;
    }
    .app-layout.theme-dark .sidebar-nav a,
    .app-layout.theme-dark .logout-side {
      color: #c0c7ea;
    }
    .app-layout.theme-dark .sidebar-nav a.active {
      background: #242d57;
      color: #ffffff;
    }
    .app-layout.theme-dark .content-body {
      background: #111528;
    }
    @media (max-width: 900px) {
      .app-layout { grid-template-columns: 1fr; }
      .sidebar { display: none; }
      .content-body { padding: 16px; }
    }
  `]
})
export class AppComponent {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected theme: 'light' | 'dark' = 'light';
  protected largeText = false;

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.authService.isAuthenticated() && this.router.url === '/') {
          void this.router.navigate(['/dashboard']);
        }
      });
  }

  protected logout(): void {
    this.authService.logout();
  }

  protected toggleTheme(): void {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
  }

  protected toggleFontSize(): void {
    this.largeText = !this.largeText;
  }

  protected getInitial(name: string): string {
    return String(name || '?').trim().charAt(0).toUpperCase() || '?';
  }
}
