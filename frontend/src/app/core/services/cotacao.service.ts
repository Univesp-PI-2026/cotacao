import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cotacao } from '../models/cotacao.model';

interface QuotationApi {
  id: number;
  customer_id: number;
  request_date: string;
  insurance_type: number;
  bonus_class: string | null;
  has_claims: number | null;
  vehicle_plate: string;
  vehicle_chassis: string;
  vehicle_brand: string;
  vehicle_model: string;
  manufacture_year: number;
  overnight_zipcode: string;
  driver_age: number;
  license_time: string;
  coverages: string[];
  has_insurer_preference: number;
  preferred_insurer: string | null;
  active: number;
  customer_name?: string;
  customer_cpf?: string;
  customer_email?: string;
}

@Injectable({ providedIn: 'root' })
export class CotacaoService {
  private readonly url = `${environment.apiUrl}/v1/quotations`;

  constructor(private http: HttpClient) {}

  private fromApi(q: QuotationApi): Cotacao {
    return {
      id: q.id,
      clienteId: q.customer_id,
      clienteNome: q.customer_name ?? '',
      clienteCpf: q.customer_cpf ?? '',
      clienteEmail: q.customer_email ?? '',
      dataSolicitacao: q.request_date,
      tipoSeguro: q.insurance_type === 1 ? 'renovacao' : 'novo',
      classeBonus: q.bonus_class ?? undefined,
      teveSinistro: q.has_claims !== null ? q.has_claims === 1 : undefined,
      placaVeiculo: q.vehicle_plate,
      chassi: q.vehicle_chassis,
      marca: q.vehicle_brand,
      modelo: q.vehicle_model,
      anoFabricacao: q.manufacture_year,
      cepPernoite: q.overnight_zipcode,
      idadeCondutor: q.driver_age,
      tempoHabilitacao: q.license_time,
      coberturas: Array.isArray(q.coverages) ? q.coverages.join(',') : (q.coverages ?? ''),
      temSeguradoraPreferida: q.has_insurer_preference === 1,
      seguradoraPreferida: q.preferred_insurer ?? undefined,
      ativo: q.active === 1,
    };
  }

  private toApi(c: Omit<Cotacao, 'id'>): Record<string, unknown> {
    return {
      customer_id: c.clienteId,
      request_date: c.dataSolicitacao,
      insurance_type: c.tipoSeguro === 'renovacao' ? 1 : 0,
      bonus_class: c.classeBonus ?? null,
      has_claims: c.teveSinistro !== undefined ? (c.teveSinistro ? 1 : 0) : null,
      vehicle_plate: c.placaVeiculo,
      vehicle_chassis: c.chassi,
      vehicle_brand: c.marca,
      vehicle_model: c.modelo,
      manufacture_year: c.anoFabricacao,
      overnight_zipcode: c.cepPernoite,
      driver_age: c.idadeCondutor,
      license_time: c.tempoHabilitacao,
      coverages: c.coberturas ? c.coberturas.split(',').map((s) => s.trim()).filter(Boolean) : [],
      has_insurer_preference: c.temSeguradoraPreferida ? 1 : 0,
      preferred_insurer: c.seguradoraPreferida ?? null,
      active: c.ativo ? 1 : 0,
    };
  }

  async listar(): Promise<Cotacao[]> {
    const resp = await firstValueFrom(
      this.http.get<{ data: QuotationApi[]; total: number }>(this.url)
    );
    return resp.data.map((q) => this.fromApi(q));
  }

  async contarTotal(): Promise<number> {
    const resp = await firstValueFrom(
      this.http.get<{ total: number }>(`${this.url}/count`)
    );
    return resp.total;
  }

  async buscarPorId(id: number): Promise<Cotacao | undefined> {
    try {
      const q = await firstValueFrom(this.http.get<QuotationApi>(`${this.url}/${id}`));
      return this.fromApi(q);
    } catch {
      return undefined;
    }
  }

  async criar(cotacao: Omit<Cotacao, 'id'>): Promise<Cotacao> {
    const q = await firstValueFrom(
      this.http.post<QuotationApi>(this.url, this.toApi(cotacao))
    );
    return this.fromApi(q);
  }

  async atualizar(id: number, dados: Partial<Cotacao>): Promise<Cotacao> {
    const atual = await this.buscarPorId(id);
    if (!atual) throw new Error('Cotação não encontrada');
    const merged: Omit<Cotacao, 'id'> = { ...atual, ...dados };
    const q = await firstValueFrom(
      this.http.put<QuotationApi>(`${this.url}/${id}`, this.toApi(merged))
    );
    return this.fromApi(q);
  }

  async excluir(id: number): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.url}/${id}`));
  }
}
