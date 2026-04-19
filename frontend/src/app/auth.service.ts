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

type JwtPayload = {
  exp?: number;
  [key: string]: unknown;
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

  updateCurrentUser(user: User): void {
    const authState = this.authState();

    if (!authState) {
      return;
    }

    const nextState = {
      ...authState,
      user
    };

    localStorage.setItem(this.storageKey, JSON.stringify(nextState));
    this.authState.set(nextState);
    this.currentUser.set(user);
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    this.authState.set(null);
    this.currentUser.set(null);
    void this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.hasValidSession();
  }

  getToken(): string | null {
    if (!this.hasValidSession()) {
      return null;
    }

    return this.authState()?.token ?? null;
  }

  hasValidSession(): boolean {
    const authState = this.authState();

    if (!authState) {
      return false;
    }

    if (this.isTokenExpired(authState.token)) {
      this.clearSession();
      return false;
    }

    return true;
  }

  private readStoredState(): AuthState | null {
    const rawValue = localStorage.getItem(this.storageKey);
    if (!rawValue) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawValue) as AuthState;

      if (!parsed?.token || !parsed?.user || this.isTokenExpired(parsed.token)) {
        localStorage.removeItem(this.storageKey);
        return null;
      }

      return parsed;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }

  private clearSession(): void {
    localStorage.removeItem(this.storageKey);
    this.authState.set(null);
    this.currentUser.set(null);
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);

    if (!payload?.exp) {
      return true;
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    return payload.exp <= nowInSeconds;
  }

  private decodeToken(token: string): JwtPayload | null {
    const parts = token.split('.');

    if (parts.length !== 3) {
      return null;
    }

    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const normalizedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      return JSON.parse(atob(normalizedBase64)) as JwtPayload;
    } catch {
      return null;
    }
  }
}
