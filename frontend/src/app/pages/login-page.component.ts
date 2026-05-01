import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="layout-page-centered">
      <article class="surface-card login-card" [style.font-size]="uiScale">
        <div class="card-header-custom">
          <div class="card-header-title">
            Acesso ao sistema
          </div>

          <div class="card-header-actions">
            <button
              class="font-scale-button"
              type="button"
              (click)="increaseFontSize()"
              [disabled]="fontScaleLevel >= maxFontScaleLevel"
              aria-label="Aumentar fonte"
            >
              A+
            </button>
            <button
              class="font-scale-button"
              type="button"
              (click)="decreaseFontSize()"
              [disabled]="fontScaleLevel <= minFontScaleLevel"
              aria-label="Diminuir fonte"
            >
              a-
            </button>
          </div>
        </div>

        <div class="login-hero-block">
          <div class="brand-card">
            <img
              class="brand-mark brand-mark--lg"
              src="assets/grupo05-shield.png"
              alt="Logo Grupo05 Seguros"
            />
            <div class="brand-copy">
              <strong class="brand-name">Grupo05 Seguros</strong>
              <span class="brand-subtitle">Plataforma de cotacoes</span>
            </div>
          </div>
        </div>

        <div class="card-content">
          <div class="feedback-slot">
            <p class="message error" *ngIf="errorMessage">{{ errorMessage }}</p>
          </div>

          <form class="stack-form" [formGroup]="form" (ngSubmit)="login()">
            <label class="form-field-full">
              <span class="field-label">Usuario ou e-mail</span>
              <input
                formControlName="identifier"
                type="text"
                placeholder="Digite seu usuario ou e-mail"
                autocomplete="username"
              />
              <small class="field-error" *ngIf="showFieldError('identifier')">
                Informe seu usuario ou e-mail.
              </small>
            </label>

            <label class="form-field-full">
              <span class="field-label">Senha</span>
              <div class="password-field">
                <input
                  formControlName="password"
                  [type]="showPassword ? 'text' : 'password'"
                  placeholder="Digite sua senha"
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  class="password-toggle"
                  (click)="togglePasswordVisibility()"
                  [attr.aria-label]="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                >
                  {{ showPassword ? 'Ocultar' : 'Mostrar' }}
                </button>
              </div>
              <small class="field-error" *ngIf="showFieldError('password')">
                Informe sua senha.
              </small>
            </label>

            <div class="actions-stack">
              <span class="text-link text-link--center">Recuperacao de acesso em breve</span>

              <div class="action-submit-block">
                <button class="action-button-primary" type="submit" [disabled]="submitting">
                  <span class="action-button-label">
                    {{ submitting ? 'Entrando...' : 'Entrar' }}
                  </span>
                </button>
                <div class="action-divider" aria-hidden="true"></div>
              </div>
            </div>
          </form>

          <div class="auth-support-row">
            <span>Novo usuario?</span>
            <span class="text-link">Cadastro em breve</span>
          </div>
        </div>
      </article>
    </section>
  `,
  styles: [`
    .layout-page-centered {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .login-card {
      width: 100%;
      max-width: 337px;
      border: 1px solid var(--line-strong);
      border-radius: 16px;
      background: var(--surface-panel);
      box-shadow: var(--shadow);
      overflow: hidden;
    }

    .card-header-custom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 18px 20px 8px;
    }

    .card-header-title {
      color: var(--ink);
      font-size: 1.15rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .card-header-actions {
      display: flex;
      gap: 8px;
    }

    .font-scale-button,
    .password-toggle {
      border: 1px solid var(--line);
      border-radius: 999px;
      background: var(--surface-soft);
      color: var(--ink);
      cursor: pointer;
      transition: transform 180ms ease, background 180ms ease, opacity 180ms ease;
    }

    .font-scale-button {
      min-width: 40px;
      min-height: 40px;
      padding: 0 12px;
      font: inherit;
      font-size: 0.95rem;
    }

    .font-scale-button:hover:not(:disabled),
    .password-toggle:hover,
    .action-button-primary:hover {
      transform: translateY(-1px);
    }

    .font-scale-button:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .login-hero-block {
      padding: 8px 20px 0;
    }

    .brand-card {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      width: 100%;
      padding: 14px 18px;
      border: 1px solid var(--line);
      border-radius: 16px;
      background: linear-gradient(135deg, var(--surface-soft), rgba(255, 255, 255, 0.92));
    }

    .brand-mark {
      display: block;
      width: auto;
      object-fit: contain;
    }

    .brand-mark--lg {
      height: 62px;
    }

    .brand-copy {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .brand-name {
      color: var(--ink);
      font-size: 1.2rem;
      line-height: 1.1;
    }

    .brand-subtitle {
      color: var(--muted);
      font-size: 0.92rem;
      line-height: 1.3;
    }

    .card-content {
      padding: 16px 20px 20px;
    }

    .feedback-slot {
      min-height: 54px;
      margin-bottom: 4px;
    }

    .stack-form,
    .form-field-full {
      display: flex;
      flex-direction: column;
    }

    .stack-form {
      gap: 14px;
    }

    .field-label {
      color: var(--muted);
      font-size: 0.95rem;
      margin-bottom: 8px;
    }

    input {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 13px 14px;
      font: inherit;
      color: var(--ink);
      background: var(--surface-base);
    }

    .password-field {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 10px;
      align-items: center;
    }

    .password-toggle {
      padding: 12px 14px;
      font: inherit;
    }

    .field-error {
      color: var(--danger);
      font-size: 0.82rem;
      margin-top: 6px;
    }

    .text-link {
      color: var(--accent);
      font-size: 0.95rem;
      line-height: 1.4;
    }

    .text-link--center {
      align-self: flex-end;
      width: 100%;
      text-align: right;
    }

    .actions-stack {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
      margin-top: 2px;
    }

    .action-submit-block {
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
    }

    .action-button-primary {
      min-height: 56px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: 0;
      border-radius: 14px;
      background: var(--ink);
      color: white;
      box-shadow: var(--shadow);
      cursor: pointer;
      transition: transform 180ms ease, opacity 180ms ease;
    }

    .action-button-primary:disabled {
      opacity: 0.7;
      cursor: wait;
    }

    .action-button-label {
      font-size: 1.1rem;
      line-height: 1.2;
      font-weight: 600;
    }

    .action-divider {
      width: 100%;
      height: 1px;
      background: var(--line);
      opacity: 0.9;
    }

    .auth-support-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-top: 20px;
      color: var(--muted);
      font-size: 0.95rem;
      line-height: 1.4;
    }

    .message.error {
      margin: 0;
      padding: 12px 14px;
      border-radius: 14px;
      font-size: 0.92rem;
      background: rgba(187, 62, 62, 0.1);
      color: var(--danger);
    }

    @media (max-width: 600px) {
      .layout-page-centered {
        padding: 16px;
      }

      .card-header-custom {
        padding: 16px 16px 8px;
      }

      .login-hero-block,
      .card-content {
        padding-left: 16px;
        padding-right: 16px;
      }

      .brand-card {
        padding: 12px 14px;
      }

      .brand-mark--lg {
        height: 52px;
      }
    }
  `]
})
export class LoginPageComponent {
  protected readonly minFontScaleLevel = -2;
  protected readonly maxFontScaleLevel = 6;
  private readonly fontScaleStep = 0.05;
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected submitting = false;
  protected errorMessage = '';
  protected showPassword = false;
  protected fontScaleLevel = 0;

  protected readonly form = this.fb.nonNullable.group({
    identifier: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  constructor() {
    if (this.authService.isAuthenticated()) {
      void this.router.navigate(['/dashboard']);
    }
  }

  protected login(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Preencha usuário e senha.';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    const { identifier, password } = this.form.getRawValue();

    this.authService.login(identifier, password).subscribe({
      next: ({ token, user }) => {
        this.submitting = false;
        this.authService.completeLogin(token, user);
        const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo') || '/dashboard';
        void this.router.navigateByUrl(redirectTo);
      },
      error: (error) => {
        this.submitting = false;
        this.errorMessage = error?.error?.message || 'Não foi possível entrar.';
      }
    });
  }

  protected showFieldError(fieldName: keyof typeof this.form.controls): boolean {
    const field = this.form.controls[fieldName];
    return field.invalid && (field.dirty || field.touched);
  }

  protected togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  protected increaseFontSize(): void {
    this.fontScaleLevel = Math.min(this.maxFontScaleLevel, this.fontScaleLevel + 1);
  }

  protected decreaseFontSize(): void {
    this.fontScaleLevel = Math.max(this.minFontScaleLevel, this.fontScaleLevel - 1);
  }

  protected get uiScale(): string {
    return `${1 + this.fontScaleLevel * this.fontScaleStep}`;
  }
}
