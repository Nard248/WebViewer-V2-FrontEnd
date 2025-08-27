export interface UserCreatePayload {
    username: string;
    full_name?: string;
    email: string;
    password: string;
  }
  
export interface UserCreate {
    username: string;
    email: string;
    full_name: string;
    password: string;
    last_login: string | null;
    is_active: boolean;
    client?: number;
  }
  
  export interface UserUpdate {
    username?: string;
    email?: string;
    full_name?: string;
    password?: string;
    is_active?: boolean;
    last_login?: string | null;
    client?: number;
  }