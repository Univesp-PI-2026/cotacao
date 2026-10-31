import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CotacaoService } from '../../../core/services/cotacao.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { Cliente } from '../../../core/models/cliente.model';
import { PRODUTOS_COTACAO, ProdutoCotacao } from '../../../core/models/cotacao.model';

@Component({
  selector: 'app-form-cotacao',
  standalone: true,
  providers: [{ provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } }],
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './form-cotacao.component.html',
  styleUrl: './form-cotacao.component.scss',
})
export class FormCotacaoComponent implements OnInit {
  formulario: FormGroup;
  carregando = false;
  editando = false;
  cotacaoId?: number;
  cliente?: Cliente;
  produtos = PRODUTOS_COTACAO;
  estados = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
    'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
  private readonly destroyRef = inject(DestroyRef);
  private readonly camposAuto = ['placaVeiculo', 'chassi', 'marca', 'modelo', 'anoFabricacao',
    'cepPernoite', 'idadeCondutor', 'tempoHabilitacao'];
  private readonly camposImovel = ['cepImovel', 'logradouroImovel', 'numeroImovel', 'complementoImovel',
    'bairroImovel', 'cidadeImovel', 'estadoImovel'];

  constructor(
    private fb: FormBuilder,
    private cotacaoService: CotacaoService,
    private clienteService: ClienteService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.formulario = this.fb.group({
      clienteId: [null, Validators.required],
      produto: ['auto', Validators.required],
      dataSolicitacao: ['', Validators.required],
      tipoSeguro: ['novo', Validators.required],
      classeBonus: [''],
      teveSinistro: [null],
      placaVeiculo: ['', [Validators.required, Validators.maxLength(10)]],
      chassi: ['', [Validators.required, Validators.maxLength(50)]],
      marca: ['', Validators.required],
      modelo: ['', Validators.required],
      anoFabricacao: [
        '',
        [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear() + 1)],
      ],
      cepPernoite: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      idadeCondutor: ['', [Validators.required, Validators.min(18), Validators.max(100)]],
      tempoHabilitacao: ['', Validators.required],
      coberturas: [''],
      temSeguradoraPreferida: [false, Validators.required],
      seguradoraPreferida: [''],
      cepImovel: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      logradouroImovel: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(255)]],
      numeroImovel: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(30)]],
      complementoImovel: ['', Validators.maxLength(255)],
      bairroImovel: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(120)]],
      cidadeImovel: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(120)]],
      estadoImovel: ['', Validators.required],
      rendaMensal: [null, [Validators.required, Validators.min(0.01), Validators.max(99999999999.99),
        Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      profissao: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(255)]],
    });
    this.atualizarProduto();
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    const clienteId = this.route.snapshot.paramMap.get('clienteId');

    if (id && id !== 'nova') {
      this.editando = true;
      this.cotacaoId = +id;
      const cotacao = await this.cotacaoService.buscarPorId(this.cotacaoId);
      if (cotacao) {
        this.formulario.patchValue(cotacao);
        this.cliente = await this.clienteService.buscarPorId(cotacao.clienteId);
      }
    } else if (clienteId) {
      this.cliente = await this.clienteService.buscarPorId(+clienteId);
      if (this.cliente) {
        this.formulario.patchValue({ clienteId: this.cliente.id });
      }
    }

    // Controles condicionais
    this.formulario.get('produto')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.atualizarProduto();
    });

    this.formulario.get('tipoSeguro')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.atualizarValidacoesRenovacao();
    });

    this.formulario.get('temSeguradoraPreferida')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.atualizarValidacaoSeguradora();
    });

    this.atualizarProduto();
  }

  get produto(): ProdutoCotacao {
    return this.formulario.get('produto')?.value ?? 'auto';
  }

  get ehSeguro(): boolean {
    return this.produto !== 'credit_card';
  }

  selecionarProduto(produto: ProdutoCotacao): void {
    this.formulario.get('produto')?.setValue(produto);
  }

  atualizarProduto(): void {
    const alternar = (campos: string[], habilitado: boolean) => campos.forEach((nome) => {
      const controle = this.formulario.get(nome)!;
      if (habilitado) controle.enable({ emitEvent: false });
      else controle.disable({ emitEvent: false });
    });
    alternar(this.camposAuto, this.produto === 'auto');
    alternar(this.camposImovel, this.produto === 'home');
    alternar(['rendaMensal', 'profissao'], this.produto === 'credit_card');
    alternar(['tipoSeguro', 'coberturas', 'temSeguradoraPreferida'], this.ehSeguro);
    this.atualizarValidacoesRenovacao();
    this.atualizarValidacaoSeguradora();
  }

  usarEnderecoSegurado(): void {
    if (!this.cliente) return;
    this.formulario.patchValue({
      cepImovel: this.cliente.cep.replace(/\D/g, ''),
      logradouroImovel: this.cliente.logradouro,
      numeroImovel: this.cliente.numero,
      complementoImovel: this.cliente.complemento ?? '',
      bairroImovel: this.cliente.bairro,
      cidadeImovel: this.cliente.cidade,
      estadoImovel: this.cliente.estado.toUpperCase(),
    });
    this.camposImovel.forEach((campo) => this.formulario.get(campo)?.markAsDirty());
    this.snackBar.open('Endereço do segurado copiado. Você pode ajustar os campos.', 'Fechar', { duration: 3000 });
  }

  atualizarValidacoesRenovacao(): void {
    const renovacao = this.ehRenovacao;
    const classeBonus = this.formulario.get('classeBonus')!;
    const teveSinistro = this.formulario.get('teveSinistro')!;

    if (renovacao && this.produto === 'auto') {
      classeBonus.enable({ emitEvent: false });
      classeBonus.setValidators(Validators.required);
    } else {
      classeBonus.disable({ emitEvent: false });
    }
    if (renovacao) {
      teveSinistro.enable({ emitEvent: false });
      teveSinistro.setValidators(Validators.required);
    } else {
      teveSinistro.disable({ emitEvent: false });
    }
    classeBonus.updateValueAndValidity();
    teveSinistro.updateValueAndValidity();
  }

  atualizarValidacaoSeguradora(): void {
    const temPreferencia = this.formulario.get('temSeguradoraPreferida')?.value === true ||
      this.formulario.get('temSeguradoraPreferida')?.value === 'true';
    const seguradora = this.formulario.get('seguradoraPreferida')!;

    if (this.ehSeguro && temPreferencia) {
      seguradora.enable({ emitEvent: false });
      seguradora.setValidators(Validators.required);
    } else {
      seguradora.disable({ emitEvent: false });
    }
    seguradora.updateValueAndValidity();
  }

  get ehRenovacao(): boolean {
    return this.ehSeguro && this.formulario.get('tipoSeguro')?.value === 'renovacao';
  }

  get temSeguradora(): boolean {
    const val = this.formulario.get('temSeguradoraPreferida')?.value;
    return val === true || val === 'true';
  }

  async salvar(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.carregando = true;
    try {
      const valores = this.formulario.value;
      const dadosCotacao = {
        ...valores,
        clienteNome: this.cliente?.nome ?? '',
        clienteCpf: this.cliente?.cpf ?? '',
        clienteEmail: this.cliente?.email ?? '',
        ativo: true,
      };

      if (this.editando && this.cotacaoId) {
        await this.cotacaoService.atualizar(this.cotacaoId, dadosCotacao);
        this.snackBar.open('Cotação atualizada com sucesso!', 'Fechar', {
          duration: 3000,
          panelClass: 'snack-sucesso',
        });
      } else {
        await this.cotacaoService.criar(dadosCotacao);
        this.snackBar.open('Cotação criada com sucesso!', 'Fechar', {
          duration: 3000,
          panelClass: 'snack-sucesso',
        });
      }
      this.router.navigate(['/cotacoes']);
    } catch {
      this.snackBar.open('Erro ao salvar cotação.', 'Fechar', {
        duration: 3000,
        panelClass: 'snack-erro',
      });
    } finally {
      this.carregando = false;
    }
  }
}
