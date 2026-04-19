import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="profile-page">
      <header class="page-head">
        <a class="back-link" routerLink="/dashboard">←</a>
        <div>
          <h2>Meu Perfil</h2>
        </div>
      </header>

      <div class="profile-grid">
        <article class="profile-card">
          <div class="card-title">
            <span class="card-icon blue">👤</span>
            <div>
              <h3>Informações do Perfil</h3>
              <p>Normalmente nome e e-mail da sua conta</p>
            </div>
          </div>

          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="form">
            <label>
              <span>Nome</span>
              <input formControlName="name" type="text" />
            </label>

            <label>
              <span>E-mail</span>
              <input formControlName="email" type="email" />
            </label>

            <button class="primary" type="submit">Salvar</button>
          </form>
        </article>

        <article class="profile-card">
          <div class="card-title">
            <span class="card-icon indigo">🔒</span>
            <div>
              <h3>Alterar Senha</h3>
              <p>Use uma senha longa e única para manter segura sua conta</p>
            </div>
          </div>

          <form [formGroup]="passwordForm" (ngSubmit)="savePassword()" class="form">
            <label>
              <span>Senha Atual</span>
              <div class="password-wrap">
                <input formControlName="currentPassword" [type]="showCurrent ? 'text' : 'password'" />
                <button type="button" class="eye-button" (click)="showCurrent = !showCurrent">◉</button>
              </div>
            </label>

            <label>
              <span>Nova Senha</span>
              <div class="password-wrap">
                <input formControlName="newPassword" [type]="showNext ? 'text' : 'password'" />
                <button type="button" class="eye-button" (click)="showNext = !showNext">◉</button>
              </div>
            </label>

            <label>
              <span>Confirme a Nova Senha</span>
              <div class="password-wrap">
                <input formControlName="confirmPassword" [type]="showConfirm ? 'text' : 'password'" />
                <button type="button" class="eye-button" (click)="showConfirm = !showConfirm">◉</button>
              </div>
            </label>

            <button class="primary" type="submit">Salvar</button>
          </form>
        </article>

      </div>

      <p class="message success" *ngIf="successMessage">{{ successMessage }}</p>
      <p class="message error" *ngIf="errorMessage">{{ errorMessage }}</p>
    </section>
  `,
  styles: [`
    .profile-page { display: grid; gap: 16px; }
    .page-head { display: flex; align-items: center; gap: 10px; color: #2a2f47; }
    .page-head h2 { margin: 0; font-size: 1.1rem; }
    .back-link { text-decoration: none; color: #2a2f47; font-size: 1rem; }
    .profile-grid { display: grid; gap: 18px; grid-template-columns: repeat(3, minmax(0, 1fr)); align-items: start; }
    .profile-card {
      background: #fff;
      border: 1px solid #e6e8f2;
      border-radius: 10px;
      padding: 16px;
      box-shadow: 0 8px 18px rgba(23, 31, 89, 0.06);
      display: grid;
      gap: 16px;
    }
    .card-title { display: flex; gap: 10px; align-items: start; }
    .card-title h3 { margin: 0; font-size: 0.92rem; color: #25306a; }
    .card-title p { margin: 4px 0 0; color: #7d839a; font-size: 0.72rem; line-height: 1.4; }
    .card-icon {
      width: 24px;
      height: 24px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      font-size: 0.8rem;
      flex: none;
    }
    .blue { background: #ebefff; }
    .indigo { background: #ecebff; }
    .red { background: #ffe9e9; }
    .form { display: grid; gap: 12px; }
    label { display: grid; gap: 6px; color: #5f667f; font-size: 0.72rem; }
    input {
      width: 100%;
      border: 1px solid #d8dcec;
      border-radius: 3px;
      min-height: 36px;
      padding: 0 10px;
      font: inherit;
      color: #29304f;
      background: #fff;
    }
    .password-wrap {
      border: 1px solid #d8dcec;
      border-radius: 3px;
      min-height: 36px;
      padding: 0 8px 0 10px;
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
      gap: 8px;
      background: #fff;
    }
    .password-wrap input {
      border: 0;
      min-height: 34px;
      padding: 0;
    }
    .eye-button {
      border: 0;
      background: transparent;
      cursor: pointer;
      color: #59607a;
      font-size: 0.78rem;
    }
    .primary, .danger {
      border: 0;
      border-radius: 3px;
      min-height: 33px;
      padding: 0 14px;
      font: inherit;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      cursor: pointer;
      justify-self: start;
    }
    .primary { background: #4b57c5; color: #fff; }
    .message { margin: 0; padding: 10px 12px; border-radius: 8px; font-size: 0.82rem; }
    .success { background: #ecfff4; color: #1f8a56; }
    .error { background: #fff0f0; color: #c44242; }
    @media (max-width: 1100px) {
      .profile-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ProfilePageComponent {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly user = computed(() => this.authService.currentUser());

  protected successMessage = '';
  protected errorMessage = '';
  protected showCurrent = false;
  protected showNext = false;
  protected showConfirm = false;

  protected readonly profileForm = this.fb.nonNullable.group({
    name: [this.user()?.name ?? '', [Validators.required]],
    email: [this.user()?.email ?? '', [Validators.required, Validators.email]]
  });

  protected readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  });

  protected saveProfile(): void {
    const currentUser = this.authService.currentUser();

    if (!currentUser || this.profileForm.invalid) {
      this.errorMessage = 'Verifique os dados do perfil.';
      this.successMessage = '';
      return;
    }

    this.authService.updateCurrentUser({
      ...currentUser,
      ...this.profileForm.getRawValue()
    });

    this.successMessage = 'Perfil atualizado com sucesso.';
    this.errorMessage = '';
  }

  protected savePassword(): void {
    const { newPassword, confirmPassword } = this.passwordForm.getRawValue();

    if (this.passwordForm.invalid) {
      this.errorMessage = 'Preencha os campos obrigatórios da senha.';
      this.successMessage = '';
      return;
    }

    if (newPassword !== confirmPassword) {
      this.errorMessage = 'A confirmação da nova senha não confere.';
      this.successMessage = '';
      return;
    }

    this.passwordForm.reset({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    this.successMessage = 'Tela pronta para integrar a alteração de senha com a API.';
    this.errorMessage = '';
  }
}
