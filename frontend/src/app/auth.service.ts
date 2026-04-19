import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { User } from './user.model';

type LoginResponse = {
  token: string;
  user: User;
};

type AuthState = {
  token: string;
  user: User;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storageKey = 'cotacao_v02_auth_state';
  private readonly authState = signal<AuthState | null>(this.readStoredState());
  readonly currentUser = signal<User | null>(this.authState()?.user ?? null);

  login(identifier: string, password: string) {
    return this.http.post<LoginResponse>('/api/v1/auth/login', {
      identifier,
      password
    });
  }

  completeLogin(token: string, user: User): void {
    const authState = { token, user };
    localStorage.setItem(this.storageKey, JSON.stringify(authState));
    this.authState.set(authState);
    this.currentUser.set(user);
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    this.authState.set(null);
    this.currentUser.set(null);
    void this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.authState() !== null;
  }

  getToken(): string | null {
    return this.authState()?.token ?? null;
  }

  private readStoredState(): AuthState | null {
    const rawValue = localStorage.getItem(this.storageKey);
    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue) as AuthState;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }
}
