import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { RespostaCep } from '../models/cliente.model';

interface ZipCodeResponse {
  zip_code: string;
  street: string;
  complement: string;
  district: string;
  city: string;
  state: string;
}

@Injectable({ providedIn: 'root' })
export class CepService {
  constructor(private http: HttpClient) {}

  buscarCep(cep: string): Observable<RespostaCep> {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      return throwError(() => new Error('CEP deve ter 8 dígitos'));
    }
    return this.http
      .get<ZipCodeResponse>(`${environment.apiUrl}/v1/zip-codes/${cepLimpo}`)
      .pipe(
        map((r) => ({
          cep: r.zip_code,
          logradouro: r.street,
          complemento: r.complement,
          bairro: r.district,
          cidade: r.city,
          estado: r.state,
        })),
        catchError((err) => throwError(() => err))
      );
  }
}
