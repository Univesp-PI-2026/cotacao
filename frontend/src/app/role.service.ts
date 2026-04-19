import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Role } from './role.model';
import { RoleFormValue } from './role-form.value';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/roles';

  list(filter: 'active' | 'inactive' | 'all' = 'all') {
    const query = filter === 'all' ? '' : `?active=${filter === 'active' ? 1 : 0}`;
    return this.http.get<Role[]>(`${this.apiUrl}${query}`);
  }

  getById(id: number) {
    return this.http.get<Role>(`${this.apiUrl}/${id}`);
  }

  create(payload: RoleFormValue) {
    return this.http.post<Role>(this.apiUrl, payload);
  }

  update(id: number, payload: RoleFormValue) {
    return this.http.put<Role>(`${this.apiUrl}/${id}`, payload);
  }

  softDelete(id: number) {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  activate(id: number) {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/${id}/activate`, {});
  }
}
