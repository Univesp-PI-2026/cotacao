export type TipoSeguro = 'novo' | 'renovacao';
export type ProdutoCotacao = 'auto' | 'home' | 'credit_card';

export const PRODUTOS_COTACAO = [
  { valor: 'auto' as const, nome: 'Automóvel', icone: 'directions_car', descricao: 'Veículo e condutor' },
  { valor: 'home' as const, nome: 'Residencial', icone: 'home', descricao: 'Seguro e endereço do imóvel' },
  { valor: 'credit_card' as const, nome: 'Cartão de crédito', icone: 'credit_card', descricao: 'Renda e profissão' },
];

export interface Cotacao {
  id: number;
  clienteId: number;
  clienteNome: string;
  clienteCpf: string;
  clienteEmail: string;
  produto?: ProdutoCotacao;
  dataSolicitacao: string;
  tipoSeguro: TipoSeguro;
  classeBonus?: string;
  teveSinistro?: boolean;
  placaVeiculo?: string;
  chassi?: string;
  marca?: string;
  modelo?: string;
  anoFabricacao?: number;
  cepPernoite?: string;
  idadeCondutor?: number;
  tempoHabilitacao?: string;
  coberturas?: string;
  temSeguradoraPreferida: boolean;
  seguradoraPreferida?: string;
  cepImovel?: string;
  logradouroImovel?: string;
  numeroImovel?: string;
  complementoImovel?: string;
  bairroImovel?: string;
  cidadeImovel?: string;
  estadoImovel?: string;
  rendaMensal?: number;
  profissao?: string;
  ativo: boolean;
}
