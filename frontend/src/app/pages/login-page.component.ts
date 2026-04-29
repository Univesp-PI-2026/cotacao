import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="login-shell">
      <article class="login-card">
        <h1>Acesso à aplicação</h1>
        <p class="subtitle">
          Entre com seu usuário para acessar clientes, usuários, roles e cotações.
        </p>

        <form [formGroup]="form" (ngSubmit)="login()" class="form">
          <p class="message error" *ngIf="errorMessage">{{ errorMessage }}</p>

          <label>
            <span>Usuário ou e-mail</span>
            <input formControlName="identifier" type="text" autocomplete="username" />
            <small class="field-error" *ngIf="showFieldError('identifier')">Este campo é obrigatório.</small>
          </label>

          <label>
            <span>Senha</span>
            <div class="password-field">
              <input
                formControlName="password"
                [type]="showPassword ? 'text' : 'password'"
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
            <small class="field-error" *ngIf="showFieldError('password')">Este campo é obrigatório.</small>
          </label>

          <button class="primary" type="submit" [disabled]="submitting">
            {{ submitting ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>
      </article>
    </section>
  `,
  styles: [`
    .login-shell { min-height: calc(100vh - 64px); display: grid; place-items: center; }
    .login-card { width: min(100%, 440px); background: var(--surface-panel-soft); border: 1px solid var(--line-strong); border-radius: 32px; padding: 32px; box-shadow: var(--shadow); backdrop-filter: blur(12px); }
    .eyebrow { margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.18em; color: var(--accent); font-size: 12px; font-weight: 700; }
    h1 { margin: 0; font-size: clamp(1rem, 2vw, 1.4rem); line-height: 0.95; letter-spacing: -0.04em; }
    .subtitle { margin: 14px 0 24px; color: var(--muted); line-height: 1.5; }
    .form { display: grid; gap: 14px; }
    label { display: grid; gap: 8px; color: var(--muted); font-size: 0.92rem; }
    input { width: 100%; border: 1px solid var(--line); border-radius: 16px; padding: 13px 14px; font: inherit; color: var(--ink); background: var(--surface-base); }
    .password-field { display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center; }
    .password-toggle { border: 1px solid var(--line); border-radius: 999px; padding: 12px 14px; font: inherit; cursor: pointer; background: var(--surface-soft-strong); color: var(--ink); transition: transform 180ms ease, background 180ms ease; }
    .password-toggle:hover { transform: translateY(-1px); }
    .field-error { color: var(--danger); font-size: 0.82rem; }
    .primary { border: 0; border-radius: 999px; padding: 13px 18px; font: inherit; cursor: pointer; background: var(--ink); color: white; box-shadow: var(--shadow); transition: transform 180ms ease, background 180ms ease; }
    .primary:hover { transform: translateY(-1px); }
    .message.error { margin: 0; padding: 12px 14px; border-radius: 14px; font-size: 0.92rem; background: rgba(187, 62, 62, 0.1); color: var(--danger); }
  `]
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected submitting = false;
  protected errorMessage = '';
  protected showPassword = false;

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
}
