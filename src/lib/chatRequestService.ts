import { supabase } from "./supabase";

export interface ChatRequest {
  id: string;
  requester_id: string;
  receiver_id: string;
  experience_id: string;
  status: "pending" | "accepted" | "rejected";
  requester_name?: string;
  receiver_name?: string;
  requester?: any;
  experience?: any;
  created_at: string;
}

/**
 * Sends a chat request to another user
 */
export async function sendChatRequest(
  requesterId: string,
  receiverId: string,
  experienceId: string
) {
  try {
    if (requesterId === receiverId) {
      throw new Error("Cannot send chat request to yourself");
    }

    // Fetch requester and receiver names
    const [{ data: requesterData }, { data: receiverData }] = await Promise.all([
      supabase.from("users").select("name").eq("id", requesterId).maybeSingle(),
      supabase.from("users").select("name").eq("id", receiverId).maybeSingle(),
    ]);

    const { data, error } = await supabase
      .from("chat_requests")
      .insert([
        {
          requester_id: requesterId,
          receiver_id: receiverId,
          experience_id: experienceId,
          status: "pending",
          requester_name: requesterData?.name || null,
          receiver_name: receiverData?.name || null,
        },
      ])
      .select();

    if (error) {
      if (error.code === "23505") {
        throw new Error(
          "Chat request already exists with this user for this experience"
        );
      }
      throw error;
    }

    return data?.[0];
  } catch (err) {
    console.error("Error sending chat request:", err);
    throw err;
  }
}

/**
 * Get all pending chat requests for a user
 */
export async function getPendingChatRequests(userId: string) {
  try {
    const { data, error } = await supabase
      .from("chat_requests")
      .select("id, requester_id, receiver_id, experience_id, status, created_at, requester_name, receiver_name")
      .eq("receiver_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const requests = (data as any) || [];

    // Fetch requester and experience data separately
    const enriched = await Promise.all(
      requests.map(async (req) => {
        const [{ data: requester }, { data: experience }] = await Promise.all([
          supabase.from("users").select("id, name, email").eq("id", req.requester_id).maybeSingle(),
          supabase.from("experiences").select("id, company, role, user_name").eq("id", req.experience_id).maybeSingle(),
        ]);

        return {
          ...req,
          requester,
          experience,
        };
      })
    );

    return enriched;
  } catch (err) {
    console.error("Error fetching pending chat requests:", err);
    throw err;
  }
}

/**
 * Get all sent chat requests by a user
 */
export async function getSentChatRequests(userId: string) {
  try {
    const { data, error } = await supabase
      .from("chat_requests")
      .select("id, requester_id, receiver_id, experience_id, status, created_at")
      .eq("requester_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const requests = (data as any) || [];

    // Fetch receiver data separately
    const enriched = await Promise.all(
      requests.map(async (req) => {
        const { data: receiver } = await supabase
          .from("users")
          .select("id, name, email")
          .eq("id", req.receiver_id)
          .maybeSingle();

        return {
          ...req,
          receiver,
        };
      })
    );

    return enriched;
  } catch (err) {
    console.error("Error fetching sent chat requests:", err);
    throw err;
  }
}

/**
 * Accept a chat request
 */
export async function acceptChatRequest(
  requestId: string,
  userId: string
): Promise<string> {
  try {
    // Get the request details
    const { data: request, error: fetchError } = await supabase
      .from("chat_requests")
      .select("requester_id, receiver_id, requester_name, receiver_name")
      .eq("id", requestId)
      .eq("receiver_id", userId)
      .single();

    if (fetchError) throw fetchError;

    if (!request) {
      throw new Error("Chat request not found or unauthorized");
    }

    // Fetch current receiver name from users table
    const { data: receiverData, error: receiverError } = await supabase
      .from("users")
      .select("name")
      .eq("id", request.receiver_id)
      .maybeSingle();

    if (receiverError) throw receiverError;

    const currentReceiverName = receiverData?.name || request.receiver_name || null;

    // Ensure user_one_id is always less than user_two_id for consistency
    const user_one_id =
      request.requester_id < request.receiver_id
        ? request.requester_id
        : request.receiver_id;
    const user_two_id =
      request.requester_id < request.receiver_id
        ? request.receiver_id
        : request.requester_id;

    // Determine user names based on order
    const user_one_name = user_one_id === request.requester_id ? request.requester_name : currentReceiverName;
    const user_two_name = user_two_id === request.requester_id ? request.requester_name : currentReceiverName;

    // Create or get conversation
    let conversationId: string | undefined;

    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert([
        {
          user_one_id,
          user_two_id,
          user_one_name,
          user_two_name,
        },
      ])
      .select()
      .single();

    if (convError && convError.code === "23505") {
      // Unique constraint violation - conversation already exists
      const { data: existingConv, error: getConvError } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_one_id", user_one_id)
        .eq("user_two_id", user_two_id)
        .single();

      if (getConvError) throw getConvError;
      conversationId = existingConv?.id;
    } else if (convError) {
      throw convError;
    } else {
      conversationId = conversation?.id;
    }

    if (!conversationId) {
      throw new Error("Failed to create or retrieve conversation");
    }

    // Update chat request status and receiver_name with current receiver's name
    const { error: updateError } = await supabase
      .from("chat_requests")
      .update({ status: "accepted", receiver_name: currentReceiverName })
      .eq("id", requestId);

    if (updateError) throw updateError;

    return conversationId;
  } catch (err) {
    console.error("Error accepting chat request:", err);
    throw err;
  }
}

/**
 * Reject a chat request
 */
export async function rejectChatRequest(requestId: string, userId: string) {
  try {
    const { error } = await supabase
      .from("chat_requests")
      .update({ status: "rejected" })
      .eq("id", requestId)
      .eq("receiver_id", userId);

    if (error) throw error;

    return true;
  } catch (err) {
    console.error("Error rejecting chat request:", err);
    throw err;
  }
}

/**
 * Check if chat request exists between two users
 */
export async function checkChatRequestExists(
  requesterId: string,
  receiverId: string
): Promise<ChatRequest | null> {
  try {
    const { data, error } = await supabase
      .from("chat_requests")
      .select("*")
      .or(
        `and(requester_id.eq.${requesterId},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${requesterId})`
      )
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return data as ChatRequest | null;
  } catch (err) {
    console.error("Error checking chat request:", err);
    return null;
  }
}
