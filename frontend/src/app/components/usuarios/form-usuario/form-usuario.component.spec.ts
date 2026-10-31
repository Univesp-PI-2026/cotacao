import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormUsuarioComponent } from './form-usuario.component';
import { UsuarioService } from '../../../core/services/usuario.service';

describe('FormUsuarioComponent: erros ao salvar', () => {
  let component: FormUsuarioComponent;
  let usuarios: jasmine.SpyObj<UsuarioService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    usuarios = jasmine.createSpyObj<UsuarioService>('UsuarioService', ['obterRoles', 'criar', 'atualizar']);
    usuarios.obterRoles.and.resolveTo([{ id: 2, nome: 'corretor' }]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    TestBed.configureTestingModule({ providers: [FormBuilder,
      { provide: UsuarioService, useValue: usuarios },
      { provide: Router, useValue: router },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({}) } } },
      { provide: MatSnackBar, useValue: snackBar },
    ] });
    component = TestBed.runInInjectionContext(() => new FormUsuarioComponent(
      TestBed.inject(FormBuilder), usuarios, router, TestBed.inject(ActivatedRoute), snackBar));
    await component.ngOnInit();
    component.formulario.patchValue({ nome: 'Teste', username: 'teste', email: 'teste@example.test',
      senha: '12345678', roleId: 2 });
  });

  for (const editando of [false, true]) {
    it(`exibe o e-mail duplicado ao ${editando ? 'atualizar' : 'criar'} usuário e mantém o formulário`, async () => {
      component.editando = editando;
      component.usuarioId = editando ? 10 : undefined;
      const erro = new HttpErrorResponse({ status: 400,
        error: { message: 'Dados invalidos', errors: ['Este e-mail já está cadastrado para outro usuário.'] } });
      usuarios.criar.and.rejectWith(erro);
      usuarios.atualizar.and.rejectWith(erro);
      await component.salvar();
      expect(snackBar.open.calls.mostRecent().args[0]).toBe('Este e-mail já está cadastrado para outro usuário.');
      expect(router.navigate).not.toHaveBeenCalled();
      expect(component.formulario.get('email')!.value).toBe('teste@example.test');
      expect(component.carregando).toBeFalse();
    });
  }

  it('mantém detalhes internos de erros do servidor fora da mensagem', async () => {
    usuarios.criar.and.rejectWith(new HttpErrorResponse({ status: 500,
      error: { detail: 'SQL com dados privados', message: 'Erro interno' } }));
    await component.salvar();
    expect(snackBar.open.calls.mostRecent().args[0]).toBe('Erro ao salvar usuário.');
    expect(component.carregando).toBeFalse();
  });
});
