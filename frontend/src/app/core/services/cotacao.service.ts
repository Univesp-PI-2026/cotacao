import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cotacao, ProdutoCotacao } from '../models/cotacao.model';

interface QuotationApi {
  id: number;
  customer_id: number;
  product?: ProdutoCotacao;
  request_date: string;
  insurance_type: number | null;
  bonus_class: string | null;
  has_claims: number | null;
  vehicle_plate: string | null;
  vehicle_chassis: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  manufacture_year: number | null;
  overnight_zipcode: string | null;
  driver_age: number | null;
  license_time: string | null;
  property_zipcode?: string | null;
  property_street?: string | null;
  property_number?: string | null;
  property_complement?: string | null;
  property_district?: string | null;
  property_city?: string | null;
  property_state?: string | null;
  monthly_income?: number | string | null;
  occupation?: string | null;
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

  private productUrl(produto: ProdutoCotacao = 'auto'): string {
    const paths: Record<ProdutoCotacao, string> = { auto: 'auto', home: 'home', credit_card: 'credit-card' };
    return `${this.url}/${paths[produto]}`;
  }

  private fromApi(q: QuotationApi): Cotacao {
    return {
      id: q.id,
      clienteId: q.customer_id,
      produto: q.product ?? 'auto',
      clienteNome: q.customer_name ?? '',
      clienteCpf: q.customer_cpf ?? '',
      clienteEmail: q.customer_email ?? '',
      dataSolicitacao: q.request_date.slice(0, 10),
      tipoSeguro: q.insurance_type === 1 ? 'renovacao' : 'novo',
      classeBonus: q.bonus_class ?? undefined,
      teveSinistro: q.has_claims !== null ? q.has_claims === 1 : undefined,
      placaVeiculo: q.vehicle_plate ?? undefined,
      chassi: q.vehicle_chassis ?? undefined,
      marca: q.vehicle_brand ?? undefined,
      modelo: q.vehicle_model ?? undefined,
      anoFabricacao: q.manufacture_year ?? undefined,
      cepPernoite: q.overnight_zipcode ?? undefined,
      idadeCondutor: q.driver_age ?? undefined,
      tempoHabilitacao: q.license_time ?? undefined,
      cepImovel: q.property_zipcode ?? undefined,
      logradouroImovel: q.property_street ?? undefined,
      numeroImovel: q.property_number ?? undefined,
      complementoImovel: q.property_complement ?? undefined,
      bairroImovel: q.property_district ?? undefined,
      cidadeImovel: q.property_city ?? undefined,
      estadoImovel: q.property_state ?? undefined,
      rendaMensal: q.monthly_income != null ? Number(q.monthly_income) : undefined,
      profissao: q.occupation ?? undefined,
      coberturas: Array.isArray(q.coverages) ? q.coverages.join(',') : (q.coverages ?? ''),
      temSeguradoraPreferida: q.has_insurer_preference === 1,
      seguradoraPreferida: q.preferred_insurer ?? undefined,
      ativo: q.active === 1,
    };
  }

  private toApi(c: Omit<Cotacao, 'id'>): Record<string, unknown> {
    const product = c.produto ?? 'auto';
    const isInsurance = product !== 'credit_card';
    return {
      customer_id: c.clienteId,
      product,
      request_date: c.dataSolicitacao,
      insurance_type: isInsurance ? (c.tipoSeguro === 'renovacao' ? 1 : 0) : null,
      bonus_class: product === 'auto' ? c.classeBonus ?? null : null,
      has_claims: isInsurance && c.teveSinistro !== undefined ? (c.teveSinistro ? 1 : 0) : null,
      vehicle_plate: product === 'auto' ? c.placaVeiculo : null,
      vehicle_chassis: product === 'auto' ? c.chassi : null,
      vehicle_brand: product === 'auto' ? c.marca : null,
      vehicle_model: product === 'auto' ? c.modelo : null,
      manufacture_year: product === 'auto' ? c.anoFabricacao : null,
      overnight_zipcode: product === 'auto' ? c.cepPernoite : null,
      driver_age: product === 'auto' ? c.idadeCondutor : null,
      license_time: product === 'auto' ? c.tempoHabilitacao : null,
      coverages: isInsurance && c.coberturas ? c.coberturas.split(',').map((s) => s.trim()).filter(Boolean) : [],
      has_insurer_preference: isInsurance && c.temSeguradoraPreferida ? 1 : 0,
      preferred_insurer: isInsurance ? c.seguradoraPreferida ?? null : null,
      property_zipcode: product === 'home' ? c.cepImovel ?? null : null,
      property_street: product === 'home' ? c.logradouroImovel ?? null : null,
      property_number: product === 'home' ? c.numeroImovel ?? null : null,
      property_complement: product === 'home' ? c.complementoImovel ?? null : null,
      property_district: product === 'home' ? c.bairroImovel ?? null : null,
      property_city: product === 'home' ? c.cidadeImovel ?? null : null,
      property_state: product === 'home' ? c.estadoImovel ?? null : null,
      monthly_income: product === 'credit_card' ? c.rendaMensal ?? null : null,
      occupation: product === 'credit_card' ? c.profissao ?? null : null,
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
      this.http.post<QuotationApi>(this.productUrl(cotacao.produto), this.toApi(cotacao))
    );
    return this.fromApi(q);
  }

  async atualizar(id: number, dados: Partial<Cotacao>): Promise<Cotacao> {
    const atual = await this.buscarPorId(id);
    if (!atual) throw new Error('Cotação não encontrada');
    const merged: Omit<Cotacao, 'id'> = { ...atual, ...dados };
    const mudouProduto = (atual.produto ?? 'auto') !== (merged.produto ?? 'auto');
    const url = mudouProduto ? this.url : this.productUrl(merged.produto);
    const q = await firstValueFrom(
      this.http.put<QuotationApi>(`${url}/${id}`, this.toApi(merged))
    );
    return this.fromApi(q);
  }

  async excluir(id: number, produto?: ProdutoCotacao): Promise<void> {
    const url = produto ? this.productUrl(produto) : this.url;
    await firstValueFrom(this.http.delete(`${url}/${id}`));
  }
}
