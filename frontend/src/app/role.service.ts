import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Role } from './role.model';
import { RoleFormValue } from './role-form.value';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/roles';

  list() {
    return this.http.get<Role[]>(this.apiUrl);
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

  delete(id: number) {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
