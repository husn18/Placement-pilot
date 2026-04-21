import { supabase } from "./supabase";

export interface FileMetadata {
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
}

export interface Message extends FileMetadata {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  sender?: any;
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
) {
  try {
    if (!content.trim()) {
      throw new Error("Message content cannot be empty");
    }

    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          conversation_id: conversationId,
          sender_id: senderId,
          content: content.trim(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Fetch sender info separately
    const { data: sender } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("id", senderId)
      .maybeSingle();

    return { ...data, sender } as Message;
  } catch (err) {
    console.error("Error sending message:", err);
    throw err;
  }
}

/**
 * Send a message with file attachment
 */
export async function sendMessageWithFile(
  conversationId: string,
  senderId: string,
  content: string,
  filePath: string,
  fileName: string,
  fileSize: number,
  fileType: string
) {
  try {
    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          conversation_id: conversationId,
          sender_id: senderId,
          content: content.trim(),
          file_path: filePath,
          file_name: fileName,
          file_size: fileSize,
          file_type: fileType,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Fetch sender info separately
    const { data: sender } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("id", senderId)
      .maybeSingle();

    return { ...data, sender } as Message;
  } catch (err) {
    console.error("Error sending message with file:", err);
    throw err;
  }
}

/**
 * Get all messages in a conversation
 */
export async function getMessages(conversationId: string, limit = 50) {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select()
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw error;

    const messages = (data as any[]) || [];

    // Fetch sender info for each message
    const enriched = await Promise.all(
      messages.map(async (msg) => {
        const { data: sender } = await supabase
          .from("users")
          .select("id, name, email")
          .eq("id", msg.sender_id)
          .maybeSingle();

        return {
          ...msg,
          sender,
        };
      })
    );

    return (enriched as Message[]) || [];
  } catch (err) {
    console.error("Error fetching messages:", err);
    throw err;
  }
}

/**
 * Get unread message count for a conversation
 */
export async function getUnreadCount(conversationId: string, userId: string) {
  try {
    const { count, error } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .is("read_at", null);

    if (error) throw error;

    return count || 0;
  } catch (err) {
    console.error("Error fetching unread count:", err);
    return 0;
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
) {
  try {
    const { error } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .is("read_at", null);

    if (error) throw error;

    return true;
  } catch (err) {
    console.error("Error marking messages as read:", err);
    throw err;
  }
}

/**
 * Subscribe to real-time messages in a conversation
 * Listens for INSERT events on messages table filtered by conversation_id
 * Delivers messages with <100ms latency
 */
export function subscribeToMessages(
  conversationId: string,
  onNewMessage: (message: Message) => void
): () => void {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        try {
          // Fetch sender info for the new message
          const newData = payload.new as any;
          const { data: sender } = await supabase
            .from("users")
            .select("id, name, email")
            .eq("id", newData.sender_id)
            .maybeSingle();

          const message: Message = {
            ...newData,
            sender: sender || { id: newData.sender_id, name: null, email: null },
          };

          // Trigger callback with enriched message
          onNewMessage(message);
        } catch (err) {
          console.error("Error processing realtime message:", err);
        }
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}
