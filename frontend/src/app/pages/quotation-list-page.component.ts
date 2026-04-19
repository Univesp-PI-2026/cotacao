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
    <section class="page">
      <header class="page-head">
        <div class="title-row">
          <span class="back-mark">←</span>
          <h2>Cotações</h2>
        </div>
        <a class="primary link-button" routerLink="/quotations/new">+ Nova Cotação</a>
      </header>

      <div class="toolbar">
        <label class="search-field">
          <span aria-hidden="true">⌕</span>
          <input [(ngModel)]="searchTerm" type="text" placeholder="Buscar cotação" />
        </label>

        <div class="toolbar-controls">
          <select [(ngModel)]="selectedCustomerId" (ngModelChange)="applyFilters()">
            <option [ngValue]="null">Todos os clientes</option>
            <option *ngFor="let customer of customers" [ngValue]="customer.id">{{ customer.name }}</option>
          </select>

          <div class="status-buttons">
            <button type="button" [class.active]="activeFilter === 'active'" (click)="setActiveFilter('active')">Ativas</button>
            <button type="button" [class.active]="activeFilter === 'all'" (click)="setActiveFilter('all')">Todas</button>
            <button type="button" [class.active]="activeFilter === 'inactive'" (click)="setActiveFilter('inactive')">Inativas</button>
          </div>
        </div>
      </div>

      <p class="message error" *ngIf="errorMessage">{{ errorMessage }}</p>
      <div class="loading" *ngIf="loading">Carregando cotações...</div>
      <div class="empty" *ngIf="!loading && filteredQuotations.length === 0">Nenhuma cotação encontrada.</div>

      <div class="cards" *ngIf="!loading && filteredQuotations.length > 0">
        <article class="quotation-card" *ngFor="let quotation of filteredQuotations">
          <div class="card-top">
            <div class="quotation-head">
              <span class="icon-mark">▣</span>
              <div>
                <div class="title-line">
                  <h3>{{ quotation.customer_name }}</h3>
                  <span class="tag" [class.renewal]="quotation.insurance_type === 1">
                    {{ quotation.insurance_type === 1 ? 'Renovação' : 'Novo Seguro' }}
                  </span>
                </div>
                <p>CPF: {{ getCustomerDocument(quotation.customer_id) }}</p>
              </div>
            </div>
          </div>

          <dl class="card-meta">
            <div>
              <dt>Placa</dt>
              <dd>{{ quotation.vehicle_plate }}</dd>
            </div>
            <div>
              <dt>Solicitação</dt>
              <dd>{{ quotation.request_date | date:'yyyy-MM-dd' }}</dd>
            </div>
            <div>
              <dt>Veículo</dt>
              <dd>{{ quotation.vehicle_brand }} {{ quotation.vehicle_model }}</dd>
            </div>
          </dl>

          <div class="card-actions">
            <a class="ghost link-button compact" [routerLink]="['/quotations', quotation.id]">✎ Editar</a>
            <button type="button" class="ghost compact danger" *ngIf="quotation.active === 1" (click)="softDelete(quotation.id)">■ Desativar</button>
            <button type="button" class="ghost compact accent" *ngIf="quotation.active === 0" (click)="activate(quotation.id)">↺ Ativar</button>
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
    .primary, .ghost, .status-buttons button {
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
    .ghost, .status-buttons button, select { background: #fff; color: #394058; border: 1px solid #d8dcec; }
    select { min-height: 28px; padding: 0 10px; font: inherit; font-size: 0.7rem; }
    .status-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
    .status-buttons button.active { background: #eef1ff; color: #4b57c5; border-color: #cfd6ff; }
    .cards { display: grid; gap: 10px; }
    .quotation-card {
      background: #fff;
      border: 1px solid #eceef6;
      border-radius: 6px;
      padding: 12px 14px;
      box-shadow: 0 2px 8px rgba(21, 28, 74, 0.04);
      display: grid;
      gap: 10px;
    }
    .quotation-head {
      display: grid;
      grid-template-columns: 28px auto;
      align-items: center;
      gap: 10px;
    }
    .icon-mark {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: grid;
      place-items: center;
      background: #ffe8f2;
      color: #e14e86;
      font-size: 0.8rem;
    }
    .title-line { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    h3 { margin: 0; font-size: 0.82rem; color: #2d334e; }
    .tag {
      background: #ebfff2;
      color: #2ea563;
      border-radius: 999px;
      padding: 2px 6px;
      font-size: 0.54rem;
      font-weight: 700;
    }
    .tag.renewal {
      background: #fff3dc;
      color: #d48b18;
    }
    .card-top p { margin: 3px 0 0; color: #8c92a8; font-size: 0.62rem; }
    .card-meta { display: flex; gap: 28px; flex-wrap: wrap; margin: 0; }
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
  protected searchTerm = '';

  protected get filteredQuotations(): Quotation[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      return this.quotations;
    }

    return this.quotations.filter((quotation) =>
      [
        quotation.customer_name,
        quotation.vehicle_plate,
        quotation.vehicle_brand,
        quotation.vehicle_model
      ]
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }

  constructor() {
    const customerId = this.route.snapshot.queryParamMap.get('customerId');
    this.selectedCustomerId = customerId ? Number(customerId) : null;
    this.loadCustomers();
    this.loadQuotations();
  }

  protected loadCustomers(): void {
    this.customerService.list('all').subscribe({
      next: (response) => {
        this.customers = response.data;
      }
    });
  }

  protected loadQuotations(): void {
    this.loading = true;
    this.errorMessage = '';
    this.quotationService.list({ active: this.activeFilter, customerId: this.selectedCustomerId }).subscribe({
      next: (response) => {
        this.quotations = response.data;
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

  protected getCustomerDocument(customerId: number): string {
    const customer = this.customers.find((item) => item.id === customerId);
    return customer ? (customer.is_foreign ? customer.rnm ?? '-' : customer.cpf ?? '-') : '-';
  }
}
