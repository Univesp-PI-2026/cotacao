import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
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
        <article class="form-card form-card--insurance">
          <div class="panel-heading">
            <strong>Informações do Seguro</strong>
          </div>

          <label>
            <span>Cliente*</span>
            <div class="customer-picker">
              <input
                type="text"
                [class.field-input-invalid]="hasFieldError('customer_id')"
                [value]="customerSearch"
                placeholder="Busque por nome, e-mail ou documento"
                (focus)="openCustomerPicker()"
                (blur)="closeCustomerPicker()"
                (input)="onCustomerSearchChange($any($event.target).value)"
              />

              <div class="customer-results" *ngIf="customerPickerOpen">
                <button
                  type="button"
                  class="customer-option"
                  *ngFor="let customer of filteredCustomers"
                  (mousedown)="selectCustomer(customer)"
                >
                  <strong>{{ customer.name }}</strong>
                  <span>{{ customer.email }}</span>
                  <small>{{ getCustomerDocument(customer) }}</small>
                </button>

                <div class="customer-empty" *ngIf="filteredCustomers.length === 0">
                  Nenhum cliente encontrado.
                </div>
              </div>
            </div>
            <small class="field-error" *ngIf="hasFieldError('customer_id')">{{ getFieldError('customer_id') }}</small>
          </label>

          <label>
            <span>Data da Solicitação*</span>
            <input formControlName="request_date" type="date" [class.field-input-invalid]="hasFieldError('request_date')" />
          </label>
          <small class="field-error" *ngIf="hasFieldError('request_date')">{{ getFieldError('request_date') }}</small>

          <label>
            <span>Tipo de Seguro*</span>
            <select formControlName="insurance_type" [class.field-input-invalid]="hasFieldError('insurance_type')">
              <option [ngValue]="0">Novo Seguro</option>
              <option [ngValue]="1">Renovação</option>
            </select>
          </label>
          <small class="field-error" *ngIf="hasFieldError('insurance_type')">{{ getFieldError('insurance_type') }}</small>

          <label *ngIf="form.value.insurance_type === 1">
            <span>Classe de Bônus</span>
            <input formControlName="bonus_class" type="text" [class.field-input-invalid]="hasFieldError('bonus_class')" />
          </label>
          <small class="field-error" *ngIf="hasFieldError('bonus_class')">{{ getFieldError('bonus_class') }}</small>

          <label *ngIf="form.value.insurance_type === 1">
            <span>Teve sinistro?</span>
            <select formControlName="has_claims">
              <option [ngValue]="false">Não</option>
              <option [ngValue]="true">Sim</option>
            </select>
          </label>
        </article>

        <article class="form-card form-card--vehicle">
          <div class="panel-heading">
            <strong>Veículo</strong>
          </div>

          <div class="grid two">
            <label><span>Placa*</span><input formControlName="vehicle_plate" type="text" [class.field-input-invalid]="hasFieldError('vehicle_plate')" /></label>
            <label><span>Chassi*</span><input formControlName="vehicle_chassis" type="text" [class.field-input-invalid]="hasFieldError('vehicle_chassis')" /></label>
          </div>
          <div class="field-grid-errors">
            <small class="field-error" *ngIf="hasFieldError('vehicle_plate')">{{ getFieldError('vehicle_plate') }}</small>
            <small class="field-error" *ngIf="hasFieldError('vehicle_chassis')">{{ getFieldError('vehicle_chassis') }}</small>
          </div>

          <div class="grid two">
            <label><span>Marca*</span><input formControlName="vehicle_brand" type="text" [class.field-input-invalid]="hasFieldError('vehicle_brand')" /></label>
            <label><span>Modelo*</span><input formControlName="vehicle_model" type="text" [class.field-input-invalid]="hasFieldError('vehicle_model')" /></label>
          </div>
          <div class="field-grid-errors">
            <small class="field-error" *ngIf="hasFieldError('vehicle_brand')">{{ getFieldError('vehicle_brand') }}</small>
            <small class="field-error" *ngIf="hasFieldError('vehicle_model')">{{ getFieldError('vehicle_model') }}</small>
          </div>

          <div class="grid two">
            <label><span>Ano de Fabricação*</span><input formControlName="manufacture_year" type="number" [class.field-input-invalid]="hasFieldError('manufacture_year')" /></label>
            <label><span>CEP de Pernoite*</span><input formControlName="overnight_zipcode" type="text" [class.field-input-invalid]="hasFieldError('overnight_zipcode')" /></label>
          </div>
          <div class="field-grid-errors">
            <small class="field-error" *ngIf="hasFieldError('manufacture_year')">{{ getFieldError('manufacture_year') }}</small>
            <small class="field-error" *ngIf="hasFieldError('overnight_zipcode')">{{ getFieldError('overnight_zipcode') }}</small>
          </div>
        </article>

        <article class="form-card form-card--driver">
          <div class="panel-heading">
            <strong>Condutor</strong>
          </div>

          <label><span>Idade do Condutor*</span><input formControlName="driver_age" type="number" [class.field-input-invalid]="hasFieldError('driver_age')" /></label>
          <small class="field-error" *ngIf="hasFieldError('driver_age')">{{ getFieldError('driver_age') }}</small>

          <label><span>Tempo de Habilitação*</span><input formControlName="license_time" type="text" [class.field-input-invalid]="hasFieldError('license_time')" /></label>
          <small class="field-error" *ngIf="hasFieldError('license_time')">{{ getFieldError('license_time') }}</small>
        </article>

        <article class="form-card form-card--coverage">
          <div class="panel-heading">
            <strong>Cobertura</strong>
          </div>

          <p class="section-note">Defina a preferência de seguradora e descreva as coberturas desejadas para a cotação.</p>

          <div class="coverage-stack">
            <label>
              <span>Tem seguradora preferida?*</span>
              <select formControlName="has_insurer_preference" [class.field-input-invalid]="hasFieldError('has_insurer_preference')">
                <option [ngValue]="false">Não</option>
                <option [ngValue]="true">Sim</option>
              </select>
            </label>
            <small class="field-error" *ngIf="hasFieldError('has_insurer_preference')">{{ getFieldError('has_insurer_preference') }}</small>

            <label *ngIf="form.value.has_insurer_preference">
              <span>Qual seguradora?</span>
              <input formControlName="preferred_insurer" type="text" [class.field-input-invalid]="hasFieldError('preferred_insurer')" />
            </label>
            <small class="field-error" *ngIf="hasFieldError('preferred_insurer')">{{ getFieldError('preferred_insurer') }}</small>
          </div>

          <div class="grid two">
            <label>
              <span>Coberturas desejadas</span>
              <textarea formControlName="coverages" rows="4"></textarea>
            </label>
          </div>
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
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      align-items: start;
    }
    .form-card { display: grid; gap: 10px; }
    .form-card--insurance { grid-column: 1; }
    .form-card--vehicle { grid-column: 2; }
    .form-card--driver { grid-column: 1; }
    .form-card--coverage { grid-column: 2; }
    .grid { display: grid; gap: 10px; }
    .two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .coverage-stack {
      display: grid;
      gap: 10px;
      max-width: calc(50% - 5px);
    }
    .section-note {
      margin: -2px 0 4px;
      color: #7a829d;
      font-size: 0.68rem;
      line-height: 1.5;
    }
    .customer-picker {
      position: relative;
    }
    .field-grid-errors {
      display: grid;
      gap: 10px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      margin-top: -6px;
    }
    .customer-results {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      right: 0;
      z-index: 5;
      display: grid;
      gap: 6px;
      max-height: 240px;
      overflow-y: auto;
      padding: 8px;
      border: 1px solid #d8dcec;
      border-radius: 6px;
      background: #fff;
      box-shadow: 0 12px 24px rgba(21, 28, 74, 0.12);
    }
    .customer-option {
      display: grid;
      gap: 2px;
      width: 100%;
      padding: 10px;
      border: 1px solid #e7eaf4;
      border-radius: 6px;
      background: #f8f9fd;
      color: #2f3650;
      text-align: left;
      cursor: pointer;
    }
    .customer-option:hover {
      border-color: #c8d1f5;
      background: #eef1ff;
    }
    .customer-option span,
    .customer-option small,
    .customer-empty {
      color: #6d7591;
      font-size: 0.64rem;
    }
    .customer-empty {
      padding: 10px;
    }
    .field-input-invalid {
      border-color: #d84f6a;
      box-shadow: 0 0 0 3px rgba(216, 79, 106, 0.12);
      background: #fff8fa;
    }
    .field-error {
      display: block;
      margin-top: -2px;
      color: #c44646;
      font-size: 0.64rem;
      line-height: 1.4;
    }
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
      .form-card--insurance,
      .form-card--vehicle,
      .form-card--driver,
      .form-card--coverage { grid-column: auto; }
      .coverage-stack { max-width: 100%; }
      .customer-grid, .two, .field-grid-errors { grid-template-columns: 1fr; }
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
  protected customerSearch = '';
  protected customerPickerOpen = false;

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
    this.form.controls.insurance_type.valueChanges.subscribe(() => this.updateConditionalValidators());
    this.form.controls.has_insurer_preference.valueChanges.subscribe(() => this.updateConditionalValidators());

    const quotationId = this.route.snapshot.paramMap.get('id');
    const customerId = this.route.snapshot.queryParamMap.get('customerId');

    if (customerId) {
      this.form.patchValue({ customer_id: Number(customerId) });
    }

    if (quotationId) {
      this.editingId = Number(quotationId);
      this.loadQuotation(this.editingId);
    }

    this.updateConditionalValidators();
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

  protected get filteredCustomers(): Customer[] {
    const term = this.normalizeCustomerTerm(this.customerSearch);
    const baseCustomers = term
      ? this.customers.filter((customer) => {
          const haystack = this.normalizeCustomerTerm([
            customer.name,
            customer.email,
            customer.cpf,
            customer.rnm
          ].join(' '));

          return haystack.includes(term);
        })
      : this.customers;

    return baseCustomers.slice(0, 12);
  }

  protected openCustomerPicker(): void {
    this.customerPickerOpen = true;
  }

  protected closeCustomerPicker(): void {
    window.setTimeout(() => {
      this.customerPickerOpen = false;
      this.form.controls.customer_id.markAsTouched();
      this.syncSelectedCustomer();
    }, 120);
  }

  protected onCustomerSearchChange(value: string): void {
    this.customerSearch = value;
    this.customerPickerOpen = true;

    const selectedLabel = this.selectedCustomer ? this.getCustomerLabel(this.selectedCustomer) : '';

    if (!selectedLabel || value !== selectedLabel) {
      this.form.patchValue({ customer_id: null }, { emitEvent: false });
      this.selectedCustomer = null;
    }
  }

  protected selectCustomer(customer: Customer): void {
    this.form.patchValue({ customer_id: customer.id });
    this.selectedCustomer = customer;
    this.customerSearch = this.getCustomerLabel(customer);
    this.customerPickerOpen = false;
  }

  protected getCustomerDocument(customer: Customer): string {
    return customer.is_foreign ? (customer.rnm ?? '-') : (customer.cpf ?? '-');
  }

  protected hasFieldError(fieldName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[fieldName];
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  protected getFieldError(fieldName: keyof typeof this.form.controls): string {
    const control = this.form.controls[fieldName];

    if (!control?.errors) {
      return '';
    }

    if (control.errors['required']) {
      return this.getRequiredMessage(fieldName);
    }

    return 'Corrija este campo.';
  }

  private syncSelectedCustomer(): void {
    const customerId = this.form.controls.customer_id.value;
    this.selectedCustomer = this.customers.find((customer) => customer.id === customerId) ?? null;
    this.customerSearch = this.selectedCustomer ? this.getCustomerLabel(this.selectedCustomer) : '';
  }

  private updateConditionalValidators(): void {
    this.setControlValidators(
      this.form.controls.bonus_class,
      this.form.controls.insurance_type.value === 1 ? [Validators.required] : []
    );

    this.setControlValidators(
      this.form.controls.preferred_insurer,
      this.form.controls.has_insurer_preference.value ? [Validators.required] : []
    );
  }

  private setControlValidators(control: AbstractControl, validators: ValidatorFn[]): void {
    control.setValidators(validators);
    control.updateValueAndValidity({ emitEvent: false });
  }

  private getRequiredMessage(fieldName: keyof typeof this.form.controls): string {
    const messages: Record<string, string> = {
      customer_id: 'Selecione um cliente.',
      request_date: 'Informe a data da solicitação.',
      insurance_type: 'Selecione o tipo de seguro.',
      bonus_class: 'Informe a classe de bônus.',
      vehicle_plate: 'Informe a placa.',
      vehicle_chassis: 'Informe o chassi.',
      vehicle_brand: 'Informe a marca.',
      vehicle_model: 'Informe o modelo.',
      manufacture_year: 'Informe o ano de fabricação.',
      overnight_zipcode: 'Informe o CEP de pernoite.',
      driver_age: 'Informe a idade do condutor.',
      license_time: 'Informe o tempo de habilitação.',
      has_insurer_preference: 'Informe se há seguradora preferida.',
      preferred_insurer: 'Informe a seguradora preferida.'
    };

    return messages[fieldName] ?? 'Este campo é obrigatório.';
  }

  private getCustomerLabel(customer: Customer): string {
    return `${customer.name} • ${customer.email}`;
  }

  private normalizeCustomerTerm(value: string): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();
  }
}
