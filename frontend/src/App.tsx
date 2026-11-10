import React, { useState, useEffect } from 'react';
import type { UserProfile, ChecklistTask, ChecklistSummary, AbsenceRequest, AccessItem, ChatMessage } from './types';
import { api } from './api/client';
import { Header } from './components/Header';
import { StatsCard } from './components/StatsCard';
import { ChecklistView } from './components/ChecklistView';
import { ChatWidget } from './components/ChatWidget';
import { AbsenceView } from './components/AbsenceView';
import { AccessView } from './components/AccessView';
import { Footer } from './components/Footer';
import { Clock, CheckSquare, Zap, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [activeUserId, setActiveUserId] = useState<string>('intern_1');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tasks, setTasks] = useState<ChecklistTask[]>([]);
  const [summary, setSummary] = useState<ChecklistSummary | null>(null);
  const [absences, setAbsences] = useState<AbsenceRequest[]>([]);
  const [accessList, setAccessList] = useState<AccessItem[]>([]);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content: (
        "Привет! Я твой цифровой наставник AI-buddy в Авито 🚀\n" +
        "Я помогу освоиться в команде, объясню стандарты разработки, помогу оформить отгул без лишней бюрократии и подскажу следующие шаги по чек-листу.\n\n" +
        "Чем помочь тебе прямо сейчас?"
      ),
      timestamp: new Date().toISOString(),
      suggested_chips: [
        'Как оформить отгул?',
        'Какой мой следующий шаг?',
        'Что такое Zero Bug Policy?',
        'Какие доступы мне нужны?'
      ]
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Load Initial Data
  const loadData = async (userId: string) => {
    try {
      const [allUsers, me, userTasks, userSummary, userAbsences, userAccess] = await Promise.all([
        api.getUsers(userId),
        api.getMe(userId),
        api.getChecklistTasks(userId),
        api.getChecklistSummary(userId),
        api.getAbsences(userId),
        api.getAccessList(userId),
        api.getAnalyticsSummary(userId)
      ]);
      setUsers(allUsers);
      setCurrentUser(me);
      setTasks(userTasks);
      setSummary(userSummary);
      setAbsences(userAbsences);
      setAccessList(userAccess);
    } catch (e) {
      console.error('Failed to load initial data:', e);
    }
  };

  useEffect(() => {
    loadData(activeUserId);
  }, [activeUserId]);

  const handleSwitchUser = (newUserId: string) => {
    setActiveUserId(newUserId);
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'todo' : 'completed';
    try {
      await api.updateTaskStatus(activeUserId, taskId, nextStatus);
      const [updatedTasks, updatedSummary] = await Promise.all([
        api.getChecklistTasks(activeUserId),
        api.getChecklistSummary(activeUserId)
      ]);
      setTasks(updatedTasks);
      setSummary(updatedSummary);
      api.logEvent(activeUserId, 'task_toggled', { taskId, nextStatus });
    } catch (e) {
      console.error('Failed to toggle task:', e);
    }
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const res = await api.sendChatMessage(activeUserId, text);
      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        sender: 'assistant',
        content: res.reply,
        timestamp: new Date().toISOString(),
        action_type: res.action_type,
        action_payload: res.action_payload,
        suggested_chips: res.suggested_chips,
        sources: res.sources
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // If an action was performed, refresh state
      if (res.action_type === 'absence_created') {
        const updatedAbsences = await api.getAbsences(activeUserId);
        setAbsences(updatedAbsences);
      } else if (res.action_type === 'access_requested') {
        const updatedAccess = await api.getAccessList(activeUserId);
        setAccessList(updatedAccess);
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          sender: 'assistant',
          content: `⚠️ Не удалось связаться с сервисом: ${e.message || 'Ошибка сети'}. Пожалуйста, попробуй ещё раз.`,
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleAskBuddyAboutTask = (taskTitle: string) => {
    setActiveTab('chat');
    handleSendMessage(`Как мне выполнить задачу: "${taskTitle}"? Расскажи подробнее со ссылками на стандарты.`);
  };

  const handleCreateAbsence = async (startDate: string, reason: string) => {
    try {
      await api.createAbsence(activeUserId, { start_date: startDate, reason, absence_type: 'day_off' });
      const updated = await api.getAbsences(activeUserId);
      setAbsences(updated);
      handleSendMessage(`Я оформил заявку на отгул на ${startDate} через корпоративный сервис.`);
    } catch (e) {
      console.error('Failed to create absence:', e);
    }
  };

  const handleApproveAbsence = async (id: string) => {
    try {
      await api.approveAbsence(activeUserId, id);
      const updated = await api.getAbsences(activeUserId);
      setAbsences(updated);
    } catch (e) {
      console.error('Failed to approve absence:', e);
    }
  };

  const handleRejectAbsence = async (id: string, reason?: string) => {
    try {
      await api.rejectAbsence(activeUserId, id, reason);
      const updated = await api.getAbsences(activeUserId);
      setAbsences(updated);
    } catch (e) {
      console.error('Failed to reject absence:', e);
    }
  };

  const handleRequestAccess = async (systemKey: string, justification: string) => {
    try {
      await api.requestAccess(activeUserId, systemKey, justification);
      const updated = await api.getAccessList(activeUserId);
      setAccessList(updated);
    } catch (e) {
      console.error('Failed to request access:', e);
    }
  };

  const handleGrantAccess = async (systemKey: string) => {
    try {
      await api.grantAccess(activeUserId, systemKey);
      const updated = await api.getAccessList(activeUserId);
      setAccessList(updated);
    } catch (e) {
      console.error('Failed to grant access:', e);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-white">
        <div className="flex items-center gap-3 glass-panel px-6 py-4 rounded-2xl">
          <div className="w-5 h-5 border-2 border-[#04E061] border-t-transparent rounded-full animate-spin" />
          <span>Загрузка данных Avito AI-Buddy...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 relative overflow-hidden flex flex-col justify-between selection:bg-[#04E061]/30">
      
      {/* Background Glowing Liquid Spheres */}
      <div className="glow-sphere-1" />
      <div className="glow-sphere-2" />
      <div className="glow-sphere-3" />

      {/* Top Header with Tabs & User Switcher */}
      <Header
        currentUser={currentUser}
        users={users}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSwitchUser={handleSwitchUser}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full z-10 space-y-6 flex-1">
        
        {/* User Role Quick Switch Bar with ALL 3 Personas */}
        <div className="glass-panel px-4 py-3 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#04E061] shadow-[0_0_8px_#04E061]"></span>
            <span className="text-slate-300">
              Текущий пользователь: <strong className="text-white text-sm">{currentUser.name}</strong>{' '}
              <span className="text-slate-400">
                ({currentUser.role === 'intern' ? '🎓 Стажёр Backend' : currentUser.role === 'mentor' ? '👨‍💻 Наставник (Buddy)' : '👩‍💼 Тимлид команды'})
              </span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-medium mr-1">Быстрый вход:</span>
            {users.map((u) => {
              const isActive = u.user_id === currentUser.user_id;
              return (
                <button
                  key={u.user_id}
                  onClick={() => handleSwitchUser(u.user_id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-white/20 text-white font-bold border-white/40 shadow-lg ring-1 ring-[#04E061]'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <img
                    src={u.avatar_url}
                    alt={u.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span>{u.name.split(' ')[0]}</span>
                  <span className="text-[10px] text-slate-400">
                    {u.role === 'intern' ? '(Стажёр)' : u.role === 'mentor' ? '(Наставник)' : '(Тимлид)'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4 Meaningful Intern Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Дней до экватора"
            value="42 дня"
            change={50}
            changeLabel="половина пути (6 недель)"
            icon={Clock}
            gradient="from-emerald-500/20 to-teal-500/5"
            accentColor="#04E061"
          />
          <StatsCard
            title="Прогресс онбординга"
            value={`${summary?.progress_percentage || 0}%`}
            change={summary?.completed_tasks || 0}
            changeLabel={`из ${summary?.total_tasks || 0} задач чек-листа`}
            icon={CheckSquare}
            gradient="from-blue-500/20 to-cyan-500/5"
            accentColor="#00AAFF"
          />
          <StatsCard
            title="Баланс отгулов (Day-off)"
            value="2 дня"
            change={2}
            changeLabel="доступно в ноябре"
            icon={Zap}
            gradient="from-purple-500/20 to-indigo-500/5"
            accentColor="#965EEB"
          />
          <StatsCard
            title="Текущий спринт"
            value="Спринт 24.1"
            change={4}
            changeLabel="активные задачи команды"
            icon={ShieldAlert}
            gradient="from-rose-500/20 to-amber-500/5"
            accentColor="#FF5252"
          />
        </div>

        {/* TAB 1: AI-Buddy Chat with Side Quick Actions */}
        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Quick Helpers (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#04E061]" />
                  Быстрые действия
                </h4>
                
                <div className="space-y-2">
                  <button
                    onClick={() => handleSendMessage('Мне нужен отгул на пятницу, помоги оформить')}
                    className="w-full text-left p-3 rounded-2xl glass-card hover:border-[#04E061]/50 transition-all text-xs text-slate-200 cursor-pointer flex items-center justify-between group"
                  >
                    <span>🏖️ Оформить отгул (Day-off)</span>
                    <ArrowRight size={13} className="text-slate-500 group-hover:text-[#04E061] transition-colors" />
                  </button>

                  <button
                    onClick={() => handleSendMessage('Какой мой следующий шаг по чек-листу стажёра?')}
                    className="w-full text-left p-3 rounded-2xl glass-card hover:border-[#00AAFF]/50 transition-all text-xs text-slate-200 cursor-pointer flex items-center justify-between group"
                  >
                    <span>🎯 Узнать следующий шаг</span>
                    <ArrowRight size={13} className="text-slate-500 group-hover:text-[#00AAFF] transition-colors" />
                  </button>

                  <button
                    onClick={() => handleSendMessage('Что такое Zero Bug Policy в Авито простыми словами?')}
                    className="w-full text-left p-3 rounded-2xl glass-card hover:border-[#965EEB]/50 transition-all text-xs text-slate-200 cursor-pointer flex items-center justify-between group"
                  >
                    <span>🛡️ Правило Zero Bug Policy</span>
                    <ArrowRight size={13} className="text-slate-500 group-hover:text-[#965EEB] transition-colors" />
                  </button>

                  <button
                    onClick={() => handleSendMessage('Помоги подготовиться к встрече 1:1 с наставником')}
                    className="w-full text-left p-3 rounded-2xl glass-card hover:border-[#FF5252]/50 transition-all text-xs text-slate-200 cursor-pointer flex items-center justify-between group"
                  >
                    <span>🤝 Подготовка к встрече 1:1</span>
                    <ArrowRight size={13} className="text-slate-500 group-hover:text-[#FF5252] transition-colors" />
                  </button>
                </div>
              </div>

              {/* Progress Summary Box */}
              {summary && (
                <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Твой прогресс</span>
                    <span className="text-xs font-black text-[#04E061]">{summary.progress_percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#04E061] to-[#00AAFF] rounded-full"
                      style={{ width: `${summary.progress_percentage}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Закрыто <strong>{summary.completed_tasks}</strong> из {summary.total_tasks} задач чек-листа.
                  </p>
                  <button
                    onClick={() => setActiveTab('checklist')}
                    className="text-xs text-[#00AAFF] font-bold hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                  >
                    Открыть весь чек-лист <ArrowRight size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Right Chat Center (8 cols) */}
            <div className="lg:col-span-8">
              <ChatWidget
                messages={messages}
                isLoading={isChatLoading}
                onSendMessage={handleSendMessage}
                onNavigateToTab={setActiveTab}
              />
            </div>

          </div>
        )}

        {/* TAB 2: Onboarding Checklist */}
        {activeTab === 'checklist' && (
          <ChecklistView
            tasks={tasks}
            summary={summary}
            onToggleTask={handleToggleTask}
            onAskBuddyAboutTask={handleAskBuddyAboutTask}
          />
        )}

        {/* TAB 3: Absences & Day-Offs */}
        {activeTab === 'absences' && (
          <AbsenceView
            absences={absences}
            currentUser={currentUser}
            onCreateAbsence={handleCreateAbsence}
            onApproveAbsence={handleApproveAbsence}
            onRejectAbsence={handleRejectAbsence}
            onAskBuddy={(q) => { setActiveTab('chat'); handleSendMessage(q); }}
          />
        )}

        {/* TAB 4: Access & Software */}
        {activeTab === 'access' && (
          <AccessView
            accessList={accessList}
            currentUser={currentUser}
            onRequestAccess={handleRequestAccess}
            onGrantAccess={handleGrantAccess}
            onAskBuddy={(q) => { setActiveTab('chat'); handleSendMessage(q); }}
          />
        )}

      </main>

      {/* Glassy Liquid Footer */}
      <Footer />

    </div>
  );
};

export default App;
