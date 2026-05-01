import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly CHAVE = 'g05_tema_escuro';

  temaEscuro = signal<boolean>(this.carregarTema());

  private carregarTema(): boolean {
    return localStorage.getItem(this.CHAVE) === 'true';
  }

  inicializar(): void {
    this.aplicarTema(this.temaEscuro());
  }

  alternarTema(): void {
    const escuro = !this.temaEscuro();
    this.temaEscuro.set(escuro);
    localStorage.setItem(this.CHAVE, String(escuro));
    this.aplicarTema(escuro);
  }

  private aplicarTema(escuro: boolean): void {
    if (escuro) {
      document.body.classList.add('tema-escuro');
    } else {
      document.body.classList.remove('tema-escuro');
    }
  }
}
