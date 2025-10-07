import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from './AuthContext';

interface AccessControlState {
  isAccessBlocked: boolean;
  blockedMessage: string;
  lastUpdated?: string;
  updatedBy?: string;
}

interface AccessControlContextType {
  isAccessBlocked: boolean;
  blockedMessage: string;
  checkAccess: (userRole?: UserRole) => boolean;
  showBlockedDialog: () => void;
  updateAccessControl: (blocked: boolean, message: string, updatedBy: string) => void;
  getAccessStatus: () => AccessControlState;
  isDialogOpen: boolean;
  closeDialog: () => void;
}

const AccessControlContext = createContext<AccessControlContextType | undefined>(undefined);

const STORAGE_KEY = 'weighbridge_access_control';

const DEFAULT_STATE: AccessControlState = {
  isAccessBlocked: false,
  blockedMessage: `Your access has been temporarily suspended due to pending monthly maintenance payment. Please contact your administrator to renew your subscription and restore full access to all features.

Monthly Maintenance Cost: ₹5,000
Contact: admin@weighbridge.com
Phone: +91-9876543210`,
  lastUpdated: new Date().toISOString(),
  updatedBy: 'system'
};

const getStoredState = (): AccessControlState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading access control state:', error);
  }
  return DEFAULT_STATE;
};

const saveState = (state: AccessControlState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving access control state:', error);
  }
};

export const AccessControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AccessControlState>(getStoredState);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Sync state changes to localStorage
  useEffect(() => {
    saveState(state);
  }, [state]);

  const checkAccess = (userRole?: UserRole): boolean => {
    // Super admins always have access
    if (userRole === 'super_admin') {
      return true;
    }
    // If access is blocked, admins and operators cannot access
    return !state.isAccessBlocked;
  };

  const showBlockedDialog = () => {
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  const updateAccessControl = (blocked: boolean, message: string, updatedBy: string) => {
    setState({
      isAccessBlocked: blocked,
      blockedMessage: message,
      lastUpdated: new Date().toISOString(),
      updatedBy
    });
  };

  const getAccessStatus = (): AccessControlState => {
    return state;
  };

  return (
    <AccessControlContext.Provider
      value={{
        isAccessBlocked: state.isAccessBlocked,
        blockedMessage: state.blockedMessage,
        checkAccess,
        showBlockedDialog,
        updateAccessControl,
        getAccessStatus,
        isDialogOpen,
        closeDialog
      }}
    >
      {children}
    </AccessControlContext.Provider>
  );
};

export const useAccessControl = () => {
  const context = useContext(AccessControlContext);
  if (context === undefined) {
    throw new Error('useAccessControl must be used within an AccessControlProvider');
  }
  return context;
};
