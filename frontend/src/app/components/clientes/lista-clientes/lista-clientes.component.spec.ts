import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { ListaClientesComponent } from './lista-clientes.component';
import { ClienteService } from '../../../core/services/cliente.service';
import { Cliente } from '../../../core/models/cliente.model';

const mockCliente: Cliente = {
  id: 1, nome: 'Maria Silva', email: 'maria@test.com',
  estrangeiro: false, cpf: '123.456.789-00',
  dataNascimento: '1985-03-15', cep: '01310100',
  logradouro: 'Av. Paulista', numero: '1000',
  bairro: 'Bela Vista', cidade: 'São Paulo', estado: 'SP', ativo: true,
};

describe('ListaClientesComponent', () => {
  let fixture: ComponentFixture<ListaClientesComponent>;
  let component: ListaClientesComponent;
  let clienteServiceSpy: jasmine.SpyObj<ClienteService>;
  let dialogOpenSpy: jasmine.Spy;
  let snackBarOpenSpy: jasmine.Spy;

  beforeEach(async () => {
    clienteServiceSpy = jasmine.createSpyObj('ClienteService', ['listar', 'excluir']);
    clienteServiceSpy.listar.and.resolveTo([mockCliente]);
    clienteServiceSpy.excluir.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [ListaClientesComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        { provide: ClienteService, useValue: clienteServiceSpy },
        { provide: MatSnackBar, useValue: jasmine.createSpyObj('MatSnackBar', ['open']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaClientesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    dialogOpenSpy = spyOn((component as any)['dialog'], 'open');
    snackBarOpenSpy = spyOn((component as any)['snackBar'], 'open');
  });

  it('deve ser criado', () => expect(component).toBeTruthy());

  it('carrega clientes no ngOnInit', () => {
    expect(clienteServiceSpy.listar).toHaveBeenCalled();
    expect(component.clientes.length).toBe(1);
  });

  it('filtrar por nome funciona', () => {
    component.termoBusca = 'Maria';
    component.filtrar();
    expect(component.clientesFiltrados.length).toBe(1);
  });

  it('filtrar sem termo retorna todos', () => {
    component.termoBusca = '';
    component.filtrar();
    expect(component.clientesFiltrados.length).toBe(1);
  });

  it('filtrar por termo sem match retorna lista vazia', () => {
    component.termoBusca = 'Inexistente';
    component.filtrar();
    expect(component.clientesFiltrados.length).toBe(0);
  });

  it('confirmarExclusao abre dialog', () => {
    dialogOpenSpy.and.returnValue({ afterClosed: () => of(false) } as any);
    component.confirmarExclusao(mockCliente);
    expect(dialogOpenSpy).toHaveBeenCalled();
  });

  it('confirmarExclusao chama excluir ao confirmar', async () => {
    dialogOpenSpy.and.returnValue({ afterClosed: () => of(true) } as any);
    component.confirmarExclusao(mockCliente);
    await fixture.whenStable();
    expect(clienteServiceSpy.excluir).toHaveBeenCalledWith(1);
  });
});
