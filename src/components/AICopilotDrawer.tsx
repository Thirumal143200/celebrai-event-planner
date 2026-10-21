'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { AICopilotMessage, EventData } from '@/lib/types';
import { generateClientSideId } from '@/lib/utils';

interface AICopilotDrawerProps {
  event: EventData;
  isOpen: boolean;
  onClose: () => void;
  onPlanRefresh?: () => void;
}

export default function AICopilotDrawer({
  event,
  isOpen,
  onClose,
  onPlanRefresh,
}: AICopilotDrawerProps) {
  const [messages, setMessages] = useState<AICopilotMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    `How can I trim 10% from my ${event.type} budget without sacrificing guest experience?`,
    `What are the most common vendor oversights for a ${event.guestCount}-guest ${event.type}?`,
    `Generate 3 distinct creative aesthetic themes for our celebration.`,
    `Draft a detailed day-of schedule and coordinator checklist.`,
    `What questions should I ask when interviewing venue and catering vendors?`,
  ];

  // Fetch history on open
  useEffect(() => {
    if (isOpen && event.id) {
      fetch(`/api/copilot?eventId=${event.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data && data.data.length > 0) {
            setMessages(data.data);
          } else {
            // Default welcome message
            setMessages([
              {
                id: 'welcome',
                role: 'assistant',
                content: `Hello! I am your CelebrAI planning partner for **${event.name}**. How can I help you refine your budget, optimize your timeline, or brainstorm unique ideas today?`,
                timestamp: new Date().toISOString(),
                isAIGenerated: true,
              },
            ]);
          }
        })
        .catch(() => {
          // Fallback welcome message
          setMessages([
            {
              id: 'welcome-fb',
              role: 'assistant',
              content: `Welcome to CelebrAI Copilot! Ask me anything about organizing your ${event.type} event.`,
              timestamp: new Date().toISOString(),
              isAIGenerated: true,
            },
          ]);
        });
    }
  }, [isOpen, event.id, event.name, event.type]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    setInput('');
    const userMsg: AICopilotMessage = {
      id: generateClientSideId('user'),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      isAIGenerated: false,
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          message: text,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setMessages((prev) => [...prev, data.data]);
        if (data.isDemo !== undefined) setIsDemoMode(data.isDemo);
        if (onPlanRefresh) onPlanRefresh();
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: `⚠️ ${data.error || 'Sorry, I encountered an issue processing your request. Please try again.'}`,
            timestamp: new Date().toISOString(),
            isAIGenerated: true,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ Network connection error. Please verify your connection and try again.',
          timestamp: new Date().toISOString(),
          isAIGenerated: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="CelebrAI Copilot Assistant"
    >
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-[var(--color-surface-200)] animate-slide-in">
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-surface-200)] flex items-center justify-between bg-gradient-to-r from-[var(--color-primary-900)] to-[var(--color-primary-700)] text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg">
              ✨
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">CelebrAI Planning Copilot</h3>
              <p className="text-[11px] text-white/80">
                {isDemoMode ? 'Demo Mode (Knowledge Engine)' : 'Powered by Gemini 3.8 Flash'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            aria-label="Close copilot drawer"
          >
            ✕
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--color-surface-50)]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-xs relative group ${
                  msg.role === 'user'
                    ? 'bg-[var(--color-primary-600)] text-white rounded-br-xs'
                    : 'bg-white border border-[var(--color-surface-200)] text-[var(--color-surface-800)] rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => copyToClipboard(msg.content)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-[var(--color-surface-100)] text-[10px] text-[var(--color-surface-600)] hover:text-black transition-opacity"
                    title="Copy message"
                  >
                    📋 Copy
                  </button>
                )}
              </div>
              <span className="text-[10px] text-[var(--color-surface-400)] mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-[var(--color-surface-500)] p-2 bg-white/70 rounded-xl w-fit border border-[var(--color-surface-200)]">
              <span className="animate-spin">✨</span>
              <span>CelebrAI is brainstorming...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        <div className="p-3 bg-white border-t border-[var(--color-surface-200)]">
          <span className="text-[10px] font-bold text-[var(--color-surface-400)] uppercase tracking-wider block mb-2">
            💡 Quick Questions
          </span>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {suggestedPrompts.map((p, idx) => (
              <button
                key={idx}
                disabled={loading}
                onClick={() => handleSendMessage(p)}
                className="text-[11px] whitespace-nowrap bg-[var(--color-surface-100)] hover:bg-[var(--color-primary-50)] hover:text-[var(--color-primary-700)] text-[var(--color-surface-700)] px-3 py-1.5 rounded-full border border-[var(--color-surface-200)] transition-colors flex-shrink-0"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-[var(--color-surface-200)]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask anything about ${event.name}...`}
              className="flex-1 form-input text-xs py-2.5"
              disabled={loading}
              id="copilot-input"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn btn-primary btn-sm px-4"
              id="copilot-send-btn"
            >
              {loading ? '...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
