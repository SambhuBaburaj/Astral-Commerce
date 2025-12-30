import { useEffect, useRef, useState } from 'react';

export function useChatSocket(conversationId: string | null) {
  const [messages, setMessages] = useState<any[]>([]);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    ws.current = new WebSocket('ws://localhost:4000/ws');

    ws.current.onopen = () => {
      console.log('Connected to WS');
      ws.current?.send(JSON.stringify({ type: 'join_room', data: { conversationId } }));
    }

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_message') {
        setMessages(prev => [data.data, ...prev]);
      }
    };

    return () => {
      ws.current?.close();
    };
  }, [conversationId]);

  const sendMessage = (content: string, senderType: 'user' | 'admin') => {
    if (ws.current && conversationId) {
      // Optimistic update
      setMessages(prev => [{
        content,
        senderType,
        createdAt: new Date().toISOString()
      }, ...prev]);

      ws.current.send(JSON.stringify({
        type: 'send_message',
        data: { conversationId, content, senderType }
      }));
    }
  };

  return { messages, setMessages, sendMessage };
}
