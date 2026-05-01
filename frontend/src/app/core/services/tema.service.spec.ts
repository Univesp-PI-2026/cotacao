import { TestBed } from '@angular/core/testing';
import { TemaService } from './tema.service';

describe('TemaService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.classList.remove('tema-escuro');
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.clear();
    document.body.classList.remove('tema-escuro');
  });

  it('deve ser criado com tema claro por padrão', () => {
    const service = TestBed.inject(TemaService);
    expect(service).toBeTruthy();
    expect(service.temaEscuro()).toBeFalse();
  });

  it('carrega tema escuro quando localStorage tem "true"', () => {
    localStorage.setItem('g05_tema_escuro', 'true');
    const service = TestBed.inject(TemaService);
    expect(service.temaEscuro()).toBeTrue();
  });

  it('alternarTema ativa tema escuro e salva no localStorage', () => {
    const service = TestBed.inject(TemaService);
    service.alternarTema();
    expect(service.temaEscuro()).toBeTrue();
    expect(localStorage.getItem('g05_tema_escuro')).toBe('true');
    expect(document.body.classList.contains('tema-escuro')).toBeTrue();
  });

  it('alternarTema desativa tema escuro', () => {
    localStorage.setItem('g05_tema_escuro', 'true');
    const service = TestBed.inject(TemaService);
    service.alternarTema();
    expect(service.temaEscuro()).toBeFalse();
    expect(document.body.classList.contains('tema-escuro')).toBeFalse();
  });

  it('inicializar aplica tema escuro armazenado', () => {
    localStorage.setItem('g05_tema_escuro', 'true');
    const service = TestBed.inject(TemaService);
    service.inicializar();
    expect(document.body.classList.contains('tema-escuro')).toBeTrue();
  });
});
