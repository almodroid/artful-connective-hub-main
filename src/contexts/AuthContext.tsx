import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  isAdmin: boolean;
  bio?: string;
  website?: string;
  location?: string;
  email?: string;
  deleted_at?: string | null; // ISO8601 timestamp string or null
  deletion_deadline?: string | null; // ISO8601 timestamp string or null
  allowMessages?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  updateAvatar: (file: File) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Try to get user from localStorage first
    const savedUser = localStorage.getItem('artspace_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.error('Failed to parse saved user', e);
        localStorage.removeItem('artspace_user');
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const updateAvatar = async (file: File) => {
    if (!user) return;
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-avatar.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);
      
      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      // Update local state
      setUser(prev => prev ? {
        ...prev,
        avatar: publicUrl
      } : null);
      
      toast.success('Avatar updated successfully');
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast.error('Failed to update avatar');
      throw error;
    }
  };

  // Convert Supabase user to our app's User interface
  const mapSupabaseUser = async (supabaseUser: SupabaseUser): Promise<User> => {
    // Fetch the corresponding profile from profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();
    
    if (profileError) {
      console.error('Failed to fetch profile for user:', profileError);
      // Fall back to creating a user object from auth data only
      return {
        id: supabaseUser.id,
        username: supabaseUser.email?.split('@')[0] || 'user',
        displayName: supabaseUser.user_metadata?.display_name || supabaseUser.email?.split('@')[0] || 'User',
        avatar: supabaseUser.user_metadata?.avatar_url || `https://i.pravatar.cc/150?u=${supabaseUser.id}`,
        isAdmin: supabaseUser.email === 'admin@example.com',
        email: supabaseUser.email || '',
      };
    }
    
    // Create user object with combined data from auth and profiles
    return {
      id: supabaseUser.id,
      username: profileData.username || supabaseUser.email?.split('@')[0] || 'user',
      displayName: profileData.display_name || supabaseUser.user_metadata?.display_name || 'User',
      avatar: profileData.avatar_url || supabaseUser.user_metadata?.avatar_url || `https://i.pravatar.cc/150?u=${supabaseUser.id}`,
      isAdmin: profileData.is_admin || supabaseUser.email === 'admin@example.com',
      email: supabaseUser.email || '',
      bio: profileData.bio || '',
      website: profileData.website || '',
      location: profileData.location || '',
    };
  };

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const mappedUser = await mapSupabaseUser(session.user);
          setUser(mappedUser);
          localStorage.setItem('artspace_user', JSON.stringify(mappedUser));
        } else {
          // Clear user if no session
          setUser(null);
          localStorage.removeItem('artspace_user');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // On error, keep the current user state
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };
    
    initAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          try {
            const mappedUser = await mapSupabaseUser(session.user);
            setUser(mappedUser);
            localStorage.setItem('artspace_user', JSON.stringify(mappedUser));
          } catch (error) {
            console.error('Error mapping user on sign in:', error);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('artspace_user');
        } else if (event === 'USER_UPDATED' && session) {
          try {
            const mappedUser = await mapSupabaseUser(session.user);
            setUser(mappedUser);
            localStorage.setItem('artspace_user', JSON.stringify(mappedUser));
          } catch (error) {
            console.error('Error mapping user on update:', error);
          }
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Try mock users first (for backward compatibility)
      const MOCK_USERS = [
        {
          id: "1",
          username: "admin",
          password: "admin123",
          displayName: "مدير النظام",
          avatar: "/avatar-1.png",
          isAdmin: true,
          bio: "مدير النظام ومطور الموقع",
          website: "https://example.com",
          location: "الرياض، المملكة العربية السعودية",
          email: "admin@example.com"
        },
        {
          id: "2",
          username: "user",
          password: "user123",
          displayName: "مستخدم عادي",
          avatar: "/avatar-2.png",
          isAdmin: false,
          bio: "فنان ومصمم جرافيك",
          website: "https://user-portfolio.com",
          location: "دبي، الإمارات العربية المتحدة",
          email: "user@example.com"
        }
      ];
      
      const mockUser = MOCK_USERS.find(u => 
        (u.username === email && u.password === password) || 
        (u.email === email && u.password === password)
      );
      
      if (mockUser) {
        const { password, ...userWithoutPassword } = mockUser;
        setUser(userWithoutPassword);
        localStorage.setItem('artspace_user', JSON.stringify(userWithoutPassword));
        toast.success("تم تسجيل الدخول بنجاح");
        return;
      }
      
      // If not a mock user, use Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.includes('@') ? email : `${email}@example.com`,
        password: password,
      });
      
      if (error) {
        throw error;
      }
      
      if (data.user) {
        try {
          const mappedUser = await mapSupabaseUser(data.user);
          setUser(mappedUser);
          toast.success("تم تسجيل الدخول بنجاح");
        } catch (error) {
          console.error('Error mapping user after login:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      throw new Error("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    try {
      // Check if email/username is already used by mock users
      const MOCK_USERS = [
        { username: "admin", email: "admin@example.com" },
        { username: "user", email: "user@example.com" }
      ];
      
      if (MOCK_USERS.some(u => u.username === email || u.email === email)) {
        toast.error("اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل");
        throw new Error("Email or username already exists");
      }
      
      // Register with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: email.includes('@') ? email : `${email}@example.com`,
        password: password,
        options: {
          data: {
            display_name: displayName,
            avatar_url: '/placeholder.svg'
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast.success("تم إنشاء الحساب بنجاح");
      
      if (data.user) {
        try {
          const mappedUser = await mapSupabaseUser(data.user);
          setUser(mappedUser);
        } catch (error) {
          console.error('Error mapping user after registration:', error);
        }
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "حدث خطأ أثناء التسجيل");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear local state
    setUser(null);
    localStorage.removeItem('artspace_user');
    toast.success("تم تسجيل الخروج بنجاح");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading: loading || !isInitialized, 
      login, 
      register, 
      logout,
      updateAvatar, 
      isAuthenticated: !!user && isInitialized 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
