import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cliente } from '../models/cliente.model';

interface CustomerApi {
  id: number;
  name: string;
  email: string;
  is_foreign: number;
  cpf: string | null;
  rnm: string | null;
  birth_date: string;
  zip_code: string;
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city: string;
  state: string;
  active: number;
}

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly url = `${environment.apiUrl}/v1/customers`;

  constructor(private http: HttpClient) {}

  private fromApi(c: CustomerApi): Cliente {
    return {
      id: c.id,
      nome: c.name,
      email: c.email,
      estrangeiro: c.is_foreign === 1,
      cpf: c.cpf ?? undefined,
      rnm: c.rnm ?? undefined,
      dataNascimento: c.birth_date,
      cep: c.zip_code,
      logradouro: c.street,
      numero: c.number,
      complemento: c.complement ?? undefined,
      bairro: c.district,
      cidade: c.city,
      estado: c.state,
      ativo: c.active === 1,
    };
  }

  private toApi(c: Omit<Cliente, 'id'>): Record<string, unknown> {
    return {
      name: c.nome,
      email: c.email,
      is_foreign: c.estrangeiro ? 1 : 0,
      cpf: c.estrangeiro ? null : (c.cpf ?? null),
      rnm: c.estrangeiro ? (c.rnm ?? null) : null,
      birth_date: c.dataNascimento,
      zip_code: c.cep,
      street: c.logradouro,
      number: c.numero,
      complement: c.complemento ?? null,
      district: c.bairro,
      city: c.cidade,
      state: c.estado,
      active: c.ativo ? 1 : 0,
    };
  }

  async listar(): Promise<Cliente[]> {
    const resp = await firstValueFrom(
      this.http.get<{ data: CustomerApi[]; total: number }>(this.url)
    );
    return resp.data.map((c) => this.fromApi(c));
  }

  async contarTotal(): Promise<number> {
    const resp = await firstValueFrom(
      this.http.get<{ total: number }>(`${this.url}/count`)
    );
    return resp.total;
  }

  async buscarPorId(id: number): Promise<Cliente | undefined> {
    try {
      const c = await firstValueFrom(this.http.get<CustomerApi>(`${this.url}/${id}`));
      return this.fromApi(c);
    } catch {
      return undefined;
    }
  }

  async criar(cliente: Omit<Cliente, 'id'>): Promise<Cliente> {
    const c = await firstValueFrom(
      this.http.post<CustomerApi>(this.url, this.toApi(cliente))
    );
    return this.fromApi(c);
  }

  async atualizar(id: number, dados: Partial<Cliente>): Promise<Cliente> {
    const atual = await this.buscarPorId(id);
    if (!atual) throw new Error('Cliente não encontrado');
    const merged: Omit<Cliente, 'id'> = { ...atual, ...dados };
    const c = await firstValueFrom(
      this.http.put<CustomerApi>(`${this.url}/${id}`, this.toApi(merged))
    );
    return this.fromApi(c);
  }

  async excluir(id: number): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.url}/${id}`));
  }
}
