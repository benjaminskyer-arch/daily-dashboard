'use client';

import { useState, useEffect } from 'react';

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Events ──────────────────────────────────────────────────────────────────

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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Today's Events</h2>
        <button
          onClick={() => setAdding(!adding)}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          + Add
        </button>
      </div>

      {adding && (
        <div className="mb-4 p-3 bg-gray-50 rounded-xl space-y-2">
          <input
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="Event title"
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            autoFocus
          />
          <input
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            type="time"
            value={newEvent.time}
            onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 bg-indigo-600 text-white text-sm rounded-lg py-1.5 hover:bg-indigo-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setAdding(false)}
              className="flex-1 bg-gray-200 text-gray-700 text-sm rounded-lg py-1.5 hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No events today</p>
      ) : (
        <ul className="space-y-1">
          {sorted.map((event) => (
            <li
              key={event.id}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 group"
            >
              <div className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{event.title}</p>
                {event.time && (
                  <p className="text-xs text-gray-400">{event.time}</p>
                )}
              </div>
              <button
                onClick={() => onDeleteEvent(event.id)}
                className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── News ─────────────────────────────────────────────────────────────────────

function NewsPanel() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchNews() {
      try {
        const url =
          'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Ffeeds.bbci.co.uk%2Fnews%2Frss.xml&count=7';
        const res = await fetch(url);
        const data = await res.json();
        if (data.status === 'ok') {
          setArticles(data.items);
        } else {
          setError('Could not load headlines');
        }
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
          {[80, 65, 75, 60, 70, 55, 68].map((w, i) => (
            <div
              key={i}
              className="h-4 bg-gray-100 rounded-full animate-pulse"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-gray-400 text-center py-8">{error}</p>
      )}

      {!loading && !error && (
        <ul className="space-y-0">
          {articles.map((article, i) => (
            <li key={i}>
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group block py-3"
              >
                <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-600 transition-colors leading-snug">
                  {article.title}
                </p>
                {article.pubDate && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(article.pubDate).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </a>
              {i < articles.length - 1 && (
                <div className="h-px bg-gray-50" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

function TasksPanel({ tasks, onAddTask, onToggleTask, onDeleteTask }) {
  const [input, setInput] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onAddTask(input.trim());
    setInput('');
  };

  const remaining = tasks.filter((t) => !t.done).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
        {tasks.length > 0 && (
          <span className="text-xs text-gray-400">{remaining} remaining</span>
        )}
      </div>

      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <input
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="Add a task..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Add
        </button>
      </form>

      {tasks.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No tasks yet</p>
      ) : (
        <ul className="space-y-1">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 group"
            >
              <button
                onClick={() => onToggleTask(task.id)}
                className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  task.done
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-indigo-400'
                }`}
              >
                {task.done && <span className="text-xs leading-none">✓</span>}
              </button>
              <span
                className={`flex-1 text-sm ${
                  task.done ? 'line-through text-gray-400' : 'text-gray-700'
                }`}
              >
                {task.text}
              </span>
              <button
                onClick={() => onDeleteTask(task.id)}
                className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function DailyDashboard() {
  const [now, setNow] = useState(new Date());
  const [events, setEvents] = useState([
    { id: 1, title: 'Morning standup', time: '09:00' },
    { id: 2, title: 'Lunch', time: '12:30' },
  ]);
  const [tasks, setTasks] = useState([]);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Persist events
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-events');
    if (saved) setEvents(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem('dashboard-events', JSON.stringify(events));
  }, [events]);

  // Persist tasks
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-tasks');
    if (saved) setTasks(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem('dashboard-tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addEvent = (event) => setEvents((prev) => [...prev, event]);
  const deleteEvent = (id) => setEvents((prev) => prev.filter((e) => e.id !== id));

  const addTask = (text) =>
    setTasks((prev) => [...prev, { id: Date.now(), text, done: false }]);
  const toggleTask = (id) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  const deleteTask = (id) => setTasks((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      {/* Header */}
      <div className="mb-8 max-w-6xl mx-auto">
        <p className="text-sm text-gray-400 font-medium tracking-wide">
          {formatDate(now)}
        </p>
        <h1 className="text-5xl font-bold text-gray-900 tracking-tight mt-1">
          {formatTime(now)}
        </h1>
      </div>

      {/* Panels */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <EventsPanel
          events={events}
          onAddEvent={addEvent}
          onDeleteEvent={deleteEvent}
        />
        <NewsPanel />
        <TasksPanel
          tasks={tasks}
          onAddTask={addTask}
          onToggleTask={toggleTask}
          onDeleteTask={deleteTask}
        />
      </div>
    </div>
  );
}
