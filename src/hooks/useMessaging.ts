import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  sender?: {
    id: string;
    name?: string;
    email?: string;
  };
  // Client-side tracking
  _clientId?: string; // Temporary ID for optimistic updates
  _isOptimistic?: boolean; // Flag for optimistic messages
}

export interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  addOptimisticMessage: (message: Message) => void;
  confirmOptimisticMessage: (clientId: string, realId: string) => void;
  removeOptimisticMessage: (clientId: string) => void;
  refresh: () => Promise<void>;
}

export interface UseSendMessageReturn {
  sendMessage: (content: string) => Promise<string>;
  sendMessageWithFile: (
    content: string,
    filePath: string,
    fileName: string,
    fileSize: number,
    fileType: string
  ) => Promise<string>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to manage messages for a conversation
 * - Fetches initial message history
 * - Manages optimistic UI updates
 * - Handles message deduplication
 */
export function useMessages(conversationId: string): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messageIdsRef = useRef<Set<string>>(new Set());
  const optimisticMapRef = useRef<Map<string, string>>(new Map()); // clientId -> realId

  const refresh = useCallback(async () => {
    if (!conversationId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(50);

      if (fetchError) throw fetchError;

      const rawMessages = (data || []) as any[];

      // Enrich with sender info
      const enrichedMessages = await Promise.all(
        rawMessages.map(async (msg) => {
          const { data: sender } = await supabase
            .from("users")
            .select("id, name, email")
            .eq("id", msg.sender_id)
            .maybeSingle();

          return {
            ...msg,
            sender: sender || {
              id: msg.sender_id,
              name: null,
              email: null,
            },
          };
        })
      );

      // Update message IDs tracking
      messageIdsRef.current.clear();
      enrichedMessages.forEach((msg) => {
        messageIdsRef.current.add(msg.id);
      });

      setMessages(enrichedMessages);
      setLoading(false);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to load messages";
      setError(errorMsg);
      console.error("Error fetching messages:", err);
      setLoading(false);
      throw err;
    }
  }, [conversationId]);

  // Load initial messages
  useEffect(() => {
    if (!conversationId) return;
    refresh();
  }, [conversationId, refresh]);

  const addOptimisticMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
    if (message._clientId) {
      // Don't add to messageIdsRef yet - we're waiting for real ID
    }
  }, []);

  const confirmOptimisticMessage = useCallback(
    (clientId: string, realId: string) => {
      optimisticMapRef.current.set(clientId, realId);
      messageIdsRef.current.add(realId);

      setMessages((prev) => {
        return prev.map((msg) => {
          if (msg._clientId === clientId) {
            // Replace optimistic message with real one
            return {
              ...msg,
              id: realId,
              _clientId: undefined,
              _isOptimistic: false,
            };
          }
          return msg;
        });
      });
    },
    []
  );

  const removeOptimisticMessage = useCallback((clientId: string) => {
    setMessages((prev) =>
      prev.filter((msg) => msg._clientId !== clientId)
    );
  }, []);

  return {
    messages,
    loading,
    error,
    addOptimisticMessage,
    confirmOptimisticMessage,
    removeOptimisticMessage,
    refresh,
  };
}

/**
 * Hook to send messages
 * - Sends message to Supabase
 * - Supports messages with file attachments
 * - Returns real message ID on success
 */
export function useSendMessage(
  conversationId: string,
  userId: string
): UseSendMessageReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string): Promise<string> => {
      if (!content.trim() || !conversationId || !userId) {
        throw new Error("Invalid message data");
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: insertError } = await supabase
          .from("messages")
          .insert([
            {
              conversation_id: conversationId,
              sender_id: userId,
              content: content.trim(),
            },
          ])
          .select("id")
          .single();

        if (insertError) throw insertError;

        return data.id;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to send message";
        setError(errorMsg);
        console.error("Error sending message:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [conversationId, userId]
  );

  const sendMessageWithFile = useCallback(
    async (
      content: string,
      filePath: string,
      fileName: string,
      fileSize: number,
      fileType: string
    ): Promise<string> => {
      if (!conversationId || !userId) {
        throw new Error("Invalid message data");
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: insertError } = await supabase
          .from("messages")
          .insert([
            {
              conversation_id: conversationId,
              sender_id: userId,
              content: content.trim() || "Sent a resume",
              file_path: filePath,
              file_name: fileName,
              file_size: fileSize,
              file_type: fileType,
            },
          ])
          .select("id")
          .single();

        if (insertError) throw insertError;

        return data.id;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to send message with file";
        setError(errorMsg);
        console.error("Error sending message with file:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [conversationId, userId]
  );

  return { sendMessage, sendMessageWithFile, loading, error };
}

/**
 * Hook to subscribe to real-time messages
 * - Listens for INSERT events on messages table
 * - Filters by conversation_id
 * - Prevents duplicates using message ID deduplication
 * - Returns unsubscribe function for cleanup
 */
export function useRealtimeMessages(
  conversationId: string,
  onNewMessage: (message: Message) => void
) {
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const messageIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!conversationId) return;

    // Cleanup previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    const channel = supabase
      .channel(`messages:${conversationId}:${Date.now()}`)
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
            const newData = payload.new as any;

            // DUPLICATE PREVENTION: Check if message already exists
            if (messageIdsRef.current.has(newData.id)) {
              console.log("Duplicate message detected, skipping:", newData.id);
              return;
            }

            // Mark this ID as received
            messageIdsRef.current.add(newData.id);

            // Enrich with sender info
            const { data: sender } = await supabase
              .from("users")
              .select("id, name, email")
              .eq("id", newData.sender_id)
              .maybeSingle();

            const message: Message = {
              ...newData,
              sender: sender || {
                id: newData.sender_id,
                name: null,
                email: null,
              },
            };

            // Call callback with enriched message
            onNewMessage(message);
          } catch (err) {
            console.error("Error processing realtime message:", err);
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`Realtime subscription active: ${conversationId}`);
        } else if (status === "CHANNEL_ERROR") {
          console.error("Channel error for:", conversationId);
        }
      });

    unsubscribeRef.current = () => {
      supabase.removeChannel(channel);
    };

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [conversationId, onNewMessage]);
}

/**
 * Helper to initialize message ID tracking after fetching initial messages
 */
export function initializeMessageIdTracking(messages: Message[]): Set<string> {
  const ids = new Set<string>();
  messages.forEach((msg) => {
    if (msg.id) ids.add(msg.id);
  });
  return ids;
}
