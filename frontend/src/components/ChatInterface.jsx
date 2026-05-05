/**
 * ChatInterface Component
 * -----------------------
 * Chat-style query system for asking questions about the dataset.
 * Supports natural language questions with context-aware answers.
 */

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  MessageCircle, Send, Loader2, Sparkles, User, Bot,
  HelpCircle, Zap
} from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  "What are the most important features in this dataset?",
  "Are there any strong correlations between variables?",
  "What trends do you see in the data?",
  "Are there any anomalies or outliers?",
  "Give me a summary of the dataset",
  "Which feature affects the target most?",
];

function ChatBubble({ message, isUser }) {
  return (
    <div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} animate-fadeIn`}
      style={{ maxWidth: '85%', marginLeft: isUser ? 'auto' : 0 }}
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{
          background: isUser
            ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
            : 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
        }}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-[var(--accent-primary)]" />
        )}
      </div>

      {/* Message */}
      <div
        className={`px-4 py-3 rounded-2xl ${
          isUser ? 'rounded-br-sm' : 'rounded-bl-sm'
        }`}
        style={{
          background: isUser ? 'var(--accent-gradient)' : 'var(--bg-card)',
          border: isUser ? 'none' : '1px solid var(--border-color)',
        }}
      >
        {isUser ? (
          <p className="text-sm text-white leading-relaxed">{message}</p>
        ) : (
          <div className="text-sm text-[var(--text-secondary)] leading-relaxed story-content">
            <ReactMarkdown>{message}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatInterface({ sessionId, chatHistory = [], onSendMessage }) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Sync chat history from props
  useEffect(() => {
    const formatted = chatHistory.flatMap(msg => [
      { text: msg.question, isUser: true },
      { text: msg.answer, isUser: false },
    ]);
    setMessages(formatted);
  }, [chatHistory]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (text = input) => {
    const question = text.trim();
    if (!question || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { text: question, isUser: true }]);
    setIsLoading(true);

    try {
      const response = await onSendMessage(question);
      setMessages(prev => [...prev, { text: response, isUser: false }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { text: 'Sorry, something went wrong. Please try again.', isUser: false },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ minHeight: '60vh' }}>

      {/* Left Square — Suggested Questions / Info */}
      <div
        className="bg-[#232533] rounded-[20px] p-8 border border-white/5 shadow-lg flex flex-col items-center justify-center text-center"
        style={{ aspectRatio: '1 / 1' }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: 'var(--accent-gradient)', boxShadow: 'var(--accent-glow)' }}
        >
          <MessageCircle className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Ask About Your Data</h3>
        <p className="text-sm text-gray-400 mb-8 max-w-xs">
          Ask anything — trends, correlations, predictions, feature importance, and more.
        </p>

        <div className="w-full">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center justify-center gap-1">
            <Zap className="w-3 h-3" />
            Suggested Questions
          </p>
          <div className="grid grid-cols-1 gap-2">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="text-left px-4 py-3 rounded-xl text-xs text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/5 border border-white/5 hover:border-indigo-500/20 transition-all"
              >
                <HelpCircle className="w-3 h-3 inline mr-1.5 opacity-50" />
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Square — Chat Window */}
      <div
        className="bg-[#232533] rounded-[20px] border border-white/5 shadow-lg flex flex-col overflow-hidden"
        style={{ aspectRatio: '1 / 1' }}
      >
        {/* Chat Header */}
        <div className="p-5 border-b border-white/5 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-gradient)' }}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Chat</h3>
            <p className="text-xs text-gray-500">Powered by contextual analysis</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-5 min-h-0">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Sparkles className="w-10 h-10 text-indigo-500/30 mb-3" />
              <p className="text-sm text-gray-500">Start a conversation about your data</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <ChatBubble key={i} message={msg.text} isUser={msg.isUser} />
              ))}

              {isLoading && (
                <div className="flex gap-3 animate-fadeIn">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))' }}>
                    <Bot className="w-4 h-4 text-[var(--accent-primary)]" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <Loader2 className="w-4 h-4 text-[var(--accent-primary)] animate-spin" />
                    <span className="text-xs text-[var(--text-muted)]">Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/5 flex items-center gap-3 shrink-0">
          <input
            ref={inputRef}
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your data..."
            disabled={isLoading}
            className="flex-1 bg-[#1E202C] rounded-xl px-4 py-3 border border-white/5 outline-none text-sm text-white placeholder:text-gray-500 focus:border-indigo-500/30 transition-colors"
          />
          <button
            id="chat-send-button"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="btn-primary px-4 py-3"
            style={{ borderRadius: 12 }}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
