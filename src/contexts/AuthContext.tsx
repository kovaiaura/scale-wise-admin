import React, { createContext, useContext, useState } from 'react';

export type UserRole = 'super_admin' | 'admin' | 'operator';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  tenantId: string;
  tenantName: string;
}

interface AuthContextType {
  user: User | null;
  login: (tenantId: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getInitialUser = (): User | null => {
  const storedUser = localStorage.getItem('weighbridge_user');
  return storedUser ? JSON.parse(storedUser) : null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getInitialUser);

  const login = async (tenantId: string, username: string, password: string) => {
    // Mock authentication - replace with real API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Determine role based on username
    let role: UserRole = 'operator';
    if (username.includes('superadmin')) {
      role = 'super_admin';
    } else if (username.includes('admin')) {
      role = 'admin';
    }

    const mockUser: User = {
      id: '1',
      username,
      email: `${username}@${tenantId}.com`,
      role,
      tenantId,
      tenantName: tenantId.charAt(0).toUpperCase() + tenantId.slice(1),
    };

    setUser(mockUser);
    localStorage.setItem('weighbridge_user', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('weighbridge_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
