import { supabase } from "./supabase";

export interface EligibilityCheckResult {
  id?: string;
  user_id: string;
  cgpa: number;
  branch: string;
  skills: string[];
  results: any; // The eligibility check results
  created_at?: string;
  updated_at?: string;
}

export interface UserHistory {
  id?: string;
  user_id: string;
  activity_type: "eligibility_check" | "experience_post" | "company_view";
  reference_id?: string; // ID of the check result or post
  description: string;
  created_at?: string;
}

// Store an eligibility check result
export async function saveEligibilityCheck(
  userId: string,
  cgpa: number,
  branch: string,
  skills: string[],
  results: any
): Promise<EligibilityCheckResult | null> {
  try {
    const { data, error } = await supabase
      .from("eligibility_checks")
      .insert([
        {
          user_id: userId,
          cgpa,
          branch,
          skills,
          results,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error saving eligibility check:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Failed to save eligibility check:", err);
    return null;
  }
}

// Get user's eligibility check history
export async function getUserEligibilityHistory(
  userId: string
): Promise<EligibilityCheckResult[]> {
  try {
    const { data, error } = await supabase
      .from("eligibility_checks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching eligibility history:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Failed to fetch eligibility history:", err);
    return [];
  }
}

// Get a specific eligibility check result
export async function getEligibilityCheckById(
  checkId: string
): Promise<EligibilityCheckResult | null> {
  try {
    const { data, error } = await supabase
      .from("eligibility_checks")
      .select("*")
      .eq("id", checkId)
      .single();

    if (error) {
      console.error("Error fetching eligibility check:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Failed to fetch eligibility check:", err);
    return null;
  }
}

// Delete eligibility check
export async function deleteEligibilityCheck(checkId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("eligibility_checks")
      .delete()
      .eq("id", checkId);

    if (error) {
      console.error("Error deleting eligibility check:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Failed to delete eligibility check:", err);
    return false;
  }
}

// Save user activity to history
export async function logUserActivity(
  userId: string,
  activityType: "eligibility_check" | "experience_post" | "company_view",
  description: string,
  referenceId?: string
): Promise<UserHistory | null> {
  try {
    const { data, error } = await supabase
      .from("user_activity_history")
      .insert([
        {
          user_id: userId,
          activity_type: activityType,
          reference_id: referenceId,
          description,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error logging activity:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Failed to log activity:", err);
    return null;
  }
}

// Get user's activity history
export async function getUserActivityHistory(
  userId: string,
  limit: number = 10
): Promise<UserHistory[]> {
  try {
    const { data, error } = await supabase
      .from("user_activity_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching activity history:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Failed to fetch activity history:", err);
    return [];
  }
}

/**
 * Delete activity history entries by reference ID (e.g., experience_id)
 * Used when deleting an experience post to remove associated history
 */
export async function deleteActivityHistoryByReferenceId(
  referenceId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("user_activity_history")
      .delete()
      .eq("reference_id", referenceId);

    if (error) {
      console.error("Error deleting activity history:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Failed to delete activity history:", err);
    return false;
  }
}
