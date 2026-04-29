import { Component } from '@angular/core';

import { PageCardComponent } from '../../../shared/components/page-card/page-card.component';

@Component({
  selector: 'app-customers-page',
  imports: [PageCardComponent],
  templateUrl: './customers-page.component.html',
  styleUrl: './customers-page.component.css'
})
export class CustomersPageComponent {}
