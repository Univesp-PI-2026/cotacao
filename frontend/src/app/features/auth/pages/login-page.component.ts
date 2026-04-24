import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { UI_CONFIG } from '../../../core/config/ui.config';
import { AppAlertComponent } from '../../../shared/components/app-alert/app-alert.component';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AppAlertComponent
  ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css'
})
export class LoginPageComponent {
  private static readonly MIN_SCALE_LEVEL = -2;
  private static readonly MAX_SCALE_LEVEL = 6;
  private static readonly SCALE_STEP = 0.05;

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private clearMessageTimeoutId: number | null = null;

  protected readonly carregando = signal(false);
  protected readonly senhaVisivel = signal(false);
  protected readonly nivelEscala = signal(0);
  protected readonly escalaInterface = computed(
    () => `${1 + this.nivelEscala() * LoginPageComponent.SCALE_STEP}`
  );
  protected readonly apiErrorMessage = signal('');

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required]],
    senha: ['', [Validators.required]]
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.clearApiErrorMessageTimeout();
    });
  }

  protected submit(): void {
    this.apiErrorMessage.set('');
    this.clearApiErrorMessageTimeout();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.carregando.set(true);

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.carregando.set(false);
        this.apiErrorMessage.set('');
        void this.router.navigate(['/dashboard']);
      },
      error: (error: unknown) => {
        this.carregando.set(false);
        const message = this.extractApiErrorMessage(error);
        this.apiErrorMessage.set(message);
        this.scheduleApiErrorMessageClear();
      }
    });
  }

  protected togglePasswordVisibility(): void {
    this.senhaVisivel.update((visible) => !visible);
  }

  protected diminuirFonte(): void {
    this.atualizarEscala(-1);
  }

  protected aumentarFonte(): void {
    this.atualizarEscala(1);
  }

  private atualizarEscala(delta: number): void {
    const proximoNivel = Math.min(
      LoginPageComponent.MAX_SCALE_LEVEL,
      Math.max(LoginPageComponent.MIN_SCALE_LEVEL, this.nivelEscala() + delta)
    );
    this.nivelEscala.set(proximoNivel);
  }

  private extractApiErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const apiMessage = error.error?.message;
      const apiErrors = error.error?.errors;

      if (typeof apiMessage === 'string' && apiMessage.trim()) {
        return apiMessage;
      }

      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        return String(apiErrors[0]);
      }
    }

    return 'E-mail ou senha inválidos.';
  }

  private scheduleApiErrorMessageClear(): void {
    this.clearApiErrorMessageTimeout();
    this.clearMessageTimeoutId = window.setTimeout(() => {
      this.apiErrorMessage.set('');
      this.clearMessageTimeoutId = null;
    }, UI_CONFIG.feedback.inlineMessageDurationMs);
  }

  private clearApiErrorMessageTimeout(): void {
    if (this.clearMessageTimeoutId !== null) {
      window.clearTimeout(this.clearMessageTimeoutId);
      this.clearMessageTimeoutId = null;
    }
  }
}
