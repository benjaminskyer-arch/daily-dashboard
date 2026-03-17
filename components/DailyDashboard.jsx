'use client';
import { useState, useEffect, useCallback } from 'react';

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}
function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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
        <div className="overflow-y-auto flex-1 space-y-4">
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
        <ul className="space-y-1">
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

// ── Inbox ──────────────────────────────────────────────────────────────────
function InboxPanel({ items, onAddItem, onToggleItem, onDeleteItem }) {
  const [input, setInput] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onAddItem(input.trim());
    setInput('');
  };

  const unread = items.filter(i => !i.done).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900">Inbox</h2>
          {unread > 0 && <span className="bg-indigo-100 text-indigo-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unread}</span>}
        </div>
        <span className="text-[10px] text-gray-400">Gmail coming soon</span>
      </div>
      <form onSubmit={handleAdd} className="mb-3 flex gap-2">
        <input
          className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="Add email to follow up..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="bg-indigo-600 text-white text-xs px-2.5 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors">Add</button>
      </form>
      {items.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-2">No inbox items</p>
      ) : (
        <ul className="space-y-0.5">
          {items.map(item => (
            <li key={item.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 group">
              <button
                onClick={() => onToggleItem(item.id)}
                className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  item.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                }`}
              >
                {item.done && <span className="text-[7px]">✓</span>}
              </button>
              <span className={`flex-1 text-xs ${item.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item.text}</span>
              <button onClick={() => onDeleteItem(item.id)} className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 text-xs">✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Slack ──────────────────────────────────────────────────────────────────
function SlackPanel({ items, onAddItem, onToggleItem, onDeleteItem }) {
  const [input, setInput] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onAddItem(input.trim());
    setInput('');
  };

  const unread = items.filter(i => !i.done).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900">Slack</h2>
          {unread > 0 && <span className="bg-purple-100 text-purple-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unread}</span>}
        </div>
        <span className="text-[10px] text-gray-400">Slack API coming soon</span>
      </div>
      <form onSubmit={handleAdd} className="mb-3 flex gap-2">
        <input
          className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="Add Slack item to follow up..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="bg-purple-600 text-white text-xs px-2.5 py-1.5 rounded-lg hover:bg-purple-700 transition-colors">Add</button>
      </form>
      {items.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-2">No Slack items</p>
      ) : (
        <ul className="space-y-0.5">
          {items.map(item => (
            <li key={item.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 group">
              <button
                onClick={() => onToggleItem(item.id)}
                className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  item.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                }`}
              >
                {item.done && <span className="text-[7px]">✓</span>}
              </button>
              <span className={`flex-1 text-xs ${item.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item.text}</span>
              <button onClick={() => onDeleteItem(item.id)} className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 text-xs">✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── News ───────────────────────────────────────────────────────────────────
function NewsPanel() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch(
          'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Ffeeds.bbci.co.uk%2Fnews%2Frss.xml&count=8'
        );
        const data = await res.json();
        if (data.status === 'ok') setArticles(data.items);
        else setError('Could not load headlines');
      } catch {
        setError('Could not load headlines');
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Headlines</h2>
      {loading && (
        <div className="space-y-3">
          {[80, 65, 75, 60, 70, 55, 68, 72].map((w, i) => (
            <div key={i} className="h-3.5 bg-gray-100 rounded-full animate-pulse" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}
      {error && <p className="text-sm text-gray-400 text-center py-8">{error}</p>}
      {!loading && !error && (
        <ul>
          {articles.map((article, i) => (
            <li key={i}>
              <a href={article.link} target="_blank" rel="noopener noreferrer" className="group block py-2.5">
                <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-600 transition-colors leading-snug">{article.title}</p>
                {article.pubDate && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(article.pubDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </a>
              {i < articles.length - 1 && <div className="h-px bg-gray-50" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Markets ────────────────────────────────────────────────────────────────
function MarketPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMarket() {
      try {
        const res = await fetch('/api/market');
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        setData(json);
      } catch {
        setError('Could not load market data');
      } finally {
        setLoading(false);
      }
    }
    fetchMarket();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">US Markets</h2>
        <span className="text-xs text-gray-400">Last 24h</span>
      </div>
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}
      {error && <p className="text-sm text-gray-400 text-center py-8">{error}</p>}
      {data && (
        <div className="space-y-3">
          {data.map((index) => (
            <div key={index.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-gray-900">{index.name}</p>
                <p className="text-xs text-gray-500">
                  {index.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className={`text-right ${index.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                <p className="text-sm font-bold">
                  {index.change >= 0 ? '+' : ''}{index.changePercent?.toFixed(2)}%
                </p>
                <p className="text-xs">
                  {index.change >= 0 ? '+' : ''}{index.change?.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
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
  const [inboxItems, setInboxItems] = useState([]);
  const [slackItems, setSlackItems] = useState([]);

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

    const savedInbox = localStorage.getItem('dashboard-inbox');
    if (savedInbox) setInboxItems(JSON.parse(savedInbox));

    const savedSlack = localStorage.getItem('dashboard-slack');
    if (savedSlack) setSlackItems(JSON.parse(savedSlack));
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
  useEffect(() => { localStorage.setItem('dashboard-inbox', JSON.stringify(inboxItems)); }, [inboxItems]);
  useEffect(() => { localStorage.setItem('dashboard-slack', JSON.stringify(slackItems)); }, [slackItems]);

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

  const addInboxItem = (text) => setInboxItems(prev => [...prev, { id: Date.now(), text, done: false }]);
  const toggleInboxItem = (id) => setInboxItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));
  const deleteInboxItem = (id) => setInboxItems(prev => prev.filter(i => i.id !== id));

  const addSlackItem = (text) => setSlackItems(prev => [...prev, { id: Date.now(), text, done: false }]);
  const toggleSlackItem = (id) => setSlackItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));
  const deleteSlackItem = (id) => setSlackItems(prev => prev.filter(i => i.id !== id));

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
            <InboxPanel items={inboxItems} onAddItem={addInboxItem} onToggleItem={toggleInboxItem} onDeleteItem={deleteInboxItem} />
            <SlackPanel items={slackItems} onAddItem={addSlackItem} onToggleItem={toggleSlackItem} onDeleteItem={deleteSlackItem} />
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
