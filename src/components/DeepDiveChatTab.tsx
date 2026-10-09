import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  Shield,
  HelpCircle,
  FileCode,
  AlertTriangle,
} from 'lucide-react';
import { Finding, IngestedFile, RepoMetadata } from '../types/audit';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface DeepDiveChatTabProps {
  metadata: RepoMetadata | null;
  activeFinding: Finding | null;
  selectedFile: IngestedFile | null;
}

export const DeepDiveChatTab: React.FC<DeepDiveChatTabProps> = ({
  metadata,
  activeFinding,
  selectedFile,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I am your **AI DevSecOps Architect**. I have analyzed **${metadata?.fullName || 'your repository'}**.

You can ask me how to remediate specific vulnerabilities, request hardened Dockerfiles, ask for safe refactoring diffs, or explore how any component operates. What would you like to examine?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-fill prompt if activeFinding was passed
  useEffect(() => {
    if (activeFinding) {
      setInput(`How do I patch and secure "${activeFinding.title}" in ${activeFinding.file}? Please provide step-by-step code changes and best practices.`);
    }
  }, [activeFinding]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (questionText?: string) => {
    const text = questionText || input;
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/deep-dive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          currentFinding: activeFinding,
          fileContent: selectedFile?.content,
          context: {
            repoName: metadata?.fullName,
            activeFile: selectedFile?.path,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned error ${res.status}`);
      }

      const data = await res.json();
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.answer || 'Sorry, no answer could be generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        role: 'assistant',
        content: `**Error communicating with AI Architect:** ${err.message}. Please check server connectivity or try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (index: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const promptSuggestions = [
    'How do I eliminate the SQL injection flaw and use parameterized queries?',
    'Generate a hardened, multi-stage, non-root Dockerfile for this service',
    'How should I securely inject secrets via environment vaults instead of hardcoding?',
    'What unit tests should I write to verify that the security flaws are closed?',
  ];

  return (
    <div className="flex flex-col h-[75vh] max-w-5xl mx-auto bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl animate-in fade-in duration-300">
      {/* Chat Header */}
      <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>AI DevSecOps Architect</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-normal">
                Online
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Interactive contextual code review & remediation guidance
            </p>
          </div>
        </div>

        {/* Active context pill */}
        {activeFinding && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="truncate max-w-xs font-mono">{activeFinding.title}</span>
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-950/40">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
              }`}
            >
              {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-4 text-xs space-y-2 relative group ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span>{msg.role === 'user' ? 'You' : 'DevSecOps Architect'}</span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Formatted body */}
              <div className="prose prose-invert max-w-none text-xs leading-relaxed whitespace-pre-wrap font-sans">
                {msg.content}
              </div>

              {msg.role === 'assistant' && (
                <button
                  onClick={() => handleCopy(idx, msg.content)}
                  className="opacity-0 group-hover:opacity-100 transition absolute top-2 right-2 p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                  title="Copy response"
                >
                  {copiedIndex === idx ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2.5 text-xs text-slate-400 animate-pulse pl-10">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
            <span>Analyzing repository AST & generating guidance...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="px-5 py-2 bg-slate-950/70 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar">
        <span className="text-slate-500 shrink-0 flex items-center gap-1">
          <HelpCircle className="w-3 h-3" /> Prompts:
        </span>
        {promptSuggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(s)}
            disabled={isLoading}
            className="shrink-0 px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input form */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
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
            placeholder="Ask about vulnerabilities, Docker security, or feature architecture..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-40 shadow-sm shadow-blue-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
