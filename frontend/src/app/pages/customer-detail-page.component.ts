import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Customer } from '../customer.model';
import { CustomerService } from '../customer.service';

type CustomerApiError = string | { field?: string; message?: string };

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="detail-layout">
      <article class="panel intro-panel">
        <p class="eyebrow">Customers</p>
        <h2>{{ editingId ? 'Detalhe do cliente' : 'Novo cliente' }}</h2>
        <p class="subtitle">
          {{ editingId ? 'Edite os dados principais, acompanhe o status e salve sem sair da tela.' : 'Preencha os campos para criar um novo cliente e testar o fluxo do backend.' }}
        </p>

        <div class="summary" *ngIf="loadedCustomer">
          <div><span class="label">Status</span><strong>{{ loadedCustomer.active === 1 ? 'Ativo' : 'Inativo' }}</strong></div>
          <div><span class="label">Documento</span><strong>{{ loadedCustomer.is_foreign ? loadedCustomer.rnm : loadedCustomer.cpf }}</strong></div>
          <div><span class="label">Localidade</span><strong>{{ loadedCustomer.city }}/{{ loadedCustomer.state }}</strong></div>
        </div>

        <div class="side-actions">
          <a class="ghost link-button" routerLink="/customers">Voltar para lista</a>
          <button type="button" class="ghost" *ngIf="editingId && loadedCustomer?.active === 1" (click)="softDelete()">Desativar</button>
          <button type="button" class="ghost" *ngIf="editingId && loadedCustomer?.active === 0" (click)="activate()">Ativar</button>
        </div>
      </article>

      <article class="panel form-panel">
        <form [formGroup]="form" (ngSubmit)="saveCustomer()" class="form">
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
            <span>Data de nascimento</span>
            <input formControlName="birth_date" type="date" />
            <small class="field-error" *ngIf="showFieldError('birth_date')">{{ getFieldError('birth_date') }}</small>
          </label>

          <label>
            <span>Estrangeiro?</span>
            <select formControlName="is_foreign">
              <option [ngValue]="false">Nao</option>
              <option [ngValue]="true">Sim</option>
            </select>
          </label>

          <label *ngIf="!form.value.is_foreign">
            <span>CPF</span>
            <input formControlName="cpf" type="text" />
            <small class="field-error" *ngIf="showFieldError('cpf')">{{ getFieldError('cpf') }}</small>
          </label>

          <label *ngIf="form.value.is_foreign">
            <span>RNM</span>
            <input formControlName="rnm" type="text" />
            <small class="field-error" *ngIf="showFieldError('rnm')">{{ getFieldError('rnm') }}</small>
          </label>

          <label>
            <span>CEP</span>
            <input formControlName="zip_code" type="text" />
            <small class="field-error" *ngIf="showFieldError('zip_code')">{{ getFieldError('zip_code') }}</small>
          </label>

          <label>
            <span>Rua</span>
            <input formControlName="street" type="text" />
            <small class="field-error" *ngIf="showFieldError('street')">{{ getFieldError('street') }}</small>
          </label>

          <label>
            <span>Numero</span>
            <input formControlName="number" type="text" />
            <small class="field-error" *ngIf="showFieldError('number')">{{ getFieldError('number') }}</small>
          </label>

          <label><span>Complemento</span><input formControlName="complement" type="text" /></label>

          <label>
            <span>Bairro</span>
            <input formControlName="district" type="text" />
            <small class="field-error" *ngIf="showFieldError('district')">{{ getFieldError('district') }}</small>
          </label>

          <label>
            <span>Cidade</span>
            <input formControlName="city" type="text" />
            <small class="field-error" *ngIf="showFieldError('city')">{{ getFieldError('city') }}</small>
          </label>

          <label>
            <span>Estado</span>
            <input formControlName="state" type="text" maxlength="2" />
            <small class="field-error" *ngIf="showFieldError('state')">{{ getFieldError('state') }}</small>
          </label>

          <label class="toggle"><input formControlName="active" type="checkbox" /><span>Cliente ativo</span></label>

          <div class="actions">
            <button class="primary" type="submit" [disabled]="saving">{{ saving ? 'Salvando...' : (editingId ? 'Salvar alteracoes' : 'Criar cliente') }}</button>
            <button class="ghost" type="button" (click)="resetForm()">Limpar</button>
          </div>
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
    label { display: grid; gap: 8px; color: var(--muted); font-size: 0.92rem; }
    input, select { width: 100%; border: 1px solid var(--line); border-radius: 16px; padding: 13px 14px; font: inherit; color: var(--ink); background: var(--surface-base); }
    .field-error { color: var(--danger); font-size: 0.82rem; }
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
    @media (max-width: 960px) { .detail-layout { grid-template-columns: 1fr; } }
  `]
})
export class CustomerDetailPageComponent {
  private readonly customerService = inject(CustomerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected editingId: number | null = null;
  protected saving = false;
  protected successMessage = '';
  protected errorMessage = '';
  protected loadedCustomer: Customer | null = null;
  protected serverFieldErrors: Partial<Record<keyof typeof this.form.controls, string>> = {};

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    is_foreign: [false],
    cpf: [''],
    rnm: [''],
    birth_date: ['', [Validators.required]],
    zip_code: ['', [Validators.required]],
    street: ['', [Validators.required]],
    number: ['', [Validators.required]],
    complement: [''],
    district: ['', [Validators.required]],
    city: ['', [Validators.required]],
    state: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
    active: [true]
  });

  constructor() {
    this.updateDocumentValidators(this.form.controls.is_foreign.value);

    this.form.controls.is_foreign.valueChanges.subscribe((isForeign) => {
      this.updateDocumentValidators(isForeign);
      this.clearServerFieldError('cpf');
      this.clearServerFieldError('rnm');
    });

    this.form.valueChanges.subscribe(() => {
      if (Object.keys(this.serverFieldErrors).length > 0) {
        this.serverFieldErrors = {};
      }
    });

    const id = this.route.snapshot.paramMap.get('id');
    const notice = this.route.snapshot.queryParamMap.get('notice');

    if (notice === 'created') {
      this.successMessage = 'Cliente criado com sucesso.';
    } else if (notice === 'updated') {
      this.successMessage = 'Cliente atualizado com sucesso.';
    }

    if (id) {
      this.editingId = Number(id);
      this.loadCustomer(this.editingId);
    }
  }

  protected loadCustomer(id: number): void {
    this.customerService.getById(id).subscribe({
      next: (customer) => {
        this.loadedCustomer = customer;
        this.form.patchValue({
          name: customer.name,
          email: customer.email,
          is_foreign: customer.is_foreign === 1,
          cpf: customer.cpf ?? '',
          rnm: customer.rnm ?? '',
          birth_date: customer.birth_date.slice(0, 10),
          zip_code: customer.zip_code,
          street: customer.street,
          number: customer.number,
          complement: customer.complement ?? '',
          district: customer.district,
          city: customer.city,
          state: customer.state,
          active: customer.active === 1
        });
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel carregar o cliente.';
      }
    });
  }

  protected saveCustomer(): void {
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
      ? this.customerService.update(this.editingId, payload)
      : this.customerService.create(payload);

    request$.subscribe({
      next: (customer) => {
        this.saving = false;
        this.loadedCustomer = customer;
        if (!this.editingId) {
          void this.router.navigate(['/customers', customer.id], {
            queryParams: { notice: 'created' }
          });
          return;
        }

        this.successMessage = 'Cliente atualizado com sucesso.';
        this.editingId = customer.id;
      },
      error: (error) => {
        this.saving = false;
        const apiMessage = error?.error?.message;
        const apiErrors = error?.error?.errors;
        const normalizedApiErrors = Array.isArray(apiErrors) ? apiErrors as CustomerApiError[] : [];
        this.applyApiErrors(normalizedApiErrors);
        this.errorMessage = this.buildErrorMessage(apiMessage, normalizedApiErrors);
      }
    });
  }

  protected softDelete(): void {
    if (!this.editingId) return;
    this.customerService.softDelete(this.editingId).subscribe({
      next: () => {
        this.successMessage = 'Cliente desativado com sucesso.';
        if (this.loadedCustomer) this.loadedCustomer = { ...this.loadedCustomer, active: 0 };
        this.form.patchValue({ active: false });
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel desativar o cliente.';
      }
    });
  }

  protected activate(): void {
    if (!this.editingId) return;
    this.customerService.activate(this.editingId).subscribe({
      next: () => {
        this.successMessage = 'Cliente ativado com sucesso.';
        if (this.loadedCustomer) this.loadedCustomer = { ...this.loadedCustomer, active: 1 };
        this.form.patchValue({ active: true });
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel ativar o cliente.';
      }
    });
  }

  protected resetForm(): void {
    this.serverFieldErrors = {};
    this.errorMessage = '';
    this.successMessage = '';
    if (this.loadedCustomer) {
      this.loadCustomer(this.loadedCustomer.id);
      return;
    }
    this.form.reset({
      name: '',
      email: '',
      is_foreign: false,
      cpf: '',
      rnm: '',
      birth_date: '',
      zip_code: '',
      street: '',
      number: '',
      complement: '',
      district: '',
      city: '',
      state: '',
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

    if (field.hasError('minlength')) {
      return 'Valor menor que o minimo esperado.';
    }

    if (field.hasError('maxlength')) {
      return 'Valor maior que o maximo permitido.';
    }

    return 'Campo invalido.';
  }

  private updateDocumentValidators(isForeign: boolean): void {
    const cpfControl = this.form.controls.cpf;
    const rnmControl = this.form.controls.rnm;

    if (isForeign) {
      cpfControl.clearValidators();
      cpfControl.setValue('', { emitEvent: false });
      rnmControl.setValidators([Validators.required]);
    } else {
      rnmControl.clearValidators();
      rnmControl.setValue('', { emitEvent: false });
      cpfControl.setValidators([Validators.required]);
    }

    cpfControl.updateValueAndValidity({ emitEvent: false });
    rnmControl.updateValueAndValidity({ emitEvent: false });
  }

  private clearServerFieldError(fieldName: keyof typeof this.form.controls): void {
    if (!this.serverFieldErrors[fieldName]) {
      return;
    }

    delete this.serverFieldErrors[fieldName];
  }

  private applyApiErrors(errors: CustomerApiError[]): void {
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

  private mapApiErrorToField(apiError: CustomerApiError): keyof typeof this.form.controls | null {
    const fields = new Set<keyof typeof this.form.controls>([
      'name',
      'email',
      'birth_date',
      'zip_code',
      'street',
      'number',
      'district',
      'city',
      'state',
      'cpf',
      'rnm',
      'is_foreign'
    ]);

    if (typeof apiError !== 'string' && apiError.field && fields.has(apiError.field as keyof typeof this.form.controls)) {
      return apiError.field as keyof typeof this.form.controls;
    }

    const normalizedError = this.getApiErrorMessage(apiError).toLowerCase();

    return Array.from(fields).find((fieldName) => normalizedError.includes(fieldName)) ?? null;
  }

  private translateApiError(apiError: CustomerApiError): string {
    if (typeof apiError !== 'string' && apiError.message) {
      return apiError.message;
    }

    const normalizedError = this.getApiErrorMessage(apiError).toLowerCase();

    if (normalizedError === 'email, cpf or rnm already exists') {
      return 'Ja existe um cliente com este e-mail ou documento.';
    }

    if (normalizedError.includes('must be valid')) {
      return 'Informe um valor valido.';
    }

    if (normalizedError.includes('must be boolean')) {
      return 'Selecione uma opcao valida.';
    }

    if (normalizedError.includes('is required')) {
      return 'Este campo e obrigatorio.';
    }

    return 'Campo invalido.';
  }

  private buildErrorMessage(apiMessage: string | undefined, errors: CustomerApiError[]): string {
    if (Object.keys(this.serverFieldErrors).length > 0) {
      return 'Verifique os campos destacados.';
    }

    if (apiMessage && apiMessage !== 'Dados invalidos') {
      return apiMessage;
    }

    return this.buildGenericApiErrorMessage(errors);
  }

  private buildGenericApiErrorMessage(errors: CustomerApiError[]): string {
    if (errors.length === 0) {
      return 'Falha ao salvar cliente.';
    }

    return 'Verifique os campos destacados.';
  }

  private getApiErrorMessage(apiError: CustomerApiError): string {
    return typeof apiError === 'string' ? apiError : apiError.message ?? '';
  }
}
