"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/api";
import { useAdminSocket } from "@/hooks/useAdminSocket";

type Message = {
    id: string;
    content: string;
    senderType: "user" | "admin";
    isRead: boolean;
    createdAt: string;
};

type Conversation = {
    id: string;
    status: string;
    updatedAt: string;
    messages: Message[];
};

export default function AdminDashboard() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);


  const fetchConversations = async () => {
      try {
          const res = await api.get("/conversations");
          setConversations(res.data);
      } catch (e) {
          console.error(e);
      }
  };

  const fetchMessages = async (id: string) => {
      try {
          // Mark as read first
          await api.post(`/conversations/${id}/read`);
          
          const res = await api.get(`/conversations/${id}/messages`);
          setMessages(res.data);
          
          // Refresh conversations to update unread status in sidebar
          fetchConversations();
      } catch (e) {
          console.error(e);
      }
  };

  useEffect(() => {
      fetchConversations();
  }, []);

  useEffect(() => {
      if (selectedId) {
          fetchMessages(selectedId);
          setTimeout(() => inputRef.current?.focus(), 100);
      }
  }, [selectedId]);

  const { sendMessage } = useAdminSocket(useCallback((data: any) => {
      // Refresh conversations list to show new message preview/timestamp
      fetchConversations();
      // If the updated conversation is currently selected, refresh messages
      if (data.data.conversationId === selectedId || (data.type === 'conversation_updated' && data.data.conversationId === selectedId)) {
        // Optimistically add message or refetch? Refetch is safer for sync.
        fetchMessages(selectedId!); 
      }
  }, [selectedId]));

  const sendReply = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedId || !reply.trim()) return;

      sendMessage(selectedId, reply);
      setReply("");
      // Optimistic update or wait for socket echo?
      // Since our API broadcasts back to room, the socket listener above will trigger fetchMessages.
      // But we might want an immediate UI update if latency is high.
      // For now, let's rely on the socket echo.
  };

  return (
    <div className="flex h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <h1 className="font-bold text-xl">Inbox</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
            {conversations.map(conv => (
                <div 
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={`p-4 border-b border-zinc-100 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${selectedId === conv.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                    <div className="flex justify-between mb-1">
                        <span className="font-medium text-sm">User {conv.id.slice(0, 4)}</span>
                        <span className="text-xs text-zinc-500">{new Date(conv.updatedAt).toLocaleTimeString()}</span>
                    </div>
                    <p className={`text-sm truncate ${
                        conv.messages?.[0]?.senderType === 'user' && !conv.messages?.[0]?.isRead
                         ? 'font-bold text-zinc-900 dark:text-zinc-100' 
                         : 'text-zinc-500'
                    }`}>
                        {conv.messages?.[0]?.content || "No messages"}
                    </p>
                </div>
            ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedId ? (
            <>
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm z-10">
                    <h2 className="font-semibold">Conversation {selectedId}</h2>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 flex flex-col-reverse gap-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-md p-3 rounded-2xl text-sm shadow-sm ${
                                msg.senderType === 'admin' 
                                ? 'bg-blue-600 text-white rounded-br-none' 
                                : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-bl-none'
                            }`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
                    <form 
                        onSubmit={async (e) => {
                            e.preventDefault();
                            if(!reply.trim()) return;
                            
                            sendMessage(selectedId!, reply);
                            
                            // Optimistic update
                            const optimisticMsg: Message = {
                                id: crypto.randomUUID(),
                                content: reply,
                                senderType: "admin",
                                isRead: true,
                                createdAt: new Date().toISOString()
                            };
                            setMessages(prev => [optimisticMsg, ...prev]);
                            
                            setReply("");
                        }} 
                        className="flex gap-2"
                    >
                        <input 
                            ref={inputRef}
                            value={reply}
                            onChange={e => setReply(e.target.value)}
                            className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Type a reply..."
                        />
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                            Send
                        </button>
                    </form>
                </div>
            </>
        ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-400">
                Select a conversation to start chatting
            </div>
        )}
      </div>
    </div>
  );
}
