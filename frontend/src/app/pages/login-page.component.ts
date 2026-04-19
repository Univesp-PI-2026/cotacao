import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected submitting = false;
  protected errorMessage = '';
  protected showPassword = false;

  protected readonly form = this.fb.nonNullable.group({
    identifier: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  constructor() {
    if (this.authService.isAuthenticated()) {
      void this.router.navigate(['/dashboard']);
    }
  }

  protected login(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Preencha usuário e senha.';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    const { identifier, password } = this.form.getRawValue();

    this.authService.login(identifier, password).subscribe({
      next: ({ token, user }) => {
        this.submitting = false;
        this.authService.completeLogin(token, user);
        const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo') || '/dashboard';
        void this.router.navigateByUrl(redirectTo);
      },
      error: (error) => {
        this.submitting = false;
        this.errorMessage = error?.error?.message || 'Não foi possível entrar.';
      }
    });
  }

  protected showFieldError(fieldName: keyof typeof this.form.controls): boolean {
    const field = this.form.controls[fieldName];
    return field.invalid && (field.dirty || field.touched);
  }

  protected togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
