import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  template: `
    <section class="not-found">
      <h1>404</h1>
      <p>A página solicitada não foi encontrada.</p>
      <a routerLink="/dashboard">Voltar ao dashboard</a>
    </section>
  `,
  styles: [
    `
      .not-found {
        min-height: 100vh;
        display: grid;
        place-items: center;
        align-content: center;
        gap: 12px;
        text-align: center;
      }

      h1,
      p {
        margin: 0;
      }

      a {
        color: var(--primary);
      }
    `
  ]
})
export class NotFoundPageComponent {}
