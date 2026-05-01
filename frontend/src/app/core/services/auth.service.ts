import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario, CredenciaisLogin } from '../models/usuario.model';
import { LoginRequest, LoginResponse } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly CHAVE_TOKEN = 'g05_token';
  private readonly CHAVE_USUARIO = 'g05_usuario';

  usuarioAtualSinal = signal<Usuario | null>(this.carregarUsuarioLocal());

  constructor(private http: HttpClient, private router: Router) {}

  private carregarUsuarioLocal(): Usuario | null {
    const dado = localStorage.getItem(this.CHAVE_USUARIO);
    return dado ? JSON.parse(dado) : null;
  }

  estaAutenticado(): boolean {
    return !!localStorage.getItem(this.CHAVE_TOKEN);
  }

  usuarioAtual(): Usuario | null {
    return this.usuarioAtualSinal();
  }

  async autenticar(credenciais: CredenciaisLogin): Promise<void> {
    const body: LoginRequest = {
      identifier: credenciais.identifier,
      password: credenciais.senha,
    };

    const resposta = await firstValueFrom(
      this.http.post<LoginResponse>(`${environment.apiUrl}/v1/auth/login`, body)
    );

    const usuario: Usuario = {
      id: resposta.user.id,
      nome: resposta.user.name,
      username: resposta.user.username,
      email: resposta.user.email,
      roleId: resposta.user.role_id,
      roleNome: resposta.user.role_name,
      ativo: resposta.user.active === 1,
    };

    localStorage.setItem(this.CHAVE_TOKEN, resposta.token);
    localStorage.setItem(this.CHAVE_USUARIO, JSON.stringify(usuario));
    this.usuarioAtualSinal.set(usuario);
  }

  sair(): void {
    localStorage.removeItem(this.CHAVE_TOKEN);
    localStorage.removeItem(this.CHAVE_USUARIO);
    this.usuarioAtualSinal.set(null);
    this.router.navigate(['/login']);
  }

  obterToken(): string | null {
    return localStorage.getItem(this.CHAVE_TOKEN);
  }
}
