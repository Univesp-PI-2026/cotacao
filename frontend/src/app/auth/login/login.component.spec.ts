import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['autenticar']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve ser criado', () => expect(component).toBeTruthy());

  it('formulário inválido não chama autenticar', async () => {
    component.formulario.setValue({ identifier: '', senha: '' });
    await component.entrar();
    expect(authServiceSpy.autenticar).not.toHaveBeenCalled();
  });

  it('formulário inválido marca campos como touched', async () => {
    component.formulario.setValue({ identifier: '', senha: '' });
    await component.entrar();
    expect(component.formulario.get('identifier')?.touched).toBeTrue();
  });

  it('erro HTTP 401 exibe snackbar com mensagem de credenciais inválidas', async () => {
    const { HttpErrorResponse } = await import('@angular/common/http');
    authServiceSpy.autenticar.and.rejectWith(
      new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })
    );
    component.formulario.setValue({ identifier: 'admin', senha: 'wrongpass' });
    await component.entrar();
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Usuário ou senha inválidos.', 'Fechar', jasmine.any(Object)
    );
  });

  it('sucesso no login navega para /painel', async () => {
    authServiceSpy.autenticar.and.resolveTo();
    component.formulario.setValue({ identifier: 'admin', senha: '12345678' });
    await component.entrar();
    expect(authServiceSpy.autenticar).toHaveBeenCalledWith({ identifier: 'admin', senha: '12345678' });
  });
});
