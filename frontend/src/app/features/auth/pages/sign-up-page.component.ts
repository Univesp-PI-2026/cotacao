import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-sign-up-page',
  imports: [RouterLink, MatButtonModule, MatCardModule],
  template: `
    <div class="layout-page-centered">
      <mat-card class="surface-card">
        <mat-card-header>
          <mat-card-title>Cadastro</mat-card-title>
          <mat-card-subtitle>Página reservada para implementação futura.</mat-card-subtitle>
        </mat-card-header>
        <mat-card-actions>
          <a mat-button routerLink="/login" color="primary">Voltar ao login</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `
})
export class SignUpPageComponent {}
