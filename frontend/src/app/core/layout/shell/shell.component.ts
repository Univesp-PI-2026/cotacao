import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { MATERIAL_IMPORTS } from '../../../shared/material/material.imports';
import { AppAlertComponent } from '../../../shared/components/app-alert/app-alert.component';

type NavItem = {
  label: string;
  path: string;
};

@Component({
  selector: 'app-shell',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css'
})
export class ShellComponent {
  protected readonly navigation: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Clientes', path: '/customers' }
  ];
}
