import { Routes } from '@angular/router';

import { ShellComponent } from './core/layout/shell/shell.component';
import { NotFoundPageComponent } from './core/pages/not-found/not-found-page.component';
import { authRoutes } from './features/auth/auth.routes';
import { customersRoutes } from './features/customers/customers.routes';
import { dashboardRoutes } from './features/dashboard/dashboard.routes';
import { policiesRoutes } from './features/policies/policies.routes';
import { reportsRoutes } from './features/reports/reports.routes';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },
  ...authRoutes,
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      ...dashboardRoutes,
      ...customersRoutes,
      ...policiesRoutes,
      ...reportsRoutes
    ]
  },
  {
    path: '**',
    component: NotFoundPageComponent
  }
];
