import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Role } from '../role.model';
import { RoleService } from '../role.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>Lista de roles</h2>
          <p>Gerencie os perfis do sistema e acompanhe quantos usuários usam cada um.</p>
        </div>
        <div class="head-actions">
          <button class="primary" type="button" (click)="loadRoles()">Atualizar</button>
          <a class="ghost link-button" routerLink="/roles/new">Nova role</a>
        </div>
      </div>

      <p class="message success" *ngIf="successMessage">{{ successMessage }}</p>
      <p class="message error" *ngIf="errorMessage">{{ errorMessage }}</p>
      <div class="loading" *ngIf="loading">Carregando roles...</div>
      <div class="empty" *ngIf="!loading && roles.length === 0">Nenhuma role encontrada.</div>

      <div class="cards" *ngIf="!loading && roles.length > 0">
        <article class="role-card" *ngFor="let role of roles">
          <div class="card-top">
            <div>
              <h3>{{ role.name }}</h3>
              <p>{{ role.users_count }} usuário(s) vinculado(s)</p>
            </div>
            <span class="badge" [class.inactive]="role.active === 0">{{ role.active === 1 ? 'Ativa' : 'Inativa' }}</span>
          </div>

          <dl>
            <div>
              <dt>Criada em</dt>
              <dd>{{ role.created_at | date:'dd/MM/yyyy HH:mm' }}</dd>
            </div>
            <div>
              <dt>Atualizada em</dt>
              <dd>{{ role.updated_at | date:'dd/MM/yyyy HH:mm' }}</dd>
            </div>
          </dl>

          <div class="card-actions">
            <a class="ghost link-button" [routerLink]="['/roles', role.id]">Ver detalhe</a>
            <button type="button" class="ghost danger" *ngIf="role.active === 1" (click)="deactivateRole(role.id)">Desativar</button>
            <button type="button" class="ghost" *ngIf="role.active === 0" (click)="activateRole(role.id)">Ativar</button>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .panel { background: color-mix(in srgb, var(--paper) 90%, white 10%); border: 1px solid rgba(215, 209, 194, 0.75); border-radius: 28px; padding: 24px; box-shadow: var(--shadow); backdrop-filter: blur(10px); }
    .panel-head { display: flex; justify-content: space-between; align-items: end; gap: 16px; margin-bottom: 20px; }
    .head-actions { display: flex; gap: 12px; flex-wrap: wrap; }
    h2 { margin: 0; font-size: 1.35rem; }
    .panel-head p { color: var(--muted); margin: 8px 0 0; }
    .primary, .ghost { border: 0; border-radius: 999px; padding: 12px 18px; font: inherit; cursor: pointer; transition: transform 180ms ease, background 180ms ease; }
    .primary { background: var(--ink); color: white; box-shadow: var(--shadow); }
    .ghost { background: rgba(255, 255, 255, 0.7); color: var(--ink); border: 1px solid var(--line); }
    .ghost.danger { color: var(--danger); }
    .link-button { text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
    .primary:hover, .ghost:hover { transform: translateY(-1px); }
    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
    .role-card { background: #fffefb; border: 1px solid rgba(215, 209, 194, 0.7); border-radius: 22px; padding: 18px; }
    .card-top { display: flex; justify-content: space-between; gap: 12px; align-items: start; margin-bottom: 16px; }
    h3 { margin: 0; font-size: 1.08rem; text-transform: capitalize; }
    .card-top p { margin: 6px 0 0; color: var(--muted); font-size: 0.92rem; }
    .badge { background: var(--accent-soft); color: var(--accent); border-radius: 999px; padding: 6px 10px; font-size: 0.78rem; font-weight: 700; white-space: nowrap; }
    .badge.inactive { background: rgba(187, 62, 62, 0.1); color: var(--danger); }
    dl { display: grid; gap: 12px; margin: 0 0 16px; }
    dt { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 4px; }
    dd { margin: 0; font-size: 0.94rem; }
    .card-actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .loading, .empty { color: var(--muted); padding: 12px 0; }
    .message { margin: 0 0 16px; padding: 12px 14px; border-radius: 14px; font-size: 0.92rem; }
    .message.success { background: var(--accent-soft); color: var(--accent); }
    .message.error { background: rgba(187, 62, 62, 0.1); color: var(--danger); }
    @media (max-width: 960px) { .panel-head { align-items: start; flex-direction: column; } }
  `]
})
export class RoleListPageComponent {
  private readonly roleService = inject(RoleService);
  protected roles: Role[] = [];
  protected loading = false;
  protected errorMessage = '';
  protected successMessage = '';

  constructor() {
    this.loadRoles();
  }

  protected loadRoles(): void {
    this.loading = true;
    this.errorMessage = '';
    this.roleService.list().subscribe({
      next: (roles) => {
        this.roles = roles;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel carregar as roles.';
        this.loading = false;
      }
    });
  }

  protected deactivateRole(id: number): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.roleService.softDelete(id).subscribe({
      next: () => {
        this.successMessage = 'Role desativada com sucesso.';
        this.loadRoles();
      },
      error: (error) => {
        const apiErrors = error?.error?.errors;
        this.errorMessage = Array.isArray(apiErrors) ? apiErrors.join(', ') : 'Nao foi possivel desativar a role.';
      }
    });
  }

  protected activateRole(id: number): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.roleService.activate(id).subscribe({
      next: () => {
        this.successMessage = 'Role ativada com sucesso.';
        this.loadRoles();
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel ativar a role.';
      }
    });
  }
}
