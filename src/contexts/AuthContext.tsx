import React, { createContext, useContext, useState } from 'react';

export type UserRole = 'super_admin' | 'admin' | 'operator';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (username: string, password: string) => {
    const { getUserByUsername, verifyPassword, incrementFailedAttempts, resetFailedAttempts, lockUserAccount, updateLastLogin } = await import('@/services/database/userRepository');
    const { logSecurityEvent } = await import('@/services/database/securityLogger');

    try {
      // 1. Get user by username (returns UserRow with password_hash)
      const dbUser = await getUserByUsername(username);
      
      // 2. Check if user exists
      if (!dbUser) {
        await logSecurityEvent('LOGIN_FAILED', undefined, `Failed login attempt for username: ${username}`);
        throw new Error('Invalid username or password');
      }
      
      // 3. Check if account is locked
      if (dbUser.locked_until && new Date(dbUser.locked_until) > new Date()) {
        const minutesLeft = Math.ceil(
          (new Date(dbUser.locked_until).getTime() - Date.now()) / 60000
        );
        await logSecurityEvent('LOGIN_FAILED', dbUser.id, `Login attempt on locked account`);
        throw new Error(`Account locked. Try again in ${minutesLeft} minutes.`);
      }
      
      // 4. Check if account is active
      if (dbUser.is_active !== 1) {
        await logSecurityEvent('LOGIN_FAILED', dbUser.id, 'Login attempt on inactive account');
        throw new Error('Account is inactive. Contact administrator.');
      }
      
      // 5. Verify password
      const isValid = await verifyPassword(dbUser.id, password);
      
      if (!isValid) {
        // Increment failed attempts
        await incrementFailedAttempts(dbUser.id);
        
        // Lock account after 5 failed attempts
        if (dbUser.failed_login_attempts >= 4) {
          const lockUntil = new Date(Date.now() + 30 * 60000); // 30 minutes
          await lockUserAccount(dbUser.id, lockUntil);
          await logSecurityEvent('ACCOUNT_LOCKED', dbUser.id, 'Account locked after 5 failed login attempts');
          throw new Error('Account locked due to multiple failed attempts. Try again in 30 minutes.');
        }
        
        await logSecurityEvent('LOGIN_FAILED', dbUser.id, `Failed login attempt ${dbUser.failed_login_attempts + 1}/5`);
        throw new Error('Invalid username or password');
      }
      
      // 6. Success - reset failed attempts
      await resetFailedAttempts(dbUser.id);
      await updateLastLogin(dbUser.id);
      
      // 7. Create session (in-memory only - no localStorage)
      const user: User = {
        id: dbUser.id,
        username: dbUser.username,
        email: dbUser.email || '',
        role: dbUser.role as UserRole,
        isActive: dbUser.is_active === 1,
        lastLoginAt: new Date().toISOString()
      };
      
      setUser(user);
      
      // 8. Log successful login
      await logSecurityEvent('LOGIN_SUCCESS', dbUser.id, 'User logged in successfully');
      
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (user) {
      const { logSecurityEvent } = await import('@/services/database/securityLogger');
      await logSecurityEvent('LOGOUT', user.id, 'User logged out');
    }
    setUser(null);
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
