export type Customer = {
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
};
