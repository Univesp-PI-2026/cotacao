import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Customer } from './customer.model';
import { CustomerFormValue } from './customer-form.value';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/customers';

  list(filter: 'active' | 'inactive' | 'all') {
    const query = filter === 'all' ? '' : `?active=${filter === 'active' ? 1 : 0}`;
    return this.http.get<Customer[]>(`${this.apiUrl}${query}`);
  }

  getById(id: number) {
    return this.http.get<Customer>(`${this.apiUrl}/${id}`);
  }

  create(payload: CustomerFormValue) {
    return this.http.post<Customer>(this.apiUrl, payload);
  }

  update(id: number, payload: CustomerFormValue) {
    return this.http.put<Customer>(`${this.apiUrl}/${id}`, payload);
  }

  softDelete(id: number) {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  activate(id: number) {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/${id}/activate`, {});
  }
}
