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
  signInWithProvider: (provider: 'google' | 'facebook' | 'adobe') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Add a helper to check for auth/session errors
function isAuthSessionError(error: any) {
  if (!error) return false;
  const msg = error.message || error.error_description || '';
  return (
    msg.includes('JWT expired') ||
    msg.includes('Invalid token') ||
    msg.includes('Auth session missing') ||
    msg.includes('401') ||
    msg.includes('403')
  );
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get the current session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setUser(null);
            setLoading(false);
            setIsInitialized(true);
          }
          return;
        }

        if (session?.user && mounted) {
          try {
            const mappedUser = await mapSupabaseUser(session.user);
            setUser(mappedUser);
            // Store in localStorage as backup
            localStorage.setItem('artspace_user', JSON.stringify(mappedUser));
          } catch (error) {
            console.error('Error mapping user:', error);
            if (mounted) {
              setUser(null);
              localStorage.removeItem('artspace_user');
            }
          }
        } else if (mounted) {
          setUser(null);
          localStorage.removeItem('artspace_user');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setUser(null);
          localStorage.removeItem('artspace_user');
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setIsInitialized(true);
        }
      }
    };

    initializeAuth();

    // Set up auth state change listener with debouncing
    let authChangeTimeout: NodeJS.Timeout;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        // Clear any pending timeout
        clearTimeout(authChangeTimeout);

        // Debounce auth state changes to prevent rapid re-renders
        authChangeTimeout = setTimeout(async () => {
          if (!mounted) return;

          console.log('Auth state changed:', event, session?.user?.id);

          // Only update if the user state actually changed
          const currentUserId = user?.id;
          const newUserId = session?.user?.id;

          if (event === 'SIGNED_IN' && session && currentUserId !== newUserId) {
            try {
              const mappedUser = await mapSupabaseUser(session.user);
              setUser(mappedUser);
              localStorage.setItem('artspace_user', JSON.stringify(mappedUser));
            } catch (error) {
              console.error('Error mapping user on sign in:', error);
            }
          } else if (event === 'SIGNED_OUT' && currentUserId) {
            setUser(null);
            localStorage.removeItem('artspace_user');
          } else if (event === 'TOKEN_REFRESHED' && session && currentUserId === newUserId) {
            // Only update if it's the same user (token refresh)
            try {
              const mappedUser = await mapSupabaseUser(session.user);
              setUser(mappedUser);
              localStorage.setItem('artspace_user', JSON.stringify(mappedUser));
            } catch (error) {
              console.error('Error mapping user on token refresh:', error);
            }
          } else if (event === 'USER_UPDATED' && session && currentUserId === newUserId) {
            // Only update if it's the same user (user update)
            try {
              const mappedUser = await mapSupabaseUser(session.user);
              setUser(mappedUser);
              localStorage.setItem('artspace_user', JSON.stringify(mappedUser));
            } catch (error) {
              console.error('Error mapping user on update:', error);
            }
          }
        }, 100); // 100ms debounce
      }
    );

    return () => {
      mounted = false;
      clearTimeout(authChangeTimeout);
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array to prevent loops

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

      // Update local state and clear cache
      setUser(prev => prev ? {
        ...prev,
        avatar: publicUrl
      } : null);

      // Clear cache for this user to ensure fresh data
      userProfileCache.delete(user.id);

      toast.success('Avatar updated successfully');
    } catch (error) {
      console.error('Error updating avatar:', error);
      if (isAuthSessionError(error)) {
        toast.error("انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى");
        await logout();
      } else {
        toast.error('Failed to update avatar');
      }
      throw error;
    }
  };

  // Cache for user profiles to prevent unnecessary database calls
  const userProfileCache = new Map<string, User>();

  // Convert Supabase user to our app's User interface
  const mapSupabaseUser = async (supabaseUser: SupabaseUser): Promise<User> => {
    // Check cache first
    const cachedUser = userProfileCache.get(supabaseUser.id);
    if (cachedUser) {
      return cachedUser;
    }

    // Fetch the corresponding profile from profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    let mappedUser: User;

    if (profileError) {
      console.error('Failed to fetch profile for user:', profileError);
      // Fall back to creating a user object from auth data only
      mappedUser = {
        id: supabaseUser.id,
        username: supabaseUser.email?.split('@')[0] || 'user',
        displayName: supabaseUser.user_metadata?.display_name || supabaseUser.email?.split('@')[0] || 'User',
        avatar: supabaseUser.user_metadata?.avatar_url || `https://i.pravatar.cc/150?u=${supabaseUser.id}`,
        isAdmin: supabaseUser.email === 'admin@example.com',
        email: supabaseUser.email || '',
      };
    } else {
      // Create user object with combined data from auth and profiles
      mappedUser = {
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
    }

    // Cache the result
    userProfileCache.set(supabaseUser.id, mappedUser);
    return mappedUser;
  };

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
          localStorage.setItem('artspace_user', JSON.stringify(mappedUser));
          toast.success("تم تسجيل الدخول بنجاح");
        } catch (error) {
          console.error('Error mapping user after login:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      if (isAuthSessionError(error)) {
        toast.error("انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى");
        await logout();
      } else {
        toast.error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      }
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
      if (isAuthSessionError(error)) {
        toast.error("انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى");
        await logout();
      } else {
        toast.error(error.message || "حدث خطأ أثناء التسجيل");
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithProvider = async (provider: 'google' | 'facebook' | 'adobe') => {
    try {
      if (provider === 'adobe') {
        toast.error("Adobe login is currently being configured. Please use Google or Facebook for now.");
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error(`${provider} login error:`, error);
      toast.error(`خطأ في تسجيل الدخول عبر ${provider === 'google' ? 'جوجل' : 'فيسبوك'}`);
    }
  };

  const logout = async () => {
    // Sign out from Supabase
    await supabase.auth.signOut();

    // Clear local state and cache
    setUser(null);
    localStorage.removeItem('artspace_user');
    userProfileCache.clear(); // Clear the user profile cache
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
      signInWithProvider,
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
