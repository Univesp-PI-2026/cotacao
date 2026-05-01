export type TipoSeguro = 'novo' | 'renovacao';

export interface Cotacao {
  id: number;
  clienteId: number;
  clienteNome: string;
  clienteCpf: string;
  clienteEmail: string;
  dataSolicitacao: string;
  tipoSeguro: TipoSeguro;
  classeBonus?: string;
  teveSinistro?: boolean;
  placaVeiculo: string;
  chassi: string;
  marca: string;
  modelo: string;
  anoFabricacao: number;
  cepPernoite: string;
  idadeCondutor: number;
  tempoHabilitacao: string;
  coberturas?: string;
  temSeguradoraPreferida: boolean;
  seguradoraPreferida?: string;
  ativo: boolean;
}
