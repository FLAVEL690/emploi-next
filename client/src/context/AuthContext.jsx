import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { signUp, signIn, signOut, getProfile } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId) => {
    try {
      const p = await getProfile(userId);
      setProfile(p);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const data = await signIn({ email, password });
    setUser(data.user);
    const p = await getProfile(data.user.id);
    setProfile(p);
    return p;
  };

  const register = async (formData) => {
    const data = await signUp(formData);
    if (data.user) {
      setUser(data.user);
      // Le trigger crée le profil automatiquement, on attend un peu
      await new Promise(resolve => setTimeout(resolve, 500));
      const p = await getProfile(data.user.id);
      setProfile(p);
      return p;
    }
    return null;
  };

  const logout = async () => {
    await signOut();
    setUser(null);
    setProfile(null);
  };

  const updateUserProfile = (updatedData) => {
    setProfile(prev => ({ ...prev, ...updatedData }));
  };

  return (
    <AuthContext.Provider value={{
      user: profile,
      authUser: user,
      loading,
      login,
      register,
      logout,
      updateUser: updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
