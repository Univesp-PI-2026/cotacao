import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Customer } from '../customer.model';
import { CustomerService } from '../customer.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="customer-page">
      <header class="page-head">
        <h2>{{ editingId ? 'Detalhe do Cliente' : 'Novo Cliente' }}</h2>
      </header>

      <article class="summary-panel" *ngIf="loadedCustomer">
        <div class="panel-heading">
          <strong>Cliente</strong>
        </div>
        <div class="summary-grid">
          <div><span class="caption">Nome</span><strong>{{ loadedCustomer.name }}</strong></div>
          <div><span class="caption">Documento</span><strong>{{ loadedCustomer.is_foreign ? loadedCustomer.rnm : loadedCustomer.cpf }}</strong></div>
          <div><span class="caption">E-mail</span><strong>{{ loadedCustomer.email }}</strong></div>
          <div><span class="caption">Status</span><strong>{{ loadedCustomer.active === 1 ? 'Ativo' : 'Inativo' }}</strong></div>
        </div>
      </article>

      <form [formGroup]="form" (ngSubmit)="saveCustomer()" class="customer-grid">
        <article class="form-card">
          <div class="panel-heading">
            <strong>Dados do Cliente</strong>
          </div>

          <div class="grid two">
            <label>
              <span>Nome*</span>
              <input formControlName="name" type="text" />
              <small class="field-error" *ngIf="showFieldError('name')">{{ getFieldError('name') }}</small>
            </label>

            <label>
              <span>E-mail*</span>
              <input formControlName="email" type="email" />
              <small class="field-error" *ngIf="showFieldError('email')">{{ getFieldError('email') }}</small>
            </label>
          </div>

          <div class="grid three">
            <label>
              <span>Data de nascimento*</span>
              <input formControlName="birth_date" type="date" />
              <small class="field-error" *ngIf="showFieldError('birth_date')">{{ getFieldError('birth_date') }}</small>
            </label>

            <label>
              <span>Estrangeiro?</span>
              <select formControlName="is_foreign">
                <option [ngValue]="false">Não</option>
                <option [ngValue]="true">Sim</option>
              </select>
            </label>

            <label *ngIf="!form.value.is_foreign">
              <span>CPF*</span>
              <input formControlName="cpf" type="text" />
              <small class="field-error" *ngIf="showFieldError('cpf')">{{ getFieldError('cpf') }}</small>
            </label>

            <label *ngIf="form.value.is_foreign">
              <span>RNM*</span>
              <input formControlName="rnm" type="text" />
              <small class="field-error" *ngIf="showFieldError('rnm')">{{ getFieldError('rnm') }}</small>
            </label>
          </div>
        </article>

        <article class="form-card">
          <div class="panel-heading">
            <strong>Endereço</strong>
          </div>

          <div class="grid three">
            <label>
              <span>CEP*</span>
              <input formControlName="zip_code" type="text" />
              <small class="field-error" *ngIf="showFieldError('zip_code')">{{ getFieldError('zip_code') }}</small>
            </label>

            <label>
              <span>Rua*</span>
              <input formControlName="street" type="text" />
              <small class="field-error" *ngIf="showFieldError('street')">{{ getFieldError('street') }}</small>
            </label>

            <label>
              <span>Número*</span>
              <input formControlName="number" type="text" />
              <small class="field-error" *ngIf="showFieldError('number')">{{ getFieldError('number') }}</small>
            </label>
          </div>

          <div class="grid three">
            <label>
              <span>Complemento</span>
              <input formControlName="complement" type="text" />
            </label>

            <label>
              <span>Bairro*</span>
              <input formControlName="district" type="text" />
              <small class="field-error" *ngIf="showFieldError('district')">{{ getFieldError('district') }}</small>
            </label>

            <label>
              <span>Cidade*</span>
              <input formControlName="city" type="text" />
              <small class="field-error" *ngIf="showFieldError('city')">{{ getFieldError('city') }}</small>
            </label>
          </div>

          <div class="grid two">
            <label>
              <span>Estado*</span>
              <input formControlName="state" type="text" maxlength="2" />
              <small class="field-error" *ngIf="showFieldError('state')">{{ getFieldError('state') }}</small>
            </label>

            <label class="toggle">
              <input formControlName="active" type="checkbox" />
              <span>Cliente ativo</span>
            </label>
          </div>
        </article>

        <div class="form-footer">
          <div class="status-actions">
            <a class="ghost link-button" routerLink="/customers">Cancelar</a>
            <button type="button" class="ghost" *ngIf="editingId && loadedCustomer?.active === 1" (click)="softDelete()">Desativar</button>
            <button type="button" class="ghost" *ngIf="editingId && loadedCustomer?.active === 0" (click)="activate()">Ativar</button>
          </div>

          <div class="submit-actions">
            <button class="ghost" type="button" (click)="resetForm()">Limpar</button>
            <button class="primary" type="submit" [disabled]="saving">
              {{ saving ? 'Salvando...' : (editingId ? 'Salvar Cliente' : 'Criar Cliente') }}
            </button>
          </div>
        </div>

        <p class="message success" *ngIf="successMessage">{{ successMessage }}</p>
        <p class="message error" *ngIf="errorMessage">{{ errorMessage }}</p>
      </form>
    </section>
  `,
  styles: [`
    .customer-page { display: grid; gap: 14px; }
    .page-head h2 { margin: 0; font-size: 1rem; color: #2d324d; }
    .summary-panel,
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
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }
    .caption {
      display: block;
      font-size: 0.56rem;
      text-transform: uppercase;
      color: #98a0b8;
      margin-bottom: 4px;
    }
    .customer-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }
    .form-card { display: grid; gap: 10px; }
    .grid { display: grid; gap: 10px; }
    .two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    label { display: grid; gap: 6px; color: #626982; font-size: 0.68rem; }
    input, select {
      width: 100%;
      min-height: 36px;
      border: 1px solid #d8dcec;
      border-radius: 3px;
      padding: 0 10px;
      font: inherit;
      color: #2f3650;
      background: #fff;
    }
    .field-error { color: #c44646; font-size: 0.72rem; }
    .form-footer {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    .status-actions,
    .submit-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .toggle {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #565d76;
      min-height: 36px;
    }
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
    .message { margin: 0; padding: 10px 12px; border-radius: 8px; font-size: 0.82rem; }
    .success { background: #ecfff4; color: #1f8a56; }
    .error { background: rgba(187, 62, 62, 0.1); color: #c44646; }
    @media (max-width: 1024px) {
      .summary-grid,
      .customer-grid,
      .two,
      .three { grid-template-columns: 1fr; }
      .form-footer { align-items: start; flex-direction: column; }
    }
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
        this.applyApiErrors(Array.isArray(apiErrors) ? apiErrors : []);
        this.errorMessage = apiMessage || this.buildGenericApiErrorMessage(Array.isArray(apiErrors) ? apiErrors : []);
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

  private applyApiErrors(errors: string[]): void {
    this.serverFieldErrors = {};

    errors.forEach((errorMessage) => {
      const fieldName = this.mapApiErrorToField(errorMessage);
      if (!fieldName) {
        return;
      }

      this.serverFieldErrors[fieldName] = this.translateApiError(errorMessage);
      this.form.controls[fieldName].markAsTouched();
    });
  }

  private mapApiErrorToField(errorMessage: string): keyof typeof this.form.controls | null {
    const normalizedError = errorMessage.toLowerCase();

    const fields: Array<keyof typeof this.form.controls> = [
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
    ];

    return fields.find((fieldName) => normalizedError.includes(fieldName)) ?? null;
  }

  private translateApiError(errorMessage: string): string {
    const normalizedError = errorMessage.toLowerCase();

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

  private buildGenericApiErrorMessage(errors: string[]): string {
    if (errors.length === 0) {
      return 'Falha ao salvar cliente.';
    }

    return 'Verifique os campos destacados.';
  }
}
