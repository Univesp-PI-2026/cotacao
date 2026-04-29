import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-card',
  imports: [CommonModule],
  template: `
    <section class="page-card">
      <header class="page-card__header" *ngIf="title()">
        <h2>{{ title() }}</h2>
        <p *ngIf="description()">{{ description() }}</p>
      </header>
      <ng-content />
    </section>
  `,
  styles: [
    `
      .page-card {
        padding: 24px;
        border: 1px solid var(--line);
        border-radius: 24px;
        background: var(--surface);
        box-shadow: var(--shadow);
      }

      .page-card__header {
        margin-bottom: 20px;
      }

      h2 {
        margin: 0 0 6px;
        font-size: 1.35rem;
      }

      p {
        margin: 0;
        color: var(--muted);
      }
    `
  ]
})
export class PageCardComponent {
  readonly title = input<string>('');
  readonly description = input<string>('');
}
