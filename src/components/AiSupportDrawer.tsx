import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Bot,
  Send,
  Sparkles,
  ExternalLink,
  Instagram,
  HelpCircle,
  Sword,
  Shield,
  RotateCw,
  Server,
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import { AiChatMessage } from '../types.ts';

interface AiSupportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_QUESTIONS = [
  'What are the bot plan prices (7 Days, 1 Month, 1 Year)?',
  'How does the Anti-AFK system work?',
  'Which hostile mobs does the bot attack?',
  'How do I connect the bot to my Aternos server?',
  'How do dynamic single-use activation codes work?',
  'Why does index.js get modified automatically?'
];

export const AiSupportDrawer: React.FC<AiSupportDrawerProps> = ({
  isOpen,
  onClose
}) => {
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: `👋 Hey! I am your **Minecraft Bot AI Support Assistant**.\n\nI can explain how **HELL_KING_ANSH's** Universal Auto-Detect, Anti-AFK routines, hostile mob defense, and backend \`index.js\` automation work. Feel free to ask any question!\n\n*(For payment issues or 1-on-1 help, you can also DM **@hell_king_ansh** on Instagram!)*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const INSTAGRAM_ID = 'hell_king_ansh';

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input.trim();
    if (!textToSend || loading) return;

    const userMsg: AiChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: textToSend })
      });

      const data = await res.json();
      const botReply = data.reply || 'I am ready to help you with the bot! Please ask any question.';

      const aiMsg: AiChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: AiChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `Error connecting to AI service. Please reach out directly to **@${INSTAGRAM_ID}** on Instagram for immediate help!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border-l border-zinc-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-600 flex items-center justify-center text-zinc-950 shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-white">Bot AI Support</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Gemini 3.8
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Ask how the bot works &amp; how to configure</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instagram Support Top Alert */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-purple-950/40 via-pink-950/30 to-zinc-950 border-b border-zinc-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Instagram className="w-4 h-4 text-pink-400" />
            <span className="text-zinc-300">Human Help:</span>
            <a
              href="https://www.instagram.com/hell_king_ansh/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-300 font-bold hover:underline flex items-center gap-0.5"
            >
              @{INSTAGRAM_ID}
              <ExternalLink className="w-3 h-3 ml-0.5 text-pink-400" />
            </a>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">Fast Reply</span>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[88%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap break-words ${
                  msg.sender === 'user'
                    ? 'bg-emerald-500 text-zinc-950 font-medium rounded-tr-none shadow-md'
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-tl-none shadow-sm'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-2">
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>AI is analyzing bot mechanics...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompt Chips */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/80">
          <div className="text-[10px] uppercase font-bold text-zinc-400 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Suggested Questions:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {PRESET_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 text-zinc-300 hover:text-white transition-colors text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about how the bot works..."
              className="flex-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl transition-colors disabled:opacity-40 cursor-pointer shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
