import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/painel', pathMatch: 'full' },

  // ─── Rotas públicas (guest) ─────────────────────────────────────────────────
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./auth/login/login.component').then((m) => m.LoginComponent),
  },

  // ─── Rotas protegidas (shell com sidenav) ────────────────────────────────────
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: 'painel',
        loadComponent: () =>
          import('./components/painel/painel.component').then((m) => m.PainelComponent),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./components/perfil/perfil.component').then((m) => m.PerfilComponent),
      },
      // ─── Clientes ────────────────────────────────────────────────────────────
      {
        path: 'clientes',
        loadComponent: () =>
          import('./components/clientes/lista-clientes/lista-clientes.component').then(
            (m) => m.ListaClientesComponent
          ),
      },
      {
        path: 'clientes/novo',
        loadComponent: () =>
          import('./components/clientes/form-cliente/form-cliente.component').then(
            (m) => m.FormClienteComponent
          ),
      },
      {
        path: 'clientes/:id',
        loadComponent: () =>
          import('./components/clientes/form-cliente/form-cliente.component').then(
            (m) => m.FormClienteComponent
          ),
      },
      // ─── Cotações ─────────────────────────────────────────────────────────────
      {
        path: 'cotacoes',
        loadComponent: () =>
          import('./components/cotacoes/lista-cotacoes/lista-cotacoes.component').then(
            (m) => m.ListaCotacoesComponent
          ),
      },
      {
        path: 'cotacoes/nova/:clienteId',
        loadComponent: () =>
          import('./components/cotacoes/form-cotacao/form-cotacao.component').then(
            (m) => m.FormCotacaoComponent
          ),
      },
      {
        path: 'cotacoes/:id',
        loadComponent: () =>
          import('./components/cotacoes/form-cotacao/form-cotacao.component').then(
            (m) => m.FormCotacaoComponent
          ),
      },
      // ─── Usuários ─────────────────────────────────────────────────────────────
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./components/usuarios/lista-usuarios/lista-usuarios.component').then(
            (m) => m.ListaUsuariosComponent
          ),
      },
      {
        path: 'usuarios/novo',
        loadComponent: () =>
          import('./components/usuarios/form-usuario/form-usuario.component').then(
            (m) => m.FormUsuarioComponent
          ),
      },
      {
        path: 'usuarios/:id',
        loadComponent: () =>
          import('./components/usuarios/form-usuario/form-usuario.component').then(
            (m) => m.FormUsuarioComponent
          ),
      },
    ],
  },

  { path: '**', redirectTo: '/painel' },
];
