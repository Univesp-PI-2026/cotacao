import { Injectable, signal } from '@angular/core';

type SessionUser = {
  id: number;
  name: string;
  email: string;
  role_id?: number;
  role_name?: string;
  username?: string;
  active?: number;
};

type SessionState = {
  token: string | null;
  user: SessionUser | null;
};

const SESSION_STORAGE_KEY = 'quotation_frontend_session';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly sessionState = signal<SessionState>(this.readInitialState());

  user() {
    return this.sessionState().user;
  }

  token() {
    return this.sessionState().token;
  }

  isAuthenticated(): boolean {
    return Boolean(this.sessionState().token);
  }

  currentState() {
    return this.sessionState();
  }

  save(state: SessionState): void {
    this.sessionState.set(state);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
  }

  clear(): void {
    this.sessionState.set({ token: null, user: null });
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  private readInitialState(): SessionState {
    try {
      const rawState = localStorage.getItem(SESSION_STORAGE_KEY);

      if (!rawState) {
        return { token: null, user: null };
      }

      const parsedState = JSON.parse(rawState) as SessionState;
      return {
        token: parsedState.token ?? null,
        user: parsedState.user ?? null
      };
    } catch {
      return { token: null, user: null };
    }
  }
}
