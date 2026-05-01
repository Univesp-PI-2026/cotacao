import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { guestGuard } from './guest.guard';
import { AuthService } from '../services/auth.service';

describe('guestGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['estaAutenticado']);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });
  });

  it('retorna true quando não autenticado', () => {
    authServiceSpy.estaAutenticado.and.returnValue(false);
    const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
    expect(result).toBeTrue();
  });

  it('redireciona para /painel quando já autenticado', () => {
    authServiceSpy.estaAutenticado.and.returnValue(true);
    const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
    const router = TestBed.inject(Router);
    expect(result).toEqual(router.createUrlTree(['/painel']));
  });
});
