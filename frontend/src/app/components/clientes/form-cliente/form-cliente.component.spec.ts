import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormClienteComponent } from './form-cliente.component';
import { ClienteService } from '../../../core/services/cliente.service';
import { CepService } from '../../../core/services/cep.service';

describe('FormClienteComponent: validação e cadastro', () => {
  let component: FormClienteComponent;
  let clientes: jasmine.SpyObj<ClienteService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    clientes = jasmine.createSpyObj<ClienteService>('ClienteService', ['criar', 'atualizar']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        { provide: ClienteService, useValue: clientes },
        { provide: CepService, useValue: {} },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({}) } } },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
    component = TestBed.runInInjectionContext(() => new FormClienteComponent(
      TestBed.inject(FormBuilder), clientes, TestBed.inject(CepService),
      router, TestBed.inject(ActivatedRoute), snackBar
    ));
    await component.ngOnInit();
    component.formulario.patchValue({
      nome: 'Cliente teste', email: 'teste@example.test', cpf: '12345678909',
      estrangeiro: false, dataNascimento: '1990-05-10', cep: '01310100',
      logradouro: 'Avenida Paulista', numero: '100', bairro: 'Bela Vista',
      cidade: 'São Paulo', estado: 'SP',
    });
  });

  async function falhar(erro: unknown): Promise<string> {
    clientes.criar.and.rejectWith(erro);
    await component.salvar();
    expect(component.carregando).toBeFalse();
    expect(router.navigate).not.toHaveBeenCalled();
    return snackBar.open.calls.mostRecent().args[0];
  }

  it('impede salvar e destaca o campo quando o e-mail não tem um domínio completo', async () => {
    component.formulario.patchValue({ email: '1@1' });

    await component.salvar();

    const email = component.formulario.get('email')!;
    expect(email.hasError('pattern')).toBeTrue();
    expect(email.touched).toBeTrue();
    expect(clientes.criar).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.carregando).toBeFalse();
  });

  it('aceita e-mails com subdomínio e sinal de mais', () => {
    component.formulario.patchValue({ email: 'cliente+seguro@contato.example.com.br' });
    expect(component.formulario.get('email')!.valid).toBeTrue();
  });

  it('mostra os erros de validação retornados pela API', async () => {
    const mensagem = await falhar(new HttpErrorResponse({
      status: 400, error: { message: 'Dados inválidos', errors: ['CPF já cadastrado.', 'E-mail já cadastrado.'] },
    }));
    expect(mensagem).toBe('CPF já cadastrado. E-mail já cadastrado.');
  });

  it('orienta entrar novamente quando a sessão expirou', async () => {
    expect(await falhar(new HttpErrorResponse({ status: 401 })))
      .toBe('Sua sessão expirou. Entre novamente para salvar o cliente.');
  });

  for (const campo of ['e-mail', 'CPF', 'RNM']) {
    it(`mostra a duplicidade específica de ${campo} ao editar, sem apagar os dados`, async () => {
      component.editando = true;
      component.clienteId = 10;
      const mensagem = `Este ${campo} já está cadastrado para outro cliente.`;
      clientes.atualizar.and.rejectWith(new HttpErrorResponse({ status: 400,
        error: { message: 'Dados invalidos', errors: [mensagem] } }));
      await component.salvar();
      expect(snackBar.open.calls.mostRecent().args[0]).toBe(mensagem);
      expect(router.navigate).not.toHaveBeenCalled();
      expect(component.formulario.get('nome')!.value).toBe('Cliente teste');
      expect(component.carregando).toBeFalse();
    });
  }

  it('distingue falta de conexão de erros no cadastro', async () => {
    expect(await falhar(new HttpErrorResponse({ status: 0 })))
      .toContain('Não foi possível conectar ao servidor.');
  });

  it('informa quando o usuário não tem permissão', async () => {
    expect(await falhar(new HttpErrorResponse({ status: 403 })))
      .toBe('Você não tem permissão para salvar este cliente.');
  });

  it('usa a mensagem pública da API se não houver uma lista de validações', async () => {
    expect(await falhar(new HttpErrorResponse({
      status: 422, error: { message: 'Confira a data de nascimento.' },
    }))).toBe('Confira a data de nascimento.');
  });

  it('não mostra detalhes internos do banco para o usuário', async () => {
    expect(await falhar(new HttpErrorResponse({
      status: 500, error: { message: 'Falha ao criar cliente', detail: 'SQL com dados privados' },
    }))).toBe('Erro ao salvar cliente. Tente novamente.');
  });

  it('mantém o cadastro bem-sucedido e a navegação para a lista', async () => {
    clientes.criar.and.resolveTo({ id: 1, ...component.formulario.value, ativo: true });
    await component.salvar();
    expect(clientes.criar).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/clientes']);
    expect(component.carregando).toBeFalse();
  });
});
