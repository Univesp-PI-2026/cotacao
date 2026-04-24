import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './app-alert.component.html',
  styleUrl: './app-alert.component.scss'
})
export class AppAlertComponent {
  message = input<string | null>(null);
  type = input<'error' | 'success' | 'warning' | 'info'>('error');
}
