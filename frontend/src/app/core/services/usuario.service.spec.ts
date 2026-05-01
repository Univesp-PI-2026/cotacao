import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { UsuarioService } from './usuario.service';
import { environment } from '../../../environments/environment';

const mockUserApi = {
  id: 1, role_id: 1, role_name: 'admin',
  name: 'Admin', username: 'admin',
  email: 'admin@test.com', active: 1,
};

describe('UsuarioService', () => {
  let service: UsuarioService;
  let httpMock: HttpTestingController;
  const url = `${environment.apiUrl}/v1/users`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        UsuarioService,
      ],
    });
    service = TestBed.inject(UsuarioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('deve ser criado', () => expect(service).toBeTruthy());

  it('listar faz GET e mapeia campos EN→PT', async () => {
    const promise = service.listar();
    httpMock.expectOne(url).flush({ data: [mockUserApi], total: 1 });
    const usuarios = await promise;
    expect(usuarios[0].nome).toBe('Admin');
    expect(usuarios[0].roleId).toBe(1);
    expect(usuarios[0].ativo).toBeTrue();
  });

  it('contarTotal faz GET /count', async () => {
    const promise = service.contarTotal();
    httpMock.expectOne(`${url}/count`).flush({ total: 2 });
    expect(await promise).toBe(2);
  });

  it('obterRoles faz GET /v1/roles e mapeia name→nome', async () => {
    const promise = service.obterRoles();
    httpMock.expectOne(`${environment.apiUrl}/v1/roles`).flush([
      { id: 1, name: 'admin', active: 1 },
      { id: 2, name: 'operador', active: 1 },
    ]);
    const roles = await promise;
    expect(roles.length).toBe(2);
    expect(roles[0].nome).toBe('admin');
  });

  it('criar faz POST com payload PT→EN', async () => {
    const promise = service.criar({
      nome: 'Novo', username: 'novo', email: 'novo@test.com',
      senha: 'senha123', roleId: 2, ativo: true,
    });
    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body['name']).toBe('Novo');
    expect(req.request.body['password']).toBe('senha123');
    req.flush({ ...mockUserApi, id: 2, name: 'Novo' });
    const criado = await promise;
    expect(criado.nome).toBe('Novo');
  });

  it('excluir faz DELETE /:id', async () => {
    const promise = service.excluir(1);
    const req = httpMock.expectOne(`${url}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    await promise;
  });

  it('listar mapeia active=0 para ativo=false', async () => {
    const promise = service.listar();
    httpMock.expectOne(url).flush({ data: [{ ...mockUserApi, active: 0 }], total: 1 });
    const usuarios = await promise;
    expect(usuarios[0].ativo).toBeFalse();
  });

  it('buscarPorId retorna undefined quando HTTP falha', async () => {
    const promise = service.buscarPorId(999);
    httpMock.expectOne(`${url}/999`).flush('Error', { status: 404, statusText: 'Not Found' });
    expect(await promise).toBeUndefined();
  });

  it('atualizar faz GET + PUT sem password quando dados não têm senha', async () => {
    const promise = service.atualizar(1, { nome: 'Novo Nome' });
    httpMock.expectOne(`${url}/1`).flush(mockUserApi);
    await new Promise<void>(r => setTimeout(r, 0));
    const putReq = httpMock.expectOne(`${url}/1`);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body['password']).toBeUndefined();
    putReq.flush({ ...mockUserApi, name: 'Novo Nome' });
    expect((await promise).nome).toBe('Novo Nome');
  });

  it('atualizar lança erro quando usuario não existe', async () => {
    const promise = service.atualizar(999, { nome: 'X' });
    httpMock.expectOne(`${url}/999`).flush('Error', { status: 404, statusText: 'Not Found' });
    await expectAsync(promise).toBeRejectedWithError('Usuário não encontrado');
  });
});
