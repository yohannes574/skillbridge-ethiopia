import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import { useNavigate } from 'react-router-dom';
import { apiGetContacts, apiGetConversation, apiSendMessage, apiGetMySessions, apiDirectScheduleSession } from '../../api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Send, MessageCircle, Video, Paperclip, Smile, Search, CheckCheck, MoreVertical, Calendar, Clock, X, Phone, Mic, ChevronLeft } from 'lucide-react';

const Chat = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('chat');
  const [mySessions, setMySessions] = useState([]);
  const [upcomingSession, setUpcomingSession] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const loadContactsAndSessions = async () => {
      try {
        const [contactsRes, sessionsRes] = await Promise.all([
          apiGetContacts(),
          apiGetMySessions()
        ]);
        setContacts(contactsRes.data.data || []);
        setMySessions(sessionsRes.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadContactsAndSessions();
  }, []);

  useEffect(() => {
    if (activeContact) {
      loadMessages();
      const interval = setInterval(() => loadMessages(true), 3000);
      const relevantSessions = mySessions.filter(s =>
        (s.mentorId?._id === activeContact.user._id || s.studentId?._id === activeContact.user._id) &&
        s.status === 'scheduled' &&
        new Date(s.scheduledAt).getTime() > new Date().getTime() - 60 * 60 * 1000
      );
      relevantSessions.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
      setUpcomingSession(relevantSessions[0] || null);
      return () => clearInterval(interval);
    } else {
      setUpcomingSession(null);
    }
  }, [activeContact, mySessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!upcomingSession) return;
    const interval = setInterval(() => {
      const diff = new Date(upcomingSession.scheduledAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeRemaining('Now');
      } else {
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeRemaining(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [upcomingSession]);

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleDate) return toast.error('Please pick a date and time');
    try {
      const res = await apiDirectScheduleSession({
        targetUserId: activeContact.user._id,
        scheduledAt: scheduleDate,
        durationMinutes: 60
      });
      setMySessions(prev => [...prev, res.data.data]);
      toast.success('Meeting scheduled!');
      const msgRes = await apiSendMessage({
        receiverId: activeContact.user._id,
        text: `🗓️ I have scheduled a video call for ${new Date(scheduleDate).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}. See you then!`
      });
      setMessages(prev => [...prev, msgRes.data.data]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule');
    }
  };

  const loadMessages = async (isPolling = false) => {
    try {
      const res = await apiGetConversation(activeContact.user._id);
      const newMessages = res.data.data || [];
      setMessages(prev => JSON.stringify(prev) !== JSON.stringify(newMessages) ? newMessages : prev);
    } catch {
      if (!isPolling) toast.error('Failed to load messages');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await apiSendMessage({ receiverId: activeContact.user._id, text });
      setMessages(prev => [...prev, res.data.data]);
      setText('');
    } catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  // Group messages by date
  const groupMessagesByDate = (msgs) => {
    const groups = [];
    let currentDate = null;
    msgs.forEach(msg => {
      const msgDate = new Date(msg.createdAt).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
      if (msgDate !== currentDate) {
        groups.push({ type: 'date', label: msgDate });
        currentDate = msgDate;
      }
      groups.push({ type: 'message', data: msg });
    });
    return groups;
  };

  const filteredContacts = contacts.filter(({ user: c }) =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <DashboardLayout><div className="flex justify-center py-20"><div className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="flex rounded-3xl overflow-hidden border border-slate-200/70 shadow-2xl shadow-slate-200/40" style={{ height: '82vh' }}>
        
        {/* ── LEFT PANEL ─────────────────────────────────────────── */}
        <div className="w-[32%] min-w-[280px] bg-[#f9fafb] border-r border-slate-200/80 flex flex-col">
          
          {/* Panel Header */}
          <div className="px-5 pt-5 pb-3 bg-[#f9fafb]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Messages</h2>
              <button
                onClick={() => setShowSearch(s => !s)}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-all"
              >
                <Search size={16} />
              </button>
            </div>

            {/* Search bar */}
            {showSearch && (
              <div className="mb-3 relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all"
                />
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {['chat', 'video'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-[13px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === tab
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab === 'video' ? <Video size={13} /> : <MessageCircle size={13} />}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'video' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Contacts Sections */}
          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
            {filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-60 py-16">
                <div className="w-16 h-16 rounded-2xl bg-slate-200/70 flex items-center justify-center mb-3">
                  <MessageCircle size={26} className="text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-500">No conversations yet</p>
                <p className="text-xs text-slate-400 mt-1">When you match, they'll appear here.</p>
              </div>
            ) : (
              <>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-2 pt-2 pb-1">Personal</p>
                {filteredContacts.map(({ user: contact, lastMessage }) => {
                  const isActive = activeContact?.user._id === contact._id;
                  const isUnread = lastMessage && lastMessage.senderId !== user._id && !lastMessage.read && !isActive;
                  const initials = contact.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <button
                      key={contact._id}
                      onClick={() => setActiveContact({ user: contact })}
                      className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all duration-200 text-left group relative ${
                        isActive
                          ? 'bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-slate-200/80'
                          : isUnread
                            ? 'bg-emerald-50 border border-emerald-100/50'
                            : 'hover:bg-white/70 border border-transparent'
                      }`}
                    >
                      {isUnread && (
                        <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#f9fafb] animate-pulse shadow-sm" />
                      )}
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-[15px] font-bold shadow-sm transition-all
                          ${isActive ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white' : 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600'}`}>
                          {initials}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#f9fafb] rounded-full" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between">
                          <p className={`text-[14px] truncate transition-colors ${
                            isActive ? 'text-slate-900 font-bold' 
                            : isUnread ? 'text-emerald-900 font-extrabold' 
                            : 'text-slate-700 font-bold'
                          }`}>
                            {contact.name}
                          </p>
                          <span className={`text-[11px] pl-2 flex-shrink-0 ${isUnread ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                            {lastMessage ? new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {lastMessage?.senderId === user._id && (
                            <CheckCheck size={13} className="text-emerald-500 flex-shrink-0" />
                          )}
                          <p className={`text-[12px] truncate ${isUnread ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                            {lastMessage?.text || `Start a conversation...`}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ────────────────────────────────────────── */}
        {activeContact ? (
          <div className="flex-1 flex flex-col bg-white">

            {/* Chat Header */}
            <div className="px-5 py-3.5 bg-white border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveContact(null)}
                  className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors mr-1"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {activeContact.user.name?.[0]}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-800 leading-tight">{activeContact.user.name}</h3>
                  <p className="text-[12px] text-emerald-500 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    Online • {activeContact.user.role}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab(activeTab === 'video' ? 'chat' : 'video')}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    activeTab === 'video'
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                      : 'bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'
                  }`}
                  title="Video call"
                >
                  <Video size={16} />
                </button>
                <button className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            {activeTab === 'chat' ? (
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1 bg-[#f9fafb]">
                  {messages.length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="bg-white border border-slate-100 px-7 py-8 rounded-3xl flex flex-col items-center gap-3 shadow-lg max-w-xs text-center">
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                          <Smile size={28} className="text-emerald-400" />
                        </div>
                        <p className="text-[15px] font-bold text-slate-800">Start the conversation</p>
                        <p className="text-[13px] text-slate-500">Say hi to {activeContact.user.name} 👋</p>
                      </div>
                    </div>
                  ) : (
                    groupMessagesByDate(messages).map((item, idx) => {
                      if (item.type === 'date') {
                        return (
                          <div key={`date-${idx}`} className="flex items-center gap-3 py-3">
                            <div className="flex-1 h-px bg-slate-200" />
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-[#f9fafb] px-2">{item.label}</span>
                            <div className="flex-1 h-px bg-slate-200" />
                          </div>
                        );
                      }

                      const msg = item.data;
                      const isMine = msg.senderId?._id === user._id || msg.senderId === user._id;

                      return (
                        <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} group`}>
                          <div className={`flex items-end gap-2.5 max-w-[65%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar — only for received */}
                            {!isMine && (
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mb-1 shadow-sm">
                                {activeContact.user.name?.[0]}
                              </div>
                            )}

                            <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                              {!isMine && (
                                <span className="text-[11px] font-semibold text-slate-500 mb-1 ml-1">{activeContact.user.name}</span>
                              )}
                              <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-[14px] leading-relaxed break-words whitespace-pre-wrap
                                ${isMine
                                  ? 'bg-emerald-500 text-white rounded-br-sm'
                                  : 'bg-white text-slate-700 border border-slate-200/80 rounded-bl-sm'
                                }`}>
                                {msg.text}
                              </div>
                              <div className={`flex items-center gap-1 mt-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                                <span className="text-[10px] text-slate-400 font-medium px-1">
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isMine && <CheckCheck size={12} className="text-emerald-400" />}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} className="h-2" />
                </div>

                {/* Input Bar */}
                <div className="px-4 py-3.5 bg-white border-t border-slate-100 flex-shrink-0">
                  <form onSubmit={handleSend} className="flex items-end gap-2.5">
                    <div className="flex-1 bg-[#f4f5f7] border border-slate-200/80 rounded-2xl flex items-end gap-1 px-2 py-1 focus-within:ring-2 focus-within:ring-emerald-400/20 focus-within:border-emerald-300 transition-all">
                      <button type="button" className="p-2 text-slate-400 hover:text-emerald-500 transition-colors self-end">
                        <Paperclip size={18} />
                      </button>
                      <textarea
                        className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 py-2 px-1 resize-none max-h-28 text-[14px] self-center"
                        placeholder="Write a message..."
                        rows={1}
                        value={text}
                        onChange={(e) => {
                          setText(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = (e.target.scrollHeight < 112 ? e.target.scrollHeight : 112) + 'px';
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend(e);
                            e.target.style.height = 'auto';
                          }
                        }}
                      />
                      <button type="button" className="p-2 text-slate-400 hover:text-emerald-500 transition-colors self-end">
                        <Mic size={18} />
                      </button>
                    </div>

                    {/* Send button */}
                    <button
                      type="submit"
                      disabled={sending || !text.trim()}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 shadow-md ${
                        text.trim() && !sending
                          ? 'bg-emerald-500 text-white hover:bg-emerald-400 hover:scale-105 shadow-emerald-200'
                          : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                      }`}
                    >
                      <Send size={18} className={text.trim() ? 'translate-x-0.5' : ''} />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              /* ── VIDEO TAB ── */
              <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-[#f0fdf4] relative overflow-hidden">
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-100/40 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-teal-50/60 rounded-full blur-[100px] pointer-events-none" />

                <div className="w-full max-w-lg bg-white/80 backdrop-blur-2xl border border-white/80 rounded-3xl p-10 shadow-2xl shadow-emerald-100/40 relative z-10 flex flex-col items-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl rotate-3 flex items-center justify-center mb-7 shadow-inner border border-emerald-50">
                    <Video size={36} strokeWidth={1.5} className="text-emerald-600 -rotate-3" />
                    {upcomingSession && <div className="absolute top-0 right-0 w-5 h-5 bg-emerald-500 border-[3px] border-white rounded-full animate-pulse" />}
                  </div>

                  {upcomingSession ? (
                    <div className="w-full flex flex-col items-center">
                      <h2 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight text-center">Session Scheduled</h2>
                      <p className="text-slate-500 text-[14px] mb-7 text-center">
                        {new Date(upcomingSession.scheduledAt).toLocaleString(undefined, { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>

                      <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-7 px-5 flex flex-col items-center mb-7 relative overflow-hidden">
                        <div className="absolute left-0 top-0 w-1 h-full bg-emerald-400 rounded-l-xl" />
                        {timeRemaining === 'Now' ? (
                          <p className="text-emerald-500 font-black text-4xl tracking-widest animate-pulse">It's Time!</p>
                        ) : (
                          <>
                            <p className="text-[11px] uppercase font-bold text-emerald-600/70 tracking-[0.2em] mb-2">Meeting Starts In</p>
                            <p className="text-6xl font-black text-slate-800 font-mono tracking-tighter tabular-nums">{timeRemaining}</p>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => navigate(`/meeting/${upcomingSession.jitsiRoom}`)}
                        className="w-full py-4 rounded-2xl flex items-center justify-center gap-2.5 text-[15px] font-bold bg-emerald-500 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-400 hover:scale-[1.02] transition-all"
                      >
                        <Video size={20} /> {timeRemaining === 'Now' ? 'JOIN CALL NOW' : 'JOIN EARLY'}
                      </button>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col items-center">
                      <h2 className="text-2xl font-extrabold text-slate-800 mb-2 text-center">Schedule a Video Call</h2>
                      <p className="text-slate-500 text-[14px] mb-7 text-center leading-relaxed max-w-sm">
                        Pick a time to connect with <span className="font-bold text-slate-700">{activeContact.user.name}</span>. We'll notify them instantly.
                      </p>

                      <form onSubmit={handleScheduleSubmit} className="w-full">
                        <label className="block text-[12px] uppercase tracking-wider font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                          <Clock size={13} className="text-emerald-500" /> Select Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-3.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all font-semibold text-[14px] mb-4 cursor-pointer"
                          required
                        />
                        <button type="submit" className="w-full bg-slate-900 hover:bg-emerald-600 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2.5 shadow-lg transition-all duration-300">
                          <Calendar size={18} /> Schedule Meeting
                        </button>
                      </form>

                      <div className="flex items-center gap-3 w-full my-5">
                        <div className="h-px bg-slate-200 flex-1" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">or</span>
                        <div className="h-px bg-slate-200 flex-1" />
                      </div>

                      <button
                        onClick={() => {
                          const roomName = `SkillBridge-${user._id.slice(-6)}-${activeContact.user._id.slice(-6)}`;
                          navigate(`/meeting/${roomName}`);
                        }}
                        className="w-full bg-white border-2 border-emerald-400 text-emerald-600 hover:bg-emerald-50 py-3.5 rounded-2xl font-bold transition-all hover:scale-[1.01] flex items-center justify-center gap-2.5"
                      >
                        <Video size={18} /> Start Instant Call
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── NO CONTACT SELECTED ── */
          <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-[#f9fafb] to-[#f0fdf4] relative">
            <div className="absolute top-16 right-16 w-48 h-48 bg-emerald-400/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-16 left-16 w-36 h-36 bg-teal-400/5 rounded-full blur-3xl pointer-events-none" />

            <div className="bg-white border border-slate-100 shadow-2xl shadow-slate-200/50 p-12 rounded-3xl text-center max-w-sm relative overflow-hidden z-10">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-300" />

              <div className="relative mb-7 inline-block">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-100 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/10 rotate-3 mx-auto">
                  <MessageCircle size={36} className="text-emerald-400/70" strokeWidth={1.5} />
                </div>
                <div className="absolute top-0 right-0 w-5 h-5 bg-emerald-500 border-[3px] border-white rounded-full shadow-md" />
              </div>

              <h3 className="text-xl font-extrabold text-slate-800 mb-2">SkillBridge Connect</h3>
              <p className="text-slate-500 text-[14px] leading-relaxed mb-7">
                Select a conversation from the left to start chatting with your mentors and students.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 mb-7">
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-100">💬 Instant Chat</span>
                <span className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg border border-blue-100">📹 Video Calls</span>
              </div>

              <div className="flex items-center justify-center gap-2 pt-5 border-t border-slate-100">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ready to Connect</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Chat;
