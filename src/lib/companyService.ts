import { supabase } from "./supabase";

export interface Company {
  id: string;
  name: string;
  description: string;
  min_cgpa: number;
  selection_rounds: string[];
  eligible_branches: string[];
  required_skills: string[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetch all companies from Supabase
 */
export const fetchAllCompanies = async (): Promise<Company[]> => {
  try {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching companies:", error);
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error("Failed to fetch companies:", err);
    throw err;
  }
};

/**
 * Fetch a single company by ID
 */
export const fetchCompanyById = async (id: string): Promise<Company | null> => {
  try {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching company:", error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error("Failed to fetch company:", err);
    return null;
  }
};

/**
 * Search companies by name
 */
export const searchCompanies = async (query: string): Promise<Company[]> => {
  try {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .ilike("name", `%${query}%`)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error searching companies:", error);
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error("Failed to search companies:", err);
    throw err;
  }
};

/**
 * Fetch companies filtered by minimum CGPA
 */
export const fetchCompaniesByCGPA = async (cgpa: number): Promise<Company[]> => {
  try {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .lte("min_cgpa", cgpa)
      .order("min_cgpa", { ascending: false });

    if (error) {
      console.error("Error fetching companies by CGPA:", error);
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error("Failed to fetch companies by CGPA:", err);
    throw err;
  }
};

/**
 * Fetch companies by branch
 */
export const fetchCompaniesByBranch = async (branch: string): Promise<Company[]> => {
  try {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .contains("eligible_branches", [branch])
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching companies by branch:", error);
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error("Failed to fetch companies by branch:", err);
    throw err;
  }
};
