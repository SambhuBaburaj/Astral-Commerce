import { useEffect, useRef, useState } from 'react';

export function useAdminSocket(onConversationUpdate: (data: any) => void) {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:4000/ws');

    ws.current.onopen = () => {
      console.log('Admin Connected to WS');
      ws.current?.send(JSON.stringify({ type: 'join_dashboard', data: {} }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'conversation_updated' || data.type === 'new_conversation') {
        onConversationUpdate(data);
      }
    };

    return () => {
      ws.current?.close();
    };
  }, [onConversationUpdate]);

  const sendMessage = (conversationId: string, content: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'send_message',
        data: { conversationId, content, senderType: 'admin' }
      }));
    } else {
      console.error("WebSocket is not connected");
    }
  };

  return { sendMessage };
}
