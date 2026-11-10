import React, { useState, useEffect } from 'react';
import type { UserProfile, ChecklistTask, ChecklistSummary, AbsenceRequest, AccessItem, ChatMessage } from './types';
import { api } from './api/client';
import { Header } from './components/Header';
import { StatsCard } from './components/StatsCard';
import { ChecklistView } from './components/ChecklistView';
import { ChatWidget } from './components/ChatWidget';
import { AbsenceModal } from './components/AbsenceModal';
import { AccessModal } from './components/AccessModal';
import { Footer } from './components/Footer';
import { Clock, CheckSquare, Zap, ShieldAlert, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [activeUserId, setActiveUserId] = useState<string>('intern_1');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tasks, setTasks] = useState<ChecklistTask[]>([]);
  const [summary, setSummary] = useState<ChecklistSummary | null>(null);
  const [absences, setAbsences] = useState<AbsenceRequest[]>([]);
  const [accessList, setAccessList] = useState<AccessItem[]>([]);

  // Modals state
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content: 'Привет! Я твой цифровой наставник AI-buddy в Авито 🚀\nПомогу освоиться в процессах, оформить отгул, получить доступы и закрывать этапы чек-листа.',
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

      // If an action was performed, refresh data!
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
          content: `⚠️ Произошла ошибка при обращении к сервису: ${e.message || 'Сбой сети'}. Пожалуйста, попробуй еще раз.`,
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleAskBuddyAboutTask = (taskTitle: string) => {
    handleSendMessage(`Как мне выполнить задачу: "${taskTitle}"? Расскажи подробнее со ссылками на стандарты.`);
  };

  const handleCreateAbsence = async (startDate: string, reason: string) => {
    try {
      await api.createAbsence(activeUserId, { start_date: startDate, reason, absence_type: 'day_off' });
      const updated = await api.getAbsences(activeUserId);
      setAbsences(updated);
      setIsAbsenceModalOpen(false);
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

  const handleRejectAbsence = async (id: string) => {
    try {
      await api.rejectAbsence(activeUserId, id);
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
          <span>Загрузка профиля Avito AI-Buddy...</span>
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

      {/* Top Navigation */}
      <Header
        currentUser={currentUser}
        users={users}
        onSwitchUser={handleSwitchUser}
        onOpenAbsenceModal={() => setIsAbsenceModalOpen(true)}
        onOpenAccessModal={() => setIsAccessModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8 w-full z-10 space-y-8 flex-1">
        
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill text-xs font-semibold text-[#04E061] mb-2">
              <Sparkles size={13} />
              <span>Твой персональный наставник в команде</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Добро пожаловать в Авито, <span className="text-gradient-avito">{currentUser.name.split(' ')[0]}</span>!
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Кластер: <span className="text-slate-200 font-semibold">{currentUser.team}</span> • Наставник: <span className="text-slate-200 font-semibold">{currentUser.mentor_name || 'Алексей Смирнов'}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSendMessage('Помоги подготовиться к встрече 1:1 с наставником')}
              className="glass-pill px-4 py-2 rounded-xl text-xs font-bold text-white hover:border-[#00AAFF]/50 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Clock size={14} className="text-[#00AAFF]" />
              Подготовка к 1:1
            </button>
            <button
              onClick={() => setIsAbsenceModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#04E061] text-slate-950 text-xs font-extrabold hover:bg-[#03c754] transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#04E061]/20"
            >
              Заказать отгул
            </button>
          </div>
        </div>

        {/* 4 Glassy Motion Stats Cards (Directly inspired by user's screenshot!) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Экономия времени ментора"
            value="24.5 ч"
            change={45}
            changeLabel="рутины снято"
            icon={Clock}
            gradient="from-emerald-500/20 to-teal-500/5"
            accentColor="#04E061"
          />
          <StatsCard
            title="Прогресс чек-листа"
            value={`${summary?.progress_percentage || 0}%`}
            change={summary?.completed_tasks || 0}
            changeLabel={`из ${summary?.total_tasks || 0} задач`}
            icon={CheckSquare}
            gradient="from-blue-500/20 to-cyan-500/5"
            accentColor="#00AAFF"
          />
          <StatsCard
            title="MCP Tool Запросов"
            value="109"
            change={78}
            changeLabel="без эскалации"
            icon={Zap}
            gradient="from-purple-500/20 to-indigo-500/5"
            accentColor="#965EEB"
          />
          <StatsCard
            title="Скорость отклика UI"
            value="< 0.2 с"
            change={100}
            changeLabel="SLA соблюдён"
            icon={ShieldAlert}
            gradient="from-rose-500/20 to-amber-500/5"
            accentColor="#FF5252"
          />
        </div>

        {/* Two-Column Grid: Left = Checklist Tracker, Right = AI Buddy Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Interactive Onboarding Checklist (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <ChecklistView
              tasks={tasks}
              summary={summary}
              onToggleTask={handleToggleTask}
              onAskBuddyAboutTask={handleAskBuddyAboutTask}
            />
          </div>

          {/* Right Column: AI-Buddy Chat Assistant (5 cols) */}
          <div className="lg:col-span-5 sticky top-24">
            <ChatWidget
              messages={messages}
              isLoading={isChatLoading}
              onSendMessage={handleSendMessage}
              onOpenAbsenceModal={() => setIsAbsenceModalOpen(true)}
              onOpenAccessModal={() => setIsAccessModalOpen(true)}
            />
          </div>

        </div>

      </main>

      {/* Corporate Action Modals */}
      <AbsenceModal
        isOpen={isAbsenceModalOpen}
        onClose={() => setIsAbsenceModalOpen(false)}
        absences={absences}
        currentUser={currentUser}
        onCreateAbsence={handleCreateAbsence}
        onApproveAbsence={handleApproveAbsence}
        onRejectAbsence={handleRejectAbsence}
      />

      <AccessModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        accessList={accessList}
        onRequestAccess={handleRequestAccess}
        onGrantAccess={handleGrantAccess}
      />

      {/* Glassy Liquid Footer (User screenshot wish!) */}
      <Footer />

    </div>
  );
};

export default App;
