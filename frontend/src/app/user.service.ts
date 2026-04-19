import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { User } from './user.model';
import { UserFormValue } from './user-form.value';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/users';

  list(filter: { active?: 'active' | 'inactive' | 'all'; roleId?: number | null }) {
    let params = new HttpParams();

    if (filter.active && filter.active !== 'all') {
      params = params.set('active', filter.active === 'active' ? 1 : 0);
    }

    if (filter.roleId) {
      params = params.set('role_id', filter.roleId);
    }

    return this.http.get<User[]>(this.apiUrl, { params });
  }

  getById(id: number) {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  create(payload: UserFormValue) {
    return this.http.post<User>(this.apiUrl, payload);
  }

  update(id: number, payload: UserFormValue) {
    return this.http.put<User>(`${this.apiUrl}/${id}`, payload);
  }

  softDelete(id: number) {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  activate(id: number) {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/${id}/activate`, {});
  }
}
