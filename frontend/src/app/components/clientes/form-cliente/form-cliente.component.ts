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
import { ClienteService } from '../../../core/services/cliente.service';
import { CepService } from '../../../core/services/cep.service';

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

@Component({
  selector: 'app-form-cliente',
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
  templateUrl: './form-cliente.component.html',
  styleUrl: './form-cliente.component.scss',
})
export class FormClienteComponent implements OnInit {
  formulario: FormGroup;
  carregando = false;
  buscandoCep = false;
  editando = false;
  clienteId?: number;
  estados = ESTADOS_BR;

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private cepService: CepService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.formulario = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(255)]],
      email: ['', [Validators.required, Validators.email]],
      dataNascimento: ['', Validators.required],
      estrangeiro: [false, Validators.required],
      cpf: [''],
      rnm: [''],
      cep: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      logradouro: ['', Validators.required],
      numero: ['', Validators.required],
      complemento: [''],
      bairro: ['', Validators.required],
      cidade: ['', Validators.required],
      estado: ['', Validators.required],
    });
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'novo') {
      this.editando = true;
      this.clienteId = +id;
      const cliente = await this.clienteService.buscarPorId(this.clienteId);
      if (cliente) {
        this.formulario.patchValue(cliente);
      }
    }

    // Atualiza validações quando estrangeiro muda
    this.formulario.get('estrangeiro')?.valueChanges.subscribe((estrangeiro) => {
      this.atualizarValidacoesCpfRnm(estrangeiro);
    });
    this.atualizarValidacoesCpfRnm(false);
  }

  atualizarValidacoesCpfRnm(estrangeiro: boolean): void {
    const cpfCtrl = this.formulario.get('cpf')!;
    const rnmCtrl = this.formulario.get('rnm')!;
    if (estrangeiro) {
      cpfCtrl.clearValidators();
      rnmCtrl.setValidators(Validators.required);
    } else {
      rnmCtrl.clearValidators();
      cpfCtrl.setValidators(Validators.required);
    }
    cpfCtrl.updateValueAndValidity();
    rnmCtrl.updateValueAndValidity();
  }

  buscarCep(): void {
    const cep = this.formulario.get('cep')?.value ?? '';
    if (cep.replace(/\D/g, '').length !== 8) return;

    this.buscandoCep = true;
    this.cepService.buscarCep(cep).subscribe({
      next: (resposta) => {
        this.formulario.patchValue({
          logradouro: resposta.logradouro,
          bairro: resposta.bairro,
          cidade: resposta.cidade,
          estado: resposta.estado.toUpperCase(),
        });
        this.buscandoCep = false;
      },
      error: () => {
        this.snackBar.open('CEP não encontrado.', 'Fechar', {
          duration: 3000,
          panelClass: 'snack-erro',
        });
        this.buscandoCep = false;
      },
    });
  }

  async salvar(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.carregando = true;
    try {
      if (this.editando && this.clienteId) {
        await this.clienteService.atualizar(this.clienteId, this.formulario.value);
        this.snackBar.open('Cliente atualizado com sucesso!', 'Fechar', {
          duration: 3000,
          panelClass: 'snack-sucesso',
        });
      } else {
        await this.clienteService.criar({ ...this.formulario.value, ativo: true });
        this.snackBar.open('Cliente criado com sucesso!', 'Fechar', {
          duration: 3000,
          panelClass: 'snack-sucesso',
        });
      }
      this.router.navigate(['/clientes']);
    } catch {
      this.snackBar.open('Erro ao salvar cliente.', 'Fechar', {
        duration: 3000,
        panelClass: 'snack-erro',
      });
    } finally {
      this.carregando = false;
    }
  }

  get estrangeiro(): boolean {
    return this.formulario.get('estrangeiro')?.value === true ||
      this.formulario.get('estrangeiro')?.value === 'true';
  }
}
