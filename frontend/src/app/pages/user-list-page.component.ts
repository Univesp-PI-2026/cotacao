import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Role } from '../role.model';
import { RoleService } from '../role.service';
import { User } from '../user.model';
import { UserService } from '../user.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="page">
      <header class="page-head">
        <div class="title-row">
          <span class="back-mark">←</span>
          <h2>Usuários</h2>
        </div>
        <a class="primary link-button" routerLink="/users/new">+ Novo Usuário</a>
      </header>

      <div class="toolbar">
        <label class="search-field">
          <span aria-hidden="true">⌕</span>
          <input [(ngModel)]="searchTerm" type="text" placeholder="Buscar usuário" />
        </label>

        <div class="toolbar-controls">
          <select [value]="selectedRoleId ?? ''" (change)="setRoleFilter($any($event.target).value)">
            <option value="">Todas as roles</option>
            <option *ngFor="let role of roles" [value]="role.id">{{ role.name }}</option>
          </select>

          <div class="filter-row">
            <button type="button" [class.active]="filter === 'active'" (click)="setFilter('active')">Ativos</button>
            <button type="button" [class.active]="filter === 'all'" (click)="setFilter('all')">Todos</button>
            <button type="button" [class.active]="filter === 'inactive'" (click)="setFilter('inactive')">Inativos</button>
          </div>
        </div>
      </div>

      <p class="message error" *ngIf="errorMessage">{{ errorMessage }}</p>
      <div class="loading" *ngIf="loading">Carregando usuários...</div>
      <div class="empty" *ngIf="!loading && filteredUsers.length === 0">Nenhum usuário encontrado.</div>

      <div class="cards" *ngIf="!loading && filteredUsers.length > 0">
        <article class="user-card" *ngFor="let user of filteredUsers">
          <div class="card-top">
            <div class="user-head">
              <span class="avatar">{{ getInitial(user.name) }}</span>
              <h3>{{ user.name }}</h3>
              <p>{{ user.email }}</p>
            </div>
          </div>

          <dl class="card-meta">
            <div>
              <dt>Usuário</dt>
              <dd>{{ user.username }}</dd>
            </div>
            <div>
              <dt>Perfil</dt>
              <dd>{{ user.role_name || 'Sem role' }}</dd>
            </div>
          </dl>

          <div class="card-actions">
            <a class="ghost link-button compact" [routerLink]="['/users', user.id]">✎ Editar</a>
            <button type="button" class="ghost compact danger" *ngIf="user.active === 1" (click)="softDelete(user.id)">■ Desativar</button>
            <button type="button" class="ghost compact accent" *ngIf="user.active === 0" (click)="activate(user.id)">↺ Ativar</button>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .page { display: grid; gap: 14px; }
    .page-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .title-row { display: flex; align-items: center; gap: 10px; }
    .back-mark { color: #33394f; font-size: 0.95rem; }
    h2 { margin: 0; font-size: 1rem; color: #2d324d; }
    .toolbar { display: grid; gap: 12px; }
    .toolbar-controls { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .search-field {
      width: min(100%, 190px);
      min-height: 34px;
      padding: 0 10px;
      border: 1px solid #cfd5e6;
      background: #fff;
      display: grid;
      grid-template-columns: 14px 1fr;
      align-items: center;
      gap: 8px;
      color: #8a90a8;
    }
    .search-field input {
      border: 0;
      outline: none;
      background: transparent;
      font: inherit;
      color: #2f3650;
      min-width: 0;
    }
    .primary, .ghost, .filter-row button {
      border: 0;
      border-radius: 3px;
      min-height: 28px;
      padding: 0 12px;
      font: inherit;
      font-size: 0.66rem;
      font-weight: 700;
      cursor: pointer;
      text-transform: uppercase;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .primary { background: #4b57c5; color: white; text-decoration: none; }
    .ghost, .filter-row button, select { background: #fff; border: 1px solid #d8dcec; color: #394058; }
    select { min-height: 28px; padding: 0 10px; font: inherit; font-size: 0.7rem; }
    .filter-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-row button.active { background: #eef1ff; color: #4b57c5; border-color: #cfd6ff; }
    .cards { display: grid; gap: 10px; }
    .user-card {
      background: #fff;
      border: 1px solid #eceef6;
      border-radius: 6px;
      padding: 12px 14px;
      box-shadow: 0 2px 8px rgba(21, 28, 74, 0.04);
      display: grid;
      gap: 10px;
    }
    .user-head {
      display: grid;
      grid-template-columns: 28px auto;
      align-items: center;
      gap: 10px;
    }
    .avatar {
      width: 28px;
      height: 28px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      background: #1da39b;
      color: #fff;
      font-size: 0.72rem;
      font-weight: 700;
      grid-row: span 2;
    }
    h3 { margin: 0; font-size: 0.82rem; color: #2d334e; }
    .card-top p { margin: 2px 0 0; color: #8c92a8; font-size: 0.65rem; }
    .card-meta { display: flex; gap: 32px; flex-wrap: wrap; margin: 0; }
    dt { font-size: 0.54rem; text-transform: uppercase; color: #9aa0b5; margin-bottom: 2px; }
    dd { margin: 0; font-size: 0.64rem; color: #4a5066; }
    .card-actions { display: flex; gap: 6px; flex-wrap: wrap; }
    .link-button { text-decoration: none; }
    .compact { min-height: 24px; padding: 0 10px; font-size: 0.58rem; }
    .accent { color: #4b57c5; }
    .danger { color: #e05858; }
    .loading, .empty { color: var(--muted); padding: 12px 0; }
    .message.error { margin: 0; padding: 10px 12px; border-radius: 8px; font-size: 0.82rem; background: rgba(187, 62, 62, 0.1); color: var(--danger); }
    @media (max-width: 720px) {
      .page-head { align-items: start; flex-direction: column; }
      .search-field { width: 100%; }
    }
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
  protected searchTerm = '';

  protected get filteredUsers(): User[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      return this.users;
    }

    return this.users.filter((user) =>
      [user.name, user.username, user.email, user.role_name ?? '']
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }

  constructor() {
    this.loadRoles();
    this.loadUsers();
  }

  protected loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';
    this.userService.list({ active: this.filter, roleId: this.selectedRoleId }).subscribe({
      next: (response) => {
        this.users = response.data;
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

  protected getInitial(name: string): string {
    return name.trim().charAt(0).toUpperCase() || '?';
  }
}
