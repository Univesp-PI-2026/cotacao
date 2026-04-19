import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Role } from '../role.model';
import { RoleService } from '../role.service';
import { User } from '../user.model';
import { UserService } from '../user.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="detail-layout">
      <article class="panel intro-panel">
        <p class="eyebrow">Users</p>
        <h2>{{ editingId ? 'Detalhe do usuário' : 'Novo usuário' }}</h2>
        <p class="subtitle">
          {{ editingId ? 'Edite os dados de acesso, altere a role e atualize o status de uso.' : 'Crie um novo usuário operacional para o sistema.' }}
        </p>

        <div class="summary" *ngIf="loadedUser">
          <div><span class="label">Status</span><strong>{{ loadedUser.active === 1 ? 'Ativo' : 'Inativo' }}</strong></div>
          <div><span class="label">Role</span><strong>{{ loadedUser.role_name || 'Sem role' }}</strong></div>
          <div><span class="label">E-mail</span><strong>{{ loadedUser.email }}</strong></div>
        </div>

        <div class="side-actions">
          <a class="ghost link-button" routerLink="/users">Voltar para lista</a>
          <button type="button" class="ghost" *ngIf="editingId && loadedUser?.active === 1" (click)="softDelete()">Desativar</button>
          <button type="button" class="ghost" *ngIf="editingId && loadedUser?.active === 0" (click)="activate()">Ativar</button>
        </div>
      </article>

      <article class="panel form-panel">
        <form [formGroup]="form" (ngSubmit)="saveUser()" class="form">
          <p class="message success" *ngIf="successMessage">{{ successMessage }}</p>
          <p class="message error" *ngIf="errorMessage">{{ errorMessage }}</p>

          <label>
            <span>Nome</span>
            <input formControlName="name" type="text" />
            <small class="field-error" *ngIf="showFieldError('name')">{{ getFieldError('name') }}</small>
          </label>

          <label>
            <span>E-mail</span>
            <input formControlName="email" type="email" />
            <small class="field-error" *ngIf="showFieldError('email')">{{ getFieldError('email') }}</small>
          </label>

          <label>
            <span>Role</span>
            <select formControlName="role_id">
              <option [ngValue]="0">Selecione</option>
              <option *ngFor="let role of roles" [ngValue]="role.id">{{ role.name }}</option>
            </select>
            <small class="field-error" *ngIf="showFieldError('role_id')">{{ getFieldError('role_id') }}</small>
          </label>

          <label>
            <span>{{ editingId ? 'Nova senha' : 'Senha' }}</span>
            <input formControlName="password" type="password" />
            <small class="hint" *ngIf="editingId">Deixe em branco para manter a senha atual.</small>
            <small class="field-error" *ngIf="showFieldError('password')">{{ getFieldError('password') }}</small>
          </label>

          <label class="toggle"><input formControlName="active" type="checkbox" /><span>Usuário ativo</span></label>

          <div class="actions">
            <button class="primary" type="submit" [disabled]="saving">{{ saving ? 'Salvando...' : (editingId ? 'Salvar alteracoes' : 'Criar usuário') }}</button>
            <button class="ghost" type="button" (click)="resetForm()">Limpar</button>
          </div>
        </form>
      </article>
    </section>
  `,
  styles: [`
    .detail-layout { display: grid; grid-template-columns: minmax(280px, 340px) 1fr; gap: 24px; align-items: start; }
    .panel { background: color-mix(in srgb, var(--paper) 90%, white 10%); border: 1px solid rgba(215, 209, 194, 0.75); border-radius: 28px; padding: 24px; box-shadow: var(--shadow); backdrop-filter: blur(10px); }
    .eyebrow { margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.18em; color: var(--accent); font-size: 12px; font-weight: 700; }
    h2 { margin: 0; font-size: 1.6rem; }
    .subtitle { margin: 12px 0 0; color: var(--muted); line-height: 1.5; }
    .summary { display: grid; gap: 14px; margin: 24px 0; padding: 18px; border-radius: 22px; background: rgba(255, 255, 255, 0.7); border: 1px solid var(--line); }
    .label { display: block; color: var(--muted); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
    .side-actions, .actions { display: flex; gap: 12px; flex-wrap: wrap; }
    .form { display: grid; gap: 14px; }
    label { display: grid; gap: 8px; color: var(--muted); font-size: 0.92rem; }
    input, select { width: 100%; border: 1px solid var(--line); border-radius: 16px; padding: 13px 14px; font: inherit; color: var(--ink); background: #fffefb; }
    .hint { color: var(--muted); font-size: 0.82rem; }
    .field-error { color: var(--danger); font-size: 0.82rem; }
    .toggle { display: flex; align-items: center; gap: 12px; margin-top: 4px; }
    .toggle input { width: 18px; height: 18px; }
    .primary, .ghost { border: 0; border-radius: 999px; padding: 12px 18px; font: inherit; cursor: pointer; transition: transform 180ms ease, background 180ms ease; }
    .primary { background: var(--ink); color: white; box-shadow: var(--shadow); }
    .ghost { background: rgba(255, 255, 255, 0.7); color: var(--ink); border: 1px solid var(--line); }
    .link-button { text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
    .primary:hover, .ghost:hover { transform: translateY(-1px); }
    .message { margin: 0; padding: 12px 14px; border-radius: 14px; font-size: 0.92rem; }
    .success { background: var(--accent-soft); color: var(--accent); }
    .error { background: rgba(187, 62, 62, 0.1); color: var(--danger); }
    @media (max-width: 960px) { .detail-layout { grid-template-columns: 1fr; } }
  `]
})
export class UserDetailPageComponent {
  private readonly userService = inject(UserService);
  private readonly roleService = inject(RoleService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected editingId: number | null = null;
  protected saving = false;
  protected successMessage = '';
  protected errorMessage = '';
  protected loadedUser: User | null = null;
  protected roles: Role[] = [];
  protected serverFieldErrors: Partial<Record<keyof typeof this.form.controls, string>> = {};

  protected readonly form = this.fb.nonNullable.group({
    role_id: [0, [Validators.required, Validators.min(1)]],
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    active: [true]
  });

  constructor() {
    this.loadRoles();

    this.form.valueChanges.subscribe(() => {
      if (Object.keys(this.serverFieldErrors).length > 0) {
        this.serverFieldErrors = {};
      }
    });

    const id = this.route.snapshot.paramMap.get('id');
    const notice = this.route.snapshot.queryParamMap.get('notice');

    if (notice === 'created') {
      this.successMessage = 'Usuário criado com sucesso.';
    } else if (notice === 'updated') {
      this.successMessage = 'Usuário atualizado com sucesso.';
    }

    if (id) {
      this.editingId = Number(id);
      this.loadUser(this.editingId);
    } else {
      this.form.controls.password.addValidators([Validators.required, Validators.minLength(8)]);
      this.form.controls.password.updateValueAndValidity({ emitEvent: false });
    }
  }

  protected loadRoles(): void {
    this.roleService.list().subscribe({
      next: (roles) => {
        this.roles = roles;
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel carregar as roles.';
      }
    });
  }

  protected loadUser(id: number): void {
    this.userService.getById(id).subscribe({
      next: (user) => {
        this.loadedUser = user;
        this.form.patchValue({
          role_id: user.role_id ?? 0,
          name: user.name,
          email: user.email,
          password: '',
          active: user.active === 1
        });
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel carregar o usuario.';
      }
    });
  }

  protected saveUser(): void {
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
      ? this.userService.update(this.editingId, payload)
      : this.userService.create(payload);

    request$.subscribe({
      next: (user) => {
        this.saving = false;
        this.loadedUser = user;
        if (!this.editingId) {
          void this.router.navigate(['/users', user.id], {
            queryParams: { notice: 'created' }
          });
          return;
        }

        this.successMessage = 'Usuário atualizado com sucesso.';
        this.editingId = user.id;
        this.form.patchValue({ password: '' });
      },
      error: (error) => {
        this.saving = false;
        const apiErrors = Array.isArray(error?.error?.errors) ? error.error.errors : [];
        this.applyApiErrors(apiErrors);
        this.errorMessage = error?.error?.message || (apiErrors.length > 0 ? 'Verifique os campos destacados.' : 'Falha ao salvar usuario.');
      }
    });
  }

  protected softDelete(): void {
    if (!this.editingId) return;
    this.userService.softDelete(this.editingId).subscribe({
      next: () => {
        this.successMessage = 'Usuário desativado com sucesso.';
        if (this.loadedUser) this.loadedUser = { ...this.loadedUser, active: 0 };
        this.form.patchValue({ active: false });
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel desativar o usuario.';
      }
    });
  }

  protected activate(): void {
    if (!this.editingId) return;
    this.userService.activate(this.editingId).subscribe({
      next: () => {
        this.successMessage = 'Usuário ativado com sucesso.';
        if (this.loadedUser) this.loadedUser = { ...this.loadedUser, active: 1 };
        this.form.patchValue({ active: true });
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel ativar o usuario.';
      }
    });
  }

  protected resetForm(): void {
    this.serverFieldErrors = {};
    this.errorMessage = '';
    this.successMessage = '';
    if (this.loadedUser) {
      this.loadUser(this.loadedUser.id);
      return;
    }
    this.form.reset({
      role_id: 0,
      name: '',
      email: '',
      password: '',
      active: true
    });
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
    if (field.hasError('email')) {
      return 'Informe um e-mail valido.';
    }
    if (field.hasError('min')) {
      return 'Selecione uma role valida.';
    }
    if (field.hasError('minlength')) {
      return 'A senha deve ter pelo menos 8 caracteres.';
    }

    return 'Campo invalido.';
  }

  private applyApiErrors(errors: string[]): void {
    this.serverFieldErrors = {};

    errors.forEach((errorMessage) => {
      const normalizedError = errorMessage.toLowerCase();

      if (normalizedError.includes('name')) {
        this.serverFieldErrors.name = this.translateApiError(errorMessage);
        this.form.controls.name.markAsTouched();
      } else if (normalizedError.includes('email')) {
        this.serverFieldErrors.email = this.translateApiError(errorMessage);
        this.form.controls.email.markAsTouched();
      } else if (normalizedError.includes('password')) {
        this.serverFieldErrors.password = this.translateApiError(errorMessage);
        this.form.controls.password.markAsTouched();
      } else if (normalizedError.includes('role_id')) {
        this.serverFieldErrors.role_id = this.translateApiError(errorMessage);
        this.form.controls.role_id.markAsTouched();
      }
    });
  }

  private translateApiError(errorMessage: string): string {
    const normalizedError = errorMessage.toLowerCase();

    if (normalizedError === 'email already exists') {
      return 'Ja existe um usuário com esse e-mail.';
    }
    if (normalizedError === 'role_id is invalid') {
      return 'Selecione uma role valida.';
    }
    if (normalizedError.includes('must be valid')) {
      return 'Informe um valor valido.';
    }
    if (normalizedError.includes('at least 4 characters')) {
      return 'A senha deve ter pelo menos 8 caracteres.';
    }
    if (normalizedError.includes('is required')) {
      return 'Este campo e obrigatorio.';
    }

    return 'Campo invalido.';
  }
}
