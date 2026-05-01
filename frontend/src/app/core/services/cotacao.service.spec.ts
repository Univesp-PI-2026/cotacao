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

  it('listar mapeia has_claims=1 para teveSinistro=true e preferred_insurer para seguradoraPreferida', async () => {
    const promise = service.listar();
    httpMock.expectOne(url).flush({
      data: [{
        ...mockQuotationApi, insurance_type: 1, has_claims: 1, bonus_class: '5',
        has_insurer_preference: 1, preferred_insurer: 'Porto Seguro',
      }],
      total: 1,
    });
    const cotacoes = await promise;
    expect(cotacoes[0].teveSinistro).toBeTrue();
    expect(cotacoes[0].classeBonus).toBe('5');
    expect(cotacoes[0].temSeguradoraPreferida).toBeTrue();
    expect(cotacoes[0].seguradoraPreferida).toBe('Porto Seguro');
  });

  it('criar envia insurance_type=0 para "novo", coberturas como array e has_claims=1', async () => {
    const promise = service.criar({
      clienteId: 1, clienteNome: '', clienteCpf: '', clienteEmail: '',
      dataSolicitacao: '2025-06-01', tipoSeguro: 'novo',
      teveSinistro: true, classeBonus: '3',
      placaVeiculo: 'ABC1234', chassi: '9BW123', marca: 'Toyota', modelo: 'Corolla',
      anoFabricacao: 2022, cepPernoite: '01310100', idadeCondutor: 39,
      tempoHabilitacao: '5 a 10 anos', coberturas: 'RCF, CASCO',
      temSeguradoraPreferida: true, seguradoraPreferida: 'Porto Seguro', ativo: true,
    });
    const req = httpMock.expectOne(url);
    expect(req.request.body['insurance_type']).toBe(0);
    expect(req.request.body['has_claims']).toBe(1);
    expect(req.request.body['coverages']).toEqual(['RCF', 'CASCO']);
    expect(req.request.body['has_insurer_preference']).toBe(1);
    expect(req.request.body['preferred_insurer']).toBe('Porto Seguro');
    req.flush({ ...mockQuotationApi, id: 3 });
    await promise;
  });

  it('criar envia has_claims=null e bonus_class=null quando teveSinistro e classeBonus ausentes', async () => {
    const promise = service.criar({
      clienteId: 1, clienteNome: '', clienteCpf: '', clienteEmail: '',
      dataSolicitacao: '2025-06-01', tipoSeguro: 'novo',
      placaVeiculo: 'ABC1234', chassi: '9BW123', marca: 'Toyota', modelo: 'Corolla',
      anoFabricacao: 2022, cepPernoite: '01310100', idadeCondutor: 39,
      tempoHabilitacao: '5 a 10 anos', temSeguradoraPreferida: false, ativo: true,
    });
    const req = httpMock.expectOne(url);
    expect(req.request.body['has_claims']).toBeNull();
    expect(req.request.body['bonus_class']).toBeNull();
    expect(req.request.body['preferred_insurer']).toBeNull();
    req.flush({ ...mockQuotationApi, id: 4 });
    await promise;
  });

  it('buscarPorId retorna undefined quando HTTP falha', async () => {
    const promise = service.buscarPorId(999);
    httpMock.expectOne(`${url}/999`).flush('Error', { status: 404, statusText: 'Not Found' });
    expect(await promise).toBeUndefined();
  });

  it('atualizar faz GET + PUT e retorna cotação atualizada', async () => {
    const promise = service.atualizar(1, { marca: 'Honda' });
    httpMock.expectOne(`${url}/1`).flush(mockQuotationApi);
    await new Promise<void>(r => setTimeout(r, 0));
    httpMock.expectOne(`${url}/1`).flush({ ...mockQuotationApi, vehicle_brand: 'Honda' });
    expect((await promise).marca).toBe('Honda');
  });

  it('atualizar lança erro quando cotação não existe', async () => {
    const promise = service.atualizar(999, { marca: 'Fiat' });
    httpMock.expectOne(`${url}/999`).flush('Error', { status: 404, statusText: 'Not Found' });
    await expectAsync(promise).toBeRejectedWithError('Cotação não encontrada');
  });
});
