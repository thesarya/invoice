import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange, signOutUser } from '@/lib/firebase';
import { firebaseApiKeyManager } from '@/lib/firebase-api-key-manager';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      setUser(user);
      
      if (user) {
        // Set user ID in API key manager and load keys
        firebaseApiKeyManager.setUserId(user.uid);
        await firebaseApiKeyManager.loadKeys();
      } else {
        // Clear user ID when logged out
        firebaseApiKeyManager.setUserId('');
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    setLoading(true);
    try {
      await signOutUser();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
