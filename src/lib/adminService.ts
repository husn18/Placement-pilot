import { supabase } from "./supabase";

export interface AdminUser {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function authenticateAdmin(
  email: string,
  password: string
): Promise<{ success: boolean; admin?: AdminUser; error?: string }> {
  try {
    // Fetch admin user by email
    const { data: admin, error: fetchError } = await supabase
      .from("admin_login")
      .select("id, email, full_name, role, is_active, created_at, updated_at, password_hash")
      .eq("email", email)
      .single();

    if (fetchError || !admin) {
      return {
        success: false,
        error: "Invalid email or password",
      };
    }

    // Check if admin is active
    if (!admin.is_active) {
      return {
        success: false,
        error: "Admin account is inactive",
      };
    }

    // Verify password using Supabase RPC function (pgcrypto)
    const { data: passwordMatch, error: verifyError } = await supabase
      .rpc("verify_admin_password", {
        email: email,
        password: password,
      })
      .single();

    if (verifyError || !passwordMatch) {
      return {
        success: false,
        error: "Invalid email or password",
      };
    }

    // Update last login timestamp
    await supabase
      .from("admin_login")
      .update({ last_login: new Date().toISOString() })
      .eq("id", admin.id);

    // Return admin user without password hash
    const { password_hash, ...adminWithoutPassword } = admin;

    return {
      success: true,
      admin: adminWithoutPassword as AdminUser,
    };
  } catch (err) {
    console.error("Admin authentication error:", err);
    return {
      success: false,
      error: "Authentication failed",
    };
  }
}

export async function getAdminProfile(adminId: string): Promise<AdminUser | null> {
  try {
    const { data, error } = await supabase
      .from("admin_login")
      .select("id, email, full_name, role, is_active, created_at, updated_at")
      .eq("id", adminId)
      .single();

    if (error) {
      console.error("Error fetching admin profile:", error);
      return null;
    }

    return data as AdminUser;
  } catch (err) {
    console.error("Failed to fetch admin profile:", err);
    return null;
  }
}

export async function updateAdminProfile(
  adminId: string,
  updates: {
    full_name?: string;
    email?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("admin_login")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", adminId);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (err) {
    console.error("Error updating admin profile:", err);
    const errorMsg = err instanceof Error ? err.message : "Failed to update profile";
    return {
      success: false,
      error: errorMsg,
    };
  }
}

export async function countUsers(): Promise<number> {
  try {
    const { data, error } = await supabase
      .rpc("get_user_count");

    if (error) {
      console.error("Error counting users:", error);
      return 0;
    }

    return data || 0;
  } catch (err) {
    console.error("Failed to count users:", err);
    return 0;
  }
}

export async function countCompanies(): Promise<number> {
  try {
    const { data, error } = await supabase
      .rpc("get_companies_count");

    if (error) {
      console.error("Error counting companies:", error);
      return 0;
    }

    return data || 0;
  } catch (err) {
    console.error("Failed to count companies:", err);
    return 0;
  }
}

export async function countExperiences(): Promise<number> {
  try {
    const { data, error } = await supabase
      .rpc("get_experiences_count");

    if (error) {
      console.error("Error counting experiences:", error);
      return 0;
    }

    return data || 0;
  } catch (err) {
    console.error("Failed to count experiences:", err);
    return 0;
  }
}

export async function getAdminStats(): Promise<{
  users: number;
  companies: number;
  experiences: number;
}> {
  try {
    const [users, companies, experiences] = await Promise.all([
      countUsers(),
      countCompanies(),
      countExperiences(),
    ]);

    return { users, companies, experiences };
  } catch (err) {
    console.error("Failed to fetch admin stats:", err);
    return { users: 0, companies: 0, experiences: 0 };
  }
}

// Company Management Functions
export interface Company {
  id: string;
  name: string;
  description?: string;
  min_cgpa: number;
  selection_rounds: string[];
  eligible_branches: string[];
  required_skills: string[];
  created_at: string;
  updated_at: string;
}

export async function addCompany(companyData: {
  name: string;
  description?: string;
  min_cgpa: number;
  selection_rounds: string[];
  eligible_branches: string[];
  required_skills: string[];
}): Promise<{ success: boolean; company?: Company; error?: string }> {
  try {
    // Validate required fields
    if (!companyData.name || !companyData.name.trim()) {
      return { success: false, error: "Company name is required" };
    }

    if (companyData.min_cgpa < 0 || companyData.min_cgpa > 10) {
      return { success: false, error: "CGPA must be between 0 and 10" };
    }

    if (companyData.selection_rounds.length === 0) {
      return { success: false, error: "At least one selection round is required" };
    }

    const { data, error } = await supabase
      .from("companies")
      .insert({
        name: companyData.name.trim(),
        description: companyData.description?.trim() || null,
        min_cgpa: companyData.min_cgpa,
        selection_rounds: companyData.selection_rounds,
        eligible_branches: companyData.eligible_branches,
        required_skills: companyData.required_skills,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding company:", error);
      if (error.message.includes("duplicate")) {
        return { success: false, error: "Company name already exists" };
      }
      return { success: false, error: error.message };
    }

    return { success: true, company: data as Company };
  } catch (err) {
    console.error("Failed to add company:", err);
    const errorMsg = err instanceof Error ? err.message : "Failed to add company";
    return { success: false, error: errorMsg };
  }
}

export async function getCompanies(): Promise<Company[]> {
  try {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching companies:", error);
      return [];
    }

    return data as Company[];
  } catch (err) {
    console.error("Failed to fetch companies:", err);
    return [];
  }
}

export async function updateCompany(
  companyId: string,
  updates: Partial<Company>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("companies")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", companyId);

    if (error) {
      console.error("Error updating company:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Failed to update company:", err);
    const errorMsg = err instanceof Error ? err.message : "Failed to update company";
    return { success: false, error: errorMsg };
  }
}

export async function deleteCompany(companyId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", companyId);

    if (error) {
      console.error("Error deleting company:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Failed to delete company:", err);
    const errorMsg = err instanceof Error ? err.message : "Failed to delete company";
    return { success: false, error: errorMsg };
  }
}

// Experience Verification Functions
export interface Experience {
  id: string;
  user_id: string;
  user_name?: string;
  company: string;
  role: string;
  difficulty: string;
  rounds: string[];
  tips: string;
  strengths?: string;
  mistakes?: string;
  preparation_strategy: string;
  confidence_level?: number;
  verified: boolean;
  created_at: string;
  updated_at: string;
  likes: number;
}

export async function getPendingExperiences(): Promise<Experience[]> {
  try {
    const { data, error } = await supabase
      .from("experiences")
      .select("*")
      .eq("verified", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pending experiences:", error);
      return [];
    }

    return data as Experience[];
  } catch (err) {
    console.error("Failed to fetch pending experiences:", err);
    return [];
  }
}

export async function getVerifiedExperiences(): Promise<Experience[]> {
  try {
    const { data, error } = await supabase
      .from("experiences")
      .select("*")
      .eq("verified", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching verified experiences:", error);
      return [];
    }

    return data as Experience[];
  } catch (err) {
    console.error("Failed to fetch verified experiences:", err);
    return [];
  }
}

export async function verifyExperience(
  experienceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("experiences")
      .update({
        verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", experienceId);

    if (error) {
      console.error("Error verifying experience:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Failed to verify experience:", err);
    const errorMsg = err instanceof Error ? err.message : "Failed to verify experience";
    return { success: false, error: errorMsg };
  }
}

export async function deleteExperience(
  experienceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("experiences")
      .delete()
      .eq("id", experienceId);

    if (error) {
      console.error("Error deleting experience:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Failed to delete experience:", err);
    const errorMsg = err instanceof Error ? err.message : "Failed to delete experience";
    return { success: false, error: errorMsg };
  }
}
