// src/types/auth.types.ts

/**
 * User profile
 */
export interface User {
    id: number;
    username: string;
    email: string;
    full_name: string;
    is_admin: boolean;
    client: number | null;
    client_name: string | null;
    created_at: string;
    updated_at: string;
    last_login: string | null;
    is_active: boolean;
}

/**
 * Authentication state for the application
 */
export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;
    error: string | null;
}

/**
 * Login credentials for authentication
 */
export interface LoginCredentials {
    username: string;
    password: string;
}

/**
 * Authentication tokens
 */
export interface AuthTokens {
    access: string;
    refresh: string;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
    email: string;
}

/**
 * Password reset confirmation
 */
export interface PasswordResetConfirm {
    token: string;
    uidb64: string;
    new_password: string;
}