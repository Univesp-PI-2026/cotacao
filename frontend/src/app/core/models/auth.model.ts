export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    role_id: number;
    role_name: string;
    name: string;
    username: string;
    email: string;
    active: number;
  };
}
