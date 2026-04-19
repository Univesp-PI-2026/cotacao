import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { Quotation } from './quotation.model';
import { QuotationFormValue } from './quotation-form.value';

@Injectable({ providedIn: 'root' })
export class QuotationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/quotations';

  list(filter: { active?: 'active' | 'inactive' | 'all'; customerId?: number | null }) {
    let params = new HttpParams();

    if (filter.active && filter.active !== 'all') {
      params = params.set('active', filter.active === 'active' ? 1 : 0);
    }

    if (filter.customerId) {
      params = params.set('customer_id', filter.customerId);
    }

    return this.http.get<Quotation[]>(this.apiUrl, { params });
  }

  getById(id: number) {
    return this.http.get<Quotation>(`${this.apiUrl}/${id}`);
  }

  create(payload: QuotationFormValue) {
    return this.http.post<Quotation>(this.apiUrl, payload);
  }

  update(id: number, payload: QuotationFormValue) {
    return this.http.put<Quotation>(`${this.apiUrl}/${id}`, payload);
  }

  softDelete(id: number) {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  activate(id: number) {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/${id}/activate`, {});
  }
}
