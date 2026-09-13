import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Copy, 
  Check, 
  FileText, 
  ShieldAlert, 
  BookOpen, 
  MessageSquare,
  Lightbulb,
  CornerDownLeft
} from 'lucide-react';
import { Invoice } from '../types';

interface AiAssistantProps {
  invoices: Invoice[];
  selectedInvoice?: Invoice | null;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ invoices, selectedInvoice }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello, I am your Autonomous AP & Accounting Controller Copilot.

I continuously audit inbound invoices, execute 3-way matching against purchase orders and warehouse receipts, verify bank feed remittances, and ensure double-entry General Ledger integrity.

How can I assist your accounting team today? You can choose a quick inquiry below or ask any question about your active invoices and reconciliation exceptions.`,
      time: 'Just now',
    },
  ]);

  const quickPrompts = [
    {
      label: 'Explain Nordic HW Shortage',
      prompt: 'Explain the 3-way matching shortage on invoice INV-NORDIC-7019 and what accounting actions are required.',
    },
    {
      label: 'Draft Vendor Dispute Letter',
      prompt: 'Draft an official AP dispute email to Nordic Hardware Systems requesting a credit memo for the 5 unreceived monitors.',
    },
    {
      label: 'Assess Apex Freight Surcharge',
      prompt: 'Assess the ₹84.00 price variance on Apex Freight invoice INV-AF-88291. Should we auto-approve under contractual fuel tolerance?',
    },
    {
      label: 'Audit SOX Compliance',
      prompt: 'Perform a SOX compliance audit on our posted journal entries and verify segregation of duties and double-entry balance.',
    },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      content: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai-audit-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          context: {
            invoicesCount: invoices.length,
            reconciledRate: '88.4%',
            exceptionsCount: invoices.filter((i) => i.matchingStatus !== 'exact_match').length,
            selectedInvoice: selectedInvoice || invoices[0],
          },
        }),
      });
      const data = await res.json();
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.answer || 'Response generated from accounting intelligence.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Unable to connect to AI copilot service. Please verify your connection.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyText = (content: string, idx: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
      {/* Left Sidebar: Quick Prompts & Context */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>Accounting Copilot Shortcuts</span>
          </div>
          <div className="space-y-2">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qp.prompt)}
                disabled={isLoading}
                className="w-full text-left p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-200 transition-colors flex items-start space-x-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span className="font-medium">{qp.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Current Active Context Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm text-xs">
          <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-2">
            Live Copilot Context
          </span>
          <div className="space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Invoices:</span>
              <span className="text-white font-bold">{invoices.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Exceptions:</span>
              <span className="text-amber-400 font-bold">
                {invoices.filter((i) => i.matchingStatus !== 'exact_match').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Selected Invoice:</span>
              <span className="text-cyan-400 truncate max-w-[140px]">
                {selectedInvoice?.invoiceNumber || 'INV-AWS-2025-9831'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">AI Model:</span>
              <span className="text-emerald-400 font-bold">Gemini 3.8 Flash</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Chat History & Input */}
      <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-xl">
        {/* Chat Header */}
        <div className="px-5 py-3.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Autonomous Financial Intelligence Assistant
              </h3>
              <p className="text-[11px] text-slate-400">
                Grounding in ERP PO tables, receiving slips, bank feeds, & GL accounts
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Online
          </span>
        </div>

        {/* Message Log */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={idx}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl p-4 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-sm whitespace-pre-wrap font-sans'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 opacity-70 text-[10px]">
                    <span className="font-semibold uppercase tracking-wider">
                      {isUser ? 'You (Financial Analyst)' : 'AI AP Controller'}
                    </span>
                    <span>{m.time}</span>
                  </div>

                  <div>{m.content}</div>

                  {!isUser && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex justify-end">
                      <button
                        onClick={() => copyText(m.content, idx)}
                        className="inline-flex items-center space-x-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                      >
                        {copiedIdx === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy response</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center space-x-2 text-xs text-cyan-400 font-mono">
              <Bot className="w-4 h-4 animate-bounce" />
              <span>Analyzing reconciliation parameters with Gemini 3.8 Flash...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              id="input-copilot-query"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything (e.g. 'Draft dispute email', 'Explain GL accounting impact', 'Why was invoice flagged?')"
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <button
              type="submit"
              id="btn-send-copilot"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 transition-all flex items-center space-x-1.5"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
