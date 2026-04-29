import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import type { LoginRequest, RegisterRequest, User } from '@/types';
import { ROUTES } from '@/utils/constants';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
}

const getStoredAuth = (): AuthState => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const userStr = localStorage.getItem('user');
  let user: User | null = null;
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch {
      // ignore
    }
  }
  return { user, accessToken, refreshToken };
};

export const useAuth = () => {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<AuthState>(getStoredAuth);

  const isAuthenticated = !!authState.accessToken;

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setAuthState({ user: null, accessToken: null, refreshToken: null });
      return;
    }
    try {
      const user = await authApi.getMe();
      setAuthState((prev) => ({ ...prev, user }));
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setAuthState({ user: null, accessToken: null, refreshToken: null });
    }
  }, []);

  const login = useCallback(async (values: LoginRequest) => {
    const data = await authApi.login(values);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setAuthState({
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
    navigate(ROUTES.DASHBOARD);
  }, [navigate]);

  const register = useCallback(async (values: RegisterRequest) => {
    const data = await authApi.register(values);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setAuthState({
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
    navigate(ROUTES.DASHBOARD);
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setAuthState({ user: null, accessToken: null, refreshToken: null });
    navigate(ROUTES.LOGIN);
  }, [navigate]);

  return {
    user: authState.user,
    isAuthenticated,
    checkAuth,
    login,
    register,
    logout,
  };
};
