import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormCotacaoComponent } from './form-cotacao.component';
import { ClienteService } from '../../../core/services/cliente.service';
import { CotacaoService } from '../../../core/services/cotacao.service';
import { Cliente } from '../../../core/models/cliente.model';

describe('FormCotacaoComponent: produtos', () => {
  let component: FormCotacaoComponent;
  const cliente: Cliente = {
    id: 10, nome: 'Cliente Teste', email: 'teste@example.test', estrangeiro: false,
    cpf: '12345678909', dataNascimento: '1990-01-01', ativo: true,
    cep: '01310-100', logradouro: 'Avenida Paulista', numero: '100', complemento: 'Apto 12',
    bairro: 'Bela Vista', cidade: 'São Paulo', estado: 'sp',
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        { provide: CotacaoService, useValue: {} },
        { provide: ClienteService, useValue: { buscarPorId: async () => ({ ...cliente }) } },
        { provide: Router, useValue: { navigate: jasmine.createSpy() } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ clienteId: '10' }) } } },
        { provide: MatSnackBar, useValue: { open: jasmine.createSpy() } },
      ],
    });
    component = TestBed.runInInjectionContext(() => new FormCotacaoComponent(
      TestBed.inject(FormBuilder), TestBed.inject(CotacaoService), TestBed.inject(ClienteService),
      TestBed.inject(Router), TestBed.inject(ActivatedRoute), TestBed.inject(MatSnackBar)
    ));
    await component.ngOnInit();
    component.formulario.patchValue({ dataSolicitacao: '2026-10-31' });
  });

  it('mantém as validações do automóvel como produto inicial', () => {
    expect(component.produto).toBe('auto');
    expect(component.formulario.get('placaVeiculo')?.hasError('required')).toBeTrue();
    expect(component.formulario.get('rendaMensal')?.disabled).toBeTrue();
    expect(component.formulario.get('cepImovel')?.disabled).toBeTrue();
  });

  it('copia todos os campos do endereço como dados editáveis da cotação residencial', () => {
    component.selecionarProduto('home');
    component.usarEnderecoSegurado();
    expect(component.formulario.value).toEqual(jasmine.objectContaining({
      cepImovel: '01310100', logradouroImovel: cliente.logradouro, numeroImovel: '100',
      complementoImovel: 'Apto 12', bairroImovel: 'Bela Vista', cidadeImovel: 'São Paulo', estadoImovel: 'SP',
    }));
    expect(component.formulario.valid).toBeTrue();
    component.formulario.get('numeroImovel')?.setValue('200');
    expect(component.cliente?.numero).toBe('100');
    expect(component.formulario.get('numeroImovel')?.enabled).toBeTrue();
    expect(component.formulario.value.placaVeiculo).toBeUndefined();
  });

  it('pede sinistro na renovação residencial e bônus somente na renovação do automóvel', () => {
    component.selecionarProduto('home');
    component.usarEnderecoSegurado();
    component.formulario.get('tipoSeguro')?.setValue('renovacao');
    expect(component.formulario.get('teveSinistro')?.hasError('required')).toBeTrue();
    expect(component.formulario.get('classeBonus')?.disabled).toBeTrue();
    component.formulario.get('teveSinistro')?.setValue(false);
    expect(component.formulario.valid).toBeTrue();
    component.selecionarProduto('auto');
    expect(component.formulario.get('classeBonus')?.hasError('required')).toBeTrue();
  });

  it('cartão exige apenas renda, profissão, cliente e data', () => {
    component.selecionarProduto('credit_card');
    expect(component.formulario.invalid).toBeTrue();
    component.formulario.patchValue({ rendaMensal: 4500.75, profissao: 'Professora' });
    expect(component.formulario.valid).toBeTrue();
    expect(component.formulario.value.tipoSeguro).toBeUndefined();
    expect(component.formulario.value.cepImovel).toBeUndefined();
    expect(component.formulario.value.placaVeiculo).toBeUndefined();
  });

  it('rejeita renda inválida e profissão em branco', () => {
    component.selecionarProduto('credit_card');
    for (const rendaMensal of [0, -1, 1.234, 100000000000]) {
      component.formulario.patchValue({ rendaMensal, profissao: 'Professora' });
      expect(component.formulario.invalid).withContext(String(rendaMensal)).toBeTrue();
    }
    component.formulario.patchValue({ rendaMensal: 5000, profissao: '  ' });
    expect(component.formulario.invalid).toBeTrue();
  });

  it('restaura as validações ao alternar entre os produtos', () => {
    component.selecionarProduto('home');
    component.usarEnderecoSegurado();
    expect(component.formulario.valid).toBeTrue();
    component.selecionarProduto('credit_card');
    expect(component.formulario.get('rendaMensal')?.hasError('required')).toBeTrue();
    component.selecionarProduto('auto');
    expect(component.formulario.get('placaVeiculo')?.hasError('required')).toBeTrue();
    component.selecionarProduto('home');
    expect(component.formulario.valid).toBeTrue();
  });
});
