import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './auth.service';

type ThemeMode = 'light' | 'dark';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <main class="page-shell">
      <header class="topbar" *ngIf="authService.isAuthenticated()">
        <div>
          <h1>Painel operacional</h1>
          <p class="session-user" *ngIf="authService.currentUser() as user">
            {{ user.name }} · {{ user.role_name || 'sem role' }}
          </p>
        </div>

        <div class="topbar-actions">
          <div class="accessibility-controls">
            <button
              type="button"
              class="panel-control"
              (click)="decreaseFontSize()"
              [disabled]="!canDecreaseFontSize()"
              aria-label="Diminuir tamanho da fonte"
            >
              a-
            </button>
            <button
              type="button"
              class="panel-control"
              (click)="increaseFontSize()"
              [disabled]="!canIncreaseFontSize()"
              aria-label="Aumentar tamanho da fonte"
            >
              A+
            </button>
            <button
              type="button"
              class="panel-control"
              (click)="toggleTheme()"
              [attr.aria-label]="theme() === 'light' ? 'Ativar tema escuro e restaurar fonte' : 'Ativar tema claro e restaurar fonte'"
            >
              <span class="theme-icon" aria-hidden="true">{{ theme() === 'light' ? '☾' : '☀' }}</span>
            </button>
          </div>

          <nav class="nav">
            <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
              Painel
            </a>
            <a routerLink="/customers" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
              Clientes
            </a>
            <a routerLink="/roles" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
              Roles
            </a>
            <a routerLink="/users" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
              Usuários
            </a>
            <a routerLink="/quotations" routerLinkActive="active">
              Cotações
            </a>
            <button type="button" class="logout" (click)="logout()">Sair</button>
          </nav>
        </div>
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

    .topbar h1 {
      font-size: clamp(1rem, 2vw, 2rem);
    }

    .session-user {
      margin: 10px 0 0;
      color: var(--muted);
    }

    .topbar-actions {
      display: flex;
      flex-direction: column;
      align-items: end;
      gap: 12px;
    }

    .accessibility-controls,
    .nav {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .nav a, .panel-control, .logout {
      text-decoration: none;
      color: var(--ink);
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 12px 18px;
      background: var(--surface-soft);
      transition: transform 180ms ease, background 180ms ease, opacity 180ms ease;
      font: inherit;
      cursor: pointer;
    }

    .nav a.active {
      background: var(--ink);
      color: white;
      box-shadow: var(--shadow);
    }

    .theme-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      line-height: 1;
      min-width: 1.1rem;
    }

    .panel-control[disabled] {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .nav a:hover, .panel-control:hover:not([disabled]), .logout:hover {
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

      .topbar-actions {
        align-items: start;
      }
    }
  `]
})
export class AppComponent {
  protected readonly authService = inject(AuthService);
  private readonly document = inject(DOCUMENT);
  private readonly storage = globalThis.localStorage;
  private readonly themeStorageKey = 'cotacao_v02_theme';
  private readonly fontScaleStorageKey = 'cotacao_v02_font_scale';
  private readonly minFontScale = 0.9;
  private readonly maxFontScale = 1.5;
  private readonly fontScaleStep = 0.1;

  protected readonly theme = signal<ThemeMode>('light');
  protected readonly fontScale = signal(1);
  protected readonly canDecreaseFontSize = computed(() => this.fontScale() > this.minFontScale);
  protected readonly canIncreaseFontSize = computed(() => this.fontScale() < this.maxFontScale);

  constructor() {
    this.restorePreferences();
  }

  protected logout(): void {
    this.authService.logout();
  }

  protected toggleTheme(): void {
    const nextTheme: ThemeMode = this.theme() === 'light' ? 'dark' : 'light';
    this.updateFontScale(1);
    this.applyTheme(nextTheme);
  }

  protected decreaseFontSize(): void {
    this.updateFontScale(this.fontScale() - this.fontScaleStep);
  }

  protected increaseFontSize(): void {
    this.updateFontScale(this.fontScale() + this.fontScaleStep);
  }

  private restorePreferences(): void {
    const storedTheme = this.readStoredTheme();
    const storedFontScale = this.readStoredFontScale();

    this.applyTheme(storedTheme);
    this.updateFontScale(storedFontScale, false);
  }

  private readStoredTheme(): ThemeMode {
    const storedTheme = this.storage.getItem(this.themeStorageKey);
    return storedTheme === 'dark' ? 'dark' : 'light';
  }

  private readStoredFontScale(): number {
    const rawValue = this.storage.getItem(this.fontScaleStorageKey);
    const parsedValue = rawValue ? Number(rawValue) : 1;
    return Number.isFinite(parsedValue) ? parsedValue : 1;
  }

  private applyTheme(theme: ThemeMode): void {
    this.theme.set(theme);
    this.document.documentElement.dataset['theme'] = theme;
    this.storage.setItem(this.themeStorageKey, theme);
  }

  private updateFontScale(nextScale: number, persist = true): void {
    const normalizedScale = Number(this.clamp(nextScale, this.minFontScale, this.maxFontScale).toFixed(1));
    this.fontScale.set(normalizedScale);
    this.document.documentElement.style.setProperty('--font-scale', String(normalizedScale));

    if (persist) {
      this.storage.setItem(this.fontScaleStorageKey, String(normalizedScale));
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}
