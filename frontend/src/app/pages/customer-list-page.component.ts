import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Customer } from '../customer.model';
import { CustomerService } from '../customer.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>Lista de clientes</h2>
          <p>Visualize, filtre e acesse o detalhe de cada cliente.</p>
        </div>
        <div class="panel-actions">
          <a class="primary link-button" routerLink="/customers/new">Novo cliente</a>
          <button class="ghost" type="button" (click)="loadCustomers()">Atualizar</button>
        </div>
      </div>

      <div class="filter-row">
        <button type="button" [class.active]="filter === 'active'" (click)="setFilter('active')">Ativos</button>
        <button type="button" [class.active]="filter === 'all'" (click)="setFilter('all')">Todos</button>
        <button type="button" [class.active]="filter === 'inactive'" (click)="setFilter('inactive')">Inativos</button>
      </div>

      <p class="message error" *ngIf="errorMessage">{{ errorMessage }}</p>
      <div class="loading" *ngIf="loading">Carregando clientes...</div>
      <div class="empty" *ngIf="!loading && customers.length === 0">Nenhum cliente encontrado.</div>

      <div class="cards" *ngIf="!loading && customers.length > 0">
        <article class="customer-card" *ngFor="let customer of customers">
          <div class="card-top">
            <div>
              <h3>{{ customer.name }}</h3>
              <p>{{ customer.email }}</p>
            </div>
            <span class="badge" [class.inactive]="customer.active === 0">
              {{ customer.active === 1 ? 'Ativo' : 'Inativo' }}
            </span>
          </div>

          <dl>
            <div>
              <dt>Documento</dt>
              <dd>{{ customer.is_foreign ? customer.rnm : customer.cpf }}</dd>
            </div>
            <div>
              <dt>Cidade</dt>
              <dd>{{ customer.city }}/{{ customer.state }}</dd>
            </div>
            <div>
              <dt>Endereco</dt>
              <dd>{{ customer.street }}, {{ customer.number }}</dd>
            </div>
          </dl>

          <div class="card-actions">
            <a class="ghost link-button" [routerLink]="['/customers', customer.id]">Ver detalhe</a>
            <a class="ghost link-button" [routerLink]="['/quotations/new']" [queryParams]="{ customerId: customer.id }">Nova cotação</a>
            <a class="ghost link-button" [routerLink]="['/quotations']" [queryParams]="{ customerId: customer.id }">Ver cotações</a>
            <button type="button" class="ghost" *ngIf="customer.active === 1" (click)="softDelete(customer.id)">Desativar</button>
            <button type="button" class="ghost" *ngIf="customer.active === 0" (click)="activate(customer.id)">Ativar</button>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .panel { background: var(--surface-panel); border: 1px solid var(--line-strong); border-radius: 28px; padding: 24px; box-shadow: var(--shadow); backdrop-filter: blur(10px); }
    .panel-head { display: flex; justify-content: space-between; align-items: end; gap: 16px; margin-bottom: 20px; }
    h2 { margin: 0; font-size: 1.35rem; }
    .panel-head p { color: var(--muted); margin: 8px 0 0; }
    .panel-actions { display: flex; gap: 12px; flex-wrap: wrap; }
    .primary, .ghost, .filter-row button { border: 0; border-radius: 999px; padding: 12px 18px; font: inherit; cursor: pointer; transition: transform 180ms ease, background 180ms ease; }
    .primary { background: var(--ink); color: white; box-shadow: var(--shadow); }
    .ghost, .filter-row button { background: var(--surface-soft); color: var(--ink); border: 1px solid var(--line); }
    .link-button { text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
    .primary:hover, .ghost:hover, .filter-row button:hover { transform: translateY(-1px); }
    .filter-row { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
    .filter-row button.active { background: var(--accent-soft); color: var(--accent); border-color: var(--accent-line); }
    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
    .customer-card { background: var(--surface-base); border: 1px solid var(--line-soft); border-radius: 22px; padding: 18px; }
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
export class CustomerListPageComponent {
  private readonly customerService = inject(CustomerService);
  protected customers: Customer[] = [];
  protected loading = false;
  protected filter: 'active' | 'inactive' | 'all' = 'active';
  protected errorMessage = '';

  constructor() {
    this.loadCustomers();
  }

  protected loadCustomers(): void {
    this.loading = true;
    this.errorMessage = '';
    this.customerService.list(this.filter).subscribe({
      next: (customers) => {
        this.customers = customers;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel carregar os clientes.';
        this.loading = false;
      }
    });
  }

  protected setFilter(filter: 'active' | 'inactive' | 'all'): void {
    this.filter = filter;
    this.loadCustomers();
  }

  protected softDelete(id: number): void {
    this.customerService.softDelete(id).subscribe({
      next: () => this.loadCustomers(),
      error: () => {
        this.errorMessage = 'Nao foi possivel desativar o cliente.';
      }
    });
  }

  protected activate(id: number): void {
    this.customerService.activate(id).subscribe({
      next: () => this.loadCustomers(),
      error: () => {
        this.errorMessage = 'Nao foi possivel ativar o cliente.';
      }
    });
  }
}
