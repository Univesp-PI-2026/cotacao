export interface Usuario {
  id: number;
  nome: string;
  username?: string;
  email: string;
  senha?: string;
  roleId: number;
  roleNome?: string;
  ativo: boolean;
}

export interface CredenciaisLogin {
  identifier: string;
  senha: string;
}
