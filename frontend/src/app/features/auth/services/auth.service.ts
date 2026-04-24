import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { tap } from 'rxjs';

import { SessionService } from '../../../core/services/session.service';

type LoginPayload = {
  email: string;
  senha: string;
};

type LoginResponse = {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role_id: number;
    role_name: string;
    username: string;
    active: number;
  };
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly sessionService = inject(SessionService);

  login(payload: LoginPayload) {
    return this.http
      .post<LoginResponse>('/v1/auth/login', {
        identifier: payload.email,
        password: payload.senha
      })
      .pipe(
        tap((response) => {
          this.sessionService.save({
            token: response.token,
            user: response.user
          });
        })
      );
  }

  logout(): void {
    this.sessionService.clear();
  }

  isAuthenticated(): boolean {
    return this.sessionService.isAuthenticated();
  }
}
