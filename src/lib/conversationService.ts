import { supabase } from "./supabase";

export interface Conversation {
  id: string;
  user_one_id: string;
  user_two_id: string;
  user_one_name?: string;
  user_two_name?: string;
  last_message_at: string | null;
  created_at: string;
  other_user?: any;
  other_user_id?: string;
  other_user_name?: string;
  last_message?: string;
  unread_count?: number;
}

/**
 * Get all conversations for a user with last message info
 */
export async function getUserConversations(
  userId: string
): Promise<Conversation[]> {
  try {
    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
        id,
        user_one_id,
        user_two_id,
        user_one_name,
        user_two_name,
        last_message_at,
        created_at
      `
      )
      .or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (error) throw error;

    const conversations = (data as any[]) || [];

    // Fetch last message for each conversation and determine other user
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        // Determine other user ID and name from conversation
        const otherUserId =
          conv.user_one_id === userId ? conv.user_two_id : conv.user_one_id;
        const otherUserName =
          conv.user_one_id === userId ? conv.user_two_name : conv.user_one_name;

        // Get last message
        const { data: messages } = await supabase
          .from("messages")
          .select("content")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Store other user info locally with unique ID
        const otherUser = {
          id: otherUserId,
          name: otherUserName || null,
          email: null, // Email not stored in conversation table
        };

        return {
          ...conv,
          other_user_id: otherUserId,
          other_user_name: otherUserName || null,
          other_user: otherUser,
          last_message: messages?.content,
        };
      })
    );

    return enriched;
  } catch (err) {
    console.error("Error fetching conversations:", err);
    return [];
  }
}

/**
 * Get a specific conversation between two users
 */
export async function getConversationBetweenUsers(
  userId1: string,
  userId2: string
): Promise<Conversation | null> {
  try {
    const user_one_id = userId1 < userId2 ? userId1 : userId2;
    const user_two_id = userId1 < userId2 ? userId2 : userId1;

    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_one_id", user_one_id)
      .eq("user_two_id", user_two_id)
      .maybeSingle();

    if (error) throw error;

    return (data as Conversation) || null;
  } catch (err) {
    console.error("Error fetching conversation:", err);
    return null;
  }
}

/**
 * Update last message timestamp for a conversation
 */
export async function updateConversationLastMessage(
  conversationId: string
) {
  try {
    const { error } = await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    if (error) throw error;

    return true;
  } catch (err) {
    console.error("Error updating conversation:", err);
    throw err;
  }
}
