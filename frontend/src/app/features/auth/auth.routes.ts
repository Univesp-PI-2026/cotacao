import { Routes } from '@angular/router';

import { ForgotPasswordPageComponent } from './pages/forgot-password-page.component';
import { LoginPageComponent } from './pages/login-page.component';
import { SignUpPageComponent } from './pages/sign-up-page.component';

export const authRoutes: Routes = [
  {
    path: 'login',
    component: LoginPageComponent
  },
  {
    path: 'sign-up',
    component: SignUpPageComponent
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordPageComponent
  }
];
