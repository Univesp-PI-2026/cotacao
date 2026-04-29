import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Customer } from '../customer.model';
import { CustomerService } from '../customer.service';
import { QuotationFormValue } from '../quotation-form.value';
import { Quotation } from '../quotation.model';
import { QuotationService } from '../quotation.service';

type QuotationApiError = string | { field?: string; message?: string };

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="detail-layout">
      <article class="panel intro-panel">
        <p class="eyebrow">Quotations</p>
        <h2>{{ editingId ? 'Detalhe da cotação' : 'Nova cotação' }}</h2>
        <p class="subtitle">
          {{ editingId ? 'Atualize os dados do veículo e do seguro.' : 'A criação começa a partir do cliente selecionado na lista.' }}
        </p>

        <div class="summary" *ngIf="selectedCustomer">
          <div><span class="label">Cliente</span><strong>{{ selectedCustomer.name }}</strong></div>
          <div><span class="label">E-mail</span><strong>{{ selectedCustomer.email }}</strong></div>
          <div><span class="label">Documento</span><strong>{{ selectedCustomer.is_foreign ? selectedCustomer.rnm : selectedCustomer.cpf }}</strong></div>
        </div>

        <div class="side-actions">
          <a class="ghost link-button" routerLink="/quotations">Voltar para lista</a>
          <button type="button" class="ghost" *ngIf="editingId && loadedQuotation?.active === 1" (click)="softDelete()">Desativar</button>
          <button type="button" class="ghost" *ngIf="editingId && loadedQuotation?.active === 0" (click)="activate()">Ativar</button>
        </div>
      </article>

      <article class="panel form-panel">
        <form [formGroup]="form" (ngSubmit)="saveQuotation()" class="form">
          <label>
            <span>Cliente</span>
            <select formControlName="customer_id">
              <option [ngValue]="null">Selecione um cliente</option>
              <option *ngFor="let customer of customers" [ngValue]="customer.id">{{ customer.name }}</option>
            </select>
            <small class="field-error" [class.is-visible]="showFieldError('customer_id')">{{ getFieldError('customer_id') }}</small>
          </label>

          <div class="grid two">
            <label>
              <span>Data da solicitação</span>
              <input formControlName="request_date" type="date" />
              <small class="field-error" [class.is-visible]="showFieldError('request_date')">{{ getFieldError('request_date') }}</small>
            </label>
            <label>
              <span>Tipo de seguro</span>
              <select formControlName="insurance_type">
                <option [ngValue]="0">Novo seguro</option>
                <option [ngValue]="1">Renovação</option>
              </select>
              <small class="field-error" [class.is-visible]="showFieldError('insurance_type')">{{ getFieldError('insurance_type') }}</small>
            </label>
          </div>

          <div class="grid two" *ngIf="form.value.insurance_type === 1">
            <label>
              <span>Classe de bônus</span>
              <input formControlName="bonus_class" type="text" />
              <small class="field-error" [class.is-visible]="showFieldError('bonus_class')">{{ getFieldError('bonus_class') }}</small>
            </label>
            <label>
              <span>Houve sinistros?</span>
              <select formControlName="has_claims">
                <option [ngValue]="false">Não</option>
                <option [ngValue]="true">Sim</option>
              </select>
              <small class="field-error" [class.is-visible]="showFieldError('has_claims')">{{ getFieldError('has_claims') }}</small>
            </label>
          </div>

          <div class="grid two">
            <label>
              <span>Placa</span>
              <input formControlName="vehicle_plate" type="text" />
              <small class="field-error" [class.is-visible]="showFieldError('vehicle_plate')">{{ getFieldError('vehicle_plate') }}</small>
            </label>
            <label>
              <span>Chassi</span>
              <input formControlName="vehicle_chassis" type="text" />
              <small class="field-error" [class.is-visible]="showFieldError('vehicle_chassis')">{{ getFieldError('vehicle_chassis') }}</small>
            </label>
          </div>

          <div class="grid two">
            <label>
              <span>Marca</span>
              <input formControlName="vehicle_brand" type="text" />
              <small class="field-error" [class.is-visible]="showFieldError('vehicle_brand')">{{ getFieldError('vehicle_brand') }}</small>
            </label>
            <label>
              <span>Modelo</span>
              <input formControlName="vehicle_model" type="text" />
              <small class="field-error" [class.is-visible]="showFieldError('vehicle_model')">{{ getFieldError('vehicle_model') }}</small>
            </label>
          </div>

          <div class="grid three">
            <label>
              <span>Ano</span>
              <input formControlName="manufacture_year" type="number" />
              <small class="field-error" [class.is-visible]="showFieldError('manufacture_year')">{{ getFieldError('manufacture_year') }}</small>
            </label>
            <label>
              <span>CEP de pernoite</span>
              <input formControlName="overnight_zipcode" type="text" />
              <small class="field-error" [class.is-visible]="showFieldError('overnight_zipcode')">{{ getFieldError('overnight_zipcode') }}</small>
            </label>
            <label>
              <span>Idade do condutor</span>
              <input formControlName="driver_age" type="number" />
              <small class="field-error" [class.is-visible]="showFieldError('driver_age')">{{ getFieldError('driver_age') }}</small>
            </label>
          </div>

          <label>
            <span>Tempo de habilitação</span>
            <input formControlName="license_time" type="text" />
            <small class="field-error" [class.is-visible]="showFieldError('license_time')">{{ getFieldError('license_time') }}</small>
          </label>
          <label>
            <span>Coberturas desejadas</span>
            <input formControlName="coverages" type="text" placeholder="Ex: Basica, Terceiros, Vidros" />
            <small class="field-error" [class.is-visible]="showFieldError('coverages')">{{ getFieldError('coverages') }}</small>
          </label>

          <div class="grid two">
            <label>
              <span>Seguradora preferida?</span>
              <select formControlName="has_insurer_preference">
                <option [ngValue]="false">Não</option>
                <option [ngValue]="true">Sim</option>
              </select>
              <small class="field-error" [class.is-visible]="showFieldError('has_insurer_preference')">{{ getFieldError('has_insurer_preference') }}</small>
            </label>
            <label *ngIf="form.value.has_insurer_preference">
              <span>Qual seguradora?</span>
              <input formControlName="preferred_insurer" type="text" />
              <small class="field-error" [class.is-visible]="showFieldError('preferred_insurer')">{{ getFieldError('preferred_insurer') }}</small>
            </label>
          </div>

          <label class="toggle"><input formControlName="active" type="checkbox" /><span>Cotação ativa</span></label>

          <div class="actions">
            <button class="primary" type="submit" [disabled]="saving">{{ saving ? 'Salvando...' : (editingId ? 'Salvar alteração' : 'Criar cotação') }}</button>
            <button class="ghost" type="button" (click)="resetForm()">Limpar</button>
          </div>

          <p class="message success" *ngIf="successMessage">{{ successMessage }}</p>
          <p class="message error" *ngIf="errorMessage">{{ errorMessage }}</p>
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
    .grid { display: grid; gap: 14px; }
    .two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    label { display: grid; gap: 8px; color: var(--muted); font-size: 0.92rem; }
    input, select { width: 100%; border: 1px solid var(--line); border-radius: 16px; padding: 13px 14px; font: inherit; color: var(--ink); background: var(--surface-base); }
    .field-error { min-height: 1rem; color: var(--danger); font-size: 0.82rem; visibility: hidden; }
    .field-error.is-visible { visibility: visible; }
    .toggle { display: flex; align-items: center; gap: 12px; margin-top: 4px; }
    .toggle input { width: 18px; height: 18px; }
    .primary, .ghost { border: 0; border-radius: 999px; padding: 12px 18px; font: inherit; cursor: pointer; transition: transform 180ms ease, background 180ms ease; }
    .primary { background: var(--ink); color: white; box-shadow: var(--shadow); }
    .ghost { background: var(--surface-soft); color: var(--ink); border: 1px solid var(--line); }
    .link-button { text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
    .primary:hover, .ghost:hover { transform: translateY(-1px); }
    .message { margin: 0; padding: 12px 14px; border-radius: 14px; font-size: 0.92rem; }
    .success { background: var(--accent-soft); color: var(--accent); }
    .error { background: rgba(187, 62, 62, 0.1); color: var(--danger); }
    @media (max-width: 960px) { .detail-layout, .two, .three { grid-template-columns: 1fr; } }
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
  protected serverFieldErrors: Partial<Record<keyof typeof this.form.controls, string>> = {};

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
      next: (customers) => {
        this.customers = customers;
        this.syncSelectedCustomer();
      }
    });

    this.form.controls.customer_id.valueChanges.subscribe(() => this.syncSelectedCustomer());
    this.form.valueChanges.subscribe(() => {
      if (Object.keys(this.serverFieldErrors).length > 0) {
        this.serverFieldErrors = {};
      }
    });

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
    this.serverFieldErrors = {};

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
        const normalizedApiErrors = Array.isArray(apiErrors) ? apiErrors as QuotationApiError[] : [];
        this.applyApiErrors(normalizedApiErrors);
        this.errorMessage = this.buildErrorMessage(apiMessage, normalizedApiErrors);
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
    this.serverFieldErrors = {};
    this.errorMessage = '';
    this.successMessage = '';
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

  private syncSelectedCustomer(): void {
    const customerId = this.form.controls.customer_id.value;
    this.selectedCustomer = this.customers.find((customer) => customer.id === customerId) ?? null;
  }

  private applyApiErrors(errors: QuotationApiError[]): void {
    this.serverFieldErrors = {};

    errors.forEach((apiError) => {
      const fieldName = this.mapApiErrorToField(apiError);
      if (!fieldName) {
        return;
      }

      this.serverFieldErrors[fieldName] = this.translateApiError(apiError);
      this.form.controls[fieldName].markAsTouched();
    });
  }

  private mapApiErrorToField(apiError: QuotationApiError): keyof typeof this.form.controls | null {
    const fields = new Set<keyof typeof this.form.controls>([
      'customer_id',
      'request_date',
      'insurance_type',
      'bonus_class',
      'has_claims',
      'vehicle_plate',
      'vehicle_chassis',
      'vehicle_brand',
      'vehicle_model',
      'manufacture_year',
      'overnight_zipcode',
      'driver_age',
      'license_time',
      'coverages',
      'has_insurer_preference',
      'preferred_insurer',
      'active'
    ]);

    if (typeof apiError !== 'string' && apiError.field && fields.has(apiError.field as keyof typeof this.form.controls)) {
      return apiError.field as keyof typeof this.form.controls;
    }

    const normalizedError = this.getApiErrorMessage(apiError).toLowerCase();

    return Array.from(fields).find((fieldName) => normalizedError.includes(fieldName)) ?? null;
  }

  private translateApiError(apiError: QuotationApiError): string {
    if (typeof apiError !== 'string' && apiError.message) {
      return apiError.message;
    }

    const normalizedError = this.getApiErrorMessage(apiError).toLowerCase();

    if (normalizedError.includes('is required')) {
      return 'Este campo e obrigatorio.';
    }

    if (normalizedError.includes('must be 0 or 1')) {
      return 'Selecione uma opcao valida.';
    }

    if (normalizedError.includes('must be boolean')) {
      return 'Selecione uma opcao valida.';
    }

    if (normalizedError.includes('does not exist')) {
      return 'Selecione um cliente valido.';
    }

    return 'Campo invalido.';
  }

  private buildErrorMessage(apiMessage: string | undefined, errors: QuotationApiError[]): string {
    if (Object.keys(this.serverFieldErrors).length > 0) {
      return 'Verifique os campos destacados.';
    }

    if (apiMessage && apiMessage !== 'Dados invalidos') {
      return apiMessage;
    }

    if (errors.length === 0) {
      return 'Falha ao salvar cotação.';
    }

    return 'Verifique os campos destacados.';
  }

  private getApiErrorMessage(apiError: QuotationApiError): string {
    return typeof apiError === 'string' ? apiError : apiError.message ?? '';
  }
}
