import { supabase } from "./supabase";
import { deleteActivityHistoryByReferenceId } from "./historyService";

export interface Experience {
  id: string;
  user_id: string;
  user_name?: string;
  company: string;
  role: string;
  difficulty: "Easy" | "Medium" | "Hard";
  rounds: string[];
  tips: string;
  strengths?: string;
  mistakes?: string;
  preparation_strategy: string;
  confidence_level?: number;
  verified: boolean;
  likes?: number;
  created_at: string;
  updated_at: string;
}

export async function createExperience(
  userId: string,
  userName: string,
  data: {
    company: string;
    role: string;
    difficulty: "Easy" | "Medium" | "Hard";
    rounds: string[];
    tips: string;
    strengths?: string;
    mistakes?: string;
    preparation_strategy: string;
    confidence_level?: number;
  }
) {
  try {
    if (!userName || userName.trim() === "") {
      throw new Error("User name is required to post an experience");
    }

    console.log("Creating experience with data:", { userId, userName, ...data });
    
    const { data: experience, error } = await supabase
      .from("experiences")
      .insert([
        {
          user_id: userId,
          user_name: userName.trim(),
          company: data.company,
          role: data.role,
          difficulty: data.difficulty,
          rounds: data.rounds,
          tips: data.tips,
          strengths: data.strengths || null,
          mistakes: data.mistakes || null,
          preparation_strategy: data.preparation_strategy,
          confidence_level: data.confidence_level || 3,
          verified: false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      throw new Error(`Failed to create experience: ${error.message}`);
    }
    
    if (!experience) {
      throw new Error("Experience was created but data was not returned");
    }
    
    console.log("Experience created successfully:", experience);
    return experience;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to create experience";
    console.error("Error creating experience:", errorMessage);
    throw new Error(errorMessage);
  }
}

export async function getUserExperiences(userId: string): Promise<Experience[]> {
  try {
    const { data, error } = await supabase
      .from("experiences")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching user experiences:", err);
    return [];
  }
}

export async function getAllExperiences(): Promise<Experience[]> {
  try {
    const { data, error } = await supabase
      .from("experiences")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching experiences:", err);
    return [];
  }
}

export async function getExperiencesByCompany(company: string): Promise<Experience[]> {
  try {
    const { data, error } = await supabase
      .from("experiences")
      .select("*")
      .ilike("company", `%${company}%`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching experiences by company:", err);
    return [];
  }
}

export async function updateExperience(
  experienceId: string,
  data: Partial<Experience>
) {
  try {
    const { error } = await supabase
      .from("experiences")
      .update(data)
      .eq("id", experienceId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error updating experience:", err);
    throw err;
  }
}

/**
 * Delete an experience post - archives it to deleted_posts table, removes from experiences, and removes associated history
 */
export async function deleteExperiencePost(experienceId: string) {
  try {
    // First, fetch the experience to archive it
    const { data: experience, error: fetchError } = await supabase
      .from("experiences")
      .select("*")
      .eq("id", experienceId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch experience: ${fetchError.message}`);
    }
    
    if (!experience) {
      throw new Error("Experience not found");
    }

    // Archive to deleted_posts table
    const { error: archiveError } = await supabase
      .from("deleted_posts")
      .insert([
        {
          original_experience_id: experienceId,
          user_id: experience.user_id,
          company: experience.company,
          role: experience.role,
          difficulty: experience.difficulty,
          rounds: experience.rounds,
          tips: experience.tips,
          strengths: experience.strengths,
          mistakes: experience.mistakes,
          preparation_strategy: experience.preparation_strategy,
          confidence_level: experience.confidence_level,
        },
      ]);

    if (archiveError) {
      throw new Error(`Failed to archive experience: ${archiveError.message}`);
    }

    // Delete from experiences table
    const { error: deleteError } = await supabase
      .from("experiences")
      .delete()
      .eq("id", experienceId);

    if (deleteError) {
      throw new Error(`Failed to delete experience: ${deleteError.message}`);
    }

    // Delete associated history entries
    await deleteActivityHistoryByReferenceId(experienceId);

    console.log("Experience deleted, archived, and history cleaned up successfully");
    return true;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to delete experience";
    console.error("Error deleting experience:", errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Legacy function - kept for backward compatibility
 * Use deleteExperiencePost instead
 */
export async function deleteExperience(experienceId: string) {
  return deleteExperiencePost(experienceId);
}

export async function getExperienceWithUser(experienceId: string) {
  try {
    const { data, error } = await supabase
      .from("experiences")
      .select(
        `
        *,
        users:user_id(id, name, email, branch, graduation_year, cgpa)
      `
      )
      .eq("id", experienceId)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error fetching experience with user:", err);
    return null;
  }
}

export async function getAllExperiencesWithUsers(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("experiences")
      .select(
        `
        *,
        users:user_id(id, name, email, branch, graduation_year, cgpa)
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching experiences with users:", err);
    return [];
  }
}

export async function getVerifiedExperiencesWithUsers(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("experiences")
      .select(
        `
        *,
        users:user_id(id, name, email, branch, graduation_year, cgpa)
      `
      )
      .eq("verified", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching verified experiences:", err);
    return [];
  }
}

export async function verifyExperience(experienceId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("experiences")
      .update({ verified: true })
      .eq("id", experienceId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error verifying experience:", err);
    throw err;
  }
}

export async function getUnverifiedExperiencesWithUsers(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("experiences")
      .select(
        `
        *,
        users:user_id(id, name, email, branch, graduation_year, cgpa)
      `
      )
      .eq("verified", false)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching unverified experiences:", err);
    return [];
  }
}

export async function unverifyExperience(experienceId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("experiences")
      .update({ verified: false })
      .eq("id", experienceId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error unverifying experience:", err);
    throw err;
  }
}

/**
 * Check if a user has already liked an experience post
 */
export async function checkIfUserLiked(
  experienceId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("likes_tracker")
      .select("id")
      .eq("experience_id", experienceId)
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows found
    return !!data;
  } catch (err) {
    console.error("Error checking if user liked post:", err);
    return false;
  }
}

/**
 * Toggle like on an experience post
 * Increments likes if user hasn't liked, decrements if user has already liked
 */
export async function toggleLike(
  experienceId: string,
  userId: string
): Promise<boolean> {
  try {
    // Check if user already liked this post
    const hasLiked = await checkIfUserLiked(experienceId, userId);

    if (hasLiked) {
      // Remove like
      const { error: deleteError } = await supabase
        .from("likes_tracker")
        .delete()
        .eq("experience_id", experienceId)
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      // Decrement likes count
      await decrementLikes(experienceId);
    } else {
      // Add like
      const { error: insertError } = await supabase
        .from("likes_tracker")
        .insert([{ experience_id: experienceId, user_id: userId }]);

      if (insertError) throw insertError;

      // Increment likes count
      await incrementLikes(experienceId);
    }

    return true;
  } catch (err) {
    console.error("Error toggling like:", err);
    throw err;
  }
}

/**
 * Increment likes count directly
 */
export async function incrementLikes(experienceId: string): Promise<boolean> {
  try {
    // Get current likes count
    const { data, error: fetchError } = await supabase
      .from("experiences")
      .select("likes")
      .eq("id", experienceId)
      .single();

    if (fetchError) throw fetchError;

    // Increment by 1
    const newLikes = (data?.likes || 0) + 1;
    const { error: updateError } = await supabase
      .from("experiences")
      .update({ likes: newLikes })
      .eq("id", experienceId);

    if (updateError) throw updateError;
    return true;
  } catch (err) {
    console.error("Error incrementing likes:", err);
    throw err;
  }
}

/**
 * Decrement likes count directly
 */
export async function decrementLikes(experienceId: string): Promise<boolean> {
  try {
    // Get current likes count
    const { data, error: fetchError } = await supabase
      .from("experiences")
      .select("likes")
      .eq("id", experienceId)
      .single();

    if (fetchError) throw fetchError;

    // Decrement by 1, but don't go below 0
    const newLikes = Math.max((data?.likes || 0) - 1, 0);
    const { error: updateError } = await supabase
      .from("experiences")
      .update({ likes: newLikes })
      .eq("id", experienceId);

    if (updateError) throw updateError;
    return true;
  } catch (err) {
    console.error("Error decrementing likes:", err);
    throw err;
  }
}
