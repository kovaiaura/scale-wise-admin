import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'admin' | 'operator' | 'viewer';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('weighbridge_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (tenantId: string, username: string, password: string) => {
    // Mock authentication - replace with real API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockUser: User = {
      id: '1',
      username,
      email: `${username}@${tenantId}.com`,
      role: username.includes('admin') ? 'admin' : 'operator',
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
