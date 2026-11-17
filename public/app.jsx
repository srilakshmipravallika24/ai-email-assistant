const { useState, useEffect, useMemo } = React;

function App() {
  // Navigation & Role Views
  const [viewMode, setViewMode] = useState('assistant'); // 'assistant' | 'client'
  const [activeSegment, setActiveSegment] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Data State
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    clientReply: 0,
    assistantReply: 0,
    noReply: 0,
    meetings: 0,
    actionRequired: 0
  });
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftTone, setDraftTone] = useState('professional');
  const [draftSubject, setDraftSubject] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);

  const [showCopilot, setShowCopilot] = useState(false);
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotHistory, setCopilotHistory] = useState([
    {
      role: 'assistant',
      content: 'Hello Taylor! I am your AI Email Copilot. Ask me anything about Alex Rivera\'s inbox, pending approvals, meeting schedules, or draft quick replies.'
    }
  ]);

  // Guided Walkthrough Tour for Evaluator / Demo Video
  const [tourStep, setTourStep] = useState(null); // null or step number 0..4

  // Fetch initial data
  const loadData = async () => {
    try {
      setLoading(true);
      const [emailsRes, statsRes, accountsRes] = await Promise.all([
        fetch('/api/emails'),
        fetch('/api/stats'),
        fetch('/api/accounts')
      ]);

      const emailsData = await emailsRes.json();
      const statsData = await statsRes.json();
      const accountsData = await accountsRes.json();

      if (emailsData.success) {
        setEmails(emailsData.data);
        if (!selectedEmail && emailsData.data.length > 0) {
          setSelectedEmail(emailsData.data[0]);
        } else if (selectedEmail) {
          const updated = emailsData.data.find(e => e.id === selectedEmail.id);
          if (updated) setSelectedEmail(updated);
        }
      }
      if (statsData.success) setStats(statsData.stats);
      if (accountsData.success) setAccounts(accountsData.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered emails based on Segment & Search
  const filteredEmails = useMemo(() => {
    return emails.filter(item => {
      // Role filter for Client view
      if (viewMode === 'client' && item.replyResponsibility !== 'client') {
        return false;
      }

      // Segment Filter (for Assistant view)
      if (viewMode === 'assistant') {
        if (activeSegment === 'client-reply' && item.replyResponsibility !== 'client') return false;
        if (activeSegment === 'assistant-reply' && item.replyResponsibility !== 'assistant') return false;
        if (activeSegment === 'no-reply' && item.replyResponsibility !== 'none') return false;
        if (activeSegment === 'meetings' && !item.extractedMeeting) return false;
        if (activeSegment === 'action-required' && !item.actionRequired) return false;
        if (activeSegment === 'waiting' && !item.waitingForResponse) return false;
        if (activeSegment === 'important' && (!item.starred && item.category !== 'important')) return false;
      }

      // Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matches =
          item.subject.toLowerCase().includes(q) ||
          item.sender.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.senderEmail.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [emails, viewMode, activeSegment, searchQuery]);

  // Handle classification change
  const handleUpdateClassification = async (emailId, newResp) => {
    try {
      const res = await fetch(`/api/emails/${emailId}/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responsibility: newResp })
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      }
    } catch (err) {
      console.error('Error updating classification:', err);
    }
  };

  // Handle Client-Facing Actions
  const handleClientAction = async (emailId, actionType, note = '') => {
    try {
      const res = await fetch(`/api/emails/${emailId}/client-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType, note })
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
      }
    } catch (err) {
      console.error('Client action failed:', err);
    }
  };

  // Trigger AI Draft Generation
  const handleGenerateDraft = async (tone) => {
    if (!selectedEmail) return;
    setIsDrafting(true);
    setDraftTone(tone);
    try {
      const res = await fetch(`/api/emails/${selectedEmail.id}/draft-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone })
      });
      const data = await res.json();
      if (data.success) {
        setDraftSubject(data.subject);
        setDraftBody(data.draft);
      }
    } catch (err) {
      console.error('Failed to generate draft:', err);
    } finally {
      setIsDrafting(false);
    }
  };

  const openDraftModal = (initialTone = 'professional') => {
    setShowDraftModal(true);
    handleGenerateDraft(initialTone);
  };

  const handleSendDraft = () => {
    if (!selectedEmail) return;
    // Append the reply to the history
    const updatedHistory = [
      ...selectedEmail.history,
      {
        sender: 'Taylor Vance (Assistant)',
        time: 'Just now',
        content: draftBody
      }
    ];
    selectedEmail.history = updatedHistory;
    selectedEmail.replyResponsibility = 'none';
    selectedEmail.responsibilityReason = 'Replied by Executive Assistant via AI Draft.';
    selectedEmail.actionRequired = false;
    selectedEmail.waitingForResponse = false;
    setShowDraftModal(false);
    loadData();
  };

  // Connect Simulated Account
  const handleConnectAccount = async (providerName) => {
    setConnectingProvider(providerName);
    setIsSyncing(true);
    setTimeout(async () => {
      try {
        await fetch('/api/accounts/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: providerName,
            email: providerName.includes('Google') ? 'alex.rivera.exec@gmail.com' : 'alex@riverapartners.com'
          })
        });
        await loadData();
      } catch (err) {
        console.error('Connect failed:', err);
      } finally {
        setIsSyncing(false);
        setConnectingProvider(null);
        setShowConnectModal(false);
      }
    }, 1500);
  };

  // Copilot Query
  const handleCopilotSubmit = async (customText = null) => {
    const textToSend = customText || copilotQuery;
    if (!textToSend.trim()) return;

    const userMsg = { role: 'user', content: textToSend };
    setCopilotHistory(prev => [...prev, userMsg]);
    setCopilotQuery('');
    setCopilotLoading(true);

    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSend })
      });
      const data = await res.json();
      if (data.success) {
        setCopilotHistory(prev => [
          ...prev,
          { role: 'assistant', content: data.answer, relatedEmailIds: data.relatedEmailIds }
        ]);
      }
    } catch (err) {
      console.error('Copilot error:', err);
    } finally {
      setCopilotLoading(false);
    }
  };

  // Tour steps definition
  const tourSteps = [
    {
      title: '1. Role Separation: Assistant vs Client View',
      description: 'Notice the top banner toggle. Personal Assistants get the full operational cockpit, while Clients get a hyper-minimalist approval feed.',
      action: () => setViewMode('assistant')
    },
    {
      title: '2. Automatic AI Reply Classification',
      description: 'AI automatically tags every email: "Assistant to Reply" (scheduling, inquiries), "Client to Reply" (approvals, confidential), or "No Reply Needed" (newsletters, invoices).',
      action: () => setActiveSegment('all')
    },
    {
      title: '3. Instant Manual Override',
      description: 'Assistants maintain full control. You can change any classification in 1-click if AI needs adjustment.',
      action: () => {}
    },
    {
      title: '4. Minimalistic Client-Facing Experience',
      description: 'Switching to Client Mode strips away all clutter. Alex Rivera only sees emails needing direct personal sign-off, with "Why your response is needed" and 1-click approvals.',
      action: () => setViewMode('client')
    },
    {
      title: '5. AI Email Assistance & Tone Drafter',
      description: 'Draft professional, friendly, or executive replies in seconds, review, customize, and ask questions to the AI Copilot.',
      action: () => { setViewMode('assistant'); setShowCopilot(true); }
    }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 font-sans select-none">
      
      {/* 🚀 TOP NAVBAR */}
      <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-lg">
              ✉
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold tracking-tight text-white text-base">AssistPilot <span className="text-indigo-400">AI</span></span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">v2.4 Prototype</span>
              </div>
              <p className="text-[11px] text-slate-400">Managing client: <strong className="text-slate-200">Alex Rivera (CEO)</strong></p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-2 ml-4 pl-4 border-l border-slate-800">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Live Sync Active
            </span>
            <button 
              onClick={() => setShowConnectModal(true)}
              className="text-xs text-slate-400 hover:text-slate-200 transition px-2 py-1 rounded hover:bg-slate-800/60"
            >
              Connected Accounts ({accounts.length})
            </button>
          </div>
        </div>

        {/* Center: View Switcher (Assistant vs Client) */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => setViewMode('assistant')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all ${
              viewMode === 'assistant'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>👔 Assistant Master View</span>
          </button>
          <button
            onClick={() => setViewMode('client')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all relative ${
              viewMode === 'client'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>👤 Client Minimal View</span>
            {stats.clientReply > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white">
                {stats.clientReply}
              </span>
            )}
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              if (tourStep === null) {
                setTourStep(0);
                tourSteps[0].action();
              } else {
                setTourStep(null);
              }
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/20 hover:opacity-90 transition flex items-center space-x-1.5"
          >
            <span>🎬</span>
            <span>{tourStep === null ? 'Guided Tour' : 'Exit Tour'}</span>
          </button>

          <button
            onClick={() => setShowCopilot(!showCopilot)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 transition flex items-center space-x-1.5"
          >
            <span>✨</span>
            <span>AI Copilot</span>
          </button>
        </div>
      </header>

      {/* 🧭 GUIDED TOUR BANNER (IF ACTIVE) */}
      {tourStep !== null && (
        <div className="bg-gradient-to-r from-indigo-900/90 via-purple-900/90 to-slate-900 border-b border-indigo-500/40 px-6 py-2.5 flex items-center justify-between text-xs animate-fadeIn shrink-0">
          <div className="flex items-center space-x-3">
            <span className="px-2 py-0.5 rounded bg-indigo-500 text-white font-bold text-[10px] uppercase">
              Walkthrough Step {tourStep + 1} of {tourSteps.length}
            </span>
            <span className="font-semibold text-white">{tourSteps[tourStep].title}:</span>
            <span className="text-slate-300">{tourSteps[tourStep].description}</span>
          </div>
          <div className="flex items-center space-x-2">
            {tourStep > 0 && (
              <button
                onClick={() => {
                  const prev = tourStep - 1;
                  setTourStep(prev);
                  tourSteps[prev].action();
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
              >
                Previous
              </button>
            )}
            {tourStep < tourSteps.length - 1 ? (
              <button
                onClick={() => {
                  const next = tourStep + 1;
                  setTourStep(next);
                  tourSteps[next].action();
                }}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded text-xs"
              >
                Next Step ➜
              </button>
            ) : (
              <button
                onClick={() => setTourStep(null)}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-xs"
              >
                Finish Tour ✓
              </button>
            )}
          </div>
        </div>
      )}

      {/* 📊 KPI / STATS BAR (ASSISTANT VIEW ONLY) */}
      {viewMode === 'assistant' && (
        <div className="bg-slate-950/60 border-b border-slate-800/80 px-6 py-3 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            
            <div 
              onClick={() => setActiveSegment('all')}
              className={`p-2.5 rounded-xl border cursor-pointer transition ${
                activeSegment === 'all' ? 'bg-slate-800 border-indigo-500/50' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-[11px] text-slate-400 font-medium">Total Emails</div>
              <div className="text-xl font-bold text-white mt-0.5">{stats.total}</div>
            </div>

            <div 
              onClick={() => setActiveSegment('assistant-reply')}
              className={`p-2.5 rounded-xl border cursor-pointer transition ${
                activeSegment === 'assistant-reply' ? 'bg-indigo-950/60 border-indigo-500' : 'bg-slate-900/60 border-slate-800 hover:border-indigo-500/30'
              }`}
            >
              <div className="text-[11px] text-indigo-300 font-medium flex items-center justify-between">
                <span>Assistant to Reply</span>
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              </div>
              <div className="text-xl font-bold text-indigo-300 mt-0.5">{stats.assistantReply}</div>
            </div>

            <div 
              onClick={() => setActiveSegment('client-reply')}
              className={`p-2.5 rounded-xl border cursor-pointer transition ${
                activeSegment === 'client-reply' ? 'bg-amber-950/60 border-amber-500' : 'bg-slate-900/60 border-slate-800 hover:border-amber-500/30'
              }`}
            >
              <div className="text-[11px] text-amber-300 font-medium flex items-center justify-between">
                <span>Client to Reply</span>
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              </div>
              <div className="text-xl font-bold text-amber-300 mt-0.5">{stats.clientReply}</div>
            </div>

            <div 
              onClick={() => setActiveSegment('no-reply')}
              className={`p-2.5 rounded-xl border cursor-pointer transition ${
                activeSegment === 'no-reply' ? 'bg-slate-800 border-slate-600' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-[11px] text-slate-400 font-medium">No Reply Needed</div>
              <div className="text-xl font-bold text-slate-300 mt-0.5">{stats.noReply}</div>
            </div>

            <div 
              onClick={() => setActiveSegment('meetings')}
              className={`p-2.5 rounded-xl border cursor-pointer transition ${
                activeSegment === 'meetings' ? 'bg-emerald-950/60 border-emerald-500' : 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/30'
              }`}
            >
              <div className="text-[11px] text-emerald-300 font-medium">Meetings Detected</div>
              <div className="text-xl font-bold text-emerald-400 mt-0.5">{stats.meetings}</div>
            </div>

            <div 
              onClick={() => setActiveSegment('action-required')}
              className={`p-2.5 rounded-xl border cursor-pointer transition ${
                activeSegment === 'action-required' ? 'bg-rose-950/60 border-rose-500' : 'bg-slate-900/60 border-slate-800 hover:border-rose-500/30'
              }`}
            >
              <div className="text-[11px] text-rose-300 font-medium">Action Required</div>
              <div className="text-xl font-bold text-rose-400 mt-0.5">{stats.actionRequired}</div>
            </div>

          </div>
        </div>
      )}

      {/* 📱 MAIN WORKSPACE AREA */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ========================================================
            VIEW MODE 1: ASSISTANT MASTER DASHBOARD
           ======================================================== */}
        {viewMode === 'assistant' ? (
          <>
            {/* 1. Left Sidebar Navigation */}
            <aside className="w-64 border-r border-slate-800/80 bg-slate-950/40 p-4 flex flex-col shrink-0 custom-scrollbar overflow-y-auto">
              <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 px-3 mb-2">
                Mailbox Segments
              </div>
              <nav className="space-y-1 text-xs">
                {[
                  { id: 'all', label: 'All Conversations', icon: '📬', count: stats.total },
                  { id: 'assistant-reply', label: 'Assistant to Reply', icon: '👔', count: stats.assistantReply, badgeColor: 'bg-indigo-500/20 text-indigo-300' },
                  { id: 'client-reply', label: 'Client to Reply', icon: '👤', count: stats.clientReply, badgeColor: 'bg-amber-500/20 text-amber-300' },
                  { id: 'no-reply', label: 'No Reply Needed', icon: '💤', count: stats.noReply, badgeColor: 'bg-slate-700/50 text-slate-300' },
                  { id: 'action-required', label: 'Action Required', icon: '⚡', count: stats.actionRequired, badgeColor: 'bg-rose-500/20 text-rose-300' },
                  { id: 'waiting', label: 'Waiting for Response', icon: '⏳', count: 2 },
                  { id: 'meetings', label: 'Meetings & Dates', icon: '📅', count: stats.meetings, badgeColor: 'bg-emerald-500/20 text-emerald-300' },
                  { id: 'important', label: 'Important / Starred', icon: '⭐', count: 2 },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSegment(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition ${
                      activeSegment === item.id
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center space-x-2.5">
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </span>
                    {item.count !== undefined && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${item.badgeColor || 'bg-slate-800 text-slate-400'}`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              <div className="mt-8 pt-4 border-t border-slate-800">
                <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 px-3 mb-2">
                  Connected Inboxes
                </div>
                <div className="space-y-2">
                  {accounts.map(acc => (
                    <div key={acc.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-[11px]">
                      <div className="font-semibold text-slate-200 truncate">{acc.provider}</div>
                      <div className="text-slate-400 truncate">{acc.email}</div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="text-emerald-400">● {acc.status}</span>
                        <span>{acc.lastSync}</span>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setShowConnectModal(true)}
                    className="w-full mt-2 py-1.5 border border-dashed border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200 text-xs rounded-lg transition"
                  >
                    + Connect Another Account
                  </button>
                </div>
              </div>
            </aside>

            {/* 2. Middle Email List */}
            <section className="w-96 border-r border-slate-800/80 bg-slate-900/30 flex flex-col shrink-0">
              {/* Search input */}
              <div className="p-3 border-b border-slate-800/80">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-xs">
                    🔍
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search sender, subject, summary..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-500 hover:text-slate-300 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>Showing {filteredEmails.length} conversation{filteredEmails.length === 1 ? '' : 's'}</span>
                  <span className="text-indigo-400">Auto-classified by AI</span>
                </div>
              </div>

              {/* Email items scroll */}
              <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-800/50">
                {filteredEmails.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    <p className="text-2xl mb-2">📭</p>
                    <p className="font-semibold text-slate-400">No emails in this segment</p>
                    <p className="mt-1">Try switching filters or clearing your search.</p>
                  </div>
                ) : (
                  filteredEmails.map(item => {
                    const isSelected = selectedEmail?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedEmail(item)}
                        className={`p-3.5 cursor-pointer transition relative ${
                          isSelected
                            ? 'bg-slate-800/90 border-l-4 border-indigo-500 shadow-sm'
                            : 'hover:bg-slate-800/40 border-l-4 border-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <img
                              src={item.senderAvatar}
                              alt={item.sender}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <span className={`text-xs font-semibold ${item.read ? 'text-slate-300' : 'text-white'}`}>
                              {item.sender}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">{item.timestamp}</span>
                        </div>

                        <div className="mt-1.5 text-xs font-medium text-slate-200 truncate">
                          {item.subject}
                        </div>

                        <p className="mt-1 text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {item.summary}
                        </p>

                        {/* Badges footer */}
                        <div className="mt-2.5 flex items-center flex-wrap gap-1.5">
                          {/* Reply Responsibility Badge */}
                          {item.replyResponsibility === 'assistant' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center space-x-1">
                              <span>👔</span>
                              <span>Assistant to Reply</span>
                            </span>
                          )}
                          {item.replyResponsibility === 'client' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                              <span>👤</span>
                              <span>Client to Reply</span>
                            </span>
                          )}
                          {item.replyResponsibility === 'none' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700 flex items-center space-x-1">
                              <span>💤</span>
                              <span>No Reply Needed</span>
                            </span>
                          )}

                          {item.extractedMeeting && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                              📅 Meeting
                            </span>
                          )}
                          {item.actionRequired && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/20">
                              ⚡ Action
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* 3. Right Email Detail View */}
            <main className="flex-1 bg-slate-950 flex flex-col overflow-hidden">
              {selectedEmail ? (
                <>
                  {/* Detail Header */}
                  <div className="p-5 border-b border-slate-800/80 bg-slate-900/40 flex items-start justify-between shrink-0">
                    <div>
                      <div className="flex items-center space-x-3">
                        <h1 className="text-base font-bold text-white tracking-tight">
                          {selectedEmail.subject}
                        </h1>
                        {selectedEmail.starred && <span className="text-yellow-400 text-sm">⭐</span>}
                      </div>

                      <div className="mt-2 flex items-center space-x-3 text-xs text-slate-400">
                        <img
                          src={selectedEmail.senderAvatar}
                          alt={selectedEmail.sender}
                          className="w-7 h-7 rounded-full object-cover border border-slate-700"
                        />
                        <div>
                          <span className="font-semibold text-slate-200">{selectedEmail.sender}</span>
                          <span className="text-slate-500 ml-1.5">&lt;{selectedEmail.senderEmail}&gt;</span>
                        </div>
                        <span className="text-slate-600">•</span>
                        <span>{selectedEmail.timestamp}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openDraftModal('professional')}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 flex items-center space-x-1.5 transition"
                      >
                        <span>✨</span>
                        <span>Draft AI Reply</span>
                      </button>
                    </div>
                  </div>

                  {/* AI Intelligence Card */}
                  <div className="m-5 p-4 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/30 shadow-lg shrink-0">
                    <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-indigo-500/20">
                      <div className="flex items-center space-x-2">
                        <span className="text-indigo-400 text-sm">🧠</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                          AI Intelligence & Reply Responsibility
                        </span>
                      </div>

                      {/* Manual Override Dropdown */}
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-slate-400 text-[11px]">Override Responsibility:</span>
                        <select
                          value={selectedEmail.replyResponsibility}
                          onChange={(e) => handleUpdateClassification(selectedEmail.id, e.target.value)}
                          className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="assistant">Assistant to Reply</option>
                          <option value="client">Client to Reply</option>
                          <option value="none">No Reply Needed</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      {/* Reason */}
                      <div className="md:col-span-2">
                        <div className="text-[11px] text-slate-400 font-semibold mb-1">
                          Why this classification?
                        </div>
                        <p className="text-slate-200 leading-relaxed bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                          {selectedEmail.responsibilityReason}
                        </p>
                      </div>

                      {/* Extracted meeting / Action */}
                      <div>
                        <div className="text-[11px] text-slate-400 font-semibold mb-1">
                          Detected Action & Logistics
                        </div>
                        <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                          {selectedEmail.extractedMeeting ? (
                            <div>
                              <div className="font-semibold text-emerald-400 flex items-center space-x-1">
                                <span>📅</span>
                                <span>{selectedEmail.extractedMeeting.title}</span>
                              </div>
                              <div className="text-[11px] text-slate-300 mt-1">
                                {selectedEmail.extractedMeeting.suggestedDate}
                              </div>
                              <button 
                                onClick={() => alert(`Added "${selectedEmail.extractedMeeting.title}" to Alex's Google Calendar!`)}
                                className="mt-2 w-full py-1 text-[10px] font-bold bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded transition"
                              >
                                + Add to Calendar
                              </button>
                            </div>
                          ) : selectedEmail.actionRequired ? (
                            <div className="text-rose-300 font-medium flex items-center space-x-1">
                              <span>⚡</span>
                              <span>Pending follow-up / document handling</span>
                            </div>
                          ) : (
                            <div className="text-slate-400">
                              Informational only. No calendar event detected.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Conversation Body & Thread */}
                  <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar space-y-4">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Conversation Thread
                    </div>

                    {selectedEmail.history.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border ${
                          msg.sender.includes('Assistant')
                            ? 'bg-indigo-950/30 border-indigo-500/30 ml-8'
                            : msg.sender.includes('Client')
                            ? 'bg-amber-950/30 border-amber-500/30 ml-8'
                            : 'bg-slate-900/70 border-slate-800 mr-8'
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 text-xs">
                          <span className="font-bold text-slate-200">{msg.sender}</span>
                          <span className="text-[11px] text-slate-500">{msg.time}</span>
                        </div>
                        <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm">
                  <p className="text-4xl mb-3">📬</p>
                  <p>Select an email to view full AI analysis & conversation history</p>
                </div>
              )}
            </main>
          </>
        ) : (
          /* ========================================================
              VIEW MODE 2: MINIMALISTIC CLIENT-FACING VIEW
             ======================================================== */
          <div className="flex-1 bg-slate-950 p-6 md:p-10 overflow-y-auto custom-scrollbar flex justify-center">
            <div className="w-full max-w-3xl">
              
              {/* Minimal Client Header */}
              <div className="mb-8 pb-6 border-b border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Executive Action Feed</h1>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Good day, Alex. Here are the items requiring your personal authorization or personal input. Your assistant Taylor handles the rest.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-amber-400">{filteredEmails.length}</div>
                  <div className="text-[11px] text-slate-400">Items Pending Your Review</div>
                </div>
              </div>

              {/* Client Email Cards */}
              {filteredEmails.length === 0 ? (
                <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
                  <div className="text-4xl mb-3">🎉</div>
                  <h3 className="text-base font-bold text-white">All Caught Up!</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    No emails currently require your personal response. Taylor is actively handling calendar, vendors, and routine requests.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {filteredEmails.map(item => (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl hover:border-amber-500/40 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <img
                            src={item.senderAvatar}
                            alt={item.sender}
                            className="w-9 h-9 rounded-full object-cover border border-slate-700"
                          />
                          <div>
                            <div className="text-sm font-bold text-white">{item.sender}</div>
                            <div className="text-[11px] text-slate-400">{item.senderEmail} • {item.timestamp}</div>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                          Requires Your Action
                        </span>
                      </div>

                      <div className="mt-3 text-sm font-semibold text-slate-100">
                        {item.subject}
                      </div>

                      {/* AI Executive Summary Box */}
                      <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                        <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-1">
                          AI Executive Summary:
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          {item.summary}
                        </p>

                        <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                          <span className="text-[11px] font-bold text-amber-400">Why your response is needed: </span>
                          <span className="text-slate-300 text-[11px]">{item.responsibilityReason}</span>
                        </div>
                      </div>

                      {/* Quick Client Actions */}
                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                        <button
                          onClick={() => {
                            setSelectedEmail(item);
                            setViewMode('assistant');
                          }}
                          className="text-xs text-slate-400 hover:text-indigo-400 transition"
                        >
                          View Full Conversation History ➜
                        </button>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              const note = prompt('Optional instructions for assistant Taylor:', 'Please follow up on terms.');
                              handleClientAction(item.id, 'delegate_to_assistant', note);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                          >
                            Delegate to Assistant
                          </button>

                          <button
                            onClick={() => handleClientAction(item.id, 'handled', 'Handled personally by Alex.')}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition"
                          >
                            ✓ Mark Handled / Approved
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL 1: CONNECT EMAIL ACCOUNT (ONBOARDING)
         ======================================================== */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>🔌</span>
                <span>Connect Client Mailbox</span>
              </h3>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Connect your client's email accounts via OAuth 2.0. AssistPilot automatically classifies incoming threads and syncs status in real-time.
            </p>

            {isSyncing ? (
              <div className="my-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-3"></div>
                <div className="text-xs font-semibold text-white">Authorizing & Synchronizing...</div>
                <div className="text-[11px] text-slate-400 mt-1">Connecting to {connectingProvider} API</div>
              </div>
            ) : (
              <div className="space-y-3 mt-5">
                <button
                  onClick={() => handleConnectAccount('Google Workspace (Gmail)')}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 text-left transition group"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">🔴</span>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-indigo-400 transition">Google Workspace / Gmail</div>
                      <div className="text-[10px] text-slate-400">OAuth 2.0 Secure Authorization</div>
                    </div>
                  </div>
                  <span className="text-xs text-indigo-400">Connect ➜</span>
                </button>

                <button
                  onClick={() => handleConnectAccount('Microsoft Outlook 365')}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 text-left transition group"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">🔷</span>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-indigo-400 transition">Microsoft Outlook 365</div>
                      <div className="text-[10px] text-slate-400">Azure Graph API Integration</div>
                    </div>
                  </div>
                  <span className="text-xs text-indigo-400">Connect ➜</span>
                </button>
              </div>
            )}

            <div className="mt-6 pt-3 border-t border-slate-800 text-[11px] text-slate-500 text-center">
              🔒 End-to-end encrypted synchronization. No credentials stored.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: AI REPLY DRAFTER
         ======================================================== */}
      {showDraftModal && selectedEmail && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-2">
                <span className="text-indigo-400 text-base">✨</span>
                <h3 className="text-base font-bold text-white">AI Reply Drafter & Review</h3>
              </div>
              <button
                onClick={() => setShowDraftModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Tone Selector */}
            <div className="mt-4 flex items-center justify-between shrink-0">
              <span className="text-xs font-semibold text-slate-400">Select Tone & Persona:</span>
              <div className="flex items-center space-x-2">
                {[
                  { id: 'professional', label: 'Formal / Professional' },
                  { id: 'friendly', label: 'Warm & Friendly' },
                  { id: 'brief', label: 'Executive Brief' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleGenerateDraft(t.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      draftTone === t.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Editor Area */}
            <div className="mt-4 flex-1 flex flex-col space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 font-semibold">Subject:</label>
                <input
                  type="text"
                  value={draftSubject}
                  onChange={(e) => setDraftSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white mt-1 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex-1 flex flex-col">
                <label className="text-[11px] text-slate-400 font-semibold">Review & Edit Draft (Human-in-the-Loop):</label>
                {isDrafting ? (
                  <div className="flex-1 min-h-[180px] flex flex-col items-center justify-center bg-slate-950 rounded-lg border border-slate-800 text-slate-400 text-xs">
                    <span className="animate-spin text-xl mb-2">⚡</span>
                    <span>AI is formulating optimal response based on email history...</span>
                  </div>
                ) : (
                  <textarea
                    value={draftBody}
                    onChange={(e) => setDraftBody(e.target.value)}
                    rows={8}
                    className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 mt-1 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans custom-scrollbar"
                  />
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500">
                AI draft requires your final review before sending.
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowDraftModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendDraft}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 flex items-center space-x-1.5"
                >
                  <span>Approve & Send Reply ➜</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          DRAWER: AI INBOX COPILOT
         ======================================================== */}
      {showCopilot && (
        <div className="fixed inset-y-0 right-0 w-96 bg-slate-950 border-l border-slate-800 shadow-2xl z-40 flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center space-x-2">
              <span className="text-base">✨</span>
              <span className="text-xs font-bold text-white uppercase tracking-wider">AI Inbox Copilot</span>
            </div>
            <button
              onClick={() => setShowCopilot(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>

          {/* Quick Query Pills */}
          <div className="p-3 border-b border-slate-800/80 bg-slate-900/20 flex flex-wrap gap-1.5">
            {[
              'What requires client approval?',
              'Summarize pending meetings',
              'What am I waiting on?',
              'Show assistant tasks'
            ].map((q, i) => (
              <button
                key={i}
                onClick={() => handleCopilotSubmit(q)}
                className="text-[10px] bg-slate-800/80 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-200 border border-slate-700 rounded-full px-2.5 py-1 transition"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar text-xs">
            {copilotHistory.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white ml-6'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 mr-4'
                }`}
              >
                <div className="text-[10px] font-bold opacity-60 mb-1">
                  {m.role === 'user' ? 'Taylor Vance' : 'AI Copilot'}
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
              </div>
            ))}
            {copilotLoading && (
              <div className="p-3 bg-slate-900 border border-slate-800 text-slate-400 text-xs rounded-xl flex items-center space-x-2">
                <span className="animate-spin">🌀</span>
                <span>Analyzing mailbox history...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-slate-800 bg-slate-900/40">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCopilotSubmit();
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={copilotQuery}
                onChange={(e) => setCopilotQuery(e.target.value)}
                placeholder="Ask AI about this mailbox..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Render React App
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
