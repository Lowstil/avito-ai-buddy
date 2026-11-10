import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChatMessage } from '../types';
import { MarkdownView } from './MarkdownView';
import { Send, Bot, User, Sparkles, Calendar, Shield, ArrowRight, Loader2 } from 'lucide-react';

interface ChatWidgetProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onNavigateToTab
}) => {
  const [input, setInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // FIX: Scroll ONLY the internal chat container, NEVER jump or scroll the window/page!
  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
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
      
      {/* Human-friendly Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#04E061] to-[#00AAFF] flex items-center justify-center shadow-[0_0_20px_rgba(4,224,97,0.3)]">
            <Bot size={22} className="text-slate-950" />
          </div>
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-1.5">
              AI-Наставник (Buddy)
              <span className="w-2 h-2 rounded-full bg-[#04E061] inline-block animate-pulse"></span>
            </h3>
            <p className="text-xs text-slate-400">Всегда на связи • Отвечает по регламентам Авито</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
          <Sparkles size={13} className="text-[#04E061]" />
          <span>База знаний Playbook</span>
        </div>
      </div>

      {/* Messages Scroll Area (CONTAINED: No window scrolling!) */}
      <div 
        ref={chatScrollRef}
        className="flex-1 overflow-y-auto py-4 space-y-4 pr-2"
        style={{ scrollBehavior: 'smooth' }}
      >
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
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
                {/* Message body with rich Markdown formatting */}
                <div className="space-y-1.5 font-normal">
                  <MarkdownView content={msg.content} />
                </div>

                {/* Human-friendly Action Card: Day-off created */}
                {msg.action_type === 'absence_created' && msg.action_payload && (
                  <div className="mt-3 p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-100">
                    <p className="font-bold text-xs flex items-center gap-1.5 text-white">
                      <Calendar size={15} className="text-[#04E061]" />
                      Заявка #{msg.action_payload.id} успешно подана
                    </p>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Дата: <strong>{msg.action_payload.start_date}</strong> • Причина: {msg.action_payload.reason}
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        onClick={() => onNavigateToTab && onNavigateToTab('absences')}
                        className="px-3 py-1.5 rounded-lg bg-[#04E061] text-slate-950 text-[11px] font-bold hover:bg-[#03c754] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        Перейти в раздел отгулов <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Human-friendly Action Card: Access Requested */}
                {msg.action_type === 'access_requested' && msg.action_payload && (
                  <div className="mt-3 p-3.5 rounded-xl bg-purple-950/50 border border-purple-500/40 text-purple-100">
                    <p className="font-bold text-xs flex items-center gap-1.5 text-white">
                      <Shield size={15} className="text-[#965EEB]" />
                      Запрос доступа: {msg.action_payload.system_name}
                    </p>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Статус: <span className="text-amber-300 font-semibold">Ожидает авто-выдачи (10-15 мин)</span>
                    </p>
                    <div className="mt-2.5">
                      <button
                        onClick={() => onNavigateToTab && onNavigateToTab('access')}
                        className="px-3 py-1.5 rounded-lg bg-[#965EEB] text-white text-[11px] font-bold hover:bg-[#8545e6] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        Посмотреть мои доступы <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Sources pill */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-white/10 text-[10px] text-slate-400 flex items-center gap-1">
                    <span className="font-semibold text-slate-500">Источник информации:</span>
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
            <span>AI-buddy готовит понятный ответ...</span>
          </motion.div>
        )}
      </div>

      {/* Suggested Quick Question Chips */}
      {messages.length > 0 && messages[messages.length - 1].suggested_chips && (
        <div className="pt-2 pb-3 flex flex-wrap gap-1.5">
          {messages[messages.length - 1].suggested_chips?.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleChipClick(chip)}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-xl glass-pill text-slate-300 hover:text-white hover:border-[#04E061]/40 transition-colors cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Bar */}
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
