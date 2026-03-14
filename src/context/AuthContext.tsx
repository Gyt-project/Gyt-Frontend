'use client';

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  ReactNode,
  useCallback,
} from 'react';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'LOGIN'; payload: { user: User; accessToken: string; refreshToken: string } }
  | { type: 'LOGOUT' }
  | { type: 'LOADED' }
  | { type: 'UPDATE_USER'; payload: User };

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isLoading: false,
      };
    case 'LOGOUT':
      return { user: null, accessToken: null, refreshToken: null, isLoading: false };
    case 'LOADED':
      return { ...state, isLoading: false };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    default:
      return state;
  }
}

interface AuthContextValue extends AuthState {
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    try {
      const accessToken = sessionStorage.getItem('accessToken');
      const refreshToken = sessionStorage.getItem('refreshToken');
      const userStr = sessionStorage.getItem('user');
      if (accessToken && userStr) {
        const user = JSON.parse(userStr) as User;
        dispatch({ type: 'LOGIN', payload: { user, accessToken, refreshToken: refreshToken ?? '' } });
      } else {
        dispatch({ type: 'LOADED' });
      }
    } catch {
      dispatch({ type: 'LOADED' });
    }
  }, []);

  // Listen for auth events dispatched by the Apollo error link
  useEffect(() => {
    const handleLogout = () => {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('user');
      dispatch({ type: 'LOGOUT' });
      window.location.href = '/';
    };
    const handleRefreshed = () => {
      // Tokens already updated in sessionStorage by apollo-client;
      // keep the user object in state as-is (it hasn't changed).
    };
    window.addEventListener('auth:logout', handleLogout);
    window.addEventListener('auth:token-refreshed', handleRefreshed);
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
      window.removeEventListener('auth:token-refreshed', handleRefreshed);
    };
  }, []);

  const login = useCallback((accessToken: string, refreshToken: string, user: User) => {
    sessionStorage.setItem('accessToken', accessToken);
    sessionStorage.setItem('refreshToken', refreshToken);
    sessionStorage.setItem('user', JSON.stringify(user));
    dispatch({ type: 'LOGIN', payload: { user, accessToken, refreshToken } });
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateUser = useCallback((user: User) => {
    sessionStorage.setItem('user', JSON.stringify(user));
    dispatch({ type: 'UPDATE_USER', payload: user });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
