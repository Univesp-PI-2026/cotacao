import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Role } from '../role.model';
import { RoleService } from '../role.service';
import { User } from '../user.model';
import { UserService } from '../user.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>Lista de usuários</h2>
          <p>Cadastre pessoas de operação, vincule roles e acompanhe o status de acesso.</p>
        </div>
        <div class="head-actions">
          <button class="primary" type="button" (click)="loadUsers()">Atualizar</button>
          <a class="ghost link-button" routerLink="/users/new">Novo usuário</a>
        </div>
      </div>

      <div class="filter-row">
        <button type="button" [class.active]="filter === 'active'" (click)="setFilter('active')">Ativos</button>
        <button type="button" [class.active]="filter === 'all'" (click)="setFilter('all')">Todos</button>
        <button type="button" [class.active]="filter === 'inactive'" (click)="setFilter('inactive')">Inativos</button>

        <select [value]="selectedRoleId ?? ''" (change)="setRoleFilter($any($event.target).value)">
          <option value="">Todas as roles</option>
          <option *ngFor="let role of roles" [value]="role.id">{{ role.name }}</option>
        </select>
      </div>

      <p class="message error" *ngIf="errorMessage">{{ errorMessage }}</p>
      <div class="loading" *ngIf="loading">Carregando usuários...</div>
      <div class="empty" *ngIf="!loading && users.length === 0">Nenhum usuário encontrado.</div>

      <div class="cards" *ngIf="!loading && users.length > 0">
        <article class="user-card" *ngFor="let user of users">
          <div class="card-top">
            <div>
              <h3>{{ user.name }}</h3>
              <p>{{ user.email }}</p>
            </div>
            <span class="badge" [class.inactive]="user.active === 0">
              {{ user.active === 1 ? 'Ativo' : 'Inativo' }}
            </span>
          </div>

          <dl>
            <div>
              <dt>Role</dt>
              <dd>{{ user.role_name || 'Sem role' }}</dd>
            </div>
            <div>
              <dt>Criado em</dt>
              <dd>{{ user.created_at | date:'dd/MM/yyyy HH:mm' }}</dd>
            </div>
          </dl>

          <div class="card-actions">
            <a class="ghost link-button" [routerLink]="['/users', user.id]">Ver detalhe</a>
            <button type="button" class="ghost" *ngIf="user.active === 1" (click)="softDelete(user.id)">Desativar</button>
            <button type="button" class="ghost" *ngIf="user.active === 0" (click)="activate(user.id)">Ativar</button>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .panel { background: var(--surface-panel); border: 1px solid var(--line-strong); border-radius: 28px; padding: 24px; box-shadow: var(--shadow); backdrop-filter: blur(10px); }
    .panel-head { display: flex; justify-content: space-between; align-items: end; gap: 16px; margin-bottom: 20px; }
    .head-actions { display: flex; gap: 12px; flex-wrap: wrap; }
    h2 { margin: 0; font-size: 1.35rem; }
    .panel-head p { color: var(--muted); margin: 8px 0 0; }
    .primary, .ghost, .filter-row button { border: 0; border-radius: 999px; padding: 12px 18px; font: inherit; cursor: pointer; transition: transform 180ms ease, background 180ms ease; }
    .primary { background: var(--ink); color: white; box-shadow: var(--shadow); }
    .ghost, .filter-row button, .filter-row select { background: var(--surface-soft); color: var(--ink); border: 1px solid var(--line); }
    .filter-row select { border-radius: 999px; padding: 12px 18px; font: inherit; }
    .link-button { text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
    .primary:hover, .ghost:hover, .filter-row button:hover { transform: translateY(-1px); }
    .filter-row { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
    .filter-row button.active { background: var(--accent-soft); color: var(--accent); border-color: var(--accent-line); }
    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
    .user-card { background: var(--surface-base); border: 1px solid var(--line-soft); border-radius: 22px; padding: 18px; }
    .card-top { display: flex; justify-content: space-between; gap: 12px; align-items: start; margin-bottom: 16px; }
    h3 { margin: 0; font-size: 1.08rem; }
    .card-top p { margin: 6px 0 0; color: var(--muted); font-size: 0.92rem; }
    .badge { background: var(--accent-soft); color: var(--accent); border-radius: 999px; padding: 6px 10px; font-size: 0.78rem; font-weight: 700; white-space: nowrap; }
    .badge.inactive { background: rgba(187, 62, 62, 0.1); color: var(--danger); }
    dl { display: grid; gap: 12px; margin: 0 0 16px; }
    dt { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 4px; }
    dd { margin: 0; font-size: 0.94rem; }
    .card-actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .loading, .empty { color: var(--muted); padding: 12px 0; }
    .message.error { margin: 0 0 16px; padding: 12px 14px; border-radius: 14px; font-size: 0.92rem; background: rgba(187, 62, 62, 0.1); color: var(--danger); }
    @media (max-width: 960px) { .panel-head { align-items: start; flex-direction: column; } }
  `]
})
export class UserListPageComponent {
  private readonly userService = inject(UserService);
  private readonly roleService = inject(RoleService);
  protected users: User[] = [];
  protected roles: Role[] = [];
  protected loading = false;
  protected filter: 'active' | 'inactive' | 'all' = 'active';
  protected selectedRoleId: number | null = null;
  protected errorMessage = '';

  constructor() {
    this.loadRoles();
    this.loadUsers();
  }

  protected loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';
    this.userService.list({ active: this.filter, roleId: this.selectedRoleId }).subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel carregar os usuarios.';
        this.loading = false;
      }
    });
  }

  protected loadRoles(): void {
    this.roleService.list().subscribe({
      next: (roles) => {
        this.roles = roles;
      }
    });
  }

  protected setFilter(filter: 'active' | 'inactive' | 'all'): void {
    this.filter = filter;
    this.loadUsers();
  }

  protected setRoleFilter(roleId: string): void {
    this.selectedRoleId = roleId ? Number(roleId) : null;
    this.loadUsers();
  }

  protected softDelete(id: number): void {
    this.userService.softDelete(id).subscribe({
      next: () => this.loadUsers(),
      error: () => {
        this.errorMessage = 'Nao foi possivel desativar o usuario.';
      }
    });
  }

  protected activate(id: number): void {
    this.userService.activate(id).subscribe({
      next: () => this.loadUsers(),
      error: () => {
        this.errorMessage = 'Nao foi possivel ativar o usuario.';
      }
    });
  }
}
