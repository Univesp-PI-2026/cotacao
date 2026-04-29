import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Role } from '../role.model';
import { RoleService } from '../role.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="detail-layout">
      <article class="panel intro-panel">
        <p class="eyebrow">Roles</p>
        <h2>{{ editingId ? 'Detalhe da role' : 'Nova role' }}</h2>
        <p class="subtitle">
          {{ editingId ? 'Edite o nome da role e acompanhe quantos usuários estão vinculados.' : 'Crie um novo perfil de acesso para usar no sistema.' }}
        </p>

        <div class="summary" *ngIf="loadedRole">
          <div><span class="label">Nome</span><strong>{{ loadedRole.name }}</strong></div>
          <div><span class="label">Usuários vinculados</span><strong>{{ loadedRole.users_count }}</strong></div>
          <div><span class="label">Criada em</span><strong>{{ loadedRole.created_at | date:'dd/MM/yyyy HH:mm' }}</strong></div>
        </div>

        <div class="side-actions">
          <a class="ghost link-button" routerLink="/roles">Voltar para lista</a>
          <button type="button" class="ghost danger" *ngIf="editingId" (click)="deleteRole()">Excluir</button>
        </div>
      </article>

      <article class="panel form-panel">
        <form [formGroup]="form" (ngSubmit)="saveRole()" class="form">
          <p class="message success" *ngIf="successMessage">{{ successMessage }}</p>
          <p class="message error" *ngIf="errorMessage">{{ errorMessage }}</p>

          <label>
            <span>Nome da role</span>
            <input formControlName="name" type="text" />
            <small class="field-error" *ngIf="showFieldError('name')">{{ getFieldError('name') }}</small>
          </label>

          <div class="actions">
            <button class="primary" type="submit" [disabled]="saving">{{ saving ? 'Salvando...' : (editingId ? 'Salvar alteracoes' : 'Criar role') }}</button>
            <button class="ghost" type="button" (click)="resetForm()">Limpar</button>
          </div>
        </form>
      </article>
    </section>
  `,
  styles: [`
    .detail-layout { display: grid; grid-template-columns: minmax(280px, 340px) 1fr; gap: 24px; align-items: start; }
    .panel { background: var(--surface-panel); border: 1px solid var(--line-strong); border-radius: 28px; padding: 24px; box-shadow: var(--shadow); backdrop-filter: blur(10px); }
    .eyebrow { margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.18em; color: var(--accent); font-size: 12px; font-weight: 700; }
    h2 { margin: 0; font-size: 1.6rem; }
    .subtitle { margin: 12px 0 0; color: var(--muted); line-height: 1.5; }
    .summary { display: grid; gap: 14px; margin: 24px 0; padding: 18px; border-radius: 22px; background: var(--surface-soft); border: 1px solid var(--line); }
    .label { display: block; color: var(--muted); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
    .side-actions, .actions { display: flex; gap: 12px; flex-wrap: wrap; }
    .form { display: grid; gap: 14px; }
    label { display: grid; gap: 8px; color: var(--muted); font-size: 0.92rem; }
    input { width: 100%; border: 1px solid var(--line); border-radius: 16px; padding: 13px 14px; font: inherit; color: var(--ink); background: var(--surface-base); }
    .field-error { color: var(--danger); font-size: 0.82rem; }
    .primary, .ghost { border: 0; border-radius: 999px; padding: 12px 18px; font: inherit; cursor: pointer; transition: transform 180ms ease, background 180ms ease; }
    .primary { background: var(--ink); color: white; box-shadow: var(--shadow); }
    .ghost { background: var(--surface-soft); color: var(--ink); border: 1px solid var(--line); }
    .ghost.danger { color: var(--danger); }
    .link-button { text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
    .primary:hover, .ghost:hover { transform: translateY(-1px); }
    .message { margin: 0; padding: 12px 14px; border-radius: 14px; font-size: 0.92rem; }
    .success { background: var(--accent-soft); color: var(--accent); }
    .error { background: rgba(187, 62, 62, 0.1); color: var(--danger); }
    @media (max-width: 960px) { .detail-layout { grid-template-columns: 1fr; } }
  `]
})
export class RoleDetailPageComponent {
  private readonly roleService = inject(RoleService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected editingId: number | null = null;
  protected saving = false;
  protected successMessage = '';
  protected errorMessage = '';
  protected loadedRole: Role | null = null;
  protected serverFieldErrors: Partial<Record<keyof typeof this.form.controls, string>> = {};

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]]
  });

  constructor() {
    this.form.valueChanges.subscribe(() => {
      if (Object.keys(this.serverFieldErrors).length > 0) {
        this.serverFieldErrors = {};
      }
    });

    const id = this.route.snapshot.paramMap.get('id');
    const notice = this.route.snapshot.queryParamMap.get('notice');

    if (notice === 'created') {
      this.successMessage = 'Role criada com sucesso.';
    } else if (notice === 'updated') {
      this.successMessage = 'Role atualizada com sucesso.';
    }

    if (id) {
      this.editingId = Number(id);
      this.loadRole(this.editingId);
    }
  }

  protected loadRole(id: number): void {
    this.roleService.getById(id).subscribe({
      next: (role) => {
        this.loadedRole = role;
        this.form.patchValue({ name: role.name });
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel carregar a role.';
      }
    });
  }

  protected saveRole(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Preencha os campos obrigatorios.';
      this.successMessage = '';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.serverFieldErrors = {};

    const payload = this.form.getRawValue();
    const request$ = this.editingId
      ? this.roleService.update(this.editingId, payload)
      : this.roleService.create(payload);

    request$.subscribe({
      next: (role) => {
        this.saving = false;
        this.loadedRole = role;
        if (!this.editingId) {
          void this.router.navigate(['/roles', role.id], {
            queryParams: { notice: 'created' }
          });
          return;
        }

        this.successMessage = 'Role atualizada com sucesso.';
        this.editingId = role.id;
      },
      error: (error) => {
        this.saving = false;
        const apiErrors = Array.isArray(error?.error?.errors) ? error.error.errors : [];
        this.applyApiErrors(apiErrors);
        this.errorMessage = error?.error?.message || (apiErrors.length > 0 ? 'Verifique os campos destacados.' : 'Falha ao salvar role.');
      }
    });
  }

  protected deleteRole(): void {
    if (!this.editingId) return;

    this.errorMessage = '';
    this.successMessage = '';

    this.roleService.delete(this.editingId).subscribe({
      next: () => {
        void this.router.navigate(['/roles']);
      },
      error: (error) => {
        const apiErrors = Array.isArray(error?.error?.errors) ? error.error.errors : [];
        this.errorMessage = apiErrors.length > 0 ? this.translateApiError(apiErrors[0]) : 'Nao foi possivel remover a role.';
      }
    });
  }

  protected resetForm(): void {
    this.serverFieldErrors = {};
    this.errorMessage = '';
    this.successMessage = '';
    if (this.loadedRole) {
      this.form.patchValue({ name: this.loadedRole.name });
      return;
    }
    this.form.reset({ name: '' });
  }

  protected showFieldError(fieldName: keyof typeof this.form.controls): boolean {
    const field = this.form.controls[fieldName];
    return Boolean(this.serverFieldErrors[fieldName]) || (field.invalid && (field.dirty || field.touched));
  }

  protected getFieldError(fieldName: keyof typeof this.form.controls): string {
    const serverError = this.serverFieldErrors[fieldName];
    if (serverError) {
      return serverError;
    }

    const field = this.form.controls[fieldName];
    if (field.hasError('required')) {
      return 'Este campo e obrigatorio.';
    }

    return 'Campo invalido.';
  }

  private applyApiErrors(errors: string[]): void {
    this.serverFieldErrors = {};

    errors.forEach((errorMessage) => {
      if (errorMessage.toLowerCase().includes('name')) {
        this.serverFieldErrors.name = this.translateApiError(errorMessage);
        this.form.controls.name.markAsTouched();
      }
    });
  }

  private translateApiError(errorMessage: string): string {
    const normalizedError = errorMessage.toLowerCase();

    if (normalizedError === 'name already exists') {
      return 'Ja existe uma role com esse nome.';
    }

    if (normalizedError === 'role is being used by users') {
      return 'Nao e possivel excluir esta role porque ela esta vinculada a usuarios.';
    }

    if (normalizedError.includes('is required')) {
      return 'Este campo e obrigatorio.';
    }

    return 'Campo invalido.';
  }
}
