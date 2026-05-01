import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CepService } from './cep.service';
import { environment } from '../../../environments/environment';

describe('CepService', () => {
  let service: CepService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        CepService,
      ],
    });
    service = TestBed.inject(CepService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('deve ser criado', () => expect(service).toBeTruthy());

  it('buscarCep faz GET no backend e mapeia campos EN→PT', (done) => {
    service.buscarCep('01310100').subscribe((resposta) => {
      expect(resposta.cep).toBe('01310100');
      expect(resposta.logradouro).toBe('Av. Paulista');
      expect(resposta.bairro).toBe('Bela Vista');
      expect(resposta.cidade).toBe('São Paulo');
      expect(resposta.estado).toBe('SP');
      done();
    });

    httpMock.expectOne(`${environment.apiUrl}/v1/zip-codes/01310100`).flush({
      zip_code: '01310100',
      street: 'Av. Paulista',
      complement: '',
      district: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    });
  });

  it('buscarCep retorna erro para CEP com menos de 8 dígitos', (done) => {
    service.buscarCep('123').subscribe({
      error: (err) => {
        expect(err.message).toContain('8 dígitos');
        done();
      },
    });
  });

  it('buscarCep limpa formatação do CEP antes de chamar a API', (done) => {
    service.buscarCep('01.310-100').subscribe(() => done());
    httpMock.expectOne(`${environment.apiUrl}/v1/zip-codes/01310100`).flush({
      zip_code: '01310100', street: 'X', complement: '', district: 'Y', city: 'Z', state: 'SP',
    });
  });
});
