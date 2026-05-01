import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockResponse = {
    token: 'jwt-token-123',
    user: {
      id: 1, role_id: 1, role_name: 'admin',
      name: 'Admin', username: 'admin',
      email: 'admin@test.com', active: 1,
    },
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        AuthService,
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
  });

  it('estaAutenticado retorna false sem token', () => {
    expect(service.estaAutenticado()).toBeFalse();
  });

  it('autenticar faz POST e salva token no localStorage', async () => {
    const promise = service.autenticar({ identifier: 'admin', senha: '12345678' });
    const req = httpMock.expectOne(`${environment.apiUrl}/v1/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ identifier: 'admin', password: '12345678' });
    req.flush(mockResponse);
    await promise;

    expect(localStorage.getItem('g05_token')).toBe('jwt-token-123');
    expect(service.estaAutenticado()).toBeTrue();
  });

  it('autenticar atualiza o signal do usuário', async () => {
    const promise = service.autenticar({ identifier: 'admin', senha: '12345678' });
    httpMock.expectOne(`${environment.apiUrl}/v1/auth/login`).flush(mockResponse);
    await promise;

    const usuario = service.usuarioAtual();
    expect(usuario?.nome).toBe('Admin');
    expect(usuario?.roleId).toBe(1);
  });

  it('sair limpa localStorage e zera signal', async () => {
    const promise = service.autenticar({ identifier: 'admin', senha: '12345678' });
    httpMock.expectOne(`${environment.apiUrl}/v1/auth/login`).flush(mockResponse);
    await promise;

    service.sair();
    expect(service.estaAutenticado()).toBeFalse();
    expect(service.usuarioAtual()).toBeNull();
  });

  it('carregarUsuarioLocal lê usuário do localStorage quando existe', () => {
    const u = { id: 2, nome: 'Tiago', username: 'tiago', email: 't@test.com', roleId: 1, ativo: true };
    localStorage.setItem('g05_usuario', JSON.stringify(u));
    const s = new AuthService(TestBed.inject(HttpClient), TestBed.inject(Router));
    expect(s.usuarioAtual()?.nome).toBe('Tiago');
  });
});
