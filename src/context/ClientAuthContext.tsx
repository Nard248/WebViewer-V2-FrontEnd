import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

interface ClientUser {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    clientId: number;
    clientName: string;
    isActive: boolean;
    permissions: string[];
    lastLogin: string | null;
    preferences: {
        theme: 'light' | 'dark' | 'auto';
        language: string;
        timezone: string;
    };
}

interface ClientAuthState {
    user: ClientUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    rememberMe: boolean;
}

type ClientAuthAction =
    | { type: 'LOADING' }
    | { type: 'LOGIN_SUCCESS'; payload: { user: ClientUser; token: string } }
    | { type: 'LOGIN_FAILURE'; payload: string }
    | { type: 'LOGOUT' }
    | { type: 'UPDATE_USER'; payload: Partial<ClientUser> }
    | { type: 'CLEAR_ERROR' }
    | { type: 'SET_REMEMBER_ME'; payload: boolean };

interface ClientAuthContextType extends ClientAuthState {
    login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
    logout: () => void;
    resetPassword: (email: string) => Promise<void>;
    updateProfile: (updates: Partial<ClientUser>) => Promise<void>;
    refreshToken: () => Promise<void>;
    clearError: () => void;
}

const initialState: ClientAuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    rememberMe: false
};

const CLIENT_AUTH_STORAGE_KEY = 'client_auth_data';
const CLIENT_REMEMBER_KEY = 'client_remember_me';

function clientAuthReducer(state: ClientAuthState, action: ClientAuthAction): ClientAuthState {
    switch (action.type) {
        case 'LOADING':
            return {
                ...state,
                isLoading: true,
                error: null
            };

        case 'LOGIN_SUCCESS':
            return {
                ...state,
                user: action.payload.user,
                token: action.payload.token,
                isAuthenticated: true,
                isLoading: false,
                error: null
            };

        case 'LOGIN_FAILURE':
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: action.payload
            };

        case 'LOGOUT':
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
            };

        case 'UPDATE_USER':
            return {
                ...state,
                user: state.user ? { ...state.user, ...action.payload } : null
            };

        case 'CLEAR_ERROR':
            return {
                ...state,
                error: null
            };

        case 'SET_REMEMBER_ME':
            return {
                ...state,
                rememberMe: action.payload
            };

        default:
            return state;
    }
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined);

export const useClientAuth = () => {
    const context = useContext(ClientAuthContext);
    if (context === undefined) {
        throw new Error('useClientAuth must be used within a ClientAuthProvider');
    }
    return context;
};

interface ClientAuthProviderProps {
    children: ReactNode;
}

export const ClientAuthProvider: React.FC<ClientAuthProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(clientAuthReducer, initialState);

    // Initialize auth state on app load
    useEffect(() => {
        initializeAuth();
    }, []);

    const initializeAuth = () => {
        try {
            const storedData = localStorage.getItem(CLIENT_AUTH_STORAGE_KEY) || sessionStorage.getItem(CLIENT_AUTH_STORAGE_KEY);
            const rememberMe = localStorage.getItem(CLIENT_REMEMBER_KEY) === 'true';
            
            dispatch({ type: 'SET_REMEMBER_ME', payload: rememberMe });

            if (storedData) {
                const { token, user } = JSON.parse(storedData);
                
                // Check if token is expired
                if (token && isTokenValid(token)) {
                    dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
                } else {
                    // Token expired, clear stored data
                    clearStoredAuth();
                    dispatch({ type: 'LOGOUT' });
                }
            } else {
                dispatch({ type: 'LOGOUT' });
            }
        } catch (error) {
            console.error('Error initializing client auth:', error);
            clearStoredAuth();
            dispatch({ type: 'LOGOUT' });
        }
    };

    const isTokenValid = (token: string): boolean => {
        try {
            const decoded: any = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            return decoded.exp > currentTime;
        } catch (error) {
            return false;
        }
    };

    const storeAuthData = (user: ClientUser, token: string, rememberMe: boolean) => {
        const authData = { user, token };
        const storage = rememberMe ? localStorage : sessionStorage;
        
        storage.setItem(CLIENT_AUTH_STORAGE_KEY, JSON.stringify(authData));
        localStorage.setItem(CLIENT_REMEMBER_KEY, rememberMe.toString());
    };

    const clearStoredAuth = () => {
        localStorage.removeItem(CLIENT_AUTH_STORAGE_KEY);
        sessionStorage.removeItem(CLIENT_AUTH_STORAGE_KEY);
        localStorage.removeItem(CLIENT_REMEMBER_KEY);
    };

    const login = async (email: string, password: string, rememberMe = false): Promise<void> => {
        dispatch({ type: 'LOADING' });
        dispatch({ type: 'SET_REMEMBER_ME', payload: rememberMe });

        try {
            // In a real implementation, this would call the API
            // For now, we'll simulate the login process
            await simulateLogin(email, password);
            
            // Mock response
            const mockUser: ClientUser = {
                id: 1,
                email: email,
                firstName: 'John',
                lastName: 'Doe',
                clientId: 1,
                clientName: 'Acme Corporation',
                isActive: true,
                permissions: ['view', 'edit', 'export'],
                lastLogin: new Date().toISOString(),
                preferences: {
                    theme: 'light',
                    language: 'en',
                    timezone: 'UTC'
                }
            };

            const mockToken = generateMockToken(mockUser);

            storeAuthData(mockUser, mockToken, rememberMe);
            dispatch({ type: 'LOGIN_SUCCESS', payload: { user: mockUser, token: mockToken } });
        } catch (error: any) {
            dispatch({ type: 'LOGIN_FAILURE', payload: error.message || 'Login failed' });
        }
    };

    const logout = () => {
        clearStoredAuth();
        dispatch({ type: 'LOGOUT' });
    };

    const resetPassword = async (email: string): Promise<void> => {
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // In real implementation, would call API to send reset email
            console.log(`Password reset email sent to ${email}`);
        } catch (error: any) {
            throw new Error(error.message || 'Failed to send reset email');
        }
    };

    const updateProfile = async (updates: Partial<ClientUser>): Promise<void> => {
        if (!state.user) return;

        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const updatedUser = { ...state.user, ...updates };
            
            // Update stored data
            if (state.token) {
                storeAuthData(updatedUser, state.token, state.rememberMe);
            }
            
            dispatch({ type: 'UPDATE_USER', payload: updates });
        } catch (error: any) {
            throw new Error(error.message || 'Failed to update profile');
        }
    };

    const refreshToken = async (): Promise<void> => {
        if (!state.token) return;

        try {
            // Mock API call to refresh token
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // In real implementation, would exchange current token for new one
            const newToken = generateMockToken(state.user!);
            
            if (state.user) {
                storeAuthData(state.user, newToken, state.rememberMe);
                dispatch({ type: 'LOGIN_SUCCESS', payload: { user: state.user, token: newToken } });
            }
        } catch (error) {
            // If refresh fails, logout the user
            logout();
        }
    };

    const clearError = () => {
        dispatch({ type: 'CLEAR_ERROR' });
    };

    // Mock functions for development
    const simulateLogin = (email: string, password: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (email === 'test@example.com' && password === 'password') {
                    resolve();
                } else {
                    reject(new Error('Invalid credentials'));
                }
            }, 1000);
        });
    };

    const generateMockToken = (user: ClientUser): string => {
        // In real implementation, this would come from the server
        const payload = {
            sub: user.id,
            email: user.email,
            clientId: user.clientId,
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
            iat: Math.floor(Date.now() / 1000)
        };
        
        // This is just a mock token - in reality it would be signed by the server
        return btoa(JSON.stringify(payload));
    };

    // Set up token refresh interval
    useEffect(() => {
        if (state.isAuthenticated && state.token) {
            const interval = setInterval(() => {
                if (isTokenValid(state.token!)) {
                    // Refresh token when it's 1 hour from expiry
                    const decoded: any = jwtDecode(state.token!);
                    const expiryTime = decoded.exp * 1000;
                    const oneHourFromNow = Date.now() + (60 * 60 * 1000);
                    
                    if (expiryTime < oneHourFromNow) {
                        refreshToken();
                    }
                } else {
                    logout();
                }
            }, 5 * 60 * 1000); // Check every 5 minutes

            return () => clearInterval(interval);
        }
    }, [state.isAuthenticated, state.token]);

    const value: ClientAuthContextType = {
        ...state,
        login,
        logout,
        resetPassword,
        updateProfile,
        refreshToken,
        clearError
    };

    return (
        <ClientAuthContext.Provider value={value}>
            {children}
        </ClientAuthContext.Provider>
    );
};

export default ClientAuthContext;