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

// ── Notepad ────────────────────────────────────────────────────────────────
function NotepadPanel({ notes, onChange, onGenerateTasks, generating }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col" style={{ minHeight: '420px' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Notepad</h2>
        <span className="text-xs text-gray-400">{notes.length} chars</span>
      </div>
      <textarea
        className="flex-1 w-full text-sm text-gray-700 resize-none focus:outline-none placeholder-gray-300 leading-relaxed"
        placeholder="Jot down thoughts, meeting notes, ideas throughout the day. Hit 'Generate Tasks' when ready to turn them into action items."
        value={notes}
        onChange={(e) => onChange(e.target.value)}
        rows={14}
      />
      <button
        onClick={onGenerateTasks}
        disabled={!notes.trim() || generating}
        className="mt-4 w-full bg-indigo-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
  high: 'border-red-200 bg-red-50 text-red-600',
  medium: 'border-amber-200 bg-amber-50 text-amber-600',
  low: 'border-green-200 bg-green-50 text-green-600',
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
    { label: 'High', key: 'high', color: 'text-red-500' },
    { label: 'Medium', key: 'medium', color: 'text-amber-500' },
    { label: 'Low', key: 'low', color: 'text-green-500' },
  ];

  const remaining = tasks.filter(t => !t.done).length;

  const renderTask = (task) => (
    <li key={task.id} className="flex items-start gap-2 p-2 rounded-xl hover:bg-gray-50 group">
      <button
        onClick={() => onToggleTask(task.id)}
        className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          task.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-indigo-400'
        }`}
      >
        {task.done && <span className="text-[8px] leading-none">✓</span>}
      </button>
      <span className={`flex-1 text-xs leading-relaxed ${task.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
        {task.carriedOver && <span className="mr-1">🔁</span>}{task.text}
      </span>
      <button
        onClick={() => onDeleteTask(task.id)}
        className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs flex-shrink-0"
      >✕</button>
    </li>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col" style={{ minHeight: '420px' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
        {tasks.length > 0 && <span className="text-xs text-gray-400">{remaining} remaining</span>}
      </div>
      <form onSubmit={handleAdd} className="mb-4 space-y-2">
        <input
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
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
                priority === p ? PRIORITY_STYLES[p] : 'border-gray-200 text-gray-400 hover:border-gray-300'
              }`}
            >{p}</button>
          ))}
          <button type="submit" className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-lg hover:bg-indigo-700 transition-colors">Add</button>
        </div>
      </form>
      {tasks.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No tasks yet — jot notes and hit Generate, or add manually above</p>
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
function EventsPanel({ events, onAddEvent, onDeleteEvent }) {
  const [newEvent, setNewEvent] = useState({ title: '', time: '' });
  const [adding, setAdding] = useState(false);

  const handleAdd = () => {
    if (!newEvent.title.trim()) return;
    onAddEvent({ ...newEvent, id: Date.now() });
    setNewEvent({ title: '', time: '' });
    setAdding(false);
  };

  const sorted = [...events].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-900">Calendar</h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400">Google Cal coming soon</span>
          <button onClick={() => setAdding(!adding)} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">+ Add</button>
        </div>
      </div>
      {adding && (
        <div className="mb-3 p-3 bg-gray-50 rounded-xl space-y-2">
          <input
            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="Event title"
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            autoFocus
          />
          <input
            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            type="time"
            value={newEvent.time}
            onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex-1 bg-indigo-600 text-white text-xs rounded-lg py-1.5 hover:bg-indigo-700 transition-colors">Save</button>
            <button onClick={() => setAdding(false)} className="flex-1 bg-gray-200 text-gray-700 text-xs rounded-lg py-1.5 hover:bg-gray-300 transition-colors">Cancel</button>
          </div>
        </div>
      )}
      {sorted.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">No events today</p>
      ) : (
        <ul className="space-y-1 max-h-44 overflow-y-auto">
          {sorted.map((event) => (
            <li key={event.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-50 group">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{event.title}</p>
                {event.time && <p className="text-[10px] text-gray-400">{event.time}</p>}
              </div>
              <button onClick={() => onDeleteEvent(event.id)} className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs">✕</button>
            </li>
          ))}
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
        setLastSynced(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'America/New_York' }));
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900">Gmail</h2>
          {emails.length > 0 && (
            <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{emails.length}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastSynced && !syncing && <span className="text-[9px] text-gray-300">synced {lastSynced}</span>}
          <button
            onClick={() => fetchEmails(true)}
            disabled={syncing || notConfigured}
            className="text-[10px] text-red-500 hover:text-red-600 font-medium flex items-center gap-1 disabled:opacity-40"
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
          {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      )}

      {notConfigured && (
        <div className="py-3 text-center space-y-2">
          <p className="text-xs text-gray-500">Connect your Gmail to see unread emails here.</p>
          <a
            href="/api/auth/google"
            className="inline-block bg-red-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
          >
            Connect Gmail
          </a>
        </div>
      )}

      {error && <p className="text-xs text-gray-400 text-center py-3">{error}</p>}

      {!loading && !error && !notConfigured && emails.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-3">Inbox zero — you&apos;re all caught up</p>
      )}

      {!loading && !error && emails.length > 0 && (
        <ul className="space-y-1 max-h-56 overflow-y-auto">
          {emails.map((email) => (
            <li key={email.id} className="p-2 rounded-lg hover:bg-gray-50 group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-900 truncate">{email.from}</span>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{email.time}</span>
                  </div>
                  <p className="text-xs text-gray-700 font-medium truncate mt-0.5">{email.subject}</p>
                  {email.snippet && (
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">{email.snippet}</p>
                  )}
                </div>
                <button
                  onClick={() => handleCreateTask(email)}
                  title="Create task to reply"
                  className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-200 px-1.5 py-0.5 rounded-md hover:bg-indigo-100 font-medium flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
      setLastSynced(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'America/New_York' }));
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900">Slack</h2>
          {messages.length > 0 && (
            <span className="bg-purple-100 text-purple-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {messages.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastSynced && !syncing && <span className="text-[9px] text-gray-300">synced {lastSynced}</span>}
          <button
            onClick={() => fetchSlack(true)}
            disabled={syncing}
            className="text-[10px] text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 disabled:opacity-50"
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
            <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {error && <p className="text-xs text-gray-400 text-center py-3">{error}</p>}

      {!loading && !error && messages.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-3">All caught up — no unreplied messages</p>
      )}

      {!loading && !error && messages.length > 0 && (
        <ul className="space-y-1 max-h-56 overflow-y-auto">
          {messages.map((msg) => (
            <li key={msg.id} className="p-2 rounded-lg hover:bg-gray-50 group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-900">{msg.from}</span>
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                      msg.type === 'dm'
                        ? 'bg-purple-50 text-purple-600 border border-purple-200'
                        : 'bg-blue-50 text-blue-600 border border-blue-200'
                    }`}>
                      {msg.type === 'dm' ? 'DM' : msg.channel}
                    </span>
                    <span className="text-[10px] text-gray-400">{msg.time}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed line-clamp-2">{msg.text}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCreateTask(msg)}
                    title="Create task to reply"
                    className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-200 px-1.5 py-0.5 rounded-md hover:bg-indigo-100 font-medium"
                  >
                    + Task
                  </button>
                  {msg.permalink && (
                    <a
                      href={msg.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open in Slack"
                      className="text-[9px] bg-gray-50 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded-md hover:bg-gray-100 font-medium"
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
  'Market impact': 'bg-green-50 text-green-700 border-green-200',
  'Policy': 'bg-blue-50 text-blue-700 border-blue-200',
  'Economy': 'bg-amber-50 text-amber-700 border-amber-200',
  'Tech': 'bg-purple-50 text-purple-700 border-purple-200',
  'Geopolitics': 'bg-red-50 text-red-700 border-red-200',
  'Energy': 'bg-orange-50 text-orange-700 border-orange-200',
  'Transit': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Housing': 'bg-rose-50 text-rose-700 border-rose-200',
  'Safety': 'bg-red-50 text-red-700 border-red-200',
  'Culture': 'bg-pink-50 text-pink-700 border-pink-200',
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
            className="text-sm font-medium text-gray-800 hover:text-indigo-600 transition-colors leading-snug block"
          >
            {article.title}
          </a>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] text-gray-400 font-medium">{article.source}</span>
            {article.tags?.map((tag, i) => (
              <span
                key={i}
                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${TAG_STYLES[tag] || 'bg-gray-50 text-gray-600 border-gray-200'}`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        {article.analysis && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium flex-shrink-0 mt-0.5"
          >
            {expanded ? 'Less' : 'Why it matters'}
          </button>
        )}
      </div>
      {expanded && article.analysis && (
        <div className="mt-2 bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600 leading-relaxed">{article.analysis}</p>
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-indigo-500 hover:text-indigo-700 mt-1.5 inline-block font-medium"
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">📰 Headlines for Dummies</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">Top stories with context — click &ldquo;Why it matters&rdquo; to dig deeper</p>
        </div>
        <span className="text-xs text-gray-400">Powered by Claude</span>
      </div>

      {loading && (
        <div className="space-y-3">
          {[85, 70, 90, 65, 80, 75, 60, 70].map((w, i) => (
            <div key={i} className="h-3.5 bg-gray-100 rounded-full animate-pulse" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}

      {error && <p className="text-sm text-gray-400 text-center py-8">{error}</p>}

      {data && (
        <div className="space-y-6 max-h-[520px] overflow-y-auto pr-1">
          {/* National */}
          {data.national && data.national.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                🇺🇸 National
              </p>
              <ul className="divide-y divide-gray-50">
                {data.national.slice(0, 5).map((article, i) => (
                  <NewsArticle key={i} article={article} />
                ))}
              </ul>
            </div>
          )}

          {/* NYC */}
          {data.nyc && data.nyc.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                🗽 New York City
              </p>
              <ul className="divide-y divide-gray-50">
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">📈 Stock Market for Dummies</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">Your daily ELI5 market briefing</p>
        </div>
        <span className="text-xs text-gray-400">Powered by Claude</span>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          <div className="space-y-2">
            {[90, 80, 70].map((w, i) => (
              <div key={i} className="h-3.5 bg-gray-100 rounded-full animate-pulse" style={{ width: `${w}%` }} />
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-gray-400 text-center py-8">{error}</p>}

      {data && (
        <div className="space-y-5">
          {/* Market numbers */}
          <div className="space-y-2">
            {data.marketData?.map((index) => (
              <div key={index.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{index.name}</p>
                  <p className="text-xs text-gray-500">
                    {index.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className={`text-right ${index.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
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

          {/* ELI5 Briefing */}
          {data.briefing && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">💡 What this means for you</p>
              <p className="text-sm text-gray-700 leading-relaxed">{data.briefing}</p>
            </div>
          )}

          {/* Dinner Party Tip */}
          {data.dinnerPartyTip && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">🍷 Sound smart at dinner</p>
              <p className="text-sm text-gray-700 italic leading-relaxed">&ldquo;{data.dinnerPartyTip}&rdquo;</p>
            </div>
          )}

          {/* Vocabulary toggle */}
          {data.vocabulary && data.vocabulary.length > 0 && (
            <div>
              <button
                onClick={() => setShowVocab(!showVocab)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>📚 Vocab of the day ({data.vocabulary.length} terms)</span>
                <span className="text-[10px]">{showVocab ? '▲' : '▼'}</span>
              </button>
              {showVocab && (
                <div className="mt-3 space-y-3">
                  {data.vocabulary.map((v, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs font-bold text-gray-900">{v.term}</p>
                      <p className="text-xs text-gray-600 mt-1">{v.definition}</p>
                      {v.analogy && (
                        <p className="text-xs text-indigo-500 mt-1 italic">{v.analogy}</p>
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
  const [events, setEvents] = useState([
    { id: 1, title: 'Morning standup', time: '09:00' },
    { id: 2, title: 'Lunch', time: '12:30' },
  ]);
  // Gmail and Slack panels fetch their own data live

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

    const savedEvents = localStorage.getItem('dashboard-events');
    if (savedEvents) setEvents(JSON.parse(savedEvents));

    // Gmail and Slack fetch live data via API
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

  useEffect(() => { localStorage.setItem('dashboard-events', JSON.stringify(events)); }, [events]);

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

  const addEvent = (event) => setEvents(prev => [...prev, event]);
  const deleteEvent = (id) => setEvents(prev => prev.filter(e => e.id !== id));

  // Gmail and Slack are self-contained panels

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <p className="text-sm text-gray-400 font-medium tracking-wide">{formatDate(now)}</p>
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight mt-1">{formatTime(now)}</h1>
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
            <EventsPanel events={events} onAddEvent={addEvent} onDeleteEvent={deleteEvent} />
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
