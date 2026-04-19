import { Routes } from '@angular/router';

import { CustomerListPageComponent } from './pages/customer-list-page.component';
import { CustomerDetailPageComponent } from './pages/customer-detail-page.component';
import { QuotationListPageComponent } from './pages/quotation-list-page.component';
import { QuotationDetailPageComponent } from './pages/quotation-detail-page.component';
import { RoleListPageComponent } from './pages/role-list-page.component';
import { RoleDetailPageComponent } from './pages/role-detail-page.component';
import { UserListPageComponent } from './pages/user-list-page.component';
import { UserDetailPageComponent } from './pages/user-detail-page.component';
import { LoginPageComponent } from './pages/login-page.component';
import { DashboardPageComponent } from './pages/dashboard-page.component';
import { ProfilePageComponent } from './pages/profile-page.component';
import { adminGuard, authGuard } from './auth.guard';

export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginPageComponent },
  { path: 'dashboard', component: DashboardPageComponent, canActivate: [authGuard] },
  { path: 'customers', component: CustomerListPageComponent, canActivate: [authGuard] },
  { path: 'customers/new', component: CustomerDetailPageComponent, canActivate: [authGuard] },
  { path: 'customers/:id', component: CustomerDetailPageComponent, canActivate: [authGuard] },
  { path: 'roles', component: RoleListPageComponent, canActivate: [authGuard] },
  { path: 'roles/new', component: RoleDetailPageComponent, canActivate: [authGuard] },
  { path: 'roles/:id', component: RoleDetailPageComponent, canActivate: [authGuard] },
  { path: 'users', component: UserListPageComponent, canActivate: [authGuard, adminGuard] },
  { path: 'users/new', component: UserDetailPageComponent, canActivate: [authGuard, adminGuard] },
  { path: 'users/:id', component: UserDetailPageComponent, canActivate: [authGuard, adminGuard] },
  { path: 'profile', component: ProfilePageComponent, canActivate: [authGuard] },
  { path: 'quotations', component: QuotationListPageComponent, canActivate: [authGuard] },
  { path: 'quotations/new', component: QuotationDetailPageComponent, canActivate: [authGuard] },
  { path: 'quotations/:id', component: QuotationDetailPageComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'dashboard' }
];
