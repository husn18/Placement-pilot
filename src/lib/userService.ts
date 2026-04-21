import { supabase } from "./supabase";
import type { User } from "@/context/AuthContext";

export async function fetchUserProfile(userId: string): Promise<Partial<User> | null> {
  try {
    console.log("Fetching user profile for:", userId);
    
    const { data, error } = await supabase
      .from("users")
      .select("id, email, name, branch, graduation_year, cgpa, email_verified, created_at")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }

    console.log("User profile fetched successfully:", data);
    return data;
  } catch (err) {
    console.error("Failed to fetch user profile:", err);
    return null;
  }
}

export async function updateUserProfile(
  userId: string,
  updates: {
    name?: string;
    branch?: string;
    graduation_year?: number;
    cgpa?: number;
  }
) {
  try {
    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId);

    if (error) {
      throw error;
    }

    return true;
  } catch (err) {
    console.error("Error updating user profile:", err);
    throw err;
  }
}
