import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import {
  getPendingChatRequests,
  acceptChatRequest,
  rejectChatRequest,
} from "@/lib/chatRequestService";
import {
  getUserConversations,
  getConversationBetweenUsers,
  updateConversationLastMessage,
} from "@/lib/conversationService";
import { markMessagesAsRead } from "@/lib/messageService";
import { useMessages, useSendMessage, useRealtimeMessages } from "@/hooks/useMessaging";
import { uploadResume, validateFile } from "@/lib/fileUploadService";
import { MessageCircle, Send, X, Check, FileUp } from "lucide-react";
import { toast } from "sonner";

interface PendingRequest {
  id: string;
  requester_id: string;
  receiver_id: string;
  experience_id: string;
  created_at: string;
  requester?: any;
  experience?: any;
}

interface User {
  id: string;
  name?: string;
  email?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at?: string | null;
  sender?: {
    id: string;
    name?: string;
    email?: string;
  };
  // Optimistic UI tracking
  _clientId?: string;
  _isOptimistic?: boolean;
}

const PrepTalk = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State Management
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(
    null
  );
  const [messageContent, setMessageContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use messaging hooks for current conversation
  const {
    messages,
    loading: loadingMessages,
    addOptimisticMessage,
    confirmOptimisticMessage,
    removeOptimisticMessage,
  } = useMessages(selectedConversation?.id || "");

  const { sendMessage, sendMessageWithFile, loading: sendingMessage } = useSendMessage(
    selectedConversation?.id || "",
    user?.id || ""
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user?.id) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Fetch pending requests
  useEffect(() => {
    if (!user?.id) return;

    const fetchRequests = async (isInitial = false) => {
      try {
        if (isInitial) setLoadingRequests(true);
        
        const requests = await getPendingChatRequests(user.id);
        
        // Only update state if requests have changed
        setPendingRequests((prevRequests) => {
          const hasChanged =
            requests.length !== prevRequests.length ||
            JSON.stringify(requests) !== JSON.stringify(prevRequests);

          if (hasChanged) {
            return requests as PendingRequest[];
          }
          return prevRequests;
        });
      } catch (err) {
        console.error("Error fetching requests:", err);
      } finally {
        if (isInitial) setLoadingRequests(false);
      }
    };

    // Initial fetch immediately with loading state
    fetchRequests(true);

    // Then check every 5 seconds for new requests (without loading state)
    const interval = setInterval(() => fetchRequests(false), 5000);
    
    return () => clearInterval(interval);
  }, [user?.id]);

  // Fetch conversations
  useEffect(() => {
    if (!user?.id) return;

    const fetchConversations = async (isInitial = false) => {
      try {
        if (isInitial) setLoadingConversations(true);
        const convs = await getUserConversations(user.id);
        setConversations(convs);
      } catch (err) {
        console.error("Error fetching conversations:", err);
      } finally {
        if (isInitial) setLoadingConversations(false);
      }
    };

    // Initial fetch immediately with loading state
    fetchConversations(true);
    
    // Then check every 2 seconds for new conversations (without loading state)
    const interval = setInterval(() => fetchConversations(false), 2000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Fetch messages for selected conversation with real-time updates
  useEffect(() => {
    if (!selectedConversation?.id || !user?.id) {
      return;
    }

    // Mark messages as read when loading them
    markMessagesAsRead(selectedConversation.id, user.id).catch((err) =>
      console.error("Error marking messages as read:", err)
    );

    scrollToBottom();
  }, [selectedConversation?.id, user?.id]);

  // Setup realtime subscription for new messages
  useRealtimeMessages(selectedConversation?.id || "", (newMessage) => {
    // Check if message's ID already exists in the messages list
    if (messages.some((msg) => msg.id === newMessage.id)) {
      console.log("Duplicate message detected, skipping:", newMessage.id);
      return;
    }

    // Add new message to state
    addOptimisticMessage({
      ...newMessage,
      _isOptimistic: false,
    });

    // Auto-mark new messages as read
    if (user?.id) {
      markMessagesAsRead(selectedConversation?.id || "", user.id).catch((err) =>
        console.error("Error marking messages as read:", err)
      );
    }

    scrollToBottom();
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      setProcessingRequest(requestId);
      const conversationId = await acceptChatRequest(requestId, user!.id);

      // Refresh requests
      const requests = await getPendingChatRequests(user!.id);
      setPendingRequests(requests as PendingRequest[]);

      // Refresh conversations
      const convs = await getUserConversations(user!.id);
      setConversations(convs);

      // Select the new conversation
      if (conversationId) {
        const conv = convs.find((c) => c.id === conversationId);
        if (conv) {
          setSelectedConversation(conv);
        }
      }

      toast.success("Chat request accepted!");
    } catch (err) {
      console.error("Error accepting request:", err);
      toast.error("Failed to accept request");
    } finally {
      setProcessingRequest("");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      setProcessingRequest(requestId);
      await rejectChatRequest(requestId, user!.id);

      // Refresh requests
      const requests = await getPendingChatRequests(user!.id);
      setPendingRequests(requests as PendingRequest[]);

      toast.success("Request rejected");
    } catch (err) {
      console.error("Error rejecting request:", err);
      toast.error("Failed to reject request");
    } finally {
      setProcessingRequest("");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedConversation?.id || !user?.id) return;

    // Must have either text or file
    if (!messageContent.trim() && !selectedFile) {
      toast.error("Please enter a message or select a resume");
      return;
    }

    const messageText = messageContent.trim();

    // Generate unique client ID for optimistic tracking
    const clientId = `opt-${Date.now()}-${Math.random()}`;

    try {
      setUploadingFile(true);

      let fileData = {
        file_path: null as string | null,
        file_name: null as string | null,
        file_size: null as number | null,
        file_type: null as string | null,
      };

      // Upload file if selected
      if (selectedFile) {
        try {
          const uploadResult = await uploadResume(
            selectedFile,
            user.id,
            selectedConversation.id
          );
          fileData = {
            file_path: uploadResult.filePath,
            file_name: uploadResult.fileName,
            file_size: uploadResult.fileSize,
            file_type: uploadResult.fileType,
          };
        } catch (uploadErr) {
          const errorMsg = uploadErr instanceof Error ? uploadErr.message : "Failed to upload resume";
          toast.error(errorMsg);
          console.error("File upload error:", uploadErr);
          return;
        }
      }

      // Create optimistic message
      const optimisticMessage = {
        id: clientId,
        _clientId: clientId,
        _isOptimistic: true,
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        content: messageText || "Sent a resume",
        created_at: new Date().toISOString(),
        read_at: null,
        ...fileData,
        sender: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      };

      // Add optimistic message to UI immediately
      addOptimisticMessage(optimisticMessage);
      scrollToBottom();

      // Clear inputs
      setMessageContent("");
      clearSelectedFile();

      try {
        // Send message to server (non-blocking)
        let realMessageId: string;

        if (selectedFile && fileData.file_path) {
          realMessageId = await sendMessageWithFile(
            messageText,
            fileData.file_path,
            fileData.file_name!,
            fileData.file_size!,
            fileData.file_type!
          );
        } else {
          realMessageId = await sendMessage(messageText);
        }

        // Replace optimistic message with real one
        confirmOptimisticMessage(clientId, realMessageId);

        // Update conversation metadata
        await updateConversationLastMessage(selectedConversation.id);

        toast.success(selectedFile ? "Resume sent successfully!" : "Message sent!");
        console.log("Message sent successfully:", realMessageId);
      } catch (err) {
        console.error("Error sending message:", err);

        // Remove optimistic message on failure
        removeOptimisticMessage(clientId);

        // Restore user's text for retry
        setMessageContent(messageText);
        if (selectedFile) {
          setSelectedFile(selectedFile);
        }

        toast.error("Failed to send message. Please try again.");
      }
    } finally {
      setUploadingFile(false);
    }
  };

  if (!user?.id) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-12 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8 animate-in fade-in slide-in-from-top duration-500">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground flex items-center gap-2">
            <MessageCircle className="h-7 sm:h-8 w-7 sm:w-8 text-blue-300" />
            PrepTalk
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-2">
            Connect and chat with other placement seekers
          </p>
        </div>

        {/* Mobile-responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-h-[600px]">
          {/* Left Sidebar - Requests and Conversations - Slides from left on mobile */}
          <div className="lg:col-span-1 space-y-4 animate-in fade-in slide-in-from-left duration-500">
            {/* Pending Requests */}
            {loadingRequests ? (
              <div className="glass-card p-4 text-center animate-in fade-in">
                <div className="relative w-6 h-6 mx-auto">
                  <div className="absolute inset-0 border-2 border-transparent border-t-blue-400 border-r-purple-400 rounded-full animate-spin" />
                </div>
              </div>
            ) : pendingRequests.length > 0 ? (
              <div className="space-y-3">
                <h2 className="text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wider px-2">
                  Connect Requests
                </h2>
                {pendingRequests.map((req, idx) => (
                  <div
                    key={req.id}
                    className="glass-card p-3 sm:p-4 space-y-3 border-l-4 border-accent/60 hover:border-accent/80 hover:bg-accent/5 transition-all duration-200 animate-in fade-in slide-in-from-left"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="flex-shrink-0 w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-gradient-to-br from-accent/40 to-primary/40 flex items-center justify-center border border-accent/20 mt-0.5">
                        <span className="text-xs font-bold text-accent">
                          {(req.requester?.name || req.requester?.email || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {req.requester?.name || req.requester?.email || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          wants to chat about
                        </p>
                        <p className="text-xs font-medium text-accent mt-1 truncate">
                          {req.experience?.company || "Experience"} • {req.experience?.role || "Role"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleAcceptRequest(req.id)}
                        disabled={processingRequest === req.id}
                        className="flex-1 px-2 sm:px-3 py-2 rounded-lg bg-gradient-to-r from-success/40 to-success/20 text-success hover:from-success/60 hover:to-success/40 transition-all duration-200 text-xs font-semibold flex items-center justify-center gap-1 sm:gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed border border-success/20"
                      >
                        <Check className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="hidden sm:inline">Accept</span>
                        <span className="sm:hidden">OK</span>
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req.id)}
                        disabled={processingRequest === req.id}
                        className="flex-1 px-2 sm:px-3 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all duration-200 text-xs font-semibold flex items-center justify-center gap-1 sm:gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed border border-destructive/20"
                      >
                        <X className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="hidden sm:inline">Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !loadingRequests && (
                <div className="glass-card p-4 text-center text-muted-foreground text-xs sm:text-sm">
                  No pending requests
                </div>
              )
            )}

            {/* Conversations List */}
            {loadingConversations ? (
              <div className="glass-card p-4 text-center animate-in fade-in">
                <div className="relative w-6 h-6 mx-auto">
                  <div className="absolute inset-0 border-2 border-transparent border-t-blue-400 border-r-purple-400 rounded-full animate-spin" />
                </div>
              </div>
            ) : conversations.length > 0 ? (
              <div className="space-y-3">
                <h2 className="text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wider px-2">
                  Messages
                </h2>
                {conversations.map((conv, idx) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-2.5 sm:p-3 rounded-lg transition-all text-left flex items-center gap-2 sm:gap-3 group animate-in fade-in slide-in-from-left ${
                      selectedConversation?.id === conv.id
                        ? "glass-card border-l-2 border-primary bg-primary/10"
                        : "glass-card hover:bg-secondary/30 hover:border-l-2 hover:border-primary/30"
                    }`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center border border-primary/20">
                      <span className="text-xs font-bold text-primary">
                        {(conv.other_user_name || conv.other_user?.name || conv.other_user?.email || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm text-foreground truncate">
                        {conv.other_user_name || conv.other_user?.name || conv.other_user?.email || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.last_message || "No messages yet"}
                      </p>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="flex-shrink-0 inline-block text-xs bg-gradient-to-r from-primary to-accent text-primary-foreground px-2 sm:px-2.5 py-0.5 rounded-full font-semibold shadow-lg shadow-primary/20">
                        {conv.unread_count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              !loadingConversations && (
                <div className="glass-card p-4 text-center text-muted-foreground text-sm">
                  No conversations yet. Accept a request or send a connect request!
                </div>
              )
            )}
          </div>

          {/* Right Side - Chat Interface - Mobile responsive */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <div className="glass-card h-full flex flex-col overflow-hidden">
                {/* Chat Header - Modern Design */}
                <div className="p-3 sm:p-5 border-b border-border/30 bg-gradient-to-r from-primary/5 to-accent/5">
                  <div className="flex items-center gap-2 sm:gap-4">
                    {/* User Avatar */}
                    <div className="flex-shrink-0 w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center border border-primary/20">
                      <span className="text-xs sm:text-sm font-bold text-primary">
                        {(selectedConversation.other_user_name || selectedConversation.other_user?.name || selectedConversation.other_user?.email || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-base sm:text-lg text-foreground truncate">
                        {selectedConversation.other_user_name || selectedConversation.other_user?.name || selectedConversation.other_user?.email || "User"}
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {selectedConversation.other_user?.email || "No email available"}
                      </p>
                    </div>
                    {/* Online Indicator */}
                    <div className="flex-shrink-0">
                      <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-success/60 border border-success/40"></div>
                    </div>
                  </div>
                </div>

                {/* Messages Area - Modern Design - Mobile responsive */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 sm:space-y-4 min-h-96 bg-gradient-to-b from-foreground/[0.01] to-background">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="relative w-8 h-8">
                        <div className="absolute inset-0 border-2 border-transparent border-t-blue-400 border-r-purple-400 rounded-full animate-spin" />
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MessageCircle className="h-10 sm:h-12 w-10 sm:w-12 text-muted-foreground/30 mx-auto mb-2 sm:mb-3" />
                        <p className="text-muted-foreground text-sm sm:text-base">
                          No messages yet. Start the conversation!
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-2 animate-fade-in ${
                          msg.sender_id === user.id
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        {msg.sender_id !== user.id && (
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-secondary/40 flex items-center justify-center text-xs font-semibold text-muted-foreground">
                            {(msg.sender?.name || msg.sender?.email || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                        <div
                          className={`max-w-[70vw] sm:max-w-xs lg:max-w-md group ${
                            msg.sender_id === user.id
                              ? "flex flex-col items-end"
                              : "flex flex-col items-start"
                          }`}
                        >
                          {msg.sender_id !== user.id && (
                            <p className="text-xs font-semibold text-muted-foreground mb-0.5 px-3">
                              {msg.sender?.name || msg.sender?.email || "User"}
                            </p>
                          )}
                          <div
                            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl backdrop-blur-md transition-all duration-200 ${
                              msg.sender_id === user.id
                                ? "bg-gradient-to-br from-primary/60 to-primary/40 text-primary-foreground shadow-lg shadow-primary/20 border border-primary/30"
                                : "bg-gradient-to-br from-secondary/60 to-secondary/40 text-foreground shadow-md shadow-secondary/10 border border-secondary/30"
                            }`}
                          >
                            {msg.content && (
                              <p className="text-xs sm:text-sm break-words leading-relaxed">{msg.content}</p>
                            )}

                            {/* File Attachment Display - Improved Design */}
                            {msg.file_path && msg.file_name && (
                              <div className={`${msg.content ? "mt-3 pt-3 border-t border-current border-opacity-20" : ""}`}>
                                <a
                                  href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/resumes/${encodeURIComponent(msg.file_path)}`}
                                  download={msg.file_name}
                                  className={`group inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all font-medium text-xs sm:text-sm cursor-pointer ${
                                    msg.sender_id === user.id
                                      ? "bg-primary-foreground/25 hover:bg-primary-foreground/35 active:scale-95"
                                      : "bg-foreground/15 hover:bg-foreground/25 active:scale-95"
                                  }`}
                                  title={`Download ${msg.file_name}`}
                                >
                                  {/* File Icon */}
                                  <div className="flex-shrink-0 p-1.5 rounded-lg bg-current bg-opacity-20 group-hover:bg-opacity-30 transition-all">
                                    <FileUp className="h-4 w-4" />
                                  </div>

                                  {/* File Info */}
                                  <div className="flex flex-col gap-0.5 min-w-0">
                                    <span className="truncate max-w-[140px] sm:max-w-[220px] font-semibold">
                                      {msg.file_name}
                                    </span>
                                    {msg.file_size && (
                                      <span className="text-opacity-70 text-[10px] sm:text-xs">
                                        {(msg.file_size / 1024 / 1024).toFixed(2)} MB
                                      </span>
                                    )}
                                  </div>

                                  {/* Download Icon */}
                                  <div className="flex-shrink-0 ml-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <svg
                                      className="h-4 w-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                      />
                                    </svg>
                                  </div>
                                </a>
                              </div>
                            )}
                          </div>
                          <p
                            className={`text-xs mt-1 px-3 transition-opacity ${
                              msg.sender_id === user.id
                                ? "text-primary/60 opacity-0 group-hover:opacity-100"
                                : "text-muted-foreground/60 opacity-0 group-hover:opacity-100"
                            }`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        {msg.sender_id === user.id && (
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/40 flex items-center justify-center text-xs font-semibold text-primary">
                            <span className="hidden">You</span>
                            <span className="text-[10px]">✓</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input - Modern Design - Mobile optimized */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 sm:p-5 border-t border-border/30 bg-gradient-to-r from-primary/3 to-accent/3 backdrop-blur-sm space-y-3 sm:space-y-4"
                >
                  {/* Drag and Drop Zone / File Preview */}
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`relative rounded-xl border-2 border-dashed transition-all duration-200 p-3 sm:p-4 ${
                      selectedFile
                        ? "border-success/50 bg-success/5"
                        : "border-secondary/40 bg-secondary/5 hover:border-primary/40 hover:bg-primary/5"
                    }`}
                  >
                    {selectedFile ? (
                      // File Selected - Preview
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 p-2 rounded-lg bg-success/20">
                            <FileUp className="h-5 w-5 text-success" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={clearSelectedFile}
                          disabled={uploadingFile}
                          className="flex-shrink-0 p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                          title="Remove file"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      // No File - Upload Prompt
                      <div className="text-center py-2">
                        <div className="flex justify-center mb-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <FileUp className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          Drag resume here or click to upload
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF files up to 2MB
                        </p>
                      </div>
                    )}

                    {/* Hidden File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {/* Clickable overlay for entire drag zone */}
                    {!selectedFile && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 rounded-xl"
                      />
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="flex gap-2 sm:gap-3 items-end">
                    <div className="flex-1 relative min-w-0">
                      <input
                        type="text"
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        placeholder={selectedFile ? "Add a note..." : "Type a message..."}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-secondary/40 text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 border border-secondary/30 transition-all duration-200 backdrop-blur-sm text-sm"
                      />
                    </div>

                    {/* Send Button */}
                    <button
                      type="submit"
                      disabled={
                        (!messageContent.trim() && !selectedFile) ||
                        uploadingFile ||
                        sendingMessage
                      }
                      className="flex-shrink-0 p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border border-primary/30"
                      title={
                        selectedFile
                          ? "Send message and resume"
                          : "Send message"
                      }
                    >
                      {uploadingFile || sendingMessage ? (
                        <div className="relative w-4 sm:w-5 h-4 sm:h-5">
                          <div className="absolute inset-0 border-2 border-transparent border-t-primary-foreground border-r-primary-foreground/50 rounded-full animate-spin" />
                        </div>
                      ) : (
                        <Send className="h-4 sm:h-5 w-4 sm:w-5" />
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="glass-card h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center px-4">
                  <MessageCircle className="h-12 sm:h-16 w-12 sm:w-16 text-muted-foreground/20 mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base font-medium">No conversation selected</p>
                  <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">
                    Select a conversation or accept a request to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrepTalk;
