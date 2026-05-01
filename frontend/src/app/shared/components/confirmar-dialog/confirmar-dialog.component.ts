import { Component, Inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface DadosConfirmacao {
  titulo: string;
  mensagem: string;
  textoBotaoConfirmar?: string;
  cor?: 'primary' | 'warn';
}

@Component({
  selector: 'app-confirmar-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ dados.titulo }}</h2>
    <mat-dialog-content>
      <p>{{ dados.mensagem }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button
        mat-flat-button
        [color]="dados.cor || 'primary'"
        [mat-dialog-close]="true"
      >
        {{ dados.textoBotaoConfirmar || 'Confirmar' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ConfirmarDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmarDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public dados: DadosConfirmacao
  ) {}
}
