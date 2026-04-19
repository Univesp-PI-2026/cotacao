export type User = {
  id: number;
  role_id: number | null;
  role_name: string | null;
  name: string;
  email: string;
  email_verified_at: string | null;
  active: number;
  created_at: string;
  updated_at: string;
};
