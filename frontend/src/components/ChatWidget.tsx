import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChatMessage } from '../types';
import { Send, Bot, User, Sparkles, Shield, Calendar, ArrowRight, Loader2 } from 'lucide-react';

interface ChatWidgetProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onOpenAbsenceModal: () => void;
  onOpenAccessModal: () => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onOpenAbsenceModal,
  onOpenAccessModal
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  const handleChipClick = (chip: string) => {
    if (isLoading) return;
    onSendMessage(chip);
  };

  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col h-[650px] relative">
      
      {/* Chat Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#04E061] to-[#00AAFF] flex items-center justify-center shadow-[0_0_20px_rgba(4,224,97,0.3)]">
            <Bot size={22} className="text-slate-950" />
          </div>
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-1.5">
              AI-Buddy • Наставник
              <span className="w-2 h-2 rounded-full bg-[#04E061] inline-block animate-pulse"></span>
            </h3>
            <p className="text-xs text-slate-400">MCP Orchestrator • Стек Авито • Ответ &lt; 1 сек</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium bg-white/5 px-2.5 py-1 rounded-xl">
          <Sparkles size={13} className="text-[#04E061]" />
          <span>RAG Playbook Active</span>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={16} className="text-[#04E061]" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-[#00AAFF] to-[#0088dd] text-white shadow-lg font-medium'
                    : 'glass-card border-white/10 text-slate-200 shadow-md'
                }`}
              >
                {/* Message text with formatting */}
                <div className="whitespace-pre-wrap space-y-1">
                  {msg.content}
                </div>

                {/* Interactive Action Card if MCP Tool executed */}
                {msg.action_type === 'absence_created' && msg.action_payload && (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200">
                    <p className="font-bold text-xs flex items-center gap-1.5">
                      <Calendar size={14} className="text-[#04E061]" />
                      Действие выполнено: Заявка #{msg.action_payload.id}
                    </p>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Дата: {msg.action_payload.start_date} • Статус: {msg.action_payload.status}
                    </p>
                    <button
                      onClick={onOpenAbsenceModal}
                      className="mt-2 text-[11px] font-bold text-[#04E061] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Открыть реестр отсутствий <ArrowRight size={12} />
                    </button>
                  </div>
                )}

                {msg.action_type === 'access_requested' && msg.action_payload && (
                  <div className="mt-3 p-3 rounded-xl bg-purple-950/40 border border-purple-500/40 text-purple-200">
                    <p className="font-bold text-xs flex items-center gap-1.5">
                      <Shield size={14} className="text-[#965EEB]" />
                      Заявка в ServiceDesk: {msg.action_payload.system_name}
                    </p>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Статус: {msg.action_payload.status} • Автоматическая выдача
                    </p>
                    <button
                      onClick={onOpenAccessModal}
                      className="mt-2 text-[11px] font-bold text-[#965EEB] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Посмотреть все доступы <ArrowRight size={12} />
                    </button>
                  </div>
                )}

                {/* Sources Footnote */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-white/10 text-[10px] text-slate-400 flex items-center gap-1">
                    <span className="font-semibold text-slate-500">Источник:</span>
                    <span>{msg.sources.join(', ')}</span>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-[#00AAFF]/20 border border-[#00AAFF]/30 flex items-center justify-center shrink-0 mt-0.5">
                  <User size={16} className="text-[#00AAFF]" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs text-slate-400 pl-11"
          >
            <Loader2 size={16} className="animate-spin text-[#04E061]" />
            <span>AI-buddy обращается к MCP-сервисам Авито...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Chips */}
      {messages.length > 0 && messages[messages.length - 1].suggested_chips && (
        <div className="pt-2 pb-3 flex flex-wrap gap-1.5">
          {messages[messages.length - 1].suggested_chips?.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleChipClick(chip)}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-xl glass-pill text-slate-300 hover:text-white cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="pt-2">
        <div className="glass-card rounded-2xl p-1.5 flex items-center gap-2 border border-white/15 focus-within:border-[#04E061]/60 transition-colors">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Спроси о процессах, оформи отгул или запроси доступы..."
            className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-9 h-9 rounded-xl bg-[#04E061] text-slate-950 flex items-center justify-center font-bold hover:bg-[#03c754] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            <Send size={15} />
          </button>
        </div>
      </form>

    </div>
  );
};
