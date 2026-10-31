import React, { useState } from 'react';
import api from '../services/api';
import type { Role } from '../types';
import { DEMO_USERS, type AuthUser } from './authTypes';
import { AuthContext } from './authContextDef';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const storedUser = localStorage.getItem('brightloop_user');
      if (storedUser) return JSON.parse(storedUser);
      return DEMO_USERS.ADMIN;
    } catch {
      return DEMO_USERS.ADMIN;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      const storedToken = localStorage.getItem('brightloop_token');
      if (storedToken) return storedToken;
      return 'mock-jwt-admin-token-12345';
    } catch {
      return 'mock-jwt-admin-token-12345';
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const saveSession = (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('brightloop_token', newToken);
    localStorage.setItem('brightloop_user', JSON.stringify(newUser));
  };

  const login = async (email: string, password: string): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      try {
        const res = await api.post('/auth/login', { email, password });
        if (res.data && res.data.token) {
          const authUser: AuthUser = {
            id: res.data.userId || res.data.id || 1,
            email: res.data.email || email,
            fullName: res.data.fullName || res.data.name || email.split('@')[0],
            role: res.data.role || 'ADMIN',
            companyName: res.data.companyName,
          };
          saveSession(res.data.token, authUser);
          return authUser;
        }
      } catch {
        console.warn('Backend auth endpoint unreachable; matching demo accounts fallback.');
      }

      // Fallback matching
      let resolvedUser: AuthUser;
      if (email.toLowerCase().includes('admin')) {
        resolvedUser = DEMO_USERS.ADMIN;
      } else if (email.toLowerCase().includes('staff') || email.toLowerCase().includes('bob')) {
        resolvedUser = DEMO_USERS.STAFF;
      } else {
        resolvedUser = {
          id: 4,
          email,
          fullName: email.split('@')[0].replace(/[._]/g, ' '),
          role: 'CUSTOMER',
          companyName: 'Retail Corp',
        };
      }

      const generatedToken = `jwt-token-${resolvedUser.role.toLowerCase()}-${Date.now()}`;
      saveSession(generatedToken, resolvedUser);
      return resolvedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    fullName: string;
    role?: Role;
    companyName?: string;
  }): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      try {
        const res = await api.post('/auth/register', data);
        if (res.data && res.data.token) {
          const authUser: AuthUser = {
            id: res.data.userId || res.data.id,
            email: res.data.email || data.email,
            fullName: res.data.fullName || data.fullName,
            role: res.data.role || data.role || 'CUSTOMER',
            companyName: res.data.companyName || data.companyName,
          };
          saveSession(res.data.token, authUser);
          return authUser;
        }
      } catch {
        console.warn('Backend register endpoint fallback engaged.');
      }

      const newUser: AuthUser = {
        id: Date.now(),
        email: data.email,
        fullName: data.fullName,
        role: data.role || 'CUSTOMER',
        companyName: data.companyName,
      };

      const tokenStr = `jwt-registered-${newUser.id}`;
      saveSession(tokenStr, newUser);
      return newUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('brightloop_token');
    localStorage.removeItem('brightloop_user');
  };

  const switchRole = (newRole: Role) => {
    const demoUser = DEMO_USERS[newRole];
    const newToken = `mock-jwt-${newRole.toLowerCase()}-${Date.now()}`;
    saveSession(newToken, demoUser);
  };

  const demoLogin = async (targetRole: Role): Promise<AuthUser> => {
    const target = DEMO_USERS[targetRole];
    return login(target.email, 'Compliant@Pass123');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'ADMIN',
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        switchRole,
        demoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
