import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Plus, X, MoreHorizontal, Trash2, Calendar as CalendarIcon,
  BookOpen, Beaker, PenTool, GraduationCap,
  Clock, Flame, BrainCircuit, Library,
  Settings, Palette, Pencil, CheckCircle2, Sparkles, LayoutGrid,
  StickyNote, Upload, Search, ChevronLeft, ChevronRight, FileText, File, Download, ExternalLink, Bot, Zap, Loader2, AlertTriangle, Eye, RefreshCw, Save, Timer, Play, Pause, RotateCcw, Orbit, Info, Bell, PlusCircle, Rocket, Map, Navigation, Terminal, SquareTerminal, ArrowRight, Activity, Kanban, ArrowLeft
} from 'lucide-react';

// --- CONSTANTS & CONFIG ---
const API_KEY = ""; // Injected at runtime

// --- UTILITY FUNCTIONS ---
const formatTime = (seconds) => {
  const safeSeconds = Number(seconds) || 0;
  return `${Math.floor(safeSeconds / 60)}:${(safeSeconds % 60).toString().padStart(2, '0')}`;
};

const formatDisplayTime = (time) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
};

const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatRelativeDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  const diffTime = date - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: `Overdue ${Math.abs(diffDays)}d`, color: 'text-red-500', urgent: true };
  if (diffDays === 0) return { text: 'Today', color: 'text-amber-500', urgent: true };
  if (diffDays === 1) return { text: 'Tomorrow', color: 'text-amber-500', urgent: true };
  if (diffDays < 7) return { text: date.toLocaleDateString('en-US', { weekday: 'short' }), color: 'opacity-70', urgent: false };
  return { text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), color: 'opacity-50', urgent: false };
};

const dataURItoBlob = (dataURI) => {
  try {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    return new Blob([ab], { type: mimeString });
  } catch (e) {
    console.error("Error converting Data URI", e);
    return null;
  }
};

// --- CUSTOM HOOKS ---
function useStickyState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn(`Error reading ${key} from localStorage`, e);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Error saving ${key} to localStorage`, e);
    }
  }, [key, value]);

  return [value, setValue];
}

// --- DATA CONSTANTS ---
const THEMES = {
  light: { id: 'light', label: 'Classic', type: 'light', bg: 'bg-[#F2F0E9]', text: 'text-stone-800', subtext: 'text-stone-500', headerBg: 'bg-white/80', headerBorder: 'border-stone-200/60', cardBg: 'bg-white', cardBorder: 'border-stone-200', columnTitle: 'text-stone-700', accent: 'indigo', accentColor: '#6366f1', gridColor: '#d6d3d1' },
  dark: { id: 'dark', label: 'Midnight', type: 'dark', bg: 'bg-[#0f172a]', text: 'text-slate-100', subtext: 'text-slate-400', headerBg: 'bg-[#1e293b]/80', headerBorder: 'border-slate-700/50', cardBg: 'bg-[#1e293b]', cardBorder: 'border-slate-700', columnTitle: 'text-slate-300', accent: 'indigo', accentColor: '#6366f1', gridColor: '#334155' },
  espresso: { id: 'espresso', label: 'Espresso', type: 'dark', bg: 'bg-[#1c1917]', text: 'text-[#e7e5e4]', subtext: 'text-[#a8a29e]', headerBg: 'bg-[#292524]/80', headerBorder: 'border-[#44403c]', cardBg: 'bg-[#292524]', cardBorder: 'border-[#44403c]', columnTitle: 'text-[#d6d3d1]', accent: 'orange', accentColor: '#f97316', gridColor: '#44403c' },
  nightowl: { id: 'nightowl', label: 'Night Owl', type: 'dark', bg: 'bg-[#011627]', text: 'text-[#d6deeb]', subtext: 'text-[#7fdbca]', headerBg: 'bg-[#011627]/80', headerBorder: 'border-[#5f7e97]/30', cardBg: 'bg-[#0b2942]', cardBorder: 'border-[#5f7e97]/30', columnTitle: 'text-[#82aaff]', accent: 'cyan', accentColor: '#06b6d4', gridColor: '#1d3b53' },
  forest: { id: 'forest', label: 'Forest', type: 'dark', bg: 'bg-[#052e16]', text: 'text-[#e2e8f0]', subtext: 'text-[#6ee7b7]', headerBg: 'bg-[#064e3b]/70', headerBorder: 'border-[#065f46]', cardBg: 'bg-[#064e3b]', cardBorder: 'border-[#065f46]', columnTitle: 'text-[#34d399]', accent: 'emerald', accentColor: '#10b981', gridColor: '#065f46' },
  sakura: { id: 'sakura', label: 'Sakura', type: 'light', bg: 'bg-[#fff0f5]', text: 'text-rose-900', subtext: 'text-rose-400', headerBg: 'bg-[#fff5f7]/80', headerBorder: 'border-rose-200', cardBg: 'bg-white', cardBorder: 'border-rose-100', columnTitle: 'text-rose-700', accent: 'rose', accentColor: '#f43f5e', gridColor: '#fecdd3' },
  nordic: { id: 'nordic', label: 'Nordic', type: 'light', bg: 'bg-[#f1f5f9]', text: 'text-slate-700', subtext: 'text-slate-400', headerBg: 'bg-white/80', headerBorder: 'border-slate-200', cardBg: 'bg-white', cardBorder: 'border-slate-200', columnTitle: 'text-slate-600', accent: 'sky', accentColor: '#0ea5e9', gridColor: '#cbd5e1' },
  cyberpunk: { id: 'cyberpunk', label: 'Cyberpunk', type: 'dark', bg: 'bg-black', text: 'text-yellow-400', subtext: 'text-cyan-400', headerBg: 'bg-black/90', headerBorder: 'border-yellow-400/30', cardBg: 'bg-[#111]', cardBorder: 'border-yellow-400/50', columnTitle: 'text-cyan-400', accent: 'yellow', accentColor: '#eab308', gridColor: '#333' },
  dracula: { id: 'dracula', label: 'Dracula', type: 'dark', bg: 'bg-[#282a36]', text: 'text-[#f8f8f2]', subtext: 'text-[#bd93f9]', headerBg: 'bg-[#282a36]/90', headerBorder: 'border-[#6272a4]', cardBg: 'bg-[#44475a]', cardBorder: 'border-[#6272a4]', columnTitle: 'text-[#ff79c6]', accent: 'purple', accentColor: '#a855f7', gridColor: '#44475a' },
  sunset: { id: 'sunset', label: 'Sunset', type: 'dark', bg: 'bg-[#2d1b2e]', text: 'text-[#fce4ec]', subtext: 'text-[#ffcc80]', headerBg: 'bg-[#2d1b2e]/90', headerBorder: 'border-[#e65100]/30', cardBg: 'bg-[#4a2c4a]', cardBorder: 'border-[#b0003a]/40', columnTitle: 'text-[#ffab40]', accent: 'orange', accentColor: '#f97316', gridColor: '#b0003a' },
};

const DEFAULT_COURSES = {
  'BACSE104': { name: 'Core CS I', baseColor: 'indigo' },
  'BACSE105': { name: 'Core CS II', baseColor: 'blue' },
  'BACSE106': { name: 'CS Lab', baseColor: 'cyan' },
  'BAENG101': { name: 'English', baseColor: 'rose' },
  'BAMAT205': { name: 'Mathematics', baseColor: 'emerald' },
  'BAPHY105': { name: 'Physics', baseColor: 'amber' }
};

const TASK_TYPES = { 'Task': { icon: CheckCircle2 }, 'Assignment': { icon: PenTool }, 'Exam': { icon: Flame }, 'Reading': { icon: BookOpen }, 'Lab': { icon: Beaker }, 'Other': { icon: CircleIcon } };
const COLORS = ['indigo', 'emerald', 'amber', 'rose', 'blue', 'cyan', 'slate', 'violet', 'fuchsia', 'lime', 'yellow', 'purple', 'sky', 'pink'];

function CircleIcon({ size, className }) { return <div className={`rounded-full border-2 border-current ${className}`} style={{ width: size, height: size }} />; }

const getColorClass = (color, type) => {
  const map = {
    indigo: { badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', badgeDark: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20', solid: 'bg-indigo-600 border-indigo-700 text-white', dot: 'bg-indigo-500' },
    blue: { badge: 'bg-blue-50 text-blue-700 border-blue-200', badgeDark: 'bg-blue-500/10 text-blue-300 border-blue-500/20', solid: 'bg-blue-600 border-blue-700 text-white', dot: 'bg-blue-500' },
    cyan: { badge: 'bg-cyan-50 text-cyan-700 border-cyan-200', badgeDark: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20', solid: 'bg-cyan-600 border-cyan-700 text-white', dot: 'bg-cyan-500' },
    emerald: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', badgeDark: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20', solid: 'bg-emerald-600 border-emerald-700 text-white', dot: 'bg-emerald-500' },
    amber: { badge: 'bg-amber-50 text-amber-700 border-amber-200', badgeDark: 'bg-amber-500/10 text-amber-300 border-amber-500/20', solid: 'bg-amber-600 border-amber-700 text-white', dot: 'bg-amber-500' },
    rose: { badge: 'bg-rose-50 text-rose-700 border-rose-200', badgeDark: 'bg-rose-500/10 text-rose-300 border-rose-500/20', solid: 'bg-rose-600 border-rose-700 text-white', dot: 'bg-rose-500' },
    slate: { badge: 'bg-slate-50 text-slate-700 border-slate-200', badgeDark: 'bg-slate-500/10 text-slate-300 border-slate-500/20', solid: 'bg-slate-600 border-slate-700 text-white', dot: 'bg-slate-500' },
    violet: { badge: 'bg-violet-50 text-violet-700 border-violet-200', badgeDark: 'bg-violet-500/10 text-violet-300 border-violet-500/20', solid: 'bg-violet-600 border-violet-700 text-white', dot: 'bg-violet-500' },
    fuchsia: { badge: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200', badgeDark: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20', solid: 'bg-fuchsia-600 border-fuchsia-700 text-white', dot: 'bg-fuchsia-500' },
    lime: { badge: 'bg-lime-50 text-lime-700 border-lime-200', badgeDark: 'bg-lime-500/10 text-lime-300 border-lime-500/20', solid: 'bg-lime-600 border-lime-700 text-white', dot: 'bg-lime-500' },
    yellow: { badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', badgeDark: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20', solid: 'bg-yellow-600 border-yellow-700 text-white', dot: 'bg-yellow-500' },
    purple: { badge: 'bg-purple-50 text-purple-700 border-purple-200', badgeDark: 'bg-purple-500/10 text-purple-300 border-purple-500/20', solid: 'bg-purple-600 border-purple-700 text-white', dot: 'bg-purple-500' },
    sky: { badge: 'bg-sky-50 text-sky-700 border-sky-200', badgeDark: 'bg-sky-500/10 text-sky-300 border-sky-500/20', solid: 'bg-sky-600 border-sky-700 text-white', dot: 'bg-sky-500' },
    pink: { badge: 'bg-pink-50 text-pink-700 border-pink-200', badgeDark: 'bg-pink-500/10 text-pink-300 border-pink-500/20', solid: 'bg-pink-600 border-pink-700 text-white', dot: 'bg-pink-500' },
  };
  const c = map[color] || map['indigo'];
  if (type === 'solid') return c.solid;
  if (type === 'dot') return c.dot;
  return type === 'dark' ? c.badgeDark : c.badge;
};

// FIXED: Use baseColor instead of color to prevent ReferenceError
const getCourseStyle = (baseColor, isDarkMode) => {
  const baseClasses = getColorClass(baseColor, isDarkMode ? 'dark' : 'light');
  return `${baseClasses} border shadow-sm`;
};

// --- SUB-COMPONENTS ---

const SimpleMarkdown = React.memo(({ content, theme }) => {
  if (!content) return <div className="opacity-50 italic">No content.</div>;
  const lines = content.split('\n');
  const parseInline = (text) => text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold opacity-100">$1</strong>').replace(/\*(.*?)\*/g, '<em class="opacity-80">$1</em>').replace(/`(.*?)`/g, '<code class="bg-black/10 px-1.5 py-0.5 rounded font-mono text-sm border border-black/5">$1</code>');

  return (
    <div className="text-base leading-relaxed text-opacity-90 font-sans">
      {lines.map((line, i) => {
        if (line.startsWith('# ')) return <h2 key={i} className="text-2xl font-bold mt-8 mb-4 border-b pb-2 opacity-90">{line.replace('# ', '')}</h2>;
        if (line.startsWith('## ')) return <h3 key={i} className="text-lg font-bold mt-6 mb-3 uppercase tracking-wide" style={{ color: theme.accentColor }}>{line.replace('## ', '')}</h3>;
        if (line.trim().startsWith('- ')) return <div key={i} className="flex gap-3 ml-1 mb-3"><span className="font-bold mt-1.5 shrink-0" style={{ color: theme.accentColor }}>•</span><span className="leading-7" dangerouslySetInnerHTML={{ __html: parseInline(line.replace('- ', '')) }} /></div>;
        if (line.startsWith('> ')) return <blockquote key={i} className="border-l-4 pl-6 py-3 my-6 italic opacity-80 bg-black/5 rounded-r-lg" style={{ borderColor: theme.accentColor }}>{line.replace('> ', '')}</blockquote>;
        if (!line.trim()) return <div key={i} className="h-4"></div>;
        return <p key={i} className="mb-4 leading-7" dangerouslySetInnerHTML={{ __html: parseInline(line) }} />;
      })}
    </div>
  );
});

// Typewriter Component
const TypewriterText = React.memo(({ text }) => {
  const [display, setDisplay] = useState('');
  
  useEffect(() => {
    // Safety check for non-string input
    const safeText = typeof text === 'string' ? text : String(text);
    setDisplay('');
    let i = 0;
    const timer = setInterval(() => {
      if (i < safeText.length) {
        setDisplay(safeText.slice(0, i + 1)); 
        i++;
      } else {
        clearInterval(timer);
      }
    }, 10);
    return () => clearInterval(timer);
  }, [text]);

  return <span>{display}</span>;
});

const Toast = React.memo(({ message, type, onClose, theme }) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-bottom-5 fade-in duration-300 ${theme.cardBg} ${theme.cardBorder}`}>
    {type === 'success' && <CheckCircle2 size={18} className="text-emerald-500" />}
    {type === 'error' && <AlertTriangle size={18} className="text-red-500" />}
    {type === 'info' && <Info size={18} style={{ color: theme.accentColor }} />}
    <span className="text-sm font-medium">{typeof message === 'string' ? message : 'Notification'}</span>
    <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100 active:scale-90 transition-transform"><X size={14} /></button>
  </div>
));

const FireworksOverlay = React.memo(({ position }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!position) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize); resize();
    const createParticle = (x, y, color) => ({ x, y, color, radius: Math.random() * 4 + 2, velocity: { x: (Math.random() - 0.5) * 35, y: (Math.random() - 0.5) * 35 - 12 }, alpha: 1, decay: Math.random() * 0.1 + 0.05 });
    const colors = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#3b82f6', '#ffffff'];
    const explode = (x, y) => {
      for (let i = 0; i < 30; i++) particles.push(createParticle(x, y, colors[Math.floor(Math.random() * colors.length)]));
      setTimeout(() => { for (let i = 0; i < 15; i++) particles.push(createParticle(x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 60, colors[Math.floor(Math.random() * colors.length)])); }, 60);
    };
    explode(position.x, position.y);
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, index) => {
        p.velocity.y += 0.25; p.velocity.x *= 0.94; p.velocity.y *= 0.94;
        p.x += p.velocity.x; p.y += p.velocity.y; p.alpha -= p.decay;
        if (p.alpha <= 0) particles.splice(index, 1);
        else { ctx.globalAlpha = p.alpha; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.fill(); }
      });
      if (particles.length > 0) animationId = requestAnimationFrame(animate); else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    animate();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animationId); };
  }, [position]);
  if (!position) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[9999]" />;
});

const TaskCard = React.memo(({ task, isOverlay = false, theme, courses, activeDragId, handlePointerDown, openEditModal, deleteTask, index = 0 }) => {
  const dateInfo = formatRelativeDate(task.dueDate);
  const TypeIcon = TASK_TYPES[task.type]?.icon || CircleIcon;
  const courseInfo = courses[task.course] || { name: 'Unknown', baseColor: 'gray' };
  const courseStyle = getCourseStyle(courseInfo.baseColor, theme.type === 'dark');
  const isDoing = task.columnId === 'doing' && !isOverlay;
  const isCompleted = task.columnId === 'done' && !isOverlay;
  
  // Use explicit ID check for hiding original card
  const isDraggingThis = !isOverlay && activeDragId === task.id;

  return (
    <div
      onPointerDown={!isOverlay ? (e) => handlePointerDown(e, task) : undefined}
      className={`
        relative p-4 rounded-xl border transition-all duration-200 ease-out overflow-hidden group shrink-0
        ${!isOverlay && activeDragId !== task.id ? 'hover:-translate-y-1 hover:shadow-xl hover:scale-[1.01] cursor-grab active:cursor-grabbing' : ''} 
        ${activeDragId === task.id && !isOverlay ? 'opacity-30 scale-100 blur-[0px] pointer-events-none' : 'opacity-100 scale-100'} 
        ${isOverlay ? 'shadow-2xl scale-105 z-50 ring-2 ring-indigo-500/80 ring-offset-2 rotate-2 cursor-grabbing' : ''}
        ${isCompleted ? 'bg-emerald-500/5 border-emerald-500/30' : theme.cardBg}
        ${isDoing ? 'border-2 border-white/80 dark:border-white/20' : (!isCompleted ? theme.cardBorder : '')}
      `}
      style={{ 
        width: isOverlay ? 'var(--drag-width)' : 'auto', 
        height: isOverlay ? 'var(--drag-height)' : 'auto',
      }}
    >
      {isDoing && (
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden z-0">
          <div className="absolute inset-0 animate-slide-arrow bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12 w-1/2 h-full"></div>
           <div className="absolute inset-0 animate-pulse-glow border-2 border-white/50 rounded-xl"></div>
        </div>
      )}
      <div className="flex justify-between items-start mb-3 relative z-10">
        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold tracking-wide shadow-sm ${courseStyle}`}>{task.course}</span>
        {!isOverlay && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
            <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); openEditModal(task); }} className="text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 p-1.5 rounded-lg transition-all active:scale-75"><Pencil size={14} /></button>
            <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 p-1.5 rounded-lg transition-all active:scale-75 hover:animate-shake"><Trash2 size={14} /></button>
          </div>
        )}
      </div>
      <h3 className={`font-semibold text-sm mb-3 leading-snug relative z-10 ${isCompleted ? 'line-through opacity-50 decoration-2 decoration-emerald-500/50' : ''}`}>{String(task.content)}</h3>
      <div className={`flex items-center justify-between text-xs ${theme.subtext} relative z-10`}>
        <div className="flex items-center gap-3 w-full">
          <div className="flex items-center gap-1.5 font-medium px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5"><TypeIcon size={12} /><span>{task.type}</span></div>
          {dateInfo && (
            <div className={`flex items-center gap-1.5 font-bold ml-auto ${dateInfo.color}`}>
              {isCompleted ? <CheckCircle2 size={14} className="text-emerald-500" /> : (
                <>
                  {dateInfo.urgent && <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>}
                  <span>{dateInfo.text}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// --- MAIN APPLICATION ---
export default function Artemis() {
  const [currentThemeId, setCurrentThemeId] = useStickyState('semesteros-theme', 'espresso');
  const theme = THEMES[currentThemeId] || THEMES.light;
  const [courses, setCourses] = useStickyState('semesteros-courses-v2', DEFAULT_COURSES);
  
  // Board & Task State
  const [boards, setBoards] = useStickyState('semesteros-boards', [
    { id: 'b1', name: 'Fall 2025', color: 'indigo', createdAt: new Date().toISOString() }
  ]);
  const [activeBoardId, setActiveBoardId] = useStickyState('semesteros-active-board', 'b1');
  const [tasks, setTasks] = useStickyState('semesteros-tasks-v3', [
    { id: 't1', boardId: 'b1', columnId: 'doing', content: 'Final Algorithm Project', course: 'BACSE104', type: 'Assignment', dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], dueTime: '14:30' },
    { id: 't2', boardId: 'b1', columnId: 'todo', content: 'Read Hamlet Act IV', course: 'BAENG101', type: 'Reading', dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], dueTime: '09:00' },
  ]);

  // Derived State
  const filteredTasks = useMemo(() => tasks.filter(t => (t.boardId || 'b1') === activeBoardId), [tasks, activeBoardId]);
  const activeBoardName = useMemo(() => boards.find(b => b.id === activeBoardId)?.name || 'Board', [boards, activeBoardId]);

  // Global UI State
  const [notes, setNotes] = useStickyState('semesteros-notes', []);
  const [focusMode, setFocusMode] = useStickyState('semesteros-focus', false);
  const [timeLeft, setTimeLeft] = useStickyState('semesteros-timer-left', 25 * 60);
  const [timerDuration, setTimerDuration] = useStickyState('semesteros-timer-duration', 25);
  const [isTimerExpanded, setIsTimerExpanded] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Navigation State
  const [viewMode, setViewMode] = useState('board'); // 'board' or 'space'
  const [boardViewMode, setBoardViewMode] = useState('columns'); // 'columns' or 'calendar'
  const [calendarMode, setCalendarMode] = useState('month'); // 'month' or 'day'
  const [zoomState, setZoomState] = useState('idle'); 
  const [isAddBoardModalOpen, setIsAddBoardModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [newBoardName, setNewBoardName] = useState('');
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalLines, setTerminalLines] = useState([
    "ARTEMIS KERNEL v4.2.0 [Safe Mode]",
    "Type 'help' for available commands.",
    "-------------------------------------"
  ]);
  const [terminalInput, setTerminalInput] = useState("");
  const terminalEndRef = useRef(null);
  const [suggestion, setSuggestion] = useState('');
  
  // Calendar State
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Space Pan/Zoom State
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const lastPanPoint = useRef({ x: 0, y: 0 });
  
  // System Pause State
  const [isSystemPaused, setIsSystemPaused] = useState(false);

  // Generate Stars
  const stars = useMemo(() => {
    return Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.5 + 0.5, // Reduced star size range
      opacity: Math.random() * 0.5 + 0.1,
      animationDuration: Math.random() * 3 + 2 + 's',
      animationDelay: Math.random() * 2 + 's'
    }));
  }, []);

  const initialColumns = [
    { id: 'backlog', title: 'Brain Dump', icon: BrainCircuit },
    { id: 'todo', title: 'This Week', icon: CalendarIcon },
    { id: 'doing', title: 'In The Zone', icon: Library },
    { id: 'done', title: 'Completed', icon: GraduationCap }
  ];

  // Runtime State
  const [activeDrag, setActiveDrag] = useState(null);
  const dragRef = useRef(null); 
  const [hoveredColumnId, setHoveredColumnId] = useState(null);
  const hoveredColumnRef = useRef(null); 
  const [fireworksPos, setFireworksPos] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [timerActive, setTimerActive] = useState(false);

  // Gemini State
  const [isGeminiActive, setIsGeminiActive] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState('idle');
  const [geminiOutput, setGeminiOutput] = useState('');
  const [geminiFile, setGeminiFile] = useState(null);
  const [geminiError, setGeminiError] = useState(null);
  const [geminiTargetCourse, setGeminiTargetCourse] = useState('');

  // Form States
  const [newTaskContent, setNewTaskContent] = useState('');
  const [newTaskCourse, setNewTaskCourse] = useState(Object.keys(DEFAULT_COURSES)[0]);
  const [newTaskType, setNewTaskType] = useState('Assignment');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskTime, setNewTaskTime] = useState(''); // New Time State
  const [activeColumnForAdd, setActiveColumnForAdd] = useState('backlog');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseColor, setNewCourseColor] = useState('indigo');

  // Notes State
  const [activeNote, setActiveNote] = useState(null);
  const [selectedNoteCourse, setSelectedNoteCourse] = useState('ALL');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCourse, setNoteCourse] = useState('');
  const [noteType, setNoteType] = useState('text');
  const [isEditingNote, setIsEditingNote] = useState(false);

  // --- Helpers ---
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  // --- Drag and Drop Logic ---
  const onGlobalPointerMove = useCallback((e) => {
    if (!dragRef.current) return;
    e.preventDefault();
    
    dragRef.current.currentX = e.clientX;
    dragRef.current.currentY = e.clientY;
    setActiveDrag({ ...dragRef.current });
    
    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    const colElement = elements.find(el => el.getAttribute('data-column-id'));
    const newHoveredId = colElement ? colElement.getAttribute('data-column-id') : null;
    
    if (hoveredColumnRef.current !== newHoveredId) {
        hoveredColumnRef.current = newHoveredId;
        setHoveredColumnId(newHoveredId);
    }
  }, []);

  const onGlobalPointerUp = useCallback((e) => {
    if (!dragRef.current) return;
    
    const { id, originalColumn } = dragRef.current;
    const targetColumn = hoveredColumnRef.current;
    
    if (targetColumn && targetColumn !== originalColumn) {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, columnId: targetColumn } : t));
        if (targetColumn === 'done') {
             addToast("Task Completed!", "success");
        }
    }
    
    window.removeEventListener('pointermove', onGlobalPointerMove);
    window.removeEventListener('pointerup', onGlobalPointerUp);
    dragRef.current = null;
    hoveredColumnRef.current = null;
    setActiveDrag(null);
    setHoveredColumnId(null);
  }, [addToast, onGlobalPointerMove]);

  const handlePointerDown = useCallback((e, task) => {
    e.preventDefault();
    e.stopPropagation(); 
    
    const rect = e.currentTarget.getBoundingClientRect();
    const dragData = {
        id: task.id,
        task: task,
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        originalColumn: task.columnId,
        width: rect.width,
        height: rect.height
    };
    
    dragRef.current = dragData;
    setActiveDrag(dragData);
    
    window.addEventListener('pointermove', onGlobalPointerMove);
    window.addEventListener('pointerup', onGlobalPointerUp);
  }, [onGlobalPointerMove, onGlobalPointerUp]);

  // --- Navigation & Warp Effects ---
  const goToSpace = useCallback(() => {
    setZoomState('zooming-out');
    setPan({ x: 0, y: 0 });
    setZoom(1);
    
    setTimeout(() => {
        setViewMode('space');
        setZoomState('idle');
    }, 200); 
  }, []);

  const enterBoard = useCallback((boardId) => {
    if (isDragging) return;
    setActiveBoardId(boardId);
    setZoomState('zooming-in');
    setTimeout(() => {
        setViewMode('board');
        setZoomState('idle');
    }, 200);
  }, [isDragging, setActiveBoardId]);

  const handleCreateBoard = () => {
    if (!newBoardName.trim()) return;
    const newBoard = { 
        id: Date.now().toString(), 
        name: newBoardName, 
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        createdAt: new Date().toISOString() 
    };
    setBoards(prev => [...prev, newBoard]);
    setNewBoardName('');
    setIsAddBoardModalOpen(false);
    addToast("New Board Created", "success");
  };

  // --- Delete Board ---
  const promptDeleteBoard = (e, boardId) => {
    e.stopPropagation(); 
    if (boards.length <= 1) {
        addToast("Cannot delete the last board!", "error");
        return;
    }
    setBoardToDelete(boardId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteBoard = () => {
    if (!boardToDelete) return;

    setBoards(prev => prev.filter(b => b.id !== boardToDelete));
    setTasks(prev => prev.filter(t => t.boardId !== boardToDelete));
    
    if (activeBoardId === boardToDelete) {
        const remainingBoards = boards.filter(b => b.id !== boardToDelete);
        if (remainingBoards.length > 0) {
            setActiveBoardId(remainingBoards[0].id);
        }
    }
    
    addToast("Board deleted", "info");
    setIsDeleteModalOpen(false);
    setBoardToDelete(null);
  };

  // --- Terminal Logic ---
  const handleTerminalInput = (e) => {
    const val = e.target.value;
    setTerminalInput(val);
    
    if (val.toLowerCase().startsWith('warp ')) {
        const query = val.slice(5).toLowerCase();
        const cleanQuery = query.startsWith('-') ? query.substring(1) : query;
        
        if (cleanQuery) {
             const match = boards.find(b => b.name.toLowerCase().startsWith(cleanQuery));
             if (match) {
                 setSuggestion(match.name.substring(cleanQuery.length));
             } else {
                 setSuggestion('');
             }
        } else {
            setSuggestion('');
        }
    } else {
        setSuggestion('');
    }
  };

  const handleTerminalCommand = (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        if (suggestion && terminalInput.toLowerCase().startsWith('warp ')) {
            setTerminalInput(terminalInput + suggestion);
            setSuggestion('');
        }
        return;
    }

    if (e.key !== 'Enter') return;
    
    const cmd = terminalInput.trim();
    if (!cmd) return;

    const newLines = [...terminalLines, `> ${cmd}`];
    const parts = cmd.split('|').map(s => s.trim());
    
    if (cmd === 'clear') {
        setTerminalLines([]);
        setTerminalInput("");
        setSuggestion('');
        return;
    }
    
    if (cmd === 'help') {
        newLines.push("Available commands:");
        newLines.push("  ls            - List all available boards");
        newLines.push("  warp <name>   - Jump to a specific board");
        newLines.push("  add <name>    - Create a new board");
        newLines.push("  inf <name>    - Show stats for a specific board");
        newLines.push("  ls | inf [flags] - List all boards with stats");
        newLines.push("      -a [c|u]  - Sort Ascending (Completed/Uncompleted)");
        newLines.push("      -d [c|u]  - Sort Descending (Completed/Uncompleted)");
        newLines.push("  clear         - Clear terminal output");
        newLines.push("  exit          - Close terminal");
    } else if (parts.length > 1 && parts[0] === 'ls' && parts[1].startsWith('inf')) {
        const args = parts[1].split(/\s+/).slice(1); 
        let direction = 'desc'; 
        let key = 'completed'; 
        if (args.includes('-a')) direction = 'asc';
        if (args.includes('u')) key = 'uncompleted';
        
        const boardsWithStats = boards.map(b => {
             const boardTasks = tasks.filter(t => (t.boardId || 'b1') === b.id);
             const total = boardTasks.length;
             const completed = boardTasks.filter(t => t.columnId === 'done').length;
             const uncompleted = total - completed;
             return { ...b, total, completed, uncompleted };
        });
        
        const sortedBoards = [...boardsWithStats].sort((a, b) => {
             const valA = a[key];
             const valB = b[key];
             return direction === 'asc' ? valA - valB : valB - valA;
        });

        newLines.push("SYSTEM STATS SCAN COMPLETE:");
        newLines.push("--------------------------------------------------");
        newLines.push("BOARD NAME           | TOT | CMP | PEN");
        newLines.push("--------------------------------------------------");
        
        sortedBoards.forEach(b => {
            const name = b.name.padEnd(20, ' ').substring(0, 20);
            const tot = b.total.toString().padStart(3, ' ');
            const cmp = b.completed.toString().padStart(3, ' ');
            const pen = b.uncompleted.toString().padStart(3, ' ');
            newLines.push(`${name} | ${tot} | ${cmp} | ${pen}`);
        });
        newLines.push("--------------------------------------------------");
        
    } else if (cmd.startsWith('inf ')) {
        const query = cmd.replace('inf ', '').trim();
        const target = boards.find(b => b.name.toLowerCase() === query.toLowerCase() || b.id === query);
        
        if (target) {
            const boardTasks = tasks.filter(t => (t.boardId || 'b1') === target.id);
            const total = boardTasks.length;
            const completed = boardTasks.filter(t => t.columnId === 'done').length;
            const uncompleted = total - completed;
            
            newLines.push(`STATS FOR: ${target.name}`);
            newLines.push(`  Total Tasks:      ${total}`);
            newLines.push(`  Completed:        ${completed}`);
            newLines.push(`  Uncompleted:      ${uncompleted}`);
            newLines.push(`  Completion Rate:  ${total > 0 ? Math.round((completed/total)*100) : 0}%`);
        } else {
            newLines.push(`ERROR: Board "${query}" not found.`);
        }
        
    } else if (cmd === 'ls') {
        newLines.push("DETECTED SYSTEMS:");
        boards.forEach(b => {
            const taskCount = tasks.filter(t => t.boardId === b.id).length;
            newLines.push(`  [${b.id.substring(0, 8)}...] ${b.name} (${taskCount} tasks)`);
        });
    } else if (cmd.startsWith('warp ')) {
        const query = cmd.replace('warp ', '').trim().toLowerCase();
        const cleanQuery = query.startsWith('-') ? query.substring(1) : query;
        const target = boards.find(b => b.name.toLowerCase() === cleanQuery || b.id.toLowerCase() === cleanQuery || b.name.toLowerCase().includes(cleanQuery));
        
        if (target) {
            newLines.push(`INITIATING WARP SEQUENCE TO: ${target.name}...`);
            newLines.push(`3... 2... 1...`);
            setTimeout(() => {
                enterBoard(target.id);
                setIsTerminalOpen(false);
            }, 1000);
        } else {
            newLines.push(`ERROR: Destination "${cleanQuery}" not found.`);
        }
    } else if (cmd.startsWith('add ')) {
         const name = cmd.replace('add ', '').trim();
         if (name) {
             const newBoard = { id: Date.now().toString(), name: name, color: COLORS[Math.floor(Math.random() * COLORS.length)], createdAt: new Date().toISOString() };
             setBoards(prev => [...prev, newBoard]);
             newLines.push(`SUCCESS: System "${name}" initialized.`);
             addToast("New Board Created", "success");
         } else {
             newLines.push("ERROR: Name required.");
         }
    } else if (cmd === 'exit') {
        setIsTerminalOpen(false);
    } else {
        newLines.push(`Command not found: ${cmd}`);
    }
    
    setTerminalLines(newLines);
    setTerminalInput("");
    setSuggestion('');
  };
  
  // Reset terminal lines on open
  useEffect(() => {
      if (isTerminalOpen) {
          setTerminalLines([
            "ARTEMIS KERNEL v4.2.0 [Safe Mode]",
            "Type 'help' for available commands.",
            "-------------------------------------"
          ]);
          setTerminalInput("");
          setSuggestion("");
      }
  }, [isTerminalOpen]);

  // Updated Scroll behavior to use MutationObserver
  useEffect(() => {
    if (isTerminalOpen && terminalEndRef.current) {
        const element = terminalEndRef.current.parentElement;
        if (element) {
             element.scrollTop = element.scrollHeight; 
             const observer = new MutationObserver(() => {
                 element.scrollTop = element.scrollHeight;
             });
             observer.observe(element, { childList: true, subtree: true, characterData: true });
             return () => observer.disconnect();
        }
    }
  }, [isTerminalOpen]); 

  // --- Space Navigation Handlers (Updated for horizontal scroll on board) ---
  const handleWheel = useCallback((e) => {
    if (viewMode === 'board') {
        // Implement Horizontal Scroll for Board View when using mouse wheel, 
        // BUT ONLY if we are in 'columns' mode.
        if (boardViewMode === 'columns') {
            let target = e.target;
            let isOverScrollableY = false;
            
            while (target && target !== e.currentTarget) {
                if (target.classList && target.classList.contains('overflow-y-auto')) {
                    if (target.scrollHeight > target.clientHeight) {
                        isOverScrollableY = true;
                    }
                    break;
                }
                target = target.parentElement;
            }

            if (!isOverScrollableY && e.deltaY !== 0) {
                e.currentTarget.scrollLeft += e.deltaY;
            }
        }
        return;
    }

    if (viewMode !== 'space') return;
    e.stopPropagation();
    const scaleAmount = -e.deltaY * 0.001;
    setZoom(prev => Math.min(Math.max(0.5, prev + scaleAmount), 3));
  }, [viewMode, boardViewMode]);

  const handleSpacePointerDown = (e) => {
    if (viewMode !== 'space' || e.button !== 0) return;
    setIsDragging(true);
    lastPanPoint.current = { x: e.clientX, y: e.clientY };
  };

  const handleSpacePointerMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const deltaX = e.clientX - lastPanPoint.current.x;
    const deltaY = e.clientY - lastPanPoint.current.y;
    setPan(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
    lastPanPoint.current = { x: e.clientX, y: e.clientY };
  };

  const handleSpacePointerUp = () => {
    setIsDragging(false);
  };

  // --- Effects ---
  useEffect(() => {
    let interval;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
      addToast("Timer Finished!", "success");
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, addToast]);

  const resetAllData = () => {
    if (confirm("Are you sure? This will delete all tasks, notes, and courses.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // --- Cockpit Warp Logic ---
  const handleCockpitWarp = (boardId) => {
    // Simulate warp sequence
    const warpDuration = 500; // ms
    setTimeout(() => {
        setActiveBoardId(boardId);
        setViewMode('board');
        setIsCockpitOpen(false);
        setZoomState('idle');
    }, warpDuration);
  };

  const openAddModal = useCallback((columnId) => { 
    setEditingTaskId(null); 
    setNewTaskContent(''); 
    const firstCourse = courses && Object.keys(courses).length > 0 ? Object.keys(courses)[0] : 'GENERAL';
    setNewTaskCourse(firstCourse); 
    setNewTaskType('Assignment'); 
    setNewTaskDate(''); 
    setNewTaskTime(''); // Reset Time
    setActiveColumnForAdd(columnId); 
    setIsModalOpen(true); 
  }, [courses]);
  
  const openEditModal = useCallback((task) => { setEditingTaskId(task.id); setNewTaskContent(task.content); setNewTaskCourse(task.course); setNewTaskType(task.type); setNewTaskDate(task.dueDate || ''); setNewTaskTime(task.dueTime || ''); setActiveColumnForAdd(task.columnId); setIsModalOpen(true); }, []);
  const deleteTask = useCallback((taskId) => { setTasks(prev => prev.filter(t => t.id !== taskId)); addToast("Task Deleted", "info"); }, [setTasks, addToast]);

  const handleSaveTask = () => {
    if (!newTaskContent.trim()) return;
    const currentBoard = activeBoardId || 'b1';
    const currentColumn = activeColumnForAdd || 'backlog';
    const taskData = { 
        content: newTaskContent, 
        course: newTaskCourse, 
        type: newTaskType, 
        dueDate: newTaskDate,
        dueTime: newTaskTime, // Save Time
        boardId: currentBoard 
    };
    
    if (editingTaskId) { 
        setTasks(prev => prev.map(t => t.id === editingTaskId ? { ...t, ...taskData } : t)); 
        addToast("Task Updated", "success"); 
    } else { 
        setTasks(prev => [...prev, { id: Date.now().toString(), columnId: currentColumn, ...taskData }]); 
        addToast("Task Added", "success"); 
    }
    resetModal();
  };

  const addCourse = () => { if (!newCourseCode.trim() || !newCourseName.trim()) return; setCourses(prev => ({ ...prev, [newCourseCode.toUpperCase()]: { name: newCourseName, baseColor: newCourseColor } })); setNewCourseCode(''); setNewCourseName(''); addToast("Course Added", "success"); };
  const deleteCourse = (code) => { const { [code]: deleted, ...rest } = courses; setCourses(rest); addToast("Course Removed", "info"); };
  const resetModal = () => { setNewTaskContent(''); setIsModalOpen(false); setNewTaskDate(''); setNewTaskTime(''); setEditingTaskId(null); };

  // Timer
  const toggleTimer = () => setTimerActive(!timerActive);
  const resetTimer = () => { setTimerActive(false); setTimeLeft(timerDuration * 60); };

  // Calendar Helpers
  const nextMonth = () => {
      setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };
  const prevMonth = () => {
      setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };
  const today = () => {
      setCalendarDate(new Date());
  };

  return (
    <div className={`min-h-screen font-sans select-none transition-colors duration-500 ease-in-out selection:bg-indigo-500/30 ${theme.bg} ${theme.text} overflow-hidden`}>
      <FireworksOverlay position={fireworksPos} />

      {/* Styles */}
      <style>{`
        /* Modern Slim Scrollbar */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { 
          background: ${theme.type === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}; 
          border-radius: 10px; 
          transition: background 0.2s ease;
        }
        ::-webkit-scrollbar-thumb:hover { 
          background: ${theme.type === 'dark' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'}; 
        }
        
        @keyframes slide-arrow { 0% { transform: translateX(-200%) skewX(-12deg); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateX(300%) skewX(-12deg); opacity: 0; } }
        .animate-slide-arrow { animation: slide-arrow 1s ease-out forwards; }
        @keyframes scale-in { 0% { opacity: 0; transform: scale(0.95) translateY(10px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-scale-in { animation: scale-in 0.15s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
        @keyframes stagger-slide-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-stagger { animation: stagger-slide-up 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 15px rgba(255,255,255,0.1); border-color: rgba(255, 255, 255, 0.6); } 50% { box-shadow: 0 0 25px rgba(255,255,255,0.3); border-color: rgba(255, 255, 255, 1); } }
        .animate-pulse-glow { animation: pulse-glow 3s infinite ease-in-out; }
        @keyframes pop-success { 0% { transform: scale(1); } 50% { transform: scale(1.08); } 100% { transform: scale(1); } }
        .animate-pop-success { animation: pop-success 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-2px) rotate(-2deg); } 75% { transform: translateX(2px) rotate(2deg); } }
        .hover\\:animate-shake:hover { animation: shake 0.3s ease-in-out; }
        @keyframes orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes sun-pulse { 0%, 100% { transform: scale(1); opacity: 0.9; box-shadow: 0 0 60px ${theme.accentColor}66, 0 0 100px ${theme.accentColor}33 inset; } 50% { transform: scale(1.02); opacity: 1; box-shadow: 0 0 100px ${theme.accentColor}99, 0 0 140px ${theme.accentColor}66 inset; } }
        @keyframes warp-in { 0% { transform: scale(0.1); opacity: 0; filter: blur(20px); } 100% { transform: scale(1); opacity: 1; filter: blur(0); } }
        @keyframes warp-out { 0% { transform: scale(1); opacity: 1; filter: blur(0); } 100% { transform: scale(0.1); opacity: 0; filter: blur(20px); } }
        @keyframes space-warp-in { 0% { transform: scale(5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes twinkle { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .animate-float { animation: float 4s ease-in-out infinite; }
        @keyframes beam-wiggle { 0% { transform: translateX(-1px); opacity: 0.8; } 50% { transform: translateX(1px); opacity: 1; } 100% { transform: translateX(-1px); opacity: 0.8; } }
        .animate-beam-wiggle { animation: beam-wiggle 0.1s infinite; }
        @keyframes cockpit-fade-in { 0% { opacity: 0; transform: scale(1.1); } 100% { opacity: 1; transform: scale(1); } }
        .animate-cockpit-fade-in { animation: cockpit-fade-in 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        @keyframes cursor-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .animate-cursor-blink { animation: cursor-blink 1s step-end infinite; }
        .animate-terminal-enter { animation: terminal-enter 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes terminal-enter { 0% { transform: translateY(100vh); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        .animate-screen-turn-on { animation: screen-turn-on 0.4s ease-out forwards 0.5s; opacity: 0; }
        @keyframes screen-turn-on { 0% { opacity: 0; transform: scaleY(0); filter: brightness(5); } 10% { opacity: 1; transform: scaleY(0.02); filter: brightness(5); } 100% { opacity: 1; transform: scaleY(1); filter: brightness(1); } }
        @keyframes view-switch {
          0% { opacity: 0; transform: scale(0.98) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-view-switch { animation: view-switch 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
      `}</style>

      <div className="fixed inset-0 pointer-events-none opacity-[0.4] transition-opacity duration-500" style={{ backgroundImage: `radial-gradient(${theme.gridColor} 1px, transparent 1px)`, backgroundSize: '24px 24px' }}></div>

      {/* Floating Island Header */}
      <header className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-6 px-4 py-2 rounded-full border shadow-xl backdrop-blur-2xl transition-all duration-300 ${theme.headerBg} ${theme.headerBorder} hover:shadow-2xl hover:scale-[1.02]`}>
        <div onClick={viewMode === 'board' ? goToSpace : null} className={`flex items-center gap-2.5 cursor-pointer group ${viewMode === 'space' ? 'pointer-events-none' : ''}`}>
            <div className={`p-1.5 rounded-full transition-transform group-hover:scale-110 ${theme.type === 'dark' ? `bg-${theme.accent}-500/20 text-${theme.accent}-400` : `bg-${theme.accent}-50 text-${theme.accent}-600`}`}>
            <Orbit size={18} strokeWidth={2.5} className="animate-[spin_10s_linear_infinite]" />
            </div>
            <span className="text-sm font-bold tracking-tight select-none">{viewMode === 'space' ? 'Boardspace' : activeBoardName}</span>
        </div>
        <div className="flex items-center gap-1.5">
            {/* View Switcher Button */}
            {viewMode === 'board' && (
              <button 
                onClick={() => {
                    if (calendarMode === 'day') {
                        setCalendarMode('month'); // If in day mode, switch back to month mode first
                    } else {
                        setBoardViewMode(prev => prev === 'columns' ? 'calendar' : 'columns');
                    }
                }}
                className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors active:scale-90 ${theme.subtext}`} 
                aria-label="Switch View"
                title={boardViewMode === 'columns' ? "Switch to Calendar View" : "Switch to Kanban View"}
              >
                {boardViewMode === 'columns' ? <CalendarIcon size={18} /> : <Kanban size={18} />}
              </button>
            )}
            <button onClick={() => setIsSettingsOpen(true)} className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors active:scale-90 ${theme.subtext}`} aria-label="Settings"><Settings size={18} /></button>
            <div className="h-4 w-px bg-stone-200 dark:bg-stone-700 mx-1"></div>
            <button onClick={() => setFocusMode(!focusMode)} className={`p-2 rounded-full transition-all active:scale-90 ${focusMode ? `bg-${theme.accent}-500 text-white shadow-lg shadow-${theme.accent}-500/20` : `hover:bg-black/5 dark:hover:bg-white/10 ${theme.subtext}`}`} aria-label="Focus Mode">
                {focusMode ? <Zap size={18} fill="currentColor" /> : <Zap size={18} />}
            </button>
        </div>
      </header>

      {/* Floating Pomodoro Timer */}
      <div className={`fixed bottom-6 left-6 z-40 flex items-center border shadow-xl backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] animate-float ${isTimerExpanded ? 'rounded-full px-2 py-2 gap-2' : 'rounded-full w-12 h-12 justify-center hover:scale-110 cursor-pointer'} ${theme.cardBg} ${theme.cardBorder}`}>
        <div onClick={() => setIsTimerExpanded(!isTimerExpanded)} className={`flex items-center justify-center rounded-full transition-colors duration-300 ${isTimerExpanded ? 'w-8 h-8 hover:bg-black/5 dark:hover:bg-white/10' : 'w-full h-full'}`}>
          <Timer size={isTimerExpanded ? 18 : 22} className={`${timerActive ? 'text-emerald-500 animate-pulse' : theme.subtext}`} />
        </div>
        <div className={`flex items-center gap-2 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isTimerExpanded ? 'max-w-[200px] opacity-100' : 'max-w-0 opacity-0'}`}>
          <div onClick={() => setIsTimerModalOpen(true)} className="cursor-pointer group hover:opacity-70 whitespace-nowrap">
            <span className={`font-mono text-lg font-bold tracking-widest ${theme.text}`}>{formatTime(timeLeft)}</span>
          </div>
          <div className="h-5 w-px bg-stone-200 dark:bg-stone-700 mx-1"></div>
          <div className="flex items-center gap-0.5">
            <button onClick={toggleTimer} className={`p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors active:scale-95 ${timerActive ? 'text-amber-500' : 'text-emerald-500'}`}>{timerActive ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}</button>
            <button onClick={resetTimer} className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-stone-400 hover:text-rose-500 transition-colors active:scale-95"><RotateCcw size={14} /></button>
          </div>
        </div>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (<div key={toast.id} className="pointer-events-auto"><Toast {...toast} onClose={() => removeToast(toast.id)} theme={theme} /></div>))}
      </div>

      {/* Boardspace (Solar System) */}
      {viewMode === 'space' && !isTerminalOpen && (
        <>
          <div className={`absolute inset-0 z-30 overflow-hidden ${theme.bg} animate-[space-warp-in_0.2s_ease-out]`} onPointerDown={handleSpacePointerDown} onPointerMove={handleSpacePointerMove} onPointerUp={handleSpacePointerUp} onPointerLeave={handleSpacePointerUp} onWheel={handleWheel}>
            <div className="absolute inset-0 pointer-events-none">
             {stars.map(star => (<div key={star.id} className="absolute bg-white rounded-full" style={{ top: `${star.y}%`, left: `${star.x}%`, width: `${star.size}px`, height: `${star.size}px`, opacity: star.opacity, animation: `twinkle ${star.animationDuration} infinite ease-in-out ${star.animationDelay}`, boxShadow: `0 0 ${star.size / 1.5}px ${star.size / 4}px rgba(255, 255, 255, 0.1)` }} />))}
            </div>
            <div className="w-full h-full flex items-center justify-center origin-center cursor-grab active:cursor-grabbing will-change-transform" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
              <div className="relative w-32 h-32 rounded-full z-10 animate-[sun-pulse_4s_infinite_ease-in-out]">
                  <div className="absolute inset-0 rounded-full" style={{ backgroundColor: theme.accentColor, boxShadow: `0 0 60px ${theme.accentColor}66, 0 0 100px ${theme.accentColor}33 inset` }} />
                  <div className="absolute inset-0 bg-white rounded-full blur-xl opacity-30 mix-blend-overlay"></div>
                  <div className="absolute -inset-4 rounded-full blur-2xl opacity-40 animate-pulse" style={{ backgroundColor: theme.accentColor }}></div>
              </div>
              {boards.map((board, index) => {
                  const orbitDuration = 20 + index * 10;
                  const orbitSize = 380 + index * 180;
                  const completedTasks = tasks.filter(t => (t.boardId || 'b1') === board.id && t.columnId === 'done').length;
                  const totalTasks = tasks.filter(t => (t.boardId || 'b1') === board.id).length;
                  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
                  return (
                  <div key={board.id} className="absolute rounded-full border border-white/5 pointer-events-none" style={{ width: `${orbitSize}px`, height: `${orbitSize}px`, animation: `orbit ${orbitDuration}s linear infinite`, animationPlayState: isSystemPaused ? 'paused' : 'running' }}>
                      <div className={`absolute left-1/2 top-0 bottom-1/2 w-1 -translate-x-1/2 origin-bottom transition-transform duration-75 ease-out ${isSystemPaused ? 'scale-y-100' : 'scale-y-0'}`}>
                          <div className={`w-1 h-full mx-auto ${isSystemPaused ? 'animate-beam-wiggle' : ''}`} style={{ background: `linear-gradient(to top, transparent, ${theme.accentColor})`, boxShadow: `0 0 8px ${theme.accentColor}`, opacity: 0.8 }} />
                          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white blur-[2px] ${isSystemPaused ? 'opacity-100' : 'opacity-0'}`} />
                      </div>
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 pointer-events-auto cursor-pointer group" onClick={() => enterBoard(board.id)} onMouseEnter={() => setIsSystemPaused(true)} onMouseLeave={() => setIsSystemPaused(false)} style={{ animation: `orbit ${orbitDuration}s linear infinite reverse`, animationPlayState: isSystemPaused ? 'paused' : 'running' }}>   
                          <div className={`w-full h-full rounded-full border-4 shadow-[0_0_50px_rgba(0,0,0,0.3)] transition-transform duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) group-hover:scale-110 relative overflow-hidden flex flex-col items-center justify-center text-center p-2 backdrop-blur-md ${theme.cardBg}`} style={{ borderColor: theme.accentColor }}>
                              <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 30% 30%, ${theme.accentColor}, transparent)` }}></div>
                              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="none" stroke={theme.gridColor} strokeWidth="2" opacity="0.3" /><circle cx="50" cy="50" r="46" fill="none" stroke={theme.accentColor} strokeWidth="4" strokeDasharray={`${progress * 2.89}, 289`} strokeLinecap="round" /></svg>
                              <div className="relative z-10 flex flex-col items-center gap-1 transition-opacity duration-300">
                                  <div className="flex items-center gap-1"><span className={`text-xs font-bold leading-tight line-clamp-2 ${theme.text}`}>{board.name}</span><button onClick={(e) => promptDeleteBoard(e, board.id)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 size={10} /></button></div>
                                  <div className={`flex items-center gap-1 text-[10px] font-mono ${theme.subtext}`}><CheckCircle2 size={10} /><span>{completedTasks}/{totalTasks}</span></div>
                              </div>
                          </div>
                      </div>
                  </div>
                  );
              })}
            </div>
          </div>
          
          <button type="button" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setIsAddBoardModalOpen(true); }} onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} className="fixed bottom-10 right-10 z-[200] p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full cursor-pointer transition-all hover:scale-110 hover:rotate-90 shadow-2xl group" style={{backgroundColor: theme.accentColor}}><Plus size={24} className="text-white opacity-80 group-hover:opacity-100" /></button>
          
          {/* Terminal Trigger Button */}
          <button type="button" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setIsTerminalOpen(true); }} onPointerDown={(e) => e.stopPropagation()} className="fixed bottom-10 right-28 z-[200] p-4 bg-indigo-500/20 hover:bg-indigo-500/40 backdrop-blur-md border border-indigo-500/30 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer text-indigo-400" style={{backgroundColor: theme.accentColor}}><Terminal size={24} className="text-white"/></button>
        </>
      )}

      {/* Main Board View */}
      {viewMode === 'board' && (
        <main 
          onWheel={handleWheel}
          className={`
            relative z-0 h-screen 
            ${boardViewMode === 'columns' ? 'p-8 pt-24 overflow-x-auto' : 'p-0 pt-0 overflow-hidden'}
            ${zoomState === 'zooming-out' ? 'animate-[warp-out_0.2s_ease-in_forwards]' : 'animate-[warp-in_0.2s_ease-out_forwards]'}
          `}
        >
          {boardViewMode === 'columns' ? (
            // STANDARD COLUMN VIEW
            <div key="columns" className="flex gap-6 min-w-[1024px] pb-12 h-full animate-view-switch">
                {initialColumns.map((column) => {
                const colTasks = filteredTasks.filter(t => t.columnId === column.id);
                const isTarget = hoveredColumnId === column.id;
                const isBacklog = column.id === 'backlog';
                const isDone = column.id === 'done';
                const isDoing = column.id === 'doing';
                const isDimmed = focusMode && (isBacklog || isDone);
                const isInteractionDisabled = focusMode && isBacklog;
                const widthClass = (isDoing && focusMode) ? 'flex-[2] min-w-[400px]' : 'flex-1 min-w-[300px]';

                return (
                    <div key={column.id} data-column-id={column.id} className={`${widthClass} flex flex-col rounded-3xl transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${isDimmed ? 'opacity-30 blur-[2px] scale-98' : 'opacity-100 scale-100'} ${isInteractionDisabled ? 'pointer-events-none' : ''} ${isTarget ? `bg-${theme.accent}-500/5 ring-2 ring-dashed ring-${theme.accent}-500/30` : ''}`}>
                    <div className={`flex items-center justify-between mb-4 px-2 sticky top-0 z-20 backdrop-blur-md py-2 rounded-xl transition-colors ${theme.headerBg}`}>
                        <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${theme.cardBg} ${theme.cardBorder} border opacity-70 transition-colors shadow-sm`}><column.icon size={18} /></div>
                        <span className={`font-bold text-lg tracking-tight ${theme.columnTitle}`}>{column.title}</span>
                        </div>
                        <button type="button" onClick={() => openAddModal(column.id)} onPointerDown={(e) => e.stopPropagation()} className="p-2 hover:bg-black/5 rounded-full opacity-60 hover:opacity-100 transition-all duration-150 active:scale-90 relative z-50 cursor-pointer"><Plus size={20} /></button>
                    </div>
                    <div className="flex flex-col gap-4 h-full pb-20 px-4 pt-4 overflow-y-auto overflow-x-visible relative scroll-smooth">
                        {isDoing && focusMode && <div className={`absolute inset-0 bg-${theme.accent}-500/5 rounded-2xl pointer-events-none`} />}
                        {colTasks.map((task, index) => (
                        <div key={task.id} className={!activeDrag ? "animate-stagger" : ""} style={{ animationDelay: `${index * 50}ms` }}>
                            <TaskCard task={task} theme={theme} courses={courses} activeDragId={activeDrag?.id} handlePointerDown={handlePointerDown} openEditModal={openEditModal} deleteTask={deleteTask} />
                        </div>
                        ))}
                        {colTasks.length === 0 ? (
                        <div onClick={() => openAddModal(column.id)} onPointerDown={(e) => e.stopPropagation()} className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-current opacity-10 rounded-2xl cursor-pointer transition-all duration-200 hover:opacity-30 hover:scale-[1.01] active:scale-99 shrink-0 gap-3 group animate-stagger" style={{ animationDelay: '0.1s' }}>
                            <div className="p-3 rounded-full bg-current opacity-10 group-hover:opacity-20 transition-opacity"><Plus size={24} /></div>
                            <span className="text-sm font-bold opacity-60 flex items-center gap-1.5"><Plus size={16} /> Add Task to {column.title}</span>
                        </div>
                        ) : (
                        <button type="button" onClick={() => openAddModal(column.id)} onPointerDown={(e) => e.stopPropagation()} className="w-full py-3 rounded-xl border-2 border-dashed border-current flex items-center justify-center gap-2 transition-all opacity-30 hover:opacity-60 active:opacity-80 shrink-0 hover:scale-[1.02] active:scale-95 animate-stagger pointer-events-auto relative z-50 cursor-pointer" style={{ animationDelay: `${Math.min(colTasks.length * 50, 200)}ms` }}>
                            <Plus size={16} /> <span className="text-xs font-bold uppercase tracking-widest">Add Task</span>
                        </button>
                        )}
                    </div>
                    </div>
                );
                })}
            </div>
          ) : (
            // CALENDAR VIEW (FULL SCREEN)
             <div key="calendar" className={`flex flex-col h-full w-full overflow-hidden backdrop-blur-sm ${theme.cardBg} pt-24 px-6 pb-6 animate-view-switch`}>
                {/* Calendar Header with Navigation */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        {calendarMode === 'day' && (
                            <button 
                                onClick={() => setCalendarMode('month')} 
                                className={`p-2 rounded-lg hover:bg-black/5 transition-colors ${theme.cardBorder} border flex items-center gap-2 text-sm font-bold`}
                            >
                                <ArrowLeft size={16} /> Back to Month
                            </button>
                        )}
                        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                            {calendarMode === 'month' ? (
                                <>
                                    <CalendarIcon className={`text-${theme.accent}-500`} />
                                    {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </>
                            ) : (
                                <>
                                    <span className={`text-${theme.accent}-500`}>{selectedDate.getDate()}</span>
                                    {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </>
                            )}
                        </h2>
                    </div>
                    
                    {calendarMode === 'month' && (
                        <div className="flex gap-2">
                           <button onClick={prevMonth} className={`p-2 rounded-lg hover:bg-black/5 transition-colors ${theme.cardBorder} border`}><ChevronLeft size={20}/></button>
                           <button onClick={today} className={`px-4 py-2 rounded-lg font-bold text-sm hover:bg-black/5 transition-colors ${theme.cardBorder} border`}>Today</button>
                           <button onClick={nextMonth} className={`p-2 rounded-lg hover:bg-black/5 transition-colors ${theme.cardBorder} border`}><ChevronRight size={20}/></button>
                        </div>
                    )}
                </div>
                  
                {calendarMode === 'month' ? (
                    // MONTH VIEW - FULL TEXT & SCROLLABLE
                    <>
                      <div className="grid grid-cols-7 gap-4 text-center opacity-50 font-bold mb-4 uppercase text-xs tracking-widest">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
                      </div>
                      
                      <div className="grid grid-cols-7 auto-rows-min gap-2 flex-1 overflow-y-auto">
                         {(() => {
                            const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();
                            const startDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay();
                            const days = [];
                            
                            // Empty slots
                            for (let i = 0; i < startDay; i++) {
                                days.push(<div key={`empty-${i}`} className="bg-black/5 rounded-xl opacity-20 min-h-[120px]"></div>);
                            }
                            
                            // Days
                            for (let i = 1; i <= daysInMonth; i++) {
                                const dateStr = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                                const isToday = new Date().toISOString().split('T')[0] === dateStr;
                                const dayTasks = filteredTasks.filter(t => t.dueDate === dateStr);
                                
                                days.push(
                                    <div 
                                        key={i} 
                                        onClick={() => { 
                                            setSelectedDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), i)); 
                                            setCalendarMode('day'); 
                                        }}
                                        className={`relative flex flex-col p-2 rounded-xl border transition-all hover:bg-black/5 overflow-hidden group min-h-[120px] ${isToday ? `bg-${theme.accent}-500/10 border-${theme.accent}-500` : `${theme.cardBorder} bg-black/5 hover:bg-black/10`}`}
                                    >
                                        <div className={`text-xs font-bold mb-2 ${isToday ? `text-${theme.accent}-500` : 'opacity-40'}`}>{i}</div>
                                        
                                        <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-current p-1">
                                            {dayTasks.map(task => {
                                                const course = courses[task.course];
                                                const baseColor = course ? course.baseColor : 'slate';
                                                // Using solid variant for calendar events
                                                const styleClasses = getColorClass(baseColor, 'solid');
                                                
                                                return (
                                                    <div 
                                                        key={task.id} 
                                                        onClick={(e) => { e.stopPropagation(); openEditModal(task); }}
                                                        className={`
                                                            p-2 rounded-md cursor-pointer transition-all hover:brightness-110 shadow-sm
                                                            text-xs font-medium border border-white/10
                                                            ${styleClasses}
                                                            ${task.columnId === 'done' ? 'opacity-60 decoration-slice line-through' : ''}
                                                        `}
                                                    >
                                                        <div className="flex items-center justify-between mb-1 opacity-90 text-[9px] font-bold uppercase tracking-wider border-b border-white/20 pb-0.5">
                                                            <span>{task.course}</span>
                                                        </div>
                                                        <div className="leading-tight break-words whitespace-normal">{task.content}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        
                                        {/* Quick Add Button on Hover */}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setNewTaskDate(dateStr); openAddModal('todo'); }}
                                            className="absolute bottom-1 right-1 p-1 rounded-full bg-current text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                            style={{ color: theme.accentColor }}
                                        >
                                            <Plus size={14} className="text-white" />
                                        </button>
                                    </div>
                                );
                            }
                            return days;
                         })()}
                      </div>
                    </>
                ) : (
                    // DAY VIEW - DETAILED LIST WITH 24H TIMELINE - FIXED SCROLLING
                    <div className="flex-1 overflow-y-auto relative scrollbar-thin scrollbar-thumb-current" ref={(el) => {
                        if (el && !el.hasScrolled) {
                             el.scrollTop = 600; // Scroll to 8am
                             el.hasScrolled = true;
                        }
                    }}>
                        <div className="flex relative min-h-[1920px]">
                            {/* Time Column (Sticky or Absolute) */}
                            <div className="w-20 flex-shrink-0 border-r border-white/10 select-none">
                                {Array.from({ length: 24 }).map((_, i) => (
                                    <div key={i} className="h-20 relative border-b border-transparent">
                                        <span className="absolute -top-3 right-2 text-xs opacity-50 font-mono">
                                            {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i-12} PM`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Grid & Tasks Column */}
                            <div className="flex-1 relative">
                                {/* Horizontal Grid Lines */}
                                {Array.from({ length: 24 }).map((_, i) => (
                                    <div key={i} className="h-20 border-t border-white/10 w-full box-border"></div>
                                ))}
                                
                                {/* All Day Tasks Block at Top (Optional, sticking to top of container for now) */}
                                {(() => {
                                    const dateStr = formatDateLocal(selectedDate);
                                    const dayTasks = filteredTasks.filter(t => t.dueDate === dateStr);
                                    const allDayTasks = dayTasks.filter(t => !t.dueTime);
                                    
                                    if (allDayTasks.length > 0) {
                                        return (
                                            <div className="absolute top-0 left-0 right-0 p-2 z-20 flex flex-wrap gap-2 pointer-events-none">
                                                {allDayTasks.map(task => {
                                                    const course = courses[task.course];
                                                    const baseColor = course ? course.baseColor : 'slate';
                                                    const styleClasses = getColorClass(baseColor, 'solid');
                                                    return (
                                                        <div 
                                                            key={task.id}
                                                            onClick={(e) => { e.stopPropagation(); openEditModal(task); }}
                                                            className={`px-3 py-1.5 rounded text-xs font-bold shadow-sm pointer-events-auto cursor-pointer hover:brightness-110 ${styleClasses}`}
                                                        >
                                                            {task.content}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        );
                                    }
                                })()}
                                
                                {/* Timed Tasks */}
                                {(() => {
                                    const dateStr = formatDateLocal(selectedDate);
                                    const dayTasks = filteredTasks.filter(t => t.dueDate === dateStr);
                                    const timedTasks = dayTasks.filter(t => t.dueTime);

                                    return timedTasks.map(task => {
                                        const [hours, minutes] = task.dueTime.split(':').map(Number);
                                        const topOffset = (hours * 80) + (minutes / 60 * 80); // 80px per hour
                                        const course = courses[task.course];
                                        const baseColor = course ? course.baseColor : 'slate';
                                        const styleClasses = getColorClass(baseColor, 'solid');

                                        return (
                                            <div 
                                                key={task.id}
                                                onClick={(e) => { e.stopPropagation(); openEditModal(task); }}
                                                className={`absolute left-2 right-4 p-3 rounded-lg text-xs font-bold cursor-pointer hover:brightness-110 shadow-md border-l-4 border-white/30 overflow-hidden ${styleClasses}`}
                                                style={{ top: `${topOffset}px`, height: '70px' }} // Fixed height for 1hr block visual
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span className="opacity-80 text-[10px] uppercase font-bold tracking-wider">{task.course}</span>
                                                    <span className="opacity-90">{formatDisplayTime(task.dueTime)}</span>
                                                </div>
                                                <div className="mt-1 text-sm leading-tight line-clamp-2">{task.content}</div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                        
                         {/* Floating Add Button for Day View */}
                         <div className="fixed bottom-10 right-10 z-50">
                            <button 
                                onClick={() => { setNewTaskDate(formatDateLocal(selectedDate)); openAddModal('todo'); }}
                                className={`p-4 rounded-full shadow-2xl transition-transform hover:scale-110 active:scale-95 bg-${theme.accent}-600 text-white`}
                            >
                                <Plus size={24} />
                            </button>
                         </div>
                    </div>
                )}
             </div>
          )}
        </main>
      )}

      {/* DRAG OVERLAY - Needs to be high z-index and at root */}
      {activeDrag && (
        <div 
          className="fixed pointer-events-none z-[9999]" 
          style={{ 
            left: 0, 
            top: 0, 
            transform: `translate(${activeDrag.currentX - activeDrag.offsetX}px, ${activeDrag.currentY - activeDrag.offsetY}px)`, 
            width: activeDrag.width, 
            height: activeDrag.height 
          }}
        >
          <TaskCard task={activeDrag.task} isOverlay={true} theme={theme} courses={courses} activeDragId={activeDrag.id} />
        </div>
      )}

      {/* Add Board Modal */}
      {isAddBoardModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsAddBoardModalOpen(false)}></div>
            <div className="relative w-full max-w-sm bg-[#1e1e1e] border border-white/10 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <h3 className="text-white font-bold text-xl mb-4">Launch New Board</h3>
                <input autoFocus type="text" placeholder="e.g. Spring 2026" value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors mb-6" />
                <div className="flex gap-3">
                    <button onClick={() => setIsAddBoardModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-white/50 hover:bg-white/5 transition-colors active:scale-95">Cancel</button>
                    <button onClick={handleCreateBoard} className="flex-1 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-95">Launch</button>
                </div>
            </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsDeleteModalOpen(false)}></div>
            <div className="relative w-full max-w-sm bg-[#1e1e1e] border border-white/10 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={24} className="text-red-500" /></div>
                <h3 className="text-white font-bold text-xl mb-2">Delete Board?</h3>
                <p className="text-white/60 text-sm mb-6">This action cannot be undone. All tasks within this board will be permanently lost.</p>
                <div className="flex gap-3">
                    <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-white/50 hover:bg-white/5 transition-colors active:scale-95">Cancel</button>
                    <button onClick={confirmDeleteBoard} className="flex-1 py-3 rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 transition-all active:scale-95">Delete</button>
                </div>
            </div>
        </div>
      )}

      {/* Terminal Mode Overlay - Enhanced Boot Animation */}
      {isTerminalOpen && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center font-mono" style={{ backgroundColor: theme.type === 'dark' ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)' }}>
            {/* Main Terminal Container with Slide Up Animation */}
            <div className="relative w-full max-w-4xl h-[80vh] border-2 rounded-lg p-6 shadow-[0_0_50px_rgba(0,0,0,0.2)] flex flex-col backdrop-blur-md animate-terminal-enter" style={{ borderColor: theme.accentColor, backgroundColor: theme.type === 'dark' ? '#0c0a09' : '#ffffff' }}>
                
                {/* Retro CRT Scanlines overlay only on the terminal itself */}
                <div className="absolute inset-0 pointer-events-none z-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] rounded-lg"></div>

                {/* Inner Content Wrapper with Turn-On Animation */}
                <div className="flex-1 flex flex-col w-full h-full animate-screen-turn-on relative z-10">
                    {/* Terminal Header */}
                    <div className="flex justify-between items-center border-b pb-4 mb-4 shrink-0" style={{ borderColor: `${theme.accentColor}55`, color: theme.accentColor }}>
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                        </div>
                        <div className="text-xs tracking-widest">ARTEMIS TERMINAL</div>
                        <button onClick={() => setIsTerminalOpen(false)} className="hover:opacity-70 transition-opacity"><X size={18} /></button>
                    </div>

                    {/* Terminal Output - Auto-scrolling */}
                    <div 
                        ref={terminalEndRef}
                        className="flex-1 overflow-y-auto mb-4 scrollbar-thin scrollbar-thumb-current scrollbar-track-transparent space-y-1 font-mono text-sm" 
                        style={{ color: theme.accentColor }}
                    >
                        {terminalLines.map((line, i) => (
                            <div key={i} className="break-words"><TypewriterText text={line} /></div>
                        ))}
                    </div>

                    {/* Input Area */}
                    <div className="flex items-center gap-2 font-mono text-sm border-t pt-4 shrink-0" style={{ borderColor: `${theme.accentColor}55`, color: theme.accentColor }}>
                        <span className="animate-pulse">root@artemis:~#</span>
                        <div className="flex-1 relative">
                            {/* Ghost Text Overlay */}
                            {suggestion && (
                                <span className="absolute left-0 top-0 pointer-events-none opacity-40 select-none whitespace-pre" style={{ color: theme.accentColor }}>
                                    {terminalInput}{suggestion}
                                </span>
                            )}
                            <input 
                                autoFocus
                                type="text" 
                                value={terminalInput}
                                onChange={handleTerminalInput}
                                onKeyDown={(e) => {
                                    if (e.key === 'Tab') {
                                        e.preventDefault();
                                        if (suggestion) {
                                            setTerminalInput(terminalInput + suggestion);
                                            setSuggestion('');
                                        }
                                    }
                                    handleTerminalCommand(e);
                                }}
                                className="w-full bg-transparent border-none outline-none relative z-10"
                                style={{ color: theme.accentColor, caretColor: theme.accentColor }}
                                spellCheck="false"
                                autoComplete="off"
                            />
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-8 text-xs font-mono animate-screen-turn-on" style={{ color: theme.accentColor, opacity: 0.6 }}>
                PRESS 'ESC' TO ABORT SESSION
            </div>
        </div>
      )}

      {/* Add/Edit Task Modal - Ensure High Z-Index */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" onClick={resetModal}></div>
          <div className={`relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 slide-in-from-bottom-4 select-text ${theme.cardBg} ${theme.text}`}>
            <div className={`px-8 py-6 border-b flex justify-between items-center ${theme.headerBg} ${theme.headerBorder}`}>
              <h2 className="font-bold text-xl tracking-tight">{editingTaskId ? 'Edit Task' : 'Add New Task'}</h2>
              <button onClick={resetModal} className="p-2 rounded-full hover:bg-black/5 transition-colors active:scale-90"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div><label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${theme.subtext}`}>Task Details</label><input autoFocus type="text" placeholder="What needs to be done?" className={`w-full text-lg font-medium border-b-2 py-2 bg-transparent focus:outline-none transition-all ${theme.headerBorder} focus:border-${theme.accent}-500 focus:pl-2`} value={newTaskContent} onChange={(e) => setNewTaskContent(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-6">
                <div><label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${theme.subtext}`}>Course</label><select value={newTaskCourse} onChange={(e) => setNewTaskCourse(e.target.value)} className={`w-full p-3 rounded-xl border bg-transparent transition-all outline-none focus:ring-2 focus:ring-${theme.accent}-500/30 hover:border-${theme.accent}-500/50 ${theme.cardBorder}`}>{Object.entries(courses).map(([k, v]) => <option key={k} value={k} className="bg-stone-800 text-white">{k}</option>)}</select></div>
                <div>
                  <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${theme.subtext}`}>Type</label>
                  <div className="flex gap-2 flex-wrap">
                    {Object.keys(TASK_TYPES).map(type => (
                      <button key={type} onClick={() => setNewTaskType(type)} className={`p-2 rounded-lg border text-xs font-medium flex-1 transition-all active:scale-95 ${newTaskType === type ? `bg-${theme.accent}-500/10 border-${theme.accent}-500 text-${theme.accent}-500` : `border-transparent hover:bg-black/5`}`}>{type}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div><label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${theme.subtext}`}>Due Date</label><input type="date" value={newTaskDate} onChange={(e) => setNewTaskDate(e.target.value)} className={`w-full p-3 rounded-xl border bg-transparent transition-all outline-none focus:ring-2 focus:ring-${theme.accent}-500/30 hover:border-${theme.accent}-500/50 ${theme.cardBorder}`} /></div>
              <div><label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${theme.subtext}`}>Due Time</label><input type="time" value={newTaskTime} onChange={(e) => setNewTaskTime(e.target.value)} className={`w-full p-3 rounded-xl border bg-transparent transition-all outline-none focus:ring-2 focus:ring-${theme.accent}-500/30 hover:border-${theme.accent}-500/50 ${theme.cardBorder}`} /></div>
            </div>
            <div className={`p-6 border-t flex justify-end gap-3 ${theme.headerBg} ${theme.headerBorder}`}>
              <button onClick={resetModal} className={`px-6 py-3 text-sm font-bold rounded-xl hover:bg-black/5 transition-all active:scale-95 ${theme.subtext}`}>Cancel</button>
              <button onClick={handleSaveTask} className={`px-8 py-3 text-sm font-bold bg-${theme.accent}-600 text-white rounded-xl shadow-lg shadow-${theme.accent}-500/30 transition-all hover:brightness-110 active:scale-95 hover:translate-y-[-1px]`}>{editingTaskId ? 'Save Changes' : 'Create Task'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setIsSettingsOpen(false)}></div>
          <div className={`relative w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 slide-in-from-bottom-4 flex flex-col max-h-[85vh] select-text ${theme.cardBg} ${theme.text}`}>
            <div className={`px-8 py-6 border-b flex justify-between items-center ${theme.headerBg} ${theme.headerBorder}`}>
              <h2 className="font-bold text-xl tracking-tight">Settings</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 rounded-full hover:bg-black/5 transition-colors active:scale-90"><X size={20} /></button>
            </div>
            <div className="p-8 overflow-y-auto space-y-8">
              <div>
                <h3 className={`text-xs font-bold uppercase mb-4 ${theme.subtext}`}><Palette size={14} className="inline mr-2" />Themes</h3>
                <div className="flex gap-3 overflow-x-auto pb-4 pt-2 px-1 snap-x">
                  {Object.values(THEMES).map((t) => (
                    <button 
                      key={t.id} 
                      onClick={() => setCurrentThemeId(t.id)} 
                      className={`flex-shrink-0 group relative flex flex-col items-center gap-2 snap-start transition-all duration-200 active:scale-90`}
                    >
                      <div 
                        className={`w-12 h-12 rounded-full border-2 transition-all duration-300 shadow-sm ${currentThemeId === t.id ? `ring-2 ring-${theme.accent}-500 ring-offset-2 ring-offset-${theme.bg.replace('bg-', '')}` : 'hover:scale-110'}`}
                        style={{ background: t.id === 'light' ? '#f2f0e9' : t.bg.includes('#') ? t.bg.split('[')[1].split(']')[0] : 'var(--theme-bg)', borderColor: t.headerBorder.includes('border-') ? '' : 'currentColor' }}
                      >
                        <div className={`w-3 h-3 rounded-full absolute top-1 right-1 border border-white/20`} style={{ backgroundColor: t.accentColor }}></div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${currentThemeId === t.id ? `text-${theme.accent}-500` : theme.subtext}`}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className={`h-px w-full ${theme.headerBorder} border-t transition-colors duration-300`}></div>
              <div>
                <h3 className={`text-xs font-bold uppercase mb-4 ${theme.subtext}`}>Add Course</h3>
                <div className="flex gap-3">
                  <input type="text" placeholder="Code" value={newCourseCode} onChange={e => setNewCourseCode(e.target.value.toUpperCase())} className={`p-3 rounded-xl border bg-transparent w-24 transition-all outline-none focus:ring-2 focus:ring-${theme.accent}-500/30 ${theme.cardBorder}`} />
                  <input type="text" placeholder="Name" value={newCourseName} onChange={e => setNewCourseName(e.target.value)} className={`p-3 rounded-xl border bg-transparent flex-1 transition-all outline-none focus:ring-2 focus:ring-${theme.accent}-500/30 ${theme.cardBorder}`} />
                  <select value={newCourseColor} onChange={e => setNewCourseColor(e.target.value)} className={`p-3 rounded-xl border bg-transparent transition-all outline-none focus:ring-2 focus:ring-${theme.accent}-500/30 ${theme.cardBorder}`}>{COLORS.map(c => <option key={c} value={c} className="bg-stone-800 text-white">{c}</option>)}</select>
                  <button onClick={addCourse} className={`px-5 bg-${theme.accent}-600 text-white rounded-xl font-bold transition-all hover:brightness-110 active:scale-95 shadow-lg shadow-${theme.accent}-500/20`}>+</button>
                </div>
                <div className="mt-4 space-y-2">
                  {Object.entries(courses).map(([code, data]) => (
                    <div key={code} className={`flex justify-between p-3 border rounded-xl transition-colors duration-200 hover:border-${theme.accent}-500/30 ${theme.cardBorder}`}>
                      <span className={`text-xs px-2 py-1 rounded-md font-bold transition-colors duration-200 ${getCourseStyle(data.baseColor, theme.type === 'dark')}`}>{code}</span>
                      <span className="text-sm opacity-70 font-medium pt-0.5">{data.name}</span>
                      <button onClick={() => deleteCourse(code)} className="text-rose-500 transition-transform active:scale-90 hover:bg-rose-500/10 p-1.5 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`h-px w-full ${theme.headerBorder} border-t transition-colors duration-300`}></div>
              <div>
                <h3 className={`text-xs font-bold uppercase mb-4 ${theme.subtext}`}>Data Management</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium">
                    <Save size={16} /> <span>Auto-save active</span>
                  </div>
                  <button onClick={resetAllData} className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl text-sm font-bold hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 active:scale-95">
                    <RefreshCw size={14} /> Reset All Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}