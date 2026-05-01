import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CotacaoService } from './cotacao.service';
import { environment } from '../../../environments/environment';

const mockQuotationApi = {
  id: 1, customer_id: 1, request_date: '2025-01-10',
  insurance_type: 0, bonus_class: null, has_claims: null,
  vehicle_plate: 'ABC1234', vehicle_chassis: '9BW123',
  vehicle_brand: 'Toyota', vehicle_model: 'Corolla',
  manufacture_year: 2022, overnight_zipcode: '01310100',
  driver_age: 39, license_time: '5 a 10 anos',
  coverages: [], has_insurer_preference: 0, preferred_insurer: null,
  active: 1,
};

describe('CotacaoService', () => {
  let service: CotacaoService;
  let httpMock: HttpTestingController;
  const url = `${environment.apiUrl}/v1/quotations`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        CotacaoService,
      ],
    });
    service = TestBed.inject(CotacaoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('deve ser criado', () => expect(service).toBeTruthy());

  it('listar mapeia insurance_type=0 para "novo"', async () => {
    const promise = service.listar();
    httpMock.expectOne(url).flush({ data: [mockQuotationApi], total: 1 });
    const cotacoes = await promise;
    expect(cotacoes[0].tipoSeguro).toBe('novo');
  });

  it('listar mapeia insurance_type=1 para "renovacao"', async () => {
    const promise = service.listar();
    httpMock.expectOne(url).flush({
      data: [{ ...mockQuotationApi, insurance_type: 1, bonus_class: '7', has_claims: 0 }],
      total: 1,
    });
    const cotacoes = await promise;
    expect(cotacoes[0].tipoSeguro).toBe('renovacao');
  });

  it('contarTotal faz GET /count', async () => {
    const promise = service.contarTotal();
    httpMock.expectOne(`${url}/count`).flush({ total: 3 });
    expect(await promise).toBe(3);
  });

  it('criar envia insurance_type numérico para o backend', async () => {
    const promise = service.criar({
      clienteId: 1, clienteNome: '', clienteCpf: '', clienteEmail: '',
      dataSolicitacao: '2025-01-01', tipoSeguro: 'renovacao',
      classeBonus: '7', teveSinistro: false,
      placaVeiculo: 'XYZ5678', chassi: 'ABC123', marca: 'Honda', modelo: 'Civic',
      anoFabricacao: 2020, cepPernoite: '20040020', idadeCondutor: 30,
      tempoHabilitacao: 'Mais de 10 anos', temSeguradoraPreferida: false, ativo: true,
    });
    const req = httpMock.expectOne(url);
    expect(req.request.body['insurance_type']).toBe(1);
    expect(req.request.body['bonus_class']).toBe('7');
    req.flush({ ...mockQuotationApi, id: 2 });
    await promise;
  });

  it('excluir faz DELETE /:id', async () => {
    const promise = service.excluir(1);
    const req = httpMock.expectOne(`${url}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    await promise;
  });
});
