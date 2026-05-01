import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario } from '../models/usuario.model';
import { Role } from '../models/role.model';

interface UserApi {
  id: number;
  role_id: number;
  role_name?: string;
  name: string;
  username: string;
  email: string;
  active: number;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly url = `${environment.apiUrl}/v1/users`;

  constructor(private http: HttpClient) {}

  private fromApi(u: UserApi): Usuario {
    return {
      id: u.id,
      nome: u.name,
      username: u.username,
      email: u.email,
      roleId: u.role_id,
      roleNome: u.role_name,
      ativo: u.active === 1,
    };
  }

  private toApi(u: Omit<Usuario, 'id'>): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      name: u.nome,
      username: u.username ?? u.email.split('@')[0],
      email: u.email,
      role_id: u.roleId,
      active: u.ativo ? 1 : 0,
    };
    if (u.senha) {
      payload['password'] = u.senha;
    }
    return payload;
  }

  async listar(): Promise<Usuario[]> {
    const resp = await firstValueFrom(
      this.http.get<{ data: UserApi[]; total: number }>(this.url)
    );
    return resp.data.map((u) => this.fromApi(u));
  }

  async contarTotal(): Promise<number> {
    const resp = await firstValueFrom(
      this.http.get<{ total: number }>(`${this.url}/count`)
    );
    return resp.total;
  }

  async buscarPorId(id: number): Promise<Usuario | undefined> {
    try {
      const u = await firstValueFrom(this.http.get<UserApi>(`${this.url}/${id}`));
      return this.fromApi(u);
    } catch {
      return undefined;
    }
  }

  async criar(usuario: Omit<Usuario, 'id'>): Promise<Usuario> {
    const u = await firstValueFrom(
      this.http.post<UserApi>(this.url, this.toApi(usuario))
    );
    return this.fromApi(u);
  }

  async atualizar(id: number, dados: Partial<Usuario>): Promise<Usuario> {
    const atual = await this.buscarPorId(id);
    if (!atual) throw new Error('Usuário não encontrado');
    const merged: Omit<Usuario, 'id'> = { ...atual, ...dados };
    const u = await firstValueFrom(
      this.http.put<UserApi>(`${this.url}/${id}`, this.toApi(merged))
    );
    return this.fromApi(u);
  }

  async excluir(id: number): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.url}/${id}`));
  }

  async obterRoles(): Promise<{ id: number; nome: string }[]> {
    const roles = await firstValueFrom(
      this.http.get<Role[]>(`${environment.apiUrl}/v1/roles`)
    );
    return roles.map((r) => ({ id: r.id, nome: r.name }));
  }
}
