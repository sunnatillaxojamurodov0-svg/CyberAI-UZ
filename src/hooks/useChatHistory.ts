import { useState, useEffect, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

/* ── types ──────────────────────────────────────────── */

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ChatHistoryState {
  chats: ChatSession[];
  activeChatId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
}

/* ── hook ───────────────────────────────────────────── */

export function useChatHistory() {
  const { user } = useAuth();
  const supabase = getSupabase();

  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /* ── fetch all chat sessions for current user ────── */
  const fetchChatHistory = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }) as unknown as {
      data: ChatSession[] | null;
      error: unknown;
    };

    if (!error && data) setChats(data);
    setIsLoading(false);
  }, [user]);

  /* ── load messages for a specific chat ───────────── */
  const loadChatMessages = useCallback(async (chatId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true }) as unknown as {
      data: ChatMessage[] | null;
      error: unknown;
    };

    if (!error && data) setMessages(data);
    setIsLoading(false);
  }, []);

  /* ── react to activeChatId changes ──────────────── */
  useEffect(() => {
    if (activeChatId) {
      loadChatMessages(activeChatId);
    } else {
      setMessages([]);
    }
  }, [activeChatId, loadChatMessages]);

  /* ── create new chat (local only — row inserted on first message) ── */
  const createNewChat = useCallback(() => {
    setActiveChatId(null);
    setMessages([]);
  }, []);

  /* ── insert a new chat row on first message ──────── */
  const insertChat = useCallback(
    async (title: string): Promise<string | null> => {
      if (!user) return null;
      const res = await supabase
        .from("chats")
        .insert({ user_id: user.id, title } as never)
        .select("id")
        .single();
      const { data, error } = res as unknown as { data: { id: string } | null; error: unknown };

      if (error || !data) {
        console.error("Failed to create chat:", error);
        return null;
      }
      return data.id;
    },
    [user],
  );

  /* ── save a single message to supabase ────────────── */
  const saveMessage = useCallback(
    async (
      chatId: string,
      role: "user" | "assistant",
      content: string,
      metadata: Record<string, unknown> = {},
    ): Promise<ChatMessage | null> => {
      if (!user) return null;
      const res = await supabase
        .from("messages")
        .insert({ chat_id: chatId, user_id: user.id, role, content, metadata } as never)
        .select("*")
        .single();
      const { data, error } = res as unknown as { data: ChatMessage | null; error: unknown };

      if (error) {
        console.error("Failed to save message:", error);
        return null;
      }
      return data;
    },
    [user],
  );

  /* ── save a user message; auto-create chat if needed ── */
  const sendUserMessage = useCallback(
    async (
      content: string,
      metadata: Record<string, unknown> = {},
    ): Promise<{ chatId: string; message: ChatMessage | null }> => {
      let chatId = activeChatId;

      if (!chatId) {
        const title = content.length > 30 ? content.slice(0, 30) + "…" : content;
        chatId = await insertChat(title);
        if (!chatId) throw new Error("Failed to create chat session");
        setActiveChatId(chatId);
      }

      const message = await saveMessage(chatId, "user", content, metadata);
      return { chatId, message };
    },
    [activeChatId, insertChat, saveMessage],
  );

  /* ── save an AI response message ──────────────────── */
  const saveAssistantMessage = useCallback(
    async (
      chatId: string,
      content: string,
      metadata: Record<string, unknown> = {},
    ): Promise<ChatMessage | null> => {
      return saveMessage(chatId, "assistant", content, metadata);
    },
    [saveMessage],
  );

  /* ── edit chat title ────────────────────────────── */
  const updateChatTitle = useCallback(
    async (chatId: string, newTitle: string) => {
      if (!user) return;
      const res = await supabase
        .from("chats")
        .update({ title: newTitle } as never)
        .eq("id", chatId)
        .eq("user_id", user.id);
      const { error } = res as unknown as { error: unknown };

      if (error) {
        console.error("Failed to update chat title:", error);
        return;
      }

      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c)),
      );
    },
    [user],
  );

  /* ── client-side search ──────────────────────────── */
  const searchChats = useCallback(
    (query: string): ChatSession[] => {
      if (!query.trim()) return chats;
      const q = query.toLowerCase();
      return chats.filter((c) => c.title.toLowerCase().includes(q));
    },
    [chats],
  );

  /* ── delete a chat and its messages ──────────────── */
  const deleteChat = useCallback(
    async (chatId: string) => {
      if (!user) return;
      const res = await supabase
        .from("chats")
        .delete()
        .eq("id", chatId)
        .eq("user_id", user.id);
      const { error } = res as unknown as { error: unknown };

      if (error) {
        console.error("Failed to delete chat:", error);
        return;
      }

      setChats((prev) => prev.filter((c) => c.id !== chatId));
      if (activeChatId === chatId) createNewChat();
    },
    [user, activeChatId, createNewChat],
  );

  /* ── fetch on mount / user change ─────────────────── */
  useEffect(() => {
    if (user) fetchChatHistory();
  }, [user?.id]);

  return {
    /* state */
    chats,
    activeChatId,
    setActiveChatId,
    messages,
    isLoading,

    /* chat CRUD */
    fetchChatHistory,
    createNewChat,
    updateChatTitle,
    searchChats,
    deleteChat,

    /* message operations */
    sendUserMessage,
    saveAssistantMessage,
    saveMessage,
  };
}
