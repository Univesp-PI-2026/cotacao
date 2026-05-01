import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ClienteService } from './cliente.service';
import { environment } from '../../../environments/environment';

const mockCustomerApi = {
  id: 1, name: 'Maria Silva', email: 'maria@test.com',
  is_foreign: 0, cpf: '123.456.789-00', rnm: null,
  birth_date: '1985-03-15', zip_code: '01310100',
  street: 'Av. Paulista', number: '1000', complement: 'Apto 12',
  district: 'Bela Vista', city: 'São Paulo', state: 'SP', active: 1,
};

describe('ClienteService', () => {
  let service: ClienteService;
  let httpMock: HttpTestingController;
  const url = `${environment.apiUrl}/v1/customers`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ClienteService,
      ],
    });
    service = TestBed.inject(ClienteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('deve ser criado', () => expect(service).toBeTruthy());

  it('listar faz GET e mapeia campos EN→PT', async () => {
    const promise = service.listar();
    httpMock.expectOne(url).flush({ data: [mockCustomerApi], total: 1 });
    const clientes = await promise;

    expect(clientes.length).toBe(1);
    expect(clientes[0].nome).toBe('Maria Silva');
    expect(clientes[0].cep).toBe('01310100');
    expect(clientes[0].estrangeiro).toBeFalse();
  });

  it('contarTotal faz GET /count e retorna número', async () => {
    const promise = service.contarTotal();
    httpMock.expectOne(`${url}/count`).flush({ total: 5 });
    const total = await promise;
    expect(total).toBe(5);
  });

  it('buscarPorId faz GET /:id', async () => {
    const promise = service.buscarPorId(1);
    httpMock.expectOne(`${url}/1`).flush(mockCustomerApi);
    const cliente = await promise;
    expect(cliente?.id).toBe(1);
    expect(cliente?.logradouro).toBe('Av. Paulista');
  });

  it('criar faz POST com payload mapeado PT→EN', async () => {
    const promise = service.criar({
      nome: 'João', email: 'joao@test.com', estrangeiro: false,
      cpf: '999.999.999-99', dataNascimento: '1990-01-01',
      cep: '20040020', logradouro: 'Av. Rio Branco', numero: '100',
      bairro: 'Centro', cidade: 'Rio', estado: 'RJ', ativo: true,
    });
    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body['name']).toBe('João');
    expect(req.request.body['is_foreign']).toBe(0);
    req.flush({ ...mockCustomerApi, id: 2, name: 'João' });
    const criado = await promise;
    expect(criado.nome).toBe('João');
  });

  it('excluir faz DELETE /:id', async () => {
    const promise = service.excluir(1);
    const req = httpMock.expectOne(`${url}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    await promise;
  });

  it('mapeia cliente estrangeiro com rnm, active=0 e complement=null', async () => {
    const promise = service.listar();
    httpMock.expectOne(url).flush({
      data: [{ ...mockCustomerApi, is_foreign: 1, cpf: null, rnm: 'RNM12345', active: 0, complement: null }],
      total: 1,
    });
    const clientes = await promise;
    expect(clientes[0].estrangeiro).toBeTrue();
    expect(clientes[0].cpf).toBeUndefined();
    expect(clientes[0].rnm).toBe('RNM12345');
    expect(clientes[0].ativo).toBeFalse();
    expect(clientes[0].complemento).toBeUndefined();
  });

  it('criar estrangeiro envia is_foreign=1, cpf=null, rnm e active=0', async () => {
    const promise = service.criar({
      nome: 'John', email: 'john@test.com', estrangeiro: true,
      rnm: 'RNM99', dataNascimento: '1990-01-01',
      cep: '20040020', logradouro: 'Rua X', numero: '1',
      bairro: 'Centro', cidade: 'Rio', estado: 'RJ', ativo: false,
    });
    const req = httpMock.expectOne(url);
    expect(req.request.body['is_foreign']).toBe(1);
    expect(req.request.body['cpf']).toBeNull();
    expect(req.request.body['rnm']).toBe('RNM99');
    expect(req.request.body['complement']).toBeNull();
    expect(req.request.body['active']).toBe(0);
    req.flush({ ...mockCustomerApi, id: 3, is_foreign: 1 });
    await promise;
  });

  it('buscarPorId retorna undefined quando HTTP falha', async () => {
    const promise = service.buscarPorId(999);
    httpMock.expectOne(`${url}/999`).flush('Not Found', { status: 404, statusText: 'Not Found' });
    expect(await promise).toBeUndefined();
  });

  it('atualizar faz GET + PUT e retorna cliente atualizado', async () => {
    const promise = service.atualizar(1, { nome: 'João Atualizado' });
    httpMock.expectOne(`${url}/1`).flush(mockCustomerApi);
    await new Promise<void>(r => setTimeout(r, 0));
    httpMock.expectOne(`${url}/1`).flush({ ...mockCustomerApi, name: 'João Atualizado' });
    expect((await promise).nome).toBe('João Atualizado');
  });

  it('atualizar lança erro quando cliente não existe', async () => {
    const promise = service.atualizar(999, { nome: 'X' });
    httpMock.expectOne(`${url}/999`).flush('Not Found', { status: 404, statusText: 'Not Found' });
    await expectAsync(promise).toBeRejectedWithError('Cliente não encontrado');
  });
});
