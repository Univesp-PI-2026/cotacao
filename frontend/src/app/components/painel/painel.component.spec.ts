import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { signal } from '@angular/core';
import { PainelComponent } from './painel.component';
import { AuthService } from '../../core/services/auth.service';
import { ClienteService } from '../../core/services/cliente.service';
import { CotacaoService } from '../../core/services/cotacao.service';
import { UsuarioService } from '../../core/services/usuario.service';

describe('PainelComponent', () => {
  let fixture: ComponentFixture<PainelComponent>;
  let component: PainelComponent;

  const mockUsuario = { id: 1, nome: 'Admin Teste', email: 'a@b.com', roleId: 1, ativo: true };
  const mockAuthService = {
    usuarioAtualSinal: signal(mockUsuario),
    usuarioAtual: () => mockUsuario,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PainelComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        { provide: AuthService, useValue: mockAuthService },
        { provide: ClienteService, useValue: { contarTotal: () => Promise.resolve(5) } },
        { provide: CotacaoService, useValue: { contarTotal: () => Promise.resolve(3) } },
        { provide: UsuarioService, useValue: { contarTotal: () => Promise.resolve(2) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PainelComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('deve ser criado', () => expect(component).toBeTruthy());

  it('exibe o primeiro nome do usuário logado', () => {
    expect(component.primeiroNome()).toBe('Admin');
  });

  it('carrega totais dos cards via contarTotal()', () => {
    expect(component.cartoes[0].total).toBe(5);
    expect(component.cartoes[1].total).toBe(3);
    expect(component.cartoes[2].total).toBe(2);
  });

  it('tem 3 cartões de atalho', () => {
    expect(component.cartoes.length).toBe(3);
  });
});
