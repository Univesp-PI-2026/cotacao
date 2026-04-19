import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Customer } from '../customer.model';
import { CustomerService } from '../customer.service';
import { QuotationFormValue } from '../quotation-form.value';
import { Quotation } from '../quotation.model';
import { QuotationService } from '../quotation.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="quotation-page">
      <header class="page-head">
        <h2>{{ editingId ? 'Editar Cotação' : 'Nova Cotação' }}</h2>
      </header>

      <article class="customer-panel" *ngIf="selectedCustomer">
        <div class="panel-heading">
          <strong>Cliente</strong>
        </div>
        <div class="customer-grid">
          <div><span class="caption">Nome</span><strong>{{ selectedCustomer.name }}</strong></div>
          <div><span class="caption">CPF</span><strong>{{ selectedCustomer.is_foreign ? selectedCustomer.rnm : selectedCustomer.cpf }}</strong></div>
          <div><span class="caption">E-mail</span><strong>{{ selectedCustomer.email }}</strong></div>
        </div>
      </article>

      <form [formGroup]="form" (ngSubmit)="saveQuotation()" class="quotation-grid">
        <article class="form-card">
          <div class="panel-heading">
            <strong>Informações do Seguro</strong>
          </div>

          <label>
            <span>Cliente*</span>
            <select formControlName="customer_id">
              <option [ngValue]="null">Selecione um cliente</option>
              <option *ngFor="let customer of customers" [ngValue]="customer.id">{{ customer.name }}</option>
            </select>
          </label>

          <label>
            <span>Data da Solicitação*</span>
            <input formControlName="request_date" type="date" />
          </label>

          <label>
            <span>Tipo de Seguro*</span>
            <select formControlName="insurance_type">
              <option [ngValue]="0">Novo Seguro</option>
              <option [ngValue]="1">Renovação</option>
            </select>
          </label>

          <label *ngIf="form.value.insurance_type === 1">
            <span>Classe de Bônus</span>
            <input formControlName="bonus_class" type="text" />
          </label>
        </article>

        <article class="form-card">
          <div class="panel-heading">
            <strong>Veículo</strong>
          </div>

          <div class="grid two">
            <label><span>Placa*</span><input formControlName="vehicle_plate" type="text" /></label>
            <label><span>Chassi*</span><input formControlName="vehicle_chassis" type="text" /></label>
          </div>

          <div class="grid two">
            <label><span>Marca*</span><input formControlName="vehicle_brand" type="text" /></label>
            <label><span>Modelo*</span><input formControlName="vehicle_model" type="text" /></label>
          </div>

          <div class="grid two">
            <label><span>Ano de Fabricação*</span><input formControlName="manufacture_year" type="number" /></label>
            <label><span>CEP de Pernoite*</span><input formControlName="overnight_zipcode" type="text" /></label>
          </div>
        </article>

        <article class="form-card">
          <div class="panel-heading">
            <strong>Condutor</strong>
          </div>

          <label><span>Idade do Condutor*</span><input formControlName="driver_age" type="number" /></label>

          <label><span>Tempo de Habilitação*</span><input formControlName="license_time" type="text" /></label>

          <label>
            <span>Tem seguradora preferida?*</span>
            <select formControlName="has_insurer_preference">
              <option [ngValue]="false">Não</option>
              <option [ngValue]="true">Sim</option>
            </select>
          </label>

          <label *ngIf="form.value.has_insurer_preference">
            <span>Qual seguradora?</span>
            <input formControlName="preferred_insurer" type="text" />
          </label>

          <label>
            <span>Coberturas desejadas</span>
            <textarea formControlName="coverages" rows="4"></textarea>
          </label>
        </article>

        <div class="form-footer">
          <div class="status-actions">
            <a class="ghost link-button" routerLink="/quotations">Cancelar</a>
            <button type="button" class="ghost" *ngIf="editingId && loadedQuotation?.active === 1" (click)="softDelete()">Desativar</button>
            <button type="button" class="ghost" *ngIf="editingId && loadedQuotation?.active === 0" (click)="activate()">Ativar</button>
            <label class="toggle"><input formControlName="active" type="checkbox" /><span>Ativa</span></label>
          </div>

          <div class="submit-actions">
            <button class="ghost" type="button" (click)="resetForm()">Cancelar</button>
            <button class="primary" type="submit" [disabled]="saving">
              {{ saving ? 'Salvando...' : 'Salvar Cotação' }}
            </button>
          </div>
        </div>

        <p class="message success" *ngIf="successMessage">{{ successMessage }}</p>
        <p class="message error" *ngIf="errorMessage">{{ errorMessage }}</p>
      </form>
    </section>
  `,
  styles: [`
    .quotation-page { display: grid; gap: 14px; }
    .page-head h2 { margin: 0; font-size: 1rem; color: #2d324d; }
    .customer-panel,
    .form-card {
      background: #fff;
      border: 1px solid #e7eaf4;
      border-radius: 6px;
      padding: 12px;
      box-shadow: 0 2px 8px rgba(21, 28, 74, 0.04);
    }
    .panel-heading {
      color: #4b57c5;
      font-size: 0.72rem;
      font-weight: 700;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .customer-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }
    .caption {
      display: block;
      font-size: 0.56rem;
      text-transform: uppercase;
      color: #98a0b8;
      margin-bottom: 4px;
    }
    .quotation-grid {
      display: grid;
      grid-template-columns: 1.15fr 1fr 0.95fr;
      gap: 14px;
      align-items: start;
    }
    .form-card { display: grid; gap: 10px; }
    .grid { display: grid; gap: 10px; }
    .two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    label { display: grid; gap: 6px; color: #626982; font-size: 0.68rem; }
    input, select, textarea {
      width: 100%;
      min-height: 36px;
      border: 1px solid #d8dcec;
      border-radius: 3px;
      padding: 0 10px;
      font: inherit;
      color: #2f3650;
      background: #fff;
    }
    textarea { padding: 10px; resize: vertical; min-height: 92px; }
    .form-footer {
      grid-column: 1 / -1;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    .status-actions,
    .submit-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .toggle { display: inline-flex; align-items: center; gap: 8px; color: #565d76; }
    .toggle input { width: 16px; height: 16px; }
    .primary, .ghost {
      border: 0;
      border-radius: 3px;
      min-height: 30px;
      padding: 0 12px;
      font: inherit;
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .primary { background: #4b57c5; color: white; }
    .ghost { background: #fff; color: #3f455e; border: 1px solid #d8dcec; text-decoration: none; }
    .message { grid-column: 1 / -1; margin: 0; padding: 10px 12px; border-radius: 8px; font-size: 0.82rem; }
    .success { background: #ecfff4; color: #1f8a56; }
    .error { background: rgba(187, 62, 62, 0.1); color: #c44646; }
    @media (max-width: 1024px) {
      .quotation-grid { grid-template-columns: 1fr; }
      .customer-grid, .two { grid-template-columns: 1fr; }
      .form-footer { align-items: start; flex-direction: column; }
    }
  `]
})
export class QuotationDetailPageComponent {
  private readonly quotationService = inject(QuotationService);
  private readonly customerService = inject(CustomerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected customers: Customer[] = [];
  protected selectedCustomer: Customer | null = null;
  protected loadedQuotation: Quotation | null = null;
  protected editingId: number | null = null;
  protected saving = false;
  protected successMessage = '';
  protected errorMessage = '';

  protected readonly form = this.fb.group({
    customer_id: [null as number | null, [Validators.required]],
    request_date: ['', [Validators.required]],
    insurance_type: [0],
    bonus_class: [''],
    has_claims: [false],
    vehicle_plate: ['', [Validators.required]],
    vehicle_chassis: ['', [Validators.required]],
    vehicle_brand: ['', [Validators.required]],
    vehicle_model: ['', [Validators.required]],
    manufacture_year: [null as number | null, [Validators.required]],
    overnight_zipcode: ['', [Validators.required]],
    driver_age: [null as number | null, [Validators.required]],
    license_time: ['', [Validators.required]],
    coverages: [''],
    has_insurer_preference: [false],
    preferred_insurer: [''],
    active: [true]
  });

  constructor() {
    this.customerService.list('all').subscribe({
      next: (response) => {
        this.customers = response.data;
        this.syncSelectedCustomer();
      }
    });

    this.form.controls.customer_id.valueChanges.subscribe(() => this.syncSelectedCustomer());

    const quotationId = this.route.snapshot.paramMap.get('id');
    const customerId = this.route.snapshot.queryParamMap.get('customerId');

    if (customerId) {
      this.form.patchValue({ customer_id: Number(customerId) });
    }

    if (quotationId) {
      this.editingId = Number(quotationId);
      this.loadQuotation(this.editingId);
    }
  }

  protected loadQuotation(id: number): void {
    this.quotationService.getById(id).subscribe({
      next: (quotation) => {
        this.loadedQuotation = quotation;
        this.form.patchValue({
          customer_id: quotation.customer_id,
          request_date: quotation.request_date.slice(0, 10),
          insurance_type: quotation.insurance_type,
          bonus_class: quotation.bonus_class ?? '',
          has_claims: quotation.has_claims === 1,
          vehicle_plate: quotation.vehicle_plate,
          vehicle_chassis: quotation.vehicle_chassis,
          vehicle_brand: quotation.vehicle_brand,
          vehicle_model: quotation.vehicle_model,
          manufacture_year: quotation.manufacture_year,
          overnight_zipcode: quotation.overnight_zipcode,
          driver_age: quotation.driver_age,
          license_time: quotation.license_time,
          coverages: Array.isArray(quotation.coverages) ? quotation.coverages.join(', ') : (quotation.coverages ?? ''),
          has_insurer_preference: quotation.has_insurer_preference === 1,
          preferred_insurer: quotation.preferred_insurer ?? '',
          active: quotation.active === 1
        });
        this.syncSelectedCustomer();
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel carregar a cotacao.';
      }
    });
  }

  protected saveQuotation(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Preencha os campos obrigatorios da cotação.';
      this.successMessage = '';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const rawValue = this.form.getRawValue();
    const payload: QuotationFormValue = {
      customer_id: Number(rawValue.customer_id),
      request_date: rawValue.request_date ?? '',
      insurance_type: Number(rawValue.insurance_type ?? 0),
      bonus_class: rawValue.bonus_class ?? '',
      has_claims: Boolean(rawValue.has_claims),
      vehicle_plate: rawValue.vehicle_plate ?? '',
      vehicle_chassis: rawValue.vehicle_chassis ?? '',
      vehicle_brand: rawValue.vehicle_brand ?? '',
      vehicle_model: rawValue.vehicle_model ?? '',
      manufacture_year: rawValue.manufacture_year === null ? null : Number(rawValue.manufacture_year),
      overnight_zipcode: rawValue.overnight_zipcode ?? '',
      driver_age: rawValue.driver_age === null ? null : Number(rawValue.driver_age),
      license_time: rawValue.license_time ?? '',
      coverages: rawValue.coverages ?? '',
      has_insurer_preference: Boolean(rawValue.has_insurer_preference),
      preferred_insurer: rawValue.preferred_insurer ?? '',
      active: Boolean(rawValue.active)
    };
    const request$ = this.editingId
      ? this.quotationService.update(this.editingId, payload)
      : this.quotationService.create(payload);

    request$.subscribe({
      next: (quotation) => {
        this.saving = false;
        this.loadedQuotation = quotation;
        this.successMessage = this.editingId ? 'Cotação atualizada com sucesso.' : 'Cotação criada com sucesso.';
        if (!this.editingId) {
          void this.router.navigate(['/quotations', quotation.id]);
          return;
        }
      },
      error: (error) => {
        this.saving = false;
        const apiMessage = error?.error?.message;
        const apiErrors = error?.error?.errors;
        this.errorMessage = apiMessage || (Array.isArray(apiErrors) ? apiErrors.join(', ') : 'Falha ao salvar cotação.');
      }
    });
  }

  protected softDelete(): void {
    if (!this.editingId) return;
    this.quotationService.softDelete(this.editingId).subscribe({
      next: () => {
        this.successMessage = 'Cotação desativada com sucesso.';
        if (this.loadedQuotation) this.loadedQuotation = { ...this.loadedQuotation, active: 0 };
        this.form.patchValue({ active: false });
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel desativar a cotação.';
      }
    });
  }

  protected activate(): void {
    if (!this.editingId) return;
    this.quotationService.activate(this.editingId).subscribe({
      next: () => {
        this.successMessage = 'Cotação ativada com sucesso.';
        if (this.loadedQuotation) this.loadedQuotation = { ...this.loadedQuotation, active: 1 };
        this.form.patchValue({ active: true });
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel ativar a cotação.';
      }
    });
  }

  protected resetForm(): void {
    if (this.loadedQuotation) {
      this.loadQuotation(this.loadedQuotation.id);
      return;
    }

    const customerId = this.route.snapshot.queryParamMap.get('customerId');
    this.form.reset({
      customer_id: customerId ? Number(customerId) : null,
      request_date: '',
      insurance_type: 0,
      bonus_class: '',
      has_claims: false,
      vehicle_plate: '',
      vehicle_chassis: '',
      vehicle_brand: '',
      vehicle_model: '',
      manufacture_year: null,
      overnight_zipcode: '',
      driver_age: null,
      license_time: '',
      coverages: '',
      has_insurer_preference: false,
      preferred_insurer: '',
      active: true
    });
    this.syncSelectedCustomer();
  }

  private syncSelectedCustomer(): void {
    const customerId = this.form.controls.customer_id.value;
    this.selectedCustomer = this.customers.find((customer) => customer.id === customerId) ?? null;
  }
}
