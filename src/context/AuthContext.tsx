import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { fetchUserProfile } from "@/lib/userService";
import { saveTempUser } from "@/lib/tempUserService";

export interface User {
  id: string;
  email: string;
  name?: string;
  branch?: string;
  graduation_year?: number;
  cgpa?: number;
  emailVerified: boolean;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  signup: (email: string, password: string, name: string, branch?: string, graduationYear?: string, cgpa?: string) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileCacheTime, setProfileCacheTime] = useState<number>(0);

  // Initialize auth session on mount - load from localStorage if available
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check for stored user data in localStorage first
        const storedUserData = localStorage.getItem('user_profile');
        if (storedUserData) {
          try {
            const userData = JSON.parse(storedUserData);
            setUser(userData);
            console.log("Loaded user data from localStorage:", userData);
            return;
          } catch (e) {
            console.error("Failed to parse stored user data:", e);
            localStorage.removeItem('user_profile');
          }
        }
        
        // Get current session from Supabase if not in localStorage
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Set minimal user data
          const userData: User = {
            id: session.user.id,
            email: session.user.email || "",
            emailVerified: session.user.email_confirmed_at ? true : false,
            name: session.user.user_metadata?.name,
            createdAt: session.user.created_at,
          };
          setUser(userData);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setError("Failed to initialize authentication");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    
    // Safety timeout to ensure isLoading is set to false
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        if (session?.user) {
          // Try to load from localStorage first
          const storedUserData = localStorage.getItem('user_profile');
          if (storedUserData) {
            try {
              const userData = JSON.parse(storedUserData);
              setUser(userData);
              return;
            } catch (e) {
              console.error("Failed to parse stored user data:", e);
            }
          }
          
          // Fallback to basic session info
          const userData: User = {
            id: session.user.id,
            email: session.user.email || "",
            emailVerified: session.user.email_confirmed_at ? true : false,
            name: session.user.user_metadata?.name,
            createdAt: session.user.created_at,
          };
          setUser(userData);
        } else {
          setUser(null);
          localStorage.removeItem('user_profile');
        }
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription?.unsubscribe();
    };
  }, []);

  const signup = async (email: string, password: string, name: string, branch?: string, graduationYear?: string, cgpa?: string) => {
    setError(null);
    setIsLoading(true);
    try {
      console.log("Starting signup process...", { email, name, branch, graduationYear, cgpa });
      
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            branch: branch,
            graduation_year: graduationYear,
            cgpa: cgpa,
          },
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });

      if (signupError) {
        throw signupError;
      }

      // Step 1: Save profile data to temp_users table
      await saveTempUser({
        email,
        name,
        branch: branch || undefined,
        cgpa: cgpa ? parseFloat(cgpa) : undefined,
        graduation_year: graduationYear ? parseInt(graduationYear) : undefined,
      });

      // Step 2: Create minimal user record in users table
      if (data.user) {
        console.log("Creating user record for:", data.user.id);
        
        const profileData = {
          id: data.user.id,
          email: email,
          name: name,
          branch: null,
          graduation_year: null,
          cgpa: null,
          email_verified: false,
        };
        
        console.log("User record to insert:", profileData);
        
        const { error: profileError } = await supabase
          .from('users')
          .insert([profileData]);

        if (profileError) {
          console.error('User record creation error:', profileError);
          throw new Error(`User record creation failed: ${profileError.message}`);
        } else {
          console.log("User record created successfully");
        }
      }

      // Note: User will be set after email verification via onAuthStateChange
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Sign up failed";
      console.error("Signup error:", errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        throw loginError;
      }

      // After successful login, fetch all user profile data
      if (data.user) {
        console.log("Fetching user profile after login...");
        const profile = await fetchUserProfile(data.user.id);
        
        const userData: User = {
          id: data.user.id,
          email: data.user.email || "",
          emailVerified: data.user.email_confirmed_at ? true : false,
          name: profile?.name || data.user.user_metadata?.name,
          branch: profile?.branch,
          graduation_year: profile?.graduation_year,
          cgpa: profile?.cgpa,
          createdAt: data.user.created_at,
        };
        
        // Store all user data in localStorage
        localStorage.setItem('user_profile', JSON.stringify(userData));
        console.log("User data stored in localStorage:", userData);
        
        // Store in state
        setUser(userData);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const { error: logoutError } = await supabase.auth.signOut();
      if (logoutError) {
        throw logoutError;
      }
      setUser(null);
      // Clear localStorage on logout
      localStorage.removeItem('user_profile');
      console.log("User logged out and localStorage cleared");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Logout failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        signup,
        isLoading,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
