import { supabase } from "./supabase";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
const ALLOWED_FILE_TYPES = ["application/pdf"];
const BUCKET_NAME = "resumes";

export interface FileUploadResult {
  filePath: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  downloadUrl: string;
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): string | null {
  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return "Only PDF files are allowed";
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return `File size must be less than 2MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`;
  }

  return null;
}

/**
 * Get Supabase URL from environment
 */
function getSupabaseUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url) {
    throw new Error("VITE_SUPABASE_URL is not configured");
  }
  return url;
}

/**
 * Upload resume file to Supabase storage
 * Both sender and recipient can download the file via public URL
 */
export async function uploadResume(
  file: File,
  userId: string,
  conversationId: string
): Promise<FileUploadResult> {
  try {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    // Get current session to ensure auth token is valid
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error("Authentication required to upload files. Please log in again.");
    }

    // Create unique file path
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const filePath = `${userId}/${conversationId}/${timestamp}-${randomString}.pdf`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Storage upload error:", {
        message: error.message,
        name: error.name,
        statusCode: (error as any).statusCode,
      });

      // Provide user-friendly error messages
      if (error.message.includes("row violates row-level security")) {
        throw new Error(
          "Storage upload failed due to permission settings. Please contact support."
        );
      }

      throw new Error(error.message || "Failed to upload resume to storage");
    }

    // Build public download URL (works for both sender and recipient)
    const supabaseUrl = getSupabaseUrl();
    const downloadUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${data.path}`;

    return {
      filePath: data.path,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      downloadUrl,
    };
  } catch (err) {
    console.error("Error uploading file:", err);
    throw err instanceof Error 
      ? err 
      : new Error("Failed to upload resume. Please try again.");
  }
}

/**
 * Get public download URL for a resume
 * Works for both sender and recipient
 */
export function getResumeDownloadUrl(filePath: string): string {
  try {
    const supabaseUrl = getSupabaseUrl();
    return `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;
  } catch (err) {
    console.error("Error building download URL:", err);
    throw err;
  }
}

/**
 * Delete resume file from storage (owner only)
 */
export async function deleteResume(filePath: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) throw error;
  } catch (err) {
    console.error("Error deleting file:", err);
    throw err;
  }
}
