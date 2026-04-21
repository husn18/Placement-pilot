import { supabase } from "./supabase";

export interface TempUserData {
  email: string;
  name: string;
  branch?: string;
  cgpa?: number;
  graduation_year?: number;
}

/**
 * Save user data to temp_users table during registration
 */
export async function saveTempUser(data: TempUserData) {
  try {
    console.log("Saving temp user:", data);

    const { error } = await supabase
      .from("temp_users")
      .insert([
        {
          email: data.email,
          name: data.name,
          branch: data.branch || null,
          cgpa: data.cgpa ? parseFloat(String(data.cgpa)) : null,
          graduation_year: data.graduation_year ? parseInt(String(data.graduation_year)) : null,
        },
      ]);

    if (error) {
      console.error("Error saving temp user:", error);
      throw error;
    }

    console.log("Temp user saved successfully");
    return true;
  } catch (err) {
    console.error("Failed to save temp user:", err);
    throw err;
  }
}

/**
 * Migrate temp user data to users table after email verification
 */
export async function migrateTempUserToUsers(userId: string, email: string) {
  try {
    console.log("Migrating temp user to users table:", email);

    // Get temp user data
    const { data: tempUser, error: fetchError } = await supabase
      .from("temp_users")
      .select("*")
      .eq("email", email)
      .single();

    if (fetchError) {
      console.error("Error fetching temp user:", fetchError);
      throw fetchError;
    }

    if (!tempUser) {
      console.log("No temp user found for email:", email);
      return false;
    }

    // Update users table with temp user data
    const { error: updateError } = await supabase
      .from("users")
      .update({
        name: tempUser.name,
        branch: tempUser.branch,
        cgpa: tempUser.cgpa,
        graduation_year: tempUser.graduation_year,
        email_verified: true,
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating users table:", updateError);
      throw updateError;
    }

    // Delete temp user record after migration
    const { error: deleteError } = await supabase
      .from("temp_users")
      .delete()
      .eq("email", email);

    if (deleteError) {
      console.error("Error deleting temp user:", deleteError);
      // Don't throw, as the migration was successful
    }

    console.log("Temp user migrated successfully to users table");
    return true;
  } catch (err) {
    console.error("Failed to migrate temp user:", err);
    throw err;
  }
}

/**
 * Get temp user data by email
 */
export async function getTempUserByEmail(email: string) {
  try {
    const { data, error } = await supabase
      .from("temp_users")
      .select("*")
      .eq("email", email)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows found" which is expected
      console.error("Error fetching temp user:", error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error("Failed to get temp user:", err);
    return null;
  }
}

/**
 * Delete temp user record
 */
export async function deleteTempUser(email: string) {
  try {
    const { error } = await supabase
      .from("temp_users")
      .delete()
      .eq("email", email);

    if (error) {
      console.error("Error deleting temp user:", error);
      throw error;
    }

    return true;
  } catch (err) {
    console.error("Failed to delete temp user:", err);
    throw err;
  }
}
