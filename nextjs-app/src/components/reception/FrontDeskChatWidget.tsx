'use client';

import { useEffect, useState } from 'react';

interface ChatMessage {
  id: string;
  content: string;
  senderType: string;
  createdAt: string;
}

interface FrontDeskChatWidgetProps {
  threadId: string;
}

export function FrontDeskChatWidget({ threadId }: FrontDeskChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const source = new EventSource(`/api/reception/chat/${threadId}/stream`);

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.type === 'snapshot' && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      } catch {
        // ignore parse errors
      }
    };

    source.onerror = () => {
      source.close();
    };

    return () => {
      source.close();
    };
  }, [threadId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content) return;
    setSending(true);
    try {
      await fetch(`/api/reception/chat/${threadId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      setInput('');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-80 flex-col rounded-lg border bg-card">
      <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground">Start a conversation with the front desk.</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderType === 'USER' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                msg.senderType === 'USER'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className="mt-1 text-[10px] opacity-70">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="border-t p-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Message front desk..."
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending}
            className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-60"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

