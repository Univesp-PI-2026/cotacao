export interface Cliente {
  id: number;
  nome: string;
  email: string;
  estrangeiro: boolean;
  cpf?: string;
  rnm?: string;
  dataNascimento: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  ativo: boolean;
}

export interface RespostaCep {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}
