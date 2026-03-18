'use client';
import { useState, useEffect, useCallback } from 'react';

const TZ = 'America/New_York';

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: TZ,
  });
}
function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
}
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// ── Savvy Submark ───────────────────────────────────────────────────────────
function SavvySubmark({ size = 28, color = '#3F434A' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 70 86" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="36" cy="26" rx="26" ry="17" transform="rotate(-12 36 26)" stroke={color} strokeWidth="7.5" strokeLinecap="round" />
      <ellipse cx="34" cy="60" rx="26" ry="17" transform="rotate(12 34 60)" stroke={color} strokeWidth="7.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Notepad ────────────────────────────────────────────────────────────────
function NotepadPanel({ notes, onChange, onGenerateTasks, generating }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#ECECEC] p-6 flex flex-col" style={{ minHeight: '420px' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#3F434A]">Notepad</h2>
        <span className="text-xs text-[#A3A3A3]">{notes.length} chars</span>
      </div>
      <textarea
        className="flex-1 w-full text-sm text-[#5E646E] resize-none focus:outline-none placeholder-[#D0D0D0] leading-relaxed"
        placeholder="Jot down thoughts, meeting notes, ideas throughout the day. Hit 'Generate Tasks' when ready to turn them into action items."
        value={notes}
        onChange={(e) => onChange(e.target.value)}
        rows={14}
      />
      <button
        onClick={onGenerateTasks}
        disabled={!notes.trim() || generating}
        className="mt-4 w-full text-white text-sm font-medium py-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        style={{ backgroundColor: generating ? '#A3A3A3' : '#8E7E57' }}
        onMouseEnter={e => { if (!generating) e.currentTarget.style.backgroundColor = '#6B6242'; }}
        onMouseLeave={e => { if (!generating) e.currentTarget.style.backgroundColor = '#8E7E57'; }}
      >
        {generating ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Generating…
          </>
        ) : '✦ Generate Tasks with AI'}
      </button>
    </div>
  );
}

// ── Tasks ──────────────────────────────────────────────────────────────────
const PRIORITY_STYLES = {
  high:   'border-[#EAC6C3] bg-[#FAF0EF] text-[#B63D35]',
  medium: 'border-[#EDD898] bg-[#FBF5E3] text-[#D69F31]',
  low:    'border-[#A8CEC6] bg-[#EBF4F1] text-[#175242]',
};

function TasksPanel({ tasks, onAddTask, onToggleTask, onDeleteTask }) {
  const [input, setInput] = useState('');
  const [priority, setPriority] = useState('medium');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onAddTask(input.trim(), priority);
    setInput('');
  };

  const groups = [
    { label: 'High',   key: 'high',   color: 'text-[#B63D35]' },
    { label: 'Medium', key: 'medium', color: 'text-[#D69F31]' },
    { label: 'Low',    key: 'low',    color: 'text-[#175242]' },
  ];

  const remaining = tasks.filter(t => !t.done).length;

  const renderTask = (task) => (
    <li key={task.id} className="flex items-start gap-2 p-2 rounded-xl hover:bg-[#F6F2EC] group">
      <button
        onClick={() => onToggleTask(task.id)}
        className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          task.done ? 'bg-[#175242] border-[#175242] text-white' : 'border-[#D0D0D0] hover:border-[#8E7E57]'
        }`}
      >
        {task.done && <span className="text-[8px] leading-none">✓</span>}
      </button>
      <span className={`flex-1 text-xs leading-relaxed ${task.done ? 'line-through text-[#A3A3A3]' : 'text-[#3F434A]'}`}>
        {task.carriedOver && <span className="mr-1">🔁</span>}{task.text}
      </span>
      <button
        onClick={() => onDeleteTask(task.id)}
        className="text-[#D0D0D0] hover:text-[#B63D35] opacity-0 group-hover:opacity-100 transition-opacity text-xs flex-shrink-0"
      >✕</button>
    </li>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#ECECEC] p-6 flex flex-col" style={{ minHeight: '420px' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#3F434A]">Tasks</h2>
        {tasks.length > 0 && <span className="text-xs text-[#A3A3A3]">{remaining} remaining</span>}
      </div>
      <form onSubmit={handleAdd} className="mb-4 space-y-2">
        <input
          className="w-full text-sm border border-[#ECECEC] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#C7BCA0] text-[#3F434A] placeholder-[#A3A3A3]"
          placeholder="Add a task manually..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="flex gap-2">
          {['high', 'medium', 'low'].map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={`flex-1 text-xs py-1 rounded-lg border transition-colors capitalize ${
                priority === p ? PRIORITY_STYLES[p] : 'border-[#ECECEC] text-[#A3A3A3] hover:border-[#A3A3A3]'
              }`}
            >{p}</button>
          ))}
          <button
            type="submit"
            className="text-white text-xs px-3 py-1 rounded-lg transition-colors"
            style={{ backgroundColor: '#8E7E57' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#6B6242'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#8E7E57'}
          >Add</button>
        </div>
      </form>
      {tasks.length === 0 ? (
        <p className="text-sm text-[#A3A3A3] text-center py-8">No tasks yet — jot notes and hit Generate, or add manually above</p>
      ) : (
        <div className="overflow-y-auto flex-1 space-y-4 max-h-72">
          {groups.map(({ label, key, color }) => {
            const group = tasks.filter(t => t.priority === key);
            if (group.length === 0) return null;
            return (
              <div key={key}>
                <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 px-2 ${color}`}>{label}</p>
                <ul className="space-y-0.5">{group.map(renderTask)}</ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Calendar ───────────────────────────────────────────────────────────────
function CalendarPanel() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  const fetchEvents = useCallback(async (isResync) => {
    if (isResync) setSyncing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/calendar?t=${Date.now()}`, { cache: 'no-store' });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { setError(`API error: ${text.slice(0, 200)}`); return; }
      if (data.error) {
        if (data.error.includes('not configured')) setNotConfigured(true);
        else setError(data.error);
      } else {
        setEvents(data.events || []);
        setLastSynced(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: TZ }));
      }
    } catch (err) {
      setError('Could not load calendar: ' + err.message);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => { fetchEvents(false); }, [fetchEvents]);

  const now = Date.now();

  const sortedEvents = [...events].sort((a, b) => {
    const aIsPast = !a.isAllDay && a.startMs && a.startMs < now;
    const bIsPast = !b.isAllDay && b.startMs && b.startMs < now;
    if (aIsPast && !bIsPast) return 1;
    if (!aIsPast && bIsPast) return -1;
    return (a.startMs || 0) - (b.startMs || 0);
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#ECECEC] p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-[#3F434A]">Calendar</h2>
        <div className="flex items-center gap-2">
          {lastSynced && !syncing && <span className="text-[9px] text-[#D0D0D0]">synced {lastSynced}</span>}
          <button
            onClick={() => fetchEvents(true)}
            disabled={syncing || notConfigured}
            className="text-[10px] font-medium flex items-center gap-1 disabled:opacity-40 text-[#175242] hover:text-[#0f3a2d]"
          >
            {syncing ? (
              <>
                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Syncing…
              </>
            ) : '↻ Re-sync'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="space-y-2 py-2">
          {[1, 2, 3].map(i => <div key={i} className="h-9 bg-[#ECECEC] rounded-lg animate-pulse" />)}
        </div>
      )}

      {notConfigured && (
        <div className="py-3 text-center space-y-2">
          <p className="text-xs text-[#767676]">Connect your Google Calendar to see today&apos;s events here.</p>
          <a
            href="/api/auth/google"
            className="inline-block text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ backgroundColor: '#175242' }}
          >
            Connect Calendar
          </a>
        </div>
      )}

      {error && <p className="text-xs text-[#A3A3A3] text-center py-3">{error}</p>}

      {!loading && !error && !notConfigured && events.length === 0 && (
        <p className="text-xs text-[#A3A3A3] text-center py-3">No events today</p>
      )}

      {!loading && !error && events.length > 0 && (
        <ul className="space-y-1 max-h-44 overflow-y-auto">
          {sortedEvents.map((event) => {
            const isPast = !event.isAllDay && event.startMs && event.startMs < now;
            return (
              <li key={event.id} className={`flex items-start gap-2 p-2 rounded-xl hover:bg-[#F6F2EC] ${isPast ? 'opacity-50' : ''}`}>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: '#175242' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#3F434A] truncate">{event.title}</p>
                  <p className="text-[10px] text-[#A3A3A3]">{event.time}</p>
                  {event.location && <p className="text-[10px] text-[#A3A3A3] truncate">{event.location}</p>}
                </div>
                {event.meetLink && (
                  <a
                    href={event.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] border px-1.5 py-0.5 rounded-md font-medium flex-shrink-0 transition-colors"
                    style={{ backgroundColor: '#EBF4F1', color: '#175242', borderColor: '#A8CEC6' }}
                  >
                    Join
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── Gmail Inbox ─────────────────────────────────────────────────────────────
function GmailPanel({ onCreateTask }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  const fetchEmails = useCallback(async (isResync) => {
    if (isResync) setSyncing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/gmail?t=${Date.now()}`, { cache: 'no-store' });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { setError(`Parse error: ${text.slice(0, 200)}`); return; }
      if (data.error) {
        if (data.error.includes('not configured')) setNotConfigured(true);
        else setError(data.error);
      } else {
        setEmails(data.emails || []);
        setLastSynced(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: TZ }));
      }
    } catch (err) {
      setError('Could not load Gmail: ' + err.message);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => { fetchEmails(false); }, [fetchEmails]);

  const handleCreateTask = (email) => {
    onCreateTask(`Reply to ${email.from}: "${email.subject}"`, 'high');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#ECECEC] p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-[#3F434A]">Gmail</h2>
          {emails.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#FAF0EF', color: '#B63D35' }}>{emails.length}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastSynced && !syncing && <span className="text-[9px] text-[#D0D0D0]">synced {lastSynced}</span>}
          <button
            onClick={() => fetchEmails(true)}
            disabled={syncing || notConfigured}
            className="text-[10px] font-medium flex items-center gap-1 disabled:opacity-40"
            style={{ color: '#B63D35' }}
          >
            {syncing ? (
              <>
                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Syncing…
              </>
            ) : '↻ Re-sync'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="space-y-2 py-2">
          {[1, 2, 3].map(i => <div key={i} className="h-10 bg-[#ECECEC] rounded-lg animate-pulse" />)}
        </div>
      )}

      {notConfigured && (
        <div className="py-3 text-center space-y-2">
          <p className="text-xs text-[#767676]">Connect your Gmail to see unread emails here.</p>
          <a
            href="/api/auth/google"
            className="inline-block text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ backgroundColor: '#B63D35' }}
          >
            Connect Gmail
          </a>
        </div>
      )}

      {error && <p className="text-xs text-[#A3A3A3] text-center py-3">{error}</p>}

      {!loading && !error && !notConfigured && emails.length === 0 && (
        <p className="text-xs text-[#A3A3A3] text-center py-3">Inbox zero — you&apos;re all caught up</p>
      )}

      {!loading && !error && emails.length > 0 && (
        <ul className="space-y-1 max-h-56 overflow-y-auto">
          {emails.map((email) => (
            <li key={email.id} className="p-2 rounded-lg hover:bg-[#F6F2EC] group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-[#3F434A] truncate">{email.from}</span>
                    <span className="text-[10px] text-[#A3A3A3] flex-shrink-0">{email.time}</span>
                  </div>
                  <p className="text-xs text-[#3F434A] font-medium truncate mt-0.5">{email.subject}</p>
                  {email.snippet && (
                    <p className="text-[10px] text-[#A3A3A3] truncate mt-0.5">{email.snippet}</p>
                  )}
                </div>
                <button
                  onClick={() => handleCreateTask(email)}
                  title="Create task to reply"
                  className="text-[9px] border px-1.5 py-0.5 rounded-md font-medium flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: '#F6F2EC', color: '#8E7E57', borderColor: '#C7BCA0' }}
                >
                  + Task
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Slack ──────────────────────────────────────────────────────────────────
function SlackPanel({ onCreateTask }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);

  const fetchSlack = useCallback(async (isResync) => {
    if (isResync) setSyncing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/slack?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages(data.messages || []);
      setLastSynced(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: TZ }));
    } catch (err) {
      setError(err.message || 'Could not load Slack messages');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => { fetchSlack(false); }, [fetchSlack]);

  const handleCreateTask = (msg) => {
    const taskText = `Reply to ${msg.from} ${msg.channel !== 'DM' ? `in ${msg.channel}` : '(DM)'}: "${msg.text.slice(0, 100)}${msg.text.length > 100 ? '…' : ''}"`;
    onCreateTask(taskText, 'high');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#ECECEC] p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-[#3F434A]">Slack</h2>
          {messages.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#EBF4F7', color: '#0B5871' }}>
              {messages.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastSynced && !syncing && <span className="text-[9px] text-[#D0D0D0]">synced {lastSynced}</span>}
          <button
            onClick={() => fetchSlack(true)}
            disabled={syncing}
            className="text-[10px] font-medium flex items-center gap-1 disabled:opacity-50"
            style={{ color: '#0B5871' }}
          >
            {syncing ? (
              <>
                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Syncing…
              </>
            ) : '↻ Re-sync'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="space-y-2 py-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-[#ECECEC] rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {error && <p className="text-xs text-[#A3A3A3] text-center py-3">{error}</p>}

      {!loading && !error && messages.length === 0 && (
        <p className="text-xs text-[#A3A3A3] text-center py-3">All caught up — no unreplied messages</p>
      )}

      {!loading && !error && messages.length > 0 && (
        <ul className="space-y-1 max-h-56 overflow-y-auto">
          {messages.map((msg) => (
            <li key={msg.id} className="p-2 rounded-lg hover:bg-[#F6F2EC] group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-[#3F434A]">{msg.from}</span>
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full border"
                      style={msg.type === 'dm'
                        ? { backgroundColor: '#EBF4F7', color: '#0B5871', borderColor: '#A8CADB' }
                        : { backgroundColor: '#EBF4F1', color: '#175242', borderColor: '#A8CEC6' }
                      }>
                      {msg.type === 'dm' ? 'DM' : msg.channel}
                    </span>
                    <span className="text-[10px] text-[#A3A3A3]">{msg.time}</span>
                  </div>
                  <p className="text-xs text-[#5E646E] mt-0.5 leading-relaxed line-clamp-2">{msg.text}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCreateTask(msg)}
                    title="Create task to reply"
                    className="text-[9px] border px-1.5 py-0.5 rounded-md font-medium"
                    style={{ backgroundColor: '#F6F2EC', color: '#8E7E57', borderColor: '#C7BCA0' }}
                  >
                    + Task
                  </button>
                  {msg.permalink && (
                    <a
                      href={msg.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open in Slack"
                      className="text-[9px] border px-1.5 py-0.5 rounded-md font-medium"
                      style={{ backgroundColor: '#F6F2EC', color: '#767676', borderColor: '#ECECEC' }}
                    >
                      Open
                    </a>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── News Briefing ──────────────────────────────────────────────────────────
const TAG_STYLES = {
  'Market impact': 'bg-[#EBF4F1] text-[#175242] border-[#A8CEC6]',
  'Policy':        'bg-[#EBF4F7] text-[#0B5871] border-[#A8CADB]',
  'Economy':       'bg-[#FBF5E3] text-[#D69F31] border-[#EDD898]',
  'Tech':          'bg-[#F6F2EC] text-[#8E7E57] border-[#C7BCA0]',
  'Geopolitics':   'bg-[#FAF0EF] text-[#B63D35] border-[#EAC6C3]',
  'Energy':        'bg-[#FBF5E3] text-[#D69F31] border-[#EDD898]',
  'Transit':       'bg-[#EBF4F7] text-[#0B5871] border-[#A8CADB]',
  'Housing':       'bg-[#FAF0EF] text-[#B63D35] border-[#EAC6C3]',
  'Safety':        'bg-[#FAF0EF] text-[#B63D35] border-[#EAC6C3]',
  'Culture':       'bg-[#F8EEF4] text-[#C06F73] border-[#DDB8BF]',
};

function NewsArticle({ article }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#3F434A] hover:text-[#8E7E57] transition-colors leading-snug block"
          >
            {article.title}
          </a>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] text-[#A3A3A3] font-medium">{article.source}</span>
            {article.tags?.map((tag, i) => (
              <span
                key={i}
                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${TAG_STYLES[tag] || 'bg-[#F6F2EC] text-[#767676] border-[#ECECEC]'}`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        {article.analysis && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] font-medium flex-shrink-0 mt-0.5 text-[#8E7E57] hover:text-[#6B6242]"
          >
            {expanded ? 'Less' : 'Why it matters'}
          </button>
        )}
      </div>
      {expanded && article.analysis && (
        <div className="mt-2 bg-[#F6F2EC] rounded-lg p-3">
          <p className="text-xs text-[#5E646E] leading-relaxed">{article.analysis}</p>
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[#8E7E57] hover:text-[#6B6242] mt-1.5 inline-block font-medium"
          >
            Read full article →
          </a>
        </div>
      )}
    </li>
  );
}

function NewsPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch('/api/news-briefing');
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        setData(json);
      } catch {
        setError('Could not load news briefing');
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#ECECEC] p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-[#3F434A]">📰 Headlines for Dummies</h2>
          <p className="text-[11px] text-[#A3A3A3] mt-0.5">Top stories with context — click &ldquo;Why it matters&rdquo; to dig deeper</p>
        </div>
        <span className="text-xs text-[#A3A3A3]">Powered by Claude</span>
      </div>

      {loading && (
        <div className="space-y-3">
          {[85, 70, 90, 65, 80, 75, 60, 70].map((w, i) => (
            <div key={i} className="h-3.5 bg-[#ECECEC] rounded-full animate-pulse" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}

      {error && <p className="text-sm text-[#A3A3A3] text-center py-8">{error}</p>}

      {data && (
        <div className="space-y-6 max-h-[520px] overflow-y-auto pr-1">
          {data.national && data.national.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#767676] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                🇺🇸 National
              </p>
              <ul className="divide-y divide-[#F6F2EC]">
                {data.national.slice(0, 5).map((article, i) => (
                  <NewsArticle key={i} article={article} />
                ))}
              </ul>
            </div>
          )}
          {data.nyc && data.nyc.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#767676] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                🗽 New York City
              </p>
              <ul className="divide-y divide-[#F6F2EC]">
                {data.nyc.slice(0, 5).map((article, i) => (
                  <NewsArticle key={i} article={article} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Stock Market for Dummies ───────────────────────────────────────────────
function MarketPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showVocab, setShowVocab] = useState(false);

  useEffect(() => {
    async function fetchBriefing() {
      try {
        const res = await fetch('/api/market-briefing');
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        setData(json);
      } catch {
        setError('Could not load market briefing');
      } finally {
        setLoading(false);
      }
    }
    fetchBriefing();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#ECECEC] p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-[#3F434A]">📈 Stock Market for Dummies</h2>
          <p className="text-[11px] text-[#A3A3A3] mt-0.5">Your daily ELI5 market briefing</p>
        </div>
        <span className="text-xs text-[#A3A3A3]">Powered by Claude</span>
      </div>

      {loading && (
        <div className="space-y-4">
          <div className="space-y-2">
            {[90, 80, 70].map((w, i) => (
              <div key={i} className="h-3.5 bg-[#ECECEC] rounded-full animate-pulse" style={{ width: `${w}%` }} />
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-[#ECECEC] rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-[#A3A3A3] text-center py-8">{error}</p>}

      {data && (
        <div className="space-y-5">
          <div className="space-y-2">
            {data.marketData?.map((index) => (
              <div key={index.name} className="flex items-center justify-between p-3 bg-[#F6F2EC] rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-[#3F434A]">{index.name}</p>
                  <p className="text-xs text-[#767676]">
                    {index.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className={`text-right ${index.change >= 0 ? 'text-[#175242]' : 'text-[#B63D35]'}`}>
                  <p className="text-sm font-bold">
                    {index.change >= 0 ? '▲' : '▼'} {Math.abs(index.changePercent)?.toFixed(2)}%
                  </p>
                  <p className="text-xs">
                    {index.change >= 0 ? '+' : ''}{index.change?.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {data.briefing && (
            <div className="rounded-xl p-4" style={{ backgroundColor: '#FFF8F1', border: '1px solid #C7BCA0' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#8E7E57' }}>💡 What this means for you</p>
              <p className="text-sm text-[#5E646E] leading-relaxed">{data.briefing}</p>
            </div>
          )}

          {data.dinnerPartyTip && (
            <div className="rounded-xl p-4" style={{ backgroundColor: '#FBF5E3', border: '1px solid #EDD898' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#D69F31' }}>🍷 Sound smart at dinner</p>
              <p className="text-sm text-[#5E646E] italic leading-relaxed">&ldquo;{data.dinnerPartyTip}&rdquo;</p>
            </div>
          )}

          {data.vocabulary && data.vocabulary.length > 0 && (
            <div>
              <button
                onClick={() => setShowVocab(!showVocab)}
                className="text-xs font-semibold flex items-center gap-1 text-[#8E7E57] hover:text-[#6B6242]"
              >
                <span>📚 Vocab of the day ({data.vocabulary.length} terms)</span>
                <span className="text-[10px]">{showVocab ? '▲' : '▼'}</span>
              </button>
              {showVocab && (
                <div className="mt-3 space-y-3">
                  {data.vocabulary.map((v, i) => (
                    <div key={i} className="bg-[#F6F2EC] rounded-xl p-3">
                      <p className="text-xs font-bold text-[#3F434A]">{v.term}</p>
                      <p className="text-xs text-[#5E646E] mt-1">{v.definition}</p>
                      {v.analogy && (
                        <p className="text-xs mt-1 italic text-[#8E7E57]">{v.analogy}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────
export default function DailyDashboard() {
  const [now, setNow] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [tasks, setTasks] = useState([]);
  // Gmail, Slack, and Calendar panels fetch their own data live

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const today = todayKey();

    const savedNotes = localStorage.getItem('dashboard-notes');
    const notesDate = localStorage.getItem('dashboard-notes-date');
    if (savedNotes && notesDate === today) setNotes(savedNotes);

    const savedTasks = localStorage.getItem('dashboard-tasks');
    const tasksDate = localStorage.getItem('dashboard-tasks-date');
    if (savedTasks) {
      const parsed = JSON.parse(savedTasks);
      if (tasksDate !== today) {
        const carried = parsed.filter(t => !t.done).map(t => ({ ...t, carriedOver: true }));
        setTasks(carried);
        localStorage.setItem('dashboard-tasks-date', today);
        localStorage.setItem('dashboard-tasks', JSON.stringify(carried));
      } else {
        setTasks(parsed);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dashboard-notes', notes);
    localStorage.setItem('dashboard-notes-date', todayKey());
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('dashboard-tasks', JSON.stringify(tasks));
    if (!localStorage.getItem('dashboard-tasks-date')) {
      localStorage.setItem('dashboard-tasks-date', todayKey());
    }
  }, [tasks]);

  const handleGenerateTasks = useCallback(async () => {
    if (!notes.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      if (data.tasks) {
        const newTasks = data.tasks.map(t => ({
          id: Date.now() + Math.random(),
          text: t.text,
          priority: t.priority || 'medium',
          done: false,
          carriedOver: false,
        }));
        setTasks(prev => [...prev, ...newTasks]);
      } else {
        alert(data.error || 'Failed to generate tasks.');
      }
    } catch {
      alert('Failed to generate tasks. Please try again.');
    } finally {
      setGenerating(false);
    }
  }, [notes]);

  const addTask = (text, priority) => setTasks(prev => [...prev, { id: Date.now(), text, priority, done: false, carriedOver: false }]);
  const toggleTask = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTask = (id) => setTasks(prev => prev.filter(t => t.id !== id));

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ backgroundColor: '#F6F2EC' }}>
      <div className="max-w-7xl mx-auto">

        {/* Header with Savvy branding */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-sm text-[#A3A3A3] font-medium tracking-wide">{formatDate(now)}</p>
            <h1 className="text-5xl font-bold text-[#3F434A] tracking-tight mt-1">{formatTime(now)}</h1>
          </div>
          <div className="flex items-center gap-3">
            <SavvySubmark size={32} color="#3F434A" />
            <span
              className="text-3xl font-bold tracking-tight text-[#3F434A]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Savvy
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <NotepadPanel
            notes={notes}
            onChange={setNotes}
            onGenerateTasks={handleGenerateTasks}
            generating={generating}
          />
          <TasksPanel
            tasks={tasks}
            onAddTask={addTask}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
          />
          <div className="space-y-4">
            <CalendarPanel />
            <GmailPanel onCreateTask={addTask} />
            <SlackPanel onCreateTask={addTask} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NewsPanel />
          <MarketPanel />
        </div>
      </div>
    </div>
  );
}
