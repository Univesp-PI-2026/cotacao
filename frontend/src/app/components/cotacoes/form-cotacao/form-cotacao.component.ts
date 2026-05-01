import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CotacaoService } from '../../../core/services/cotacao.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { Cliente } from '../../../core/models/cliente.model';

@Component({
  selector: 'app-form-cotacao',
  standalone: true,
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

  constructor(
    private fb: FormBuilder,
    private cotacaoService: CotacaoService,
    private clienteService: ClienteService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.formulario = this.fb.group({
      clienteId: [null],
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
    });
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
    this.formulario.get('tipoSeguro')?.valueChanges.subscribe(() => {
      this.atualizarValidacoesRenovacao();
    });

    this.formulario.get('temSeguradoraPreferida')?.valueChanges.subscribe(() => {
      this.atualizarValidacaoSeguradora();
    });

    this.atualizarValidacoesRenovacao();
    this.atualizarValidacaoSeguradora();
  }

  atualizarValidacoesRenovacao(): void {
    const renovacao = this.formulario.get('tipoSeguro')?.value === 'renovacao';
    const classeBonus = this.formulario.get('classeBonus')!;
    const teveSinistro = this.formulario.get('teveSinistro')!;

    if (renovacao) {
      classeBonus.setValidators(Validators.required);
      teveSinistro.setValidators(Validators.required);
    } else {
      classeBonus.clearValidators();
      teveSinistro.clearValidators();
      classeBonus.setValue('');
      teveSinistro.setValue(null);
    }
    classeBonus.updateValueAndValidity();
    teveSinistro.updateValueAndValidity();
  }

  atualizarValidacaoSeguradora(): void {
    const temPreferencia = this.formulario.get('temSeguradoraPreferida')?.value === true ||
      this.formulario.get('temSeguradoraPreferida')?.value === 'true';
    const seguradora = this.formulario.get('seguradoraPreferida')!;

    if (temPreferencia) {
      seguradora.setValidators(Validators.required);
    } else {
      seguradora.clearValidators();
      seguradora.setValue('');
    }
    seguradora.updateValueAndValidity();
  }

  get ehRenovacao(): boolean {
    return this.formulario.get('tipoSeguro')?.value === 'renovacao';
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
