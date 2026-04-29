import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Customer } from '../customer.model';
import { CustomerService } from '../customer.service';
import { Quotation } from '../quotation.model';
import { QuotationService } from '../quotation.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>Lista de cotações</h2>
          <p>Filtre por cliente e acompanhe as cotações geradas a partir do cadastro.</p>
        </div>
        <a class="primary link-button" routerLink="/quotations/new">Nova cotação</a>
      </div>

      <div class="filters">
        <label>
          <span>Cliente</span>
          <select [(ngModel)]="selectedCustomerId" (ngModelChange)="applyFilters()">
            <option [ngValue]="null">Todos os clientes</option>
            <option *ngFor="let customer of customers" [ngValue]="customer.id">{{ customer.name }}</option>
          </select>
        </label>

        <div class="status-buttons">
          <button type="button" [class.active]="activeFilter === 'active'" (click)="setActiveFilter('active')">Ativas</button>
          <button type="button" [class.active]="activeFilter === 'all'" (click)="setActiveFilter('all')">Todas</button>
          <button type="button" [class.active]="activeFilter === 'inactive'" (click)="setActiveFilter('inactive')">Inativas</button>
        </div>
      </div>

      <p class="message error" *ngIf="errorMessage">{{ errorMessage }}</p>
      <div class="loading" *ngIf="loading">Carregando cotações...</div>
      <div class="empty" *ngIf="!loading && quotations.length === 0">Nenhuma cotação encontrada.</div>

      <div class="cards" *ngIf="!loading && quotations.length > 0">
        <article class="quotation-card" *ngFor="let quotation of quotations">
          <div class="card-top">
            <div>
              <h3>{{ quotation.customer_name }}</h3>
              <p>{{ quotation.vehicle_brand }} {{ quotation.vehicle_model }}</p>
            </div>
            <span class="badge" [class.inactive]="quotation.active === 0">
              {{ quotation.active === 1 ? 'Ativa' : 'Inativa' }}
            </span>
          </div>

          <dl>
            <div>
              <dt>Solicitação</dt>
              <dd>{{ quotation.request_date | date:'dd/MM/yyyy' }}</dd>
            </div>
            <div>
              <dt>Tipo</dt>
              <dd>{{ quotation.insurance_type === 1 ? 'Renovação' : 'Novo seguro' }}</dd>
            </div>
            <div>
              <dt>Placa</dt>
              <dd>{{ quotation.vehicle_plate }}</dd>
            </div>
          </dl>

          <div class="card-actions">
            <a class="ghost link-button" [routerLink]="['/quotations', quotation.id]">Ver detalhe</a>
            <button type="button" class="ghost" *ngIf="quotation.active === 1" (click)="softDelete(quotation.id)">Desativar</button>
            <button type="button" class="ghost" *ngIf="quotation.active === 0" (click)="activate(quotation.id)">Ativar</button>
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
    .primary, .ghost, .status-buttons button { border: 0; border-radius: 999px; padding: 12px 18px; font: inherit; cursor: pointer; transition: transform 180ms ease, background 180ms ease; }
    .primary { background: var(--ink); color: white; box-shadow: var(--shadow); }
    .ghost, .status-buttons button, select { background: var(--surface-soft); color: var(--ink); border: 1px solid var(--line); }
    .link-button { text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
    .filters { display: grid; grid-template-columns: minmax(220px, 320px) 1fr; gap: 16px; margin-bottom: 20px; }
    label { display: grid; gap: 8px; color: var(--muted); font-size: 0.92rem; }
    select { width: 100%; border-radius: 16px; padding: 13px 14px; font: inherit; }
    .status-buttons { display: flex; gap: 10px; flex-wrap: wrap; align-items: end; }
    .status-buttons button.active { background: var(--accent-soft); color: var(--accent); border-color: var(--accent-line); }
    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .quotation-card { background: var(--surface-base); border: 1px solid var(--line-soft); border-radius: 22px; padding: 18px; }
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
    @media (max-width: 960px) { .panel-head, .filters { grid-template-columns: 1fr; display: grid; } }
  `]
})
export class QuotationListPageComponent {
  private readonly quotationService = inject(QuotationService);
  private readonly customerService = inject(CustomerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected quotations: Quotation[] = [];
  protected customers: Customer[] = [];
  protected loading = false;
  protected errorMessage = '';
  protected activeFilter: 'active' | 'inactive' | 'all' = 'active';
  protected selectedCustomerId: number | null = null;

  constructor() {
    const customerId = this.route.snapshot.queryParamMap.get('customerId');
    this.selectedCustomerId = customerId ? Number(customerId) : null;
    this.loadCustomers();
    this.loadQuotations();
  }

  protected loadCustomers(): void {
    this.customerService.list('all').subscribe({
      next: (customers) => {
        this.customers = customers;
      }
    });
  }

  protected loadQuotations(): void {
    this.loading = true;
    this.errorMessage = '';
    this.quotationService.list({ active: this.activeFilter, customerId: this.selectedCustomerId }).subscribe({
      next: (quotations) => {
        this.quotations = quotations;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel carregar as cotacoes.';
        this.loading = false;
      }
    });
  }

  protected setActiveFilter(filter: 'active' | 'inactive' | 'all'): void {
    this.activeFilter = filter;
    this.applyFilters();
  }

  protected applyFilters(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { customerId: this.selectedCustomerId || null },
      queryParamsHandling: 'merge'
    });
    this.loadQuotations();
  }

  protected softDelete(id: number): void {
    this.quotationService.softDelete(id).subscribe({
      next: () => this.loadQuotations(),
      error: () => {
        this.errorMessage = 'Nao foi possivel desativar a cotacao.';
      }
    });
  }

  protected activate(id: number): void {
    this.quotationService.activate(id).subscribe({
      next: () => this.loadQuotations(),
      error: () => {
        this.errorMessage = 'Nao foi possivel ativar a cotacao.';
      }
    });
  }
}
