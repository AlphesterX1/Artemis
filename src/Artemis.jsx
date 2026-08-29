import React, {
  useState,
  useReducer,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Terminal as TerminalIcon,
  Folder,
  FolderOpen,
  Kanban,
  X,
  Minus,
  Square,
  Maximize2,
  Check,
  Trash2,
  Pencil,
  Plus,
  Network,
  Rocket,
  Clock,
  GripVertical,
  Sparkles,
  ListTree,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Utilities                                                          */
/* ------------------------------------------------------------------ */

let __uidCounter = 0;
function uid(prefix) {
  __uidCounter += 1;
  return `${prefix}_${__uidCounter}_${Math.random().toString(36).slice(2, 7)}`;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

const norm = (s) => (s || "").trim().toLowerCase();

function findBoardKey(boards, name) {
  const n = norm(name);
  return Object.keys(boards).find((k) => norm(k) === n) || null;
}
function findProjectKey(projects, name) {
  const n = norm(name);
  return projects.find((p) => norm(p) === n) || null;
}
function findTaskByName(tasks, name) {
  const n = norm(name);
  const matches = tasks.filter((t) => norm(t.name) === n);
  if (matches.length === 1) return matches[0];
  const partial = tasks.filter((t) => norm(t.name).includes(n));
  if (partial.length === 1) return partial[0];
  return null;
}

function countStats(board) {
  const total = board.tasks.length;
  const done = board.tasks.filter((t) => t.done).length;
  return { total, done, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

function collectDescendantTaskIds(tasks, rootId) {
  const ids = [rootId];
  let frontier = [rootId];
  while (frontier.length) {
    const next = [];
    tasks.forEach((t) => {
      if (t.parentId && frontier.includes(t.parentId) && !ids.includes(t.id)) {
        ids.push(t.id);
        next.push(t.id);
      }
    });
    frontier = next;
  }
  return ids;
}

function boardChildren(boards, key) {
  return Object.keys(boards).filter(
    (k) => boards[k].parent && norm(boards[k].parent) === norm(key)
  );
}

function isAncestorBoard(boards, candidateAncestorKey, key) {
  let cur = boards[key] ? boards[key].parent : null;
  let guard = 0;
  while (cur && guard < 500) {
    if (norm(cur) === norm(candidateAncestorKey)) return true;
    cur = boards[cur] ? boards[cur].parent : null;
    guard += 1;
  }
  return false;
}

function buildTaskTree(items) {
  const byId = new Map();
  items.forEach((it) => byId.set(it.id, { ...it, children: [] }));
  const roots = [];
  items.forEach((it) => {
    const node = byId.get(it.id);
    if (it.parentId && byId.has(it.parentId)) {
      byId.get(it.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function flattenWithDepth(nodes, depth = 0, out = []) {
  nodes.forEach((n) => {
    const { children, ...rest } = n;
    out.push({ ...rest, depth });
    if (children && children.length) flattenWithDepth(children, depth + 1, out);
  });
  return out;
}

function layoutBoardForest(boards, w, h) {
  const keys = Object.keys(boards);
  const isRoot = (k) => !boards[k].parent || !boards[boards[k].parent];
  const rootKeys = keys.filter(isRoot);
  const childrenOf = (k) => keys.filter((kk) => boards[kk].parent === k);
  const cx = w / 2;
  const cy = h / 2;
  const ringGap = Math.max(56, Math.min(w, h) / 5.2);
  const positions = {};

  function place(key, depth, aFrom, aTo) {
    const angle = (aFrom + aTo) / 2;
    const r = depth * ringGap;
    const rad = ((angle - 90) * Math.PI) / 180;
    positions[key] = { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad), depth };
    const kids = childrenOf(key);
    if (kids.length) {
      const span = aTo - aFrom;
      const step = span / kids.length;
      kids.forEach((ck, i) => place(ck, depth + 1, aFrom + i * step, aFrom + (i + 1) * step));
    }
  }
  const angleStep = 360 / Math.max(rootKeys.length, 1);
  rootKeys.forEach((k, i) => place(k, 1, i * angleStep, (i + 1) * angleStep));
  return positions;
}

const STORAGE_KEY = "artemis-os-state-v1";

/* ------------------------------------------------------------------ */
/*  Initial state                                                      */
/* ------------------------------------------------------------------ */

function makeInitialState() {
  const t1 = uid("t");
  const t2 = uid("t");
  const t3 = uid("t");
  const t4 = uid("t");
  return {
    boards: {
      "getting-started": {
        tasks: [
          { id: t1, name: "Open the File Manager", done: true, parentId: null },
          { id: t2, name: "Press Shift+T to summon the terminal", done: false, parentId: null },
          { id: t3, name: "Try: board -add sprint-1", done: false, parentId: null },
          { id: t4, name: "Drag a task onto another to nest it", done: false, parentId: null },
        ],
        parent: null,
        tags: ["demo"],
      },
      "sprint-1": { tasks: [], parent: null, tags: [] },
    },
    projects: ["artemis-os"],
    windows: [],
    activeBoard: null,
  };
}

/* ------------------------------------------------------------------ */
/*  Reducer                                                             */
/* ------------------------------------------------------------------ */

function osReducer(state, action) {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, ...action.payload };

    case "ADD_BOARD": {
      const name = action.name.trim();
      if (!name || state.boards[name]) return state;
      let parent = action.parent || null;
      if (parent && !state.boards[parent]) parent = null;
      return {
        ...state,
        boards: {
          ...state.boards,
          [name]: { tasks: [], parent, tags: action.tags || [] },
        },
      };
    }
    case "DELETE_BOARD": {
      const { name } = action;
      if (!state.boards[name]) return state;
      const grandParent = state.boards[name].parent;
      const boards = { ...state.boards };
      delete boards[name];
      Object.keys(boards).forEach((k) => {
        if (boards[k].parent === name) boards[k] = { ...boards[k], parent: grandParent };
      });
      const windows = state.windows.filter(
        (w) => !(w.kind === "board" && w.boardName === name)
      );
      return {
        ...state,
        boards,
        windows,
        activeBoard: state.activeBoard === name ? null : state.activeBoard,
      };
    }
    case "RENAME_BOARD": {
      const { oldName, newName } = action;
      const clean = newName.trim();
      if (!state.boards[oldName] || !clean || state.boards[clean]) return state;
      const boards = { ...state.boards };
      boards[clean] = boards[oldName];
      delete boards[oldName];
      Object.keys(boards).forEach((k) => {
        if (boards[k].parent === oldName) boards[k] = { ...boards[k], parent: clean };
      });
      const windows = state.windows.map((w) =>
        w.kind === "board" && w.boardName === oldName ? { ...w, boardName: clean } : w
      );
      return {
        ...state,
        boards,
        windows,
        activeBoard: state.activeBoard === oldName ? clean : state.activeBoard,
      };
    }
    case "SET_BOARD_PARENT": {
      const { child, parent } = action;
      if (!state.boards[child] || !state.boards[parent]) return state;
      if (norm(child) === norm(parent)) return state;
      if (isAncestorBoard(state.boards, child, parent)) return state;
      return {
        ...state,
        boards: { ...state.boards, [child]: { ...state.boards[child], parent } },
      };
    }
    case "UNSET_BOARD_PARENT": {
      const { name } = action;
      if (!state.boards[name]) return state;
      return { ...state, boards: { ...state.boards, [name]: { ...state.boards[name], parent: null } } };
    }
    case "TAG_BOARD": {
      const { name, tag } = action;
      const board = state.boards[name];
      if (!board || board.tags.includes(tag)) return state;
      return { ...state, boards: { ...state.boards, [name]: { ...board, tags: [...board.tags, tag] } } };
    }
    case "UNTAG_BOARD": {
      const { name, tag } = action;
      const board = state.boards[name];
      if (!board) return state;
      return {
        ...state,
        boards: { ...state.boards, [name]: { ...board, tags: board.tags.filter((t) => norm(t) !== norm(tag)) } },
      };
    }
    case "ADD_TASK": {
      const { board, name, parentId } = action;
      const b = state.boards[board];
      if (!b) return state;
      const clean = name.trim();
      if (!clean) return state;
      const task = { id: uid("task"), name: clean, done: false, parentId: parentId || null };
      return { ...state, boards: { ...state.boards, [board]: { ...b, tasks: [...b.tasks, task] } } };
    }
    case "TOGGLE_TASK": {
      const { board, taskId, done } = action;
      const b = state.boards[board];
      if (!b) return state;
      const affected = new Set(collectDescendantTaskIds(b.tasks, taskId));
      return {
        ...state,
        boards: {
          ...state.boards,
          [board]: { ...b, tasks: b.tasks.map((t) => (affected.has(t.id) ? { ...t, done } : t)) },
        },
      };
    }
    case "CHECK_ALL": {
      const { board, mark } = action;
      const b = state.boards[board];
      if (!b) return state;
      return {
        ...state,
        boards: { ...state.boards, [board]: { ...b, tasks: b.tasks.map((t) => ({ ...t, done: mark })) } },
      };
    }
    case "CLEAR_DONE": {
      const { board } = action;
      const b = state.boards[board];
      if (!b) return state;
      const doneIds = new Set(b.tasks.filter((t) => t.done).map((t) => t.id));
      const resolveParent = (pid) => {
        let cur = pid;
        while (cur && doneIds.has(cur)) {
          const parentTask = b.tasks.find((t) => t.id === cur);
          cur = parentTask ? parentTask.parentId : null;
        }
        return cur || null;
      };
      return {
        ...state,
        boards: {
          ...state.boards,
          [board]: {
            ...b,
            tasks: b.tasks.filter((t) => !doneIds.has(t.id)).map((t) => ({ ...t, parentId: resolveParent(t.parentId) })),
          },
        },
      };
    }
    case "RENAME_TASK": {
      const { board, taskId, name } = action;
      const b = state.boards[board];
      const clean = name.trim();
      if (!b || !clean) return state;
      return {
        ...state,
        boards: { ...state.boards, [board]: { ...b, tasks: b.tasks.map((t) => (t.id === taskId ? { ...t, name: clean } : t)) } },
      };
    }
    case "DELETE_TASK": {
      const { board, taskId } = action;
      const b = state.boards[board];
      if (!b) return state;
      const target = b.tasks.find((t) => t.id === taskId);
      const grandParentId = target ? target.parentId : null;
      return {
        ...state,
        boards: {
          ...state.boards,
          [board]: {
            ...b,
            tasks: b.tasks
              .filter((t) => t.id !== taskId)
              .map((t) => (t.parentId === taskId ? { ...t, parentId: grandParentId } : t)),
          },
        },
      };
    }
    case "SET_TASK_PARENT": {
      const { board, taskId, parentId } = action;
      const b = state.boards[board];
      if (!b) return state;
      if (taskId === parentId) return state;
      let cursor = parentId;
      const byId = Object.fromEntries(b.tasks.map((t) => [t.id, t]));
      while (cursor) {
        if (cursor === taskId) return state;
        cursor = byId[cursor] ? byId[cursor].parentId : null;
      }
      return {
        ...state,
        boards: { ...state.boards, [board]: { ...b, tasks: b.tasks.map((t) => (t.id === taskId ? { ...t, parentId } : t)) } },
      };
    }
    case "MOVE_TASK": {
      const { fromBoard, toBoard, taskId } = action;
      const src = state.boards[fromBoard];
      const tgt = state.boards[toBoard];
      if (!src || !tgt) return state;
      const subtree = new Set(collectDescendantTaskIds(src.tasks, taskId));
      const moving = src.tasks
        .filter((t) => subtree.has(t.id))
        .map((t) => (t.id === taskId ? { ...t, parentId: null } : t));
      return {
        ...state,
        boards: {
          ...state.boards,
          [fromBoard]: { ...src, tasks: src.tasks.filter((t) => !subtree.has(t.id)) },
          [toBoard]: { ...tgt, tasks: [...tgt.tasks, ...moving] },
        },
      };
    }
    case "ADD_PROJECT": {
      const name = action.name.trim();
      if (!name || state.projects.includes(name)) return state;
      return { ...state, projects: [...state.projects, name] };
    }
    case "RENAME_PROJECT": {
      const { oldName, newName } = action;
      if (!state.projects.includes(oldName) || state.projects.includes(newName)) return state;
      const boards = { ...state.boards };
      Object.keys(boards).forEach((k) => {
        if ((boards[k].tags || []).some((t) => norm(t) === norm(oldName))) {
          boards[k] = { ...boards[k], tags: boards[k].tags.map((t) => (norm(t) === norm(oldName) ? newName : t)) };
        }
      });
      return {
        ...state,
        boards,
        projects: state.projects.map((p) => (p === oldName ? newName : p)),
      };
    }
    case "DELETE_PROJECT": {
      const { name } = action;
      const boards = { ...state.boards };
      Object.keys(boards).forEach((k) => {
        if ((boards[k].tags || []).some((t) => norm(t) === norm(name))) {
          boards[k] = { ...boards[k], tags: boards[k].tags.filter((t) => norm(t) !== norm(name)) };
        }
      });
      return {
        ...state,
        boards,
        projects: state.projects.filter((p) => norm(p) !== norm(name)),
        windows: state.windows.filter((w) => !(w.kind === "project" && norm(w.projectName) === norm(name))),
      };
    }
    case "SET_ACTIVE_BOARD":
      return { ...state, activeBoard: action.name };

    case "OPEN_WINDOW": {
      const { kind, boardName, projectName, rect } = action;
      const singleton = kind === "terminal" || kind === "file-manager" || kind === "graph";
      let existing = null;
      if (singleton) existing = state.windows.find((w) => w.kind === kind);
      else if (kind === "board") existing = state.windows.find((w) => w.kind === "board" && w.boardName === boardName);
      else if (kind === "project") existing = state.windows.find((w) => w.kind === "project" && w.projectName === projectName);
      const maxZ = state.windows.reduce((m, w) => Math.max(m, w.z), 0);
      if (existing) {
        return {
          ...state,
          windows: state.windows.map((w) => (w.id === existing.id ? { ...w, minimized: false, z: maxZ + 1 } : w)),
        };
      }
      const count = state.windows.length;
      const dims = {
        terminal: { w: 720, h: 460 },
        "file-manager": { w: 680, h: 460 },
        board: { w: 640, h: 460 },
        graph: { w: 620, h: 440 },
        project: { w: 480, h: 380 },
      }[kind] || { w: 560, h: 400 };
      const maxX = Math.max(40, (rect?.width || 1200) - dims.w - 20);
      const maxY = Math.max(40, (rect?.height || 700) - dims.h - 20);
      const win = {
        id: uid("w"),
        kind,
        boardName: boardName || null,
        projectName: projectName || null,
        x: clamp(60 + ((count * 34) % 260), 10, maxX),
        y: clamp(40 + ((count * 28) % 200), 10, maxY),
        width: dims.w,
        height: dims.h,
        z: maxZ + 1,
        minimized: false,
        maximized: false,
        prev: null,
      };
      return { ...state, windows: [...state.windows, win] };
    }
    case "CLOSE_WINDOW":
      return { ...state, windows: state.windows.filter((w) => w.id !== action.id) };
    case "FOCUS_WINDOW": {
      const maxZ = state.windows.reduce((m, w) => Math.max(m, w.z), 0);
      return { ...state, windows: state.windows.map((w) => (w.id === action.id ? { ...w, z: maxZ + 1 } : w)) };
    }
    case "MINIMIZE_WINDOW":
      return { ...state, windows: state.windows.map((w) => (w.id === action.id ? { ...w, minimized: true } : w)) };
    case "RESTORE_WINDOW": {
      const maxZ = state.windows.reduce((m, w) => Math.max(m, w.z), 0);
      return {
        ...state,
        windows: state.windows.map((w) => (w.id === action.id ? { ...w, minimized: false, z: maxZ + 1 } : w)),
      };
    }
    case "TOGGLE_MAXIMIZE": {
      const { id, rect } = action;
      return {
        ...state,
        windows: state.windows.map((w) => {
          if (w.id !== id) return w;
          if (w.maximized) {
            return {
              ...w,
              maximized: false,
              x: w.prev?.x ?? w.x,
              y: w.prev?.y ?? w.y,
              width: w.prev?.width ?? w.width,
              height: w.prev?.height ?? w.height,
              prev: null,
            };
          }
          return {
            ...w,
            maximized: true,
            prev: { x: w.x, y: w.y, width: w.width, height: w.height },
            x: 8,
            y: 8,
            width: (rect?.width || 1200) - 16,
            height: (rect?.height || 700) - 16,
          };
        }),
      };
    }
    case "MOVE_WINDOW":
      return { ...state, windows: state.windows.map((w) => (w.id === action.id ? { ...w, x: action.x, y: action.y } : w)) };

    case "RESET":
      return makeInitialState();

    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/*  Custom cursor                                                      */
/* ------------------------------------------------------------------ */

function CustomCursor({ containerRef }) {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const pos = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const [variant, setVariant] = useState("default");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      pos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`;
      }
      setVisible(true);
      const target = e.target.closest("button, a, [data-cursor-hover]");
      const isText = e.target.closest("input, textarea");
      const isDrag = e.target.closest("[data-cursor-drag]");
      setVariant(isDrag ? "drag" : target ? "pointer" : isText ? "text" : "default");
    };
    const onLeave = () => setVisible(false);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [containerRef]);

  useEffect(() => {
    let raf;
    const animate = () => {
      ring.current.x += (pos.current.x - ring.current.x) * 0.22;
      ring.current.y += (pos.current.y - ring.current.y) * 0.22;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  const ringClass =
    variant === "pointer"
      ? "w-9 h-9 border-2 border-violet-500 bg-violet-500/10"
      : variant === "drag"
      ? "w-10 h-10 border-2 border-dashed border-violet-600 bg-violet-500/15"
      : variant === "text"
      ? "w-[3px] h-5 rounded-sm border-none bg-violet-600"
      : "w-6 h-6 border border-violet-400/70 bg-violet-400/5";

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[10000]"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 150ms ease" }}
    >
      <div
        ref={ringRef}
        className={`pointer-events-none absolute left-0 top-0 rounded-full transition-[width,height,background-color,border-color] duration-150 ${ringClass}`}
      />
      <div
        ref={dotRef}
        className="pointer-events-none absolute left-0 top-0 h-1.5 w-1.5 rounded-full bg-violet-700 shadow-[0_0_6px_rgba(124,58,237,0.6)]"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small reusable UI: modal dialog (replaces window.prompt/confirm)   */
/* ------------------------------------------------------------------ */

function Modal({ title, children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-[fadeIn_120ms_ease-out]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[360px] scale-100 animate-[popIn_180ms_ease-out] rounded-2xl border border-white/60 bg-white/90 shadow-2xl backdrop-blur-xl p-5">
        <div className="mb-3 text-sm font-semibold text-violet-900">{title}</div>
        {children}
      </div>
    </div>
  );
}

function PromptModal({ title, initial = "", confirmLabel = "Create", onSubmit, onClose }) {
  const [value, setValue] = useState(initial);
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  return (
    <Modal title={title} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) onSubmit(value.trim());
        }}
      >
        <input
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-violet-950 outline-none focus:ring-2 focus:ring-violet-400"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-violet-700 transition-transform hover:bg-violet-100 active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition-transform hover:bg-violet-700 active:scale-95"
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ConfirmModal({ title, message, danger, onConfirm, onClose }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-violet-700">{message}</p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-lg px-3 py-1.5 text-sm text-violet-700 transition-transform hover:bg-violet-100 active:scale-95"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-transform active:scale-95 ${
            danger ? "bg-rose-500 hover:bg-rose-600" : "bg-violet-600 hover:bg-violet-700"
          }`}
        >
          Confirm
        </button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Window frame                                                       */
/* ------------------------------------------------------------------ */

function WindowFrame({ win, title, icon, dark, isTop, onClose, onMinimize, onToggleMax, onFocus, onDragStart, children }) {
  if (win.minimized) return null;
  return (
    <div
      className={`absolute flex flex-col overflow-hidden rounded-xl border shadow-2xl transition-shadow duration-200 will-change-transform animate-[winIn_220ms_cubic-bezier(0.16,1,0.3,1)] ${
        dark ? "border-amber-900/60 bg-[#0b0906]" : "border-white/60 bg-white/75 backdrop-blur-xl"
      } ${isTop ? "ring-1 ring-violet-300/70" : ""}`}
      style={{ left: win.x, top: win.y, width: win.width, height: win.height, zIndex: win.z }}
      onMouseDown={onFocus}
    >
      <div
        className={`flex select-none items-center gap-2 px-3 py-2 ${
          dark ? "bg-gradient-to-b from-amber-950/80 to-[#0b0906] text-amber-300" : "bg-white/70 text-violet-900"
        }`}
        style={{ cursor: "inherit" }}
        data-cursor-drag
        onMouseDown={(e) => {
          onFocus();
          onDragStart(e);
        }}
        onDoubleClick={onToggleMax}
      >
        <span className={dark ? "text-amber-400" : "text-violet-500"}>{icon}</span>
        <span className="text-xs font-semibold tracking-wide">{title}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onMinimize}
            className={`grid h-5 w-5 place-items-center rounded-full transition-transform hover:scale-110 active:scale-90 ${
              dark ? "bg-amber-900/40 hover:bg-amber-800/60 text-amber-300" : "bg-violet-100 hover:bg-violet-200 text-violet-700"
            }`}
            title="Minimize"
          >
            <Minus size={11} />
          </button>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onToggleMax}
            className={`grid h-5 w-5 place-items-center rounded-full transition-transform hover:scale-110 active:scale-90 ${
              dark ? "bg-amber-900/40 hover:bg-amber-800/60 text-amber-300" : "bg-violet-100 hover:bg-violet-200 text-violet-700"
            }`}
            title="Maximize"
          >
            {win.maximized ? <Square size={9} /> : <Maximize2 size={9} />}
          </button>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onClose}
            className="grid h-5 w-5 place-items-center rounded-full bg-rose-400/80 text-white transition-transform hover:scale-110 hover:bg-rose-500 active:scale-90"
            title="Close"
          >
            <X size={11} />
          </button>
        </div>
      </div>
      <div className={`min-h-0 flex-1 ${dark ? "" : "overflow-auto"}`}>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  File Manager                                                       */
/* ------------------------------------------------------------------ */

function FileManagerApp({ boards, dispatch, openWindow }) {
  const [menu, setMenu] = useState(null);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const names = Object.keys(boards).sort();

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-white/40 to-violet-50/40">
      <div className="flex items-center justify-between border-b border-violet-100 px-4 py-2">
        <div className="text-xs font-medium text-violet-500">Boards · {names.length}</div>
        <button
          onClick={() => setModal({ type: "new" })}
          className="flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-medium text-white shadow transition-transform hover:bg-violet-700 active:scale-95"
        >
          <Kanban size={13} /> New Board
        </button>
      </div>

      <div className="grid flex-1 auto-rows-min grid-cols-3 gap-4 overflow-auto p-4 sm:grid-cols-4">
        {names.length === 0 && (
          <div className="col-span-full mt-10 text-center text-sm text-violet-400">
            No boards yet — create one to get started.
          </div>
        )}
        {names.map((name, i) => {
          const { total, done, pct } = countStats(boards[name]);
          const parent = boards[name].parent;
          return (
            <button
              key={name}
              style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}
              onDoubleClick={() => openWindow("board", { boardName: name })}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenu({ name, x: e.clientX, y: e.clientY });
              }}
              className="group flex animate-[popIn_220ms_ease-out_backwards] flex-col items-center gap-1.5 rounded-xl p-2 text-center transition-transform hover:-translate-y-0.5 hover:bg-violet-100/70"
            >
              <div className="relative">
                <Folder size={40} className="text-violet-400 drop-shadow-sm transition-colors group-hover:text-violet-500" strokeWidth={1.5} />
                <span className="absolute -bottom-1 -right-1 rounded-full bg-violet-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                  {done}/{total}
                </span>
              </div>
              <span className="line-clamp-1 max-w-[92px] text-[11px] font-medium text-violet-800">{name}</span>
              {parent && <span className="text-[9px] text-violet-400">in {parent}</span>}
              <div className="h-1 w-16 overflow-hidden rounded-full bg-violet-100">
                <div className="h-full bg-violet-500 transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      {menu && (
        <div
          className="fixed z-[9998] w-40 origin-top-left animate-[popIn_120ms_ease-out] overflow-hidden rounded-lg border border-violet-100 bg-white shadow-xl"
          style={{ left: menu.x, top: menu.y }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              openWindow("board", { boardName: menu.name });
              setMenu(null);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-violet-700 hover:bg-violet-50"
          >
            <FolderOpen size={13} /> Open
          </button>
          <button
            onClick={() => {
              setModal({ type: "rename", name: menu.name });
              setMenu(null);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-violet-700 hover:bg-violet-50"
          >
            <Pencil size={13} /> Rename
          </button>
          {boards[menu.name]?.parent && (
            <button
              onClick={() => {
                dispatch({ type: "UNSET_BOARD_PARENT", name: menu.name });
                setMenu(null);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-violet-700 hover:bg-violet-50"
            >
              <ListTree size={13} /> Move to top level
            </button>
          )}
          <button
            onClick={() => {
              setModal({ type: "delete", name: menu.name });
              setMenu(null);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}

      {modal?.type === "new" && (
        <PromptModal
          title="Name your new board"
          confirmLabel="Create board"
          onClose={() => setModal(null)}
          onSubmit={(val) => {
            dispatch({ type: "ADD_BOARD", name: val });
            setModal(null);
          }}
        />
      )}
      {modal?.type === "rename" && (
        <PromptModal
          title={`Rename "${modal.name}"`}
          initial={modal.name}
          confirmLabel="Rename"
          onClose={() => setModal(null)}
          onSubmit={(val) => {
            dispatch({ type: "RENAME_BOARD", oldName: modal.name, newName: val });
            setModal(null);
          }}
        />
      )}
      {modal?.type === "delete" && (
        <ConfirmModal
          title="Delete board"
          message={`Delete "${modal.name}" and all of its tasks? This can't be undone.`}
          danger
          onClose={() => setModal(null)}
          onConfirm={() => dispatch({ type: "DELETE_BOARD", name: modal.name })}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Board window (dual pending / done view)                            */
/* ------------------------------------------------------------------ */

function buildColumnTree(tasks) {
  const byParent = {};
  tasks.forEach((t) => {
    const key = tasks.some((x) => x.id === t.parentId) ? t.parentId : "__root__";
    byParent[key] = byParent[key] || [];
    byParent[key].push(t);
  });
  return byParent;
}

function TaskRow({ task, depth, board, dispatch, onDrop }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.name);
  const [over, setOver] = useState(false);

  return (
    <div
      draggable={!editing}
      data-cursor-drag
      onDragStart={(e) => e.dataTransfer.setData("text/plain", task.id)}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        const draggedId = e.dataTransfer.getData("text/plain");
        if (draggedId && draggedId !== task.id) onDrop(draggedId, task.id);
      }}
      style={{ marginLeft: depth * 16 }}
      className={`group flex animate-[slideIn_160ms_ease-out] items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
        over ? "bg-violet-200/70 ring-1 ring-violet-400" : "hover:bg-white/70"
      }`}
    >
      <GripVertical size={12} className="shrink-0 text-violet-300" />
      <button
        onClick={() => dispatch({ type: "TOGGLE_TASK", board, taskId: task.id, done: !task.done })}
        className={`grid h-4 w-4 shrink-0 place-items-center rounded border transition-transform active:scale-90 ${
          task.done ? "border-violet-500 bg-violet-500 text-white" : "border-violet-300 bg-white"
        }`}
      >
        {task.done && <Check size={11} strokeWidth={3} className="animate-[popIn_180ms_ease-out]" />}
      </button>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setEditing(false);
            if (draft.trim()) dispatch({ type: "RENAME_TASK", board, taskId: task.id, name: draft });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              setDraft(task.name);
              setEditing(false);
            }
          }}
          className="flex-1 rounded border border-violet-300 bg-white px-1.5 py-0.5 text-xs outline-none"
        />
      ) : (
        <span
          onDoubleClick={() => setEditing(true)}
          className={`flex-1 truncate text-xs transition-colors ${task.done ? "text-violet-400 line-through" : "text-violet-900"}`}
        >
          {task.name}
        </span>
      )}
      <button
        onClick={() => dispatch({ type: "DELETE_TASK", board, taskId: task.id })}
        className="invisible shrink-0 rounded p-1 text-violet-300 transition-transform hover:bg-rose-50 hover:text-rose-500 group-hover:visible active:scale-90"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

function TaskColumn({ label, tasks, board, dispatch, accent }) {
  const tree = useMemo(() => buildColumnTree(tasks), [tasks]);

  const handleDrop = useCallback(
    (draggedId, targetId) => {
      dispatch({ type: "SET_TASK_PARENT", board, taskId: draggedId, parentId: targetId });
    },
    [board, dispatch]
  );

  const renderLevel = (parentKey, depth) =>
    (tree[parentKey] || []).map((t) => (
      <div key={t.id}>
        <TaskRow task={t} depth={depth} board={board} dispatch={dispatch} onDrop={handleDrop} />
        {renderLevel(t.id, depth + 1)}
      </div>
    ));

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const draggedId = e.dataTransfer.getData("text/plain");
        if (draggedId) dispatch({ type: "SET_TASK_PARENT", board, taskId: draggedId, parentId: null });
      }}
      className="flex min-h-0 flex-1 flex-col rounded-xl bg-white/50 p-2"
    >
      <div className={`mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide ${accent}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {label}
        <span className="ml-auto text-violet-400">{tasks.length}</span>
      </div>
      <div className="flex-1 space-y-0.5 overflow-auto pr-1">
        {tasks.length === 0 && <div className="px-2 py-3 text-[11px] text-violet-300">Nothing here</div>}
        {renderLevel("__root__", 0)}
      </div>
    </div>
  );
}

function BoardApp({ boardName, boards, dispatch }) {
  const board = boards[boardName];
  const [draft, setDraft] = useState("");
  if (!board) {
    return <div className="grid h-full place-items-center text-sm text-violet-400">Board deleted.</div>;
  }
  const pending = board.tasks.filter((t) => !t.done);
  const done = board.tasks.filter((t) => t.done);
  const { pct, total } = countStats(board);

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-white/40 to-violet-50/40">
      <div className="border-b border-violet-100 px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-violet-900">{boardName}</div>
          <div className="text-[11px] text-violet-400">{total} tasks · {pct}% done</div>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-violet-100">
          <div className="h-full bg-gradient-to-r from-violet-400 to-violet-600 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <form
          className="mt-2.5 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) {
              dispatch({ type: "ADD_TASK", board: boardName, name: draft, parentId: null });
              setDraft("");
            }
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a task and press Enter…"
            className="flex-1 rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-violet-300"
          />
          <button type="submit" className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition-transform hover:bg-violet-700 active:scale-95">
            <Plus size={13} />
          </button>
        </form>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 p-3">
        <TaskColumn label="Pending" tasks={pending} board={boardName} dispatch={dispatch} accent="text-amber-600" />
        <TaskColumn label="Done" tasks={done} board={boardName} dispatch={dispatch} accent="text-emerald-600" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Graph view (real board hierarchy, radial layout)                   */
/* ------------------------------------------------------------------ */

function GraphApp({ boards, openWindow }) {
  const [ref, setRef] = useState(null);
  const [size, setSize] = useState({ width: 600, height: 420 });
  useEffect(() => {
    if (!ref) return undefined;
    const update = () => setSize({ width: ref.clientWidth || 600, height: ref.clientHeight || 420 });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(ref);
    return () => ro.disconnect();
  }, [ref]);

  const keys = Object.keys(boards);
  const positions = keys.length ? layoutBoardForest(boards, size.width, size.height) : {};

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-white/40 to-violet-50/40 p-3">
      <div className="mb-1 text-xs font-medium text-violet-500">Board relationship graph</div>
      <div ref={setRef} className="relative flex-1 overflow-hidden">
        {keys.length === 0 && (
          <div className="grid h-full place-items-center text-xs text-violet-300">No boards yet</div>
        )}
        <svg width={size.width} height={size.height} className="absolute inset-0">
          {keys.map((k) => {
            const parent = boards[k].parent;
            if (!parent || !positions[parent] || !positions[k]) return null;
            const p1 = positions[parent];
            const p2 = positions[k];
            return (
              <line key={`e-${k}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#c4b5fd" strokeWidth={1.5} />
            );
          })}
        </svg>
        {keys.map((k, i) => {
          const p = positions[k];
          if (!p) return null;
          const { total, done } = countStats(boards[k]);
          const radius = 18 + Math.min(20, total * 3);
          const complete = done === total && total > 0;
          return (
            <button
              key={k}
              style={{
                left: p.x,
                top: p.y,
                width: radius * 2,
                height: radius * 2,
                transform: "translate(-50%, -50%)",
                animationDelay: `${i * 40}ms`,
              }}
              onClick={() => openWindow("board", { boardName: k })}
              className={`absolute flex flex-col items-center justify-center rounded-full border-2 text-center transition-transform animate-[popIn_220ms_ease-out_backwards] hover:scale-110 ${
                complete ? "border-violet-600 bg-violet-400" : "border-violet-500 bg-violet-100"
              } ${complete ? "animate-[pulse_2.4s_ease-in-out_infinite]" : ""}`}
            >
              <span className="w-full truncate px-1 text-[9px] font-semibold text-violet-800">{k}</span>
              <span className="text-[8px] text-violet-600">{done}/{total}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Project view                                                       */
/* ------------------------------------------------------------------ */

function ProjectApp({ projectName, boards, dispatch, openWindow }) {
  const keys = Object.keys(boards).filter((k) => (boards[k].tags || []).some((t) => norm(t) === norm(projectName)));
  return (
    <div className="flex h-full flex-col gap-3 bg-gradient-to-b from-white/40 to-violet-50/40 p-4">
      <div className="flex items-center gap-2">
        <Rocket size={16} className="text-violet-500" />
        <div className="text-sm font-semibold text-violet-900">@{projectName}</div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto rounded-xl bg-white/60 p-3">
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-violet-400">
          Tagged boards ({keys.length})
        </div>
        {keys.length === 0 && (
          <div className="px-1 text-xs text-violet-400">
            No boards tagged @{projectName} yet — try <code>board -tag &lt;name&gt; @{projectName}</code> in the terminal.
          </div>
        )}
        <div className="space-y-1">
          {keys.map((n) => {
            const { done, total } = countStats(boards[n]);
            return (
              <button
                key={n}
                onClick={() => openWindow("board", { boardName: n })}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-violet-700 transition-transform hover:translate-x-0.5 hover:bg-violet-100"
              >
                <Folder size={13} className="text-violet-400" /> {n}
                <span className="ml-auto text-violet-400">{done}/{total}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Terminal — rich command engine                                     */
/* ------------------------------------------------------------------ */

const THEMES = {
  amber: { text: "#ffb200", dim: "#a97a1f", faint: "#6b4c17", glow: "rgba(255,178,0,0.45)" },
  green: { text: "#33ff66", dim: "#1f9e42", faint: "#155c29", glow: "rgba(51,255,102,0.45)" },
  cyan: { text: "#4ee7ff", dim: "#2b93a8", faint: "#1a5866", glow: "rgba(78,231,255,0.45)" },
  paper: { text: "#f2ead8", dim: "#a89d84", faint: "#5f5748", glow: "rgba(242,234,216,0.35)" },
};

const HELP_LINES = [
  "commands:",
  "  board -add <name>                  create a new board",
  "  board -add <name> | <parent>       create it as a subboard",
  "  board -parent <board> | <parent>   move a board under a parent",
  "  board -unparent <board>            make a board top-level again",
  "  board -del <name>                  delete a board",
  "  board -rename <old> -> <new>       rename a board",
  "  board -tag <board> @<project>      tag an existing board",
  "  board -untag <board> @<project>    remove a tag from a board",
  "  board <name> -show                 show tasks in any board",
  "  ls                                 list boards, or tasks if inside one",
  "  cd <name> | cd ..                  enter / leave a board",
  "  pwd                                show where you are",
  "",
  "  task -add <name>                   add a task to the current board",
  "  task -add <name> | <parent task>   add it as a subtask",
  "  task -parent <task> | <parent>     move a task under a parent task",
  "  task -unparent <task>              make a task top-level again",
  "  task -check / -uncheck <name>      mark a task (+ subtasks) done/undone",
  "  task -check-all / -uncheck-all     mark every task in the board",
  "  task -del <name>                   delete a task (subtasks move up)",
  "  task -clear                        delete all completed tasks",
  "  task -rename <old> -> <new>        rename a task",
  "  task -move <task> -> <board>       move a task (+ subtasks) to another board",
  "",
  "  init <project>                     create a project tag",
  "  init -rename <old> -> <new>        rename a project",
  "  init -del <project>                remove a project (untags its boards)",
  "  projects                           list projects and their board counts",
  "  open -project <name>               open every board tagged with a project",
  "",
  "  vis <name>                         open a board window",
  "  vis -node                          open the relationship graph",
  "  vis -close <name>                  close a board window",
  "",
  "  find <text>                        search task names across all boards",
  "  stats                              show overall progress",
  "  history                            show recently run commands",
  "  theme <amber|green|cyan|paper>      change terminal theme",
  "  date · whoami · clear · help",
  "  reset -yes                         erase every board & task",
  "",
  "  aliases: mkdir = board -add   touch = task -add",
  "           rmdir = board -del   rm = task -del / board -del",
];

const COMMAND_WORDS = [
  "board", "task", "vis", "open", "init", "projects", "ls", "cd", "pwd",
  "whoami", "clear", "help", "find", "stats", "history", "theme", "date",
  "reset", "mkdir", "touch", "rm", "rmdir",
];

function getPromptStr(cwd) {
  return cwd ? `guest:~/${cwd}$` : "guest:~$";
}

function TerminalApp({ boards, projects, dispatch, openWindow, windows, theme, setTheme }) {
  const [cwd, setCwd] = useState(null);
  const [lines, setLines] = useState([
    { id: uid("l"), kind: "sys", text: "Artemis Terminal — type 'help' for commands." },
  ]);
  const [input, setInput] = useState("");
  const [cmdLog, setCmdLog] = useState([]);
  const [cmdPtr, setCmdPtr] = useState(-1);
  const [suggestIndex, setSuggestIndex] = useState(0);
  const [suggestOpen, setSuggestOpen] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [lines]);

  useEffect(() => {
    if (cwd && !boards[cwd]) setCwd(null);
  }, [boards, cwd]);

  const print = useCallback((text, kind = "out") => {
    setLines((L) => [...L, { id: uid("l"), kind, text }]);
  }, []);

  const th = THEMES[theme] || THEMES.amber;

  const printBoardList = useCallback(() => {
    const allKeys = Object.keys(boards);
    const rootKeys = allKeys.filter((k) => !boards[k].parent);
    if (allKeys.length === 0) return print("no boards yet — try `board -add <name>`");
    if (rootKeys.length === 0) return print("no top-level boards — every board is nested somewhere");
    const width = Math.max(...rootKeys.map((k) => k.length)) + 2;
    const lines = [
      `${rootKeys.length} board${rootKeys.length === 1 ? "" : "s"}` +
        (allKeys.length !== rootKeys.length ? ` (+${allKeys.length - rootKeys.length} nested)` : "") + ":",
    ];
    rootKeys.forEach((k) => {
      const { total, done } = countStats(boards[k]);
      const kids = boardChildren(boards, k).length;
      const tags = boards[k].tags || [];
      const tagBits = tags.length ? `  ${tags.map((t) => `@${t}`).join(" ")}` : "";
      lines.push(`  ${k.padEnd(width)}${done}/${total} done${kids ? `  (${kids} sub)` : ""}${tagBits}`);
    });
    print(lines.join("\n"));
  }, [boards, print]);

  const printBoardTasks = useCallback(
    (key) => {
      const board = boards[key];
      const { total, done } = countStats(board);
      const out = [`board: ${key} — ${done}/${total} done`];
      if (total === 0) {
        out.push("  (no tasks yet — try `task -add <name>`)");
      } else {
        const flat = flattenWithDepth(buildTaskTree(board.tasks));
        flat.forEach((t) => out.push(`  ${"  ".repeat(t.depth)}[${t.done ? "x" : " "}] ${t.name}`));
      }
      const kids = boardChildren(boards, key);
      if (kids.length) out.push(`subboards: ${kids.join(", ")}`);
      if (board.tags?.length) out.push(`tags: ${board.tags.map((t) => `@${t}`).join(", ")}`);
      print(out.join("\n"));
    },
    [boards, print]
  );

  function doCreateBoard(name, parentName, tagKey) {
    if (!name) return print("usage: board -add <name> [| <parent>] [@<project>]", "err");
    if (findBoardKey(boards, name)) return print(`board '${name}' already exists`, "err");
    let parentKey = null;
    if (parentName) {
      parentKey = findBoardKey(boards, parentName);
      if (!parentKey) return print(`no board named '${parentName}'`, "err");
    }
    dispatch({ type: "ADD_BOARD", name, parent: parentKey, tags: tagKey ? [tagKey] : [] });
    const bits = [];
    if (parentKey) bits.push(`under '${parentKey}'`);
    if (tagKey) bits.push(`tagged @${tagKey}`);
    print(`created board '${name}'${bits.length ? " " + bits.join(" ") : ""}`, "ok");
  }

  function handleBoardCommand(tokens) {
    const sub = tokens[1];
    if (!sub) return print("usage: board -add|-del|-parent|-unparent|-tag <name>   board <name> -show", "err");

    if (sub === "-add") {
      const argTokens = tokens.slice(2);
      let tagKey = null;
      const tagIdx = argTokens.findIndex((t) => t.startsWith("@") && t.length > 1);
      if (tagIdx !== -1) {
        const tagName = argTokens[tagIdx].slice(1);
        const found = findProjectKey(projects, tagName);
        if (!found) return print(`no project named '${tagName}' — try 'init ${tagName}' first`, "err");
        tagKey = found;
        argTokens.splice(tagIdx, 1);
      }
      const rest = argTokens.join(" ");
      const pipeIdx = rest.indexOf(" | ");
      const name = (pipeIdx === -1 ? rest : rest.slice(0, pipeIdx)).trim();
      const parentName = pipeIdx === -1 ? "" : rest.slice(pipeIdx + 3).trim();
      return doCreateBoard(name, parentName, tagKey);
    }
    if (sub === "-tag" || sub === "-untag") {
      const argTokens = tokens.slice(2);
      const tagIdx = argTokens.findIndex((t) => t.startsWith("@") && t.length > 1);
      if (tagIdx === -1) return print(`usage: board ${sub} <board> @<project>`, "err");
      const tagName = argTokens[tagIdx].slice(1);
      argTokens.splice(tagIdx, 1);
      const boardName = argTokens.join(" ").trim();
      const key = findBoardKey(boards, boardName);
      if (!key) return print(`no board named '${boardName}'`, "err");
      const projKey = findProjectKey(projects, tagName);
      if (!projKey) return print(`no project named '${tagName}' — try 'init ${tagName}' first`, "err");
      dispatch({ type: sub === "-tag" ? "TAG_BOARD" : "UNTAG_BOARD", name: key, tag: projKey });
      print(sub === "-tag" ? `tagged '${key}' @${projKey}` : `untagged '${key}' from @${projKey}`, "ok");
      return;
    }
    if (sub === "-del") {
      const name = tokens.slice(2).join(" ");
      const key = findBoardKey(boards, name);
      if (!key) return print(`no board named '${name}'`, "err");
      dispatch({ type: "DELETE_BOARD", name: key });
      print(`deleted board '${key}'`, "ok");
      return;
    }
    if (sub === "-parent") {
      const rest = tokens.slice(2).join(" ");
      const pipeIdx = rest.indexOf(" | ");
      if (pipeIdx === -1) return print("usage: board -parent <board> | <parent board>", "err");
      const childName = rest.slice(0, pipeIdx).trim();
      const parentName = rest.slice(pipeIdx + 3).trim();
      const childKey = findBoardKey(boards, childName);
      const parentKey = findBoardKey(boards, parentName);
      if (!childKey) return print(`no board named '${childName}'`, "err");
      if (!parentKey) return print(`no board named '${parentName}'`, "err");
      if (norm(childKey) === norm(parentKey)) return print("a board can't be its own parent", "err");
      if (isAncestorBoard(boards, childKey, parentKey)) {
        return print(`can't link — '${parentKey}' is already inside '${childKey}'`, "err");
      }
      dispatch({ type: "SET_BOARD_PARENT", child: childKey, parent: parentKey });
      print(`'${childKey}' is now a subboard of '${parentKey}'`, "ok");
      return;
    }
    if (sub === "-unparent") {
      const name = tokens.slice(2).join(" ");
      const key = findBoardKey(boards, name);
      if (!key) return print(`no board named '${name}'`, "err");
      if (!boards[key].parent) return print(`'${key}' is already top-level`, "err");
      dispatch({ type: "UNSET_BOARD_PARENT", name: key });
      print(`'${key}' is now top-level`, "ok");
      return;
    }
    if (sub === "-rename") {
      const rest = tokens.slice(2).join(" ");
      const arrowIdx = rest.indexOf(" -> ");
      if (arrowIdx === -1) return print("usage: board -rename <old> -> <new>", "err");
      const oldName = rest.slice(0, arrowIdx).trim();
      const newName = rest.slice(arrowIdx + 4).trim();
      const key = findBoardKey(boards, oldName);
      if (!key) return print(`no board named '${oldName}'`, "err");
      if (!newName) return print("usage: board -rename <old> -> <new>", "err");
      if (findBoardKey(boards, newName)) return print(`board '${newName}' already exists`, "err");
      dispatch({ type: "RENAME_BOARD", oldName: key, newName });
      if (cwd && norm(cwd) === norm(key)) setCwd(newName);
      print(`renamed '${key}' to '${newName}'`, "ok");
      return;
    }
    if (tokens[tokens.length - 1] === "-show") {
      const name = tokens.slice(1, -1).join(" ");
      const key = findBoardKey(boards, name);
      if (!key) return print(`no board named '${name}'`, "err");
      printBoardTasks(key);
      return;
    }
    print(`unknown board command: '${sub}' — try 'help'`, "err");
  }

  function handleTaskCommand(tokens) {
    if (!cwd) return print("you're not inside a board — try `cd <board>` first", "err");
    const sub = tokens[1];
    const name = tokens.slice(2).join(" ");
    const board = boards[cwd];

    if (sub === "-add") {
      const pipeIdx = name.indexOf(" | ");
      const taskName = (pipeIdx === -1 ? name : name.slice(0, pipeIdx)).trim();
      const parentName = pipeIdx === -1 ? "" : name.slice(pipeIdx + 3).trim();
      if (!taskName) return print("usage: task -add <name> [| <parent task>]", "err");
      if (findTaskByName(board.tasks, taskName)) return print(`task '${taskName}' already exists`, "err");
      let parentId = null;
      if (parentName) {
        const p = findTaskByName(board.tasks, parentName);
        if (!p) return print(`no task named '${parentName}'`, "err");
        parentId = p.id;
      }
      dispatch({ type: "ADD_TASK", board: cwd, name: taskName, parentId });
      print(parentId ? `added subtask '${taskName}' under '${parentName}'` : `added task '${taskName}'`, "ok");
      return;
    }
    if (sub === "-parent") {
      const pipeIdx = name.indexOf(" | ");
      if (pipeIdx === -1) return print("usage: task -parent <task> | <parent task>", "err");
      const childName = name.slice(0, pipeIdx).trim();
      const parentName = name.slice(pipeIdx + 3).trim();
      const childTask = findTaskByName(board.tasks, childName);
      const parentTask = findTaskByName(board.tasks, parentName);
      if (!childTask) return print(`no task named '${childName}'`, "err");
      if (!parentTask) return print(`no task named '${parentName}'`, "err");
      if (childTask.id === parentTask.id) return print("a task can't be its own parent", "err");
      dispatch({ type: "SET_TASK_PARENT", board: cwd, taskId: childTask.id, parentId: parentTask.id });
      print(`'${childName}' is now a subtask of '${parentName}'`, "ok");
      return;
    }
    if (sub === "-unparent") {
      const t = findTaskByName(board.tasks, name);
      if (!t) return print(`no task named '${name}'`, "err");
      dispatch({ type: "SET_TASK_PARENT", board: cwd, taskId: t.id, parentId: null });
      print(`'${name}' is now top-level`, "ok");
      return;
    }
    if (sub === "-check" || sub === "-uncheck") {
      const t = findTaskByName(board.tasks, name);
      if (!t) return print(`no task named '${name}'`, "err");
      dispatch({ type: "TOGGLE_TASK", board: cwd, taskId: t.id, done: sub === "-check" });
      print(sub === "-check" ? `checked '${name}'` : `unchecked '${name}'`, "ok");
      return;
    }
    if (sub === "-check-all" || sub === "-uncheck-all") {
      dispatch({ type: "CHECK_ALL", board: cwd, mark: sub === "-check-all" });
      print(sub === "-check-all" ? "checked every task" : "unchecked every task", "ok");
      return;
    }
    if (sub === "-del") {
      const t = findTaskByName(board.tasks, name);
      if (!t) return print(`no task named '${name}'`, "err");
      dispatch({ type: "DELETE_TASK", board: cwd, taskId: t.id });
      print(`deleted task '${name}'`, "ok");
      return;
    }
    if (sub === "-clear") {
      const removed = board.tasks.filter((t) => t.done).length;
      dispatch({ type: "CLEAR_DONE", board: cwd });
      print(`cleared ${removed} completed task${removed === 1 ? "" : "s"}`, "ok");
      return;
    }
    if (sub === "-rename") {
      const arrowIdx = name.indexOf(" -> ");
      if (arrowIdx === -1) return print("usage: task -rename <old> -> <new>", "err");
      const oldName = name.slice(0, arrowIdx).trim();
      const newName = name.slice(arrowIdx + 4).trim();
      const t = findTaskByName(board.tasks, oldName);
      if (!t) return print(`no task named '${oldName}'`, "err");
      if (!newName) return print("usage: task -rename <old> -> <new>", "err");
      dispatch({ type: "RENAME_TASK", board: cwd, taskId: t.id, name: newName });
      print(`renamed '${oldName}' to '${newName}'`, "ok");
      return;
    }
    if (sub === "-move") {
      const arrowIdx = name.indexOf(" -> ");
      if (arrowIdx === -1) return print("usage: task -move <task> -> <board>", "err");
      const taskName = name.slice(0, arrowIdx).trim();
      const targetName = name.slice(arrowIdx + 4).trim();
      const t = findTaskByName(board.tasks, taskName);
      if (!t) return print(`no task named '${taskName}'`, "err");
      const targetKey = findBoardKey(boards, targetName);
      if (!targetKey) return print(`no board named '${targetName}'`, "err");
      if (norm(targetKey) === norm(cwd)) return print(`'${taskName}' is already in '${cwd}'`, "err");
      if (findTaskByName(boards[targetKey].tasks, t.name)) {
        return print(`'${targetKey}' already has a task named '${t.name}'`, "err");
      }
      dispatch({ type: "MOVE_TASK", fromBoard: cwd, toBoard: targetKey, taskId: t.id });
      print(`moved '${t.name}' to '${targetKey}'`, "ok");
      return;
    }
    print(`unknown task command: '${sub}' — try 'help'`, "err");
  }

  const run = useCallback(
    (raw) => {
      const cmdStr = raw.trim();
      print(`${getPromptStr(cwd)} ${raw}`, "cmd");
      if (!cmdStr) return;
      setCmdLog((h) => [...h, cmdStr]);
      setCmdPtr(-1);

      const tokens = cmdStr.split(/\s+/);
      const head = tokens[0].toLowerCase();

      switch (head) {
        case "help":
          return print(HELP_LINES.join("\n"));
        case "clear":
          return setLines([]);
        case "pwd":
          return print(cwd ? `/${cwd}` : "/");
        case "whoami":
          return print("guest@artemis-os");
        case "ls":
          return cwd ? printBoardTasks(cwd) : printBoardList();
        case "cd": {
          const arg = tokens.slice(1).join(" ");
          if (!arg || arg === "." || arg === "..") {
            setCwd(null);
            return print("back at root");
          }
          const key = findBoardKey(boards, arg);
          if (!key) return print(`no board named '${arg}'`, "err");
          setCwd(key);
          dispatch({ type: "SET_ACTIVE_BOARD", name: key });
          return print(`now in '${key}'`, "ok");
        }
        case "board":
          return handleBoardCommand(tokens);
        case "task":
          return handleTaskCommand(tokens);
        case "vis": {
          if (tokens[1] === "-close") {
            const arg = tokens.slice(2).join(" ");
            const key = findBoardKey(boards, arg);
            const win = key ? windows.find((w) => w.kind === "board" && w.boardName === key) : null;
            if (!win) return print(`no open window for '${arg}'`, "err");
            dispatch({ type: "CLOSE_WINDOW", id: win.id });
            return print(`closed '${key}'`, "ok");
          }
          const arg = tokens.slice(1).join(" ").trim();
          if (arg === "-node") {
            openWindow("graph");
            return print("opened board graph");
          }
          if (!arg) return print("usage: vis <board name>   or   vis -node", "err");
          const key = findBoardKey(boards, arg);
          if (!key) return print(`no board named '${arg}'`, "err");
          openWindow("board", { boardName: key });
          return print(`opened '${key}'`, "ok");
        }
        case "find": {
          const query = tokens.slice(1).join(" ");
          if (!query) return print("usage: find <text>", "err");
          const q = query.toLowerCase();
          const out = [`results for '${query}':`];
          let matches = 0;
          Object.keys(boards).forEach((k) => {
            const hits = boards[k].tasks.filter((t) => t.name.toLowerCase().includes(q));
            if (hits.length) {
              out.push(`  ${k}:`);
              hits.forEach((t) => {
                out.push(`    [${t.done ? "x" : " "}] ${t.name}`);
                matches += 1;
              });
            }
          });
          return print(matches ? out.join("\n") : `no tasks match '${query}'`);
        }
        case "stats": {
          const keys = Object.keys(boards);
          let total = 0;
          let done = 0;
          keys.forEach((k) => {
            const s = countStats(boards[k]);
            total += s.total;
            done += s.done;
          });
          const pct = total === 0 ? 0 : Math.round((done / total) * 100);
          return print(
            [`boards: ${keys.length}`, `tasks:  ${done}/${total} done (${pct}%)`, `open windows: ${windows.length}`].join("\n")
          );
        }
        case "history":
          return print(cmdLog.length ? cmdLog.map((c, i) => `  ${i + 1}  ${c}`).join("\n") : "no commands yet");
        case "theme": {
          const arg = (tokens[1] || "").toLowerCase();
          const names = Object.keys(THEMES);
          if (!arg) return print(`current theme: ${theme}\navailable: ${names.join(", ")}`);
          if (!names.includes(arg)) return print(`unknown theme '${arg}' — try: ${names.join(", ")}`, "err");
          setTheme(arg);
          return print(`theme set to '${arg}'`, "ok");
        }
        case "init": {
          if (tokens[1] === "-del") {
            const name = tokens.slice(2).join(" ");
            const key = findProjectKey(projects, name);
            if (!key) return print(`no project named '${name}'`, "err");
            dispatch({ type: "DELETE_PROJECT", name: key });
            return print(`removed project '${key}'`, "ok");
          }
          if (tokens[1] === "-rename") {
            const rest = tokens.slice(2).join(" ");
            const arrowIdx = rest.indexOf(" -> ");
            if (arrowIdx === -1) return print("usage: init -rename <old> -> <new>", "err");
            const oldName = rest.slice(0, arrowIdx).trim();
            const newName = rest.slice(arrowIdx + 4).trim();
            const key = findProjectKey(projects, oldName);
            if (!key) return print(`no project named '${oldName}'`, "err");
            if (!newName || findProjectKey(projects, newName)) return print(`invalid new name '${newName}'`, "err");
            dispatch({ type: "RENAME_PROJECT", oldName: key, newName });
            return print(`renamed project '${key}' to '${newName}'`, "ok");
          }
          const name = tokens.slice(1).join(" ");
          if (!name) return print("usage: init <project name>", "err");
          if (findProjectKey(projects, name)) return print(`project '${name}' already exists`, "err");
          dispatch({ type: "ADD_PROJECT", name });
          return print(`initialized project '${name}' — try 'board -add <name> @${name}'`, "ok");
        }
        case "projects": {
          if (projects.length === 0) return print("no projects yet — try `init <project name>`");
          const width = Math.max(...projects.map((p) => p.length)) + 2;
          const out = [`${projects.length} project${projects.length === 1 ? "" : "s"}:`];
          projects.forEach((p) => {
            const count = Object.keys(boards).filter((k) => (boards[k].tags || []).some((t) => norm(t) === norm(p))).length;
            out.push(`  ${p.padEnd(width)}${count} board${count === 1 ? "" : "s"}`);
          });
          return print(out.join("\n"));
        }
        case "open": {
          if (tokens[1] === "-project") {
            const name = tokens.slice(2).join(" ");
            const key = findProjectKey(projects, name);
            if (!key) return print(`no project named '${name}' — try 'init ${name}' first`, "err");
            openWindow("project", { projectName: key });
            return print(`opened project '${key}'`, "ok");
          }
          return print("usage: open -project <name>", "err");
        }
        case "date":
          return print(new Date().toString());
        case "reset": {
          if (tokens[1] !== "-yes") {
            return print("this deletes every board & task — type `reset -yes` to confirm", "err");
          }
          dispatch({ type: "RESET" });
          setCwd(null);
          return print("everything cleared", "ok");
        }
        case "mkdir": {
          const name = tokens.slice(1).join(" ");
          if (!name) return print("usage: mkdir <board name>", "err");
          if (findBoardKey(boards, name)) return print(`board '${name}' already exists`, "err");
          dispatch({ type: "ADD_BOARD", name });
          return print(`created board '${name}'`, "ok");
        }
        case "rmdir": {
          const name = tokens.slice(1).join(" ");
          const key = findBoardKey(boards, name);
          if (!key) return print(`no board named '${name}'`, "err");
          dispatch({ type: "DELETE_BOARD", name: key });
          return print(`deleted board '${key}'`, "ok");
        }
        case "touch": {
          if (!cwd) return print("you're not inside a board — try `cd <board>` first", "err");
          const name = tokens.slice(1).join(" ");
          if (!name) return print("usage: touch <task name>", "err");
          if (findTaskByName(boards[cwd].tasks, name)) return print(`task '${name}' already exists`, "err");
          dispatch({ type: "ADD_TASK", board: cwd, name, parentId: null });
          return print(`added task '${name}'`, "ok");
        }
        case "rm": {
          const name = tokens.slice(1).join(" ");
          if (!name) return print("usage: rm <name>", "err");
          if (cwd) {
            const t = findTaskByName(boards[cwd].tasks, name);
            if (!t) return print(`no task named '${name}'`, "err");
            dispatch({ type: "DELETE_TASK", board: cwd, taskId: t.id });
            return print(`deleted task '${name}'`, "ok");
          }
          const key = findBoardKey(boards, name);
          if (!key) return print(`no board named '${name}'`, "err");
          dispatch({ type: "DELETE_BOARD", name: key });
          return print(`deleted board '${key}'`, "ok");
        }
        default: {
          const projKey = findProjectKey(projects, tokens[0]);
          if (projKey && tokens[1] === "-add") {
            const rest = tokens.slice(2).join(" ");
            const pipeIdx = rest.indexOf(" | ");
            const name = (pipeIdx === -1 ? rest : rest.slice(0, pipeIdx)).trim();
            const parentName = pipeIdx === -1 ? "" : rest.slice(pipeIdx + 3).trim();
            return doCreateBoard(name, parentName, projKey);
          }
          return print(`unknown command: '${tokens[0]}' — try 'help'`, "err");
        }
      }
    },
    [boards, projects, cwd, cmdLog, dispatch, openWindow, print, printBoardList, printBoardTasks, setTheme, theme, windows]
  );

  /* ---------- suggestions ---------- */
  function splitInputContext(val) {
    const trailingSpace = /\s$/.test(val);
    const rawTokens = val.split(/\s+/).filter(Boolean);
    const currentToken = trailingSpace ? "" : rawTokens[rawTokens.length - 1] || "";
    const ctx = trailingSpace ? rawTokens : rawTokens.slice(0, -1);
    const basePrefix = ctx.length ? ctx.join(" ") + " " : "";
    return { ctx, currentToken, basePrefix };
  }

  function getCompletionCandidates(ctx) {
    const boardNames = Object.keys(boards);
    const taskNames = cwd ? boards[cwd].tasks.map((t) => t.name) : [];
    if (ctx.length === 0) return [...COMMAND_WORDS, ...projects];
    const last = ctx[ctx.length - 1];
    const head = (ctx[0] || "").toLowerCase();
    const headIsProject = findProjectKey(projects, ctx[0]) !== null;

    if (last === "|") {
      if (head === "board" || headIsProject) return boardNames;
      if (head === "task") return taskNames;
      return [];
    }
    if (last === "->") {
      if (head === "task" && ctx[1] === "-move") return boardNames;
      return [];
    }
    if (head === "cd") return boardNames;
    if (head === "theme") return Object.keys(THEMES);
    if (head === "vis") {
      if (ctx.length === 1) return [...boardNames, "-node", "-close"];
      if (ctx[1] === "-close") return boardNames;
      return [];
    }
    if (head === "open") {
      if (ctx.length === 1) return ["-project"];
      if (ctx[1] === "-project") return projects;
      return [];
    }
    if (head === "init") {
      if (ctx.length === 1) return ["-del", "-rename"];
      if (ctx[1] === "-del" || ctx[1] === "-rename") return projects;
      return [];
    }
    if (head === "board" || headIsProject) {
      const sub = ctx[1];
      if (ctx.length === 1) {
        return headIsProject && head !== "board"
          ? ["-add"]
          : ["-add", "-del", "-parent", "-unparent", "-rename", "-tag", "-untag", "-show"];
      }
      if (["-del", "-unparent", "-parent", "-rename", "-tag", "-untag"].includes(sub)) return boardNames;
      return [];
    }
    if (head === "task") {
      const sub = ctx[1];
      if (ctx.length === 1) {
        return ["-add", "-check", "-uncheck", "-check-all", "-uncheck-all", "-del", "-clear", "-rename", "-move", "-parent", "-unparent"];
      }
      if (["-check", "-uncheck", "-del", "-rename", "-move", "-parent", "-unparent"].includes(sub)) return taskNames;
      return [];
    }
    return [];
  }

  const { ctx: suggestCtx, currentToken: suggestToken, basePrefix: suggestBase } = splitInputContext(input);
  const suggestPool = suggestToken.startsWith("@") ? projects.map((p) => `@${p}`) : getCompletionCandidates(suggestCtx);
  const suggestions = suggestPool.filter((c) => c.toLowerCase().startsWith(suggestToken.toLowerCase()));
  const activeIndex = suggestions.length ? Math.min(suggestIndex, suggestions.length - 1) : 0;
  const showSuggestions = suggestOpen && input.length > 0 && suggestions.length > 0;

  const acceptSuggestion = (choice) => {
    if (!choice) return;
    setInput(suggestBase + choice + " ");
    setSuggestIndex(0);
    setSuggestOpen(true);
    inputRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      if (showSuggestions) acceptSuggestion(suggestions[activeIndex]);
      return;
    }
    if (e.key === "Escape") {
      if (showSuggestions) {
        e.preventDefault();
        setSuggestOpen(false);
      }
      return;
    }
    if (e.key === "Enter") {
      run(input);
      setInput("");
      setSuggestIndex(0);
      setSuggestOpen(true);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (showSuggestions) return setSuggestIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
      if (cmdLog.length === 0) return;
      const idx = cmdPtr === -1 ? cmdLog.length - 1 : Math.max(0, cmdPtr - 1);
      setCmdPtr(idx);
      setInput(cmdLog[idx]);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (showSuggestions) return setSuggestIndex((i) => (i + 1) % suggestions.length);
      if (cmdPtr === -1) return;
      const idx = cmdPtr + 1;
      if (idx >= cmdLog.length) {
        setCmdPtr(-1);
        setInput("");
      } else {
        setCmdPtr(idx);
        setInput(cmdLog[idx]);
      }
    }
  };

  const promptStr = getPromptStr(cwd);

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden font-mono"
      style={{ background: "#0b0906", color: th.text }}
      onMouseDown={() => inputRef.current?.focus()}
    >
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.15]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, #000 0px, transparent 1px, transparent 2px, #000 3px)" }}
      />
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.55)_100%)]" />
      <div className="relative z-0 flex-1 overflow-auto px-3 py-2 text-[12.5px] leading-[1.5]" style={{ textShadow: `0 0 6px ${th.glow}` }}>
        {lines.map((l) => (
          <pre
            key={l.id}
            className="animate-[lineIn_140ms_ease-out] whitespace-pre-wrap break-words"
            style={{
              color: l.kind === "err" ? "#ff5c5c" : l.kind === "ok" ? "#8dffb0" : l.kind === "sys" ? th.dim : th.text,
              opacity: l.kind === "cmd" ? 0.85 : 1,
            }}
          >
            {l.text}
          </pre>
        ))}
        <div ref={bottomRef} />
      </div>
      <form
        className="relative z-0 flex items-center gap-1.5 border-t px-3 py-2 text-[12.5px]"
        style={{ borderColor: th.dim }}
        onSubmit={(e) => {
          e.preventDefault();
          run(input);
          setInput("");
        }}
      >
        <span style={{ color: th.text, textShadow: `0 0 6px ${th.glow}` }}>{promptStr}</span>
        <div className="relative flex-1">
          <input
            ref={inputRef}
            autoFocus
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setSuggestIndex(0);
              setSuggestOpen(true);
            }}
            onKeyDown={onKeyDown}
            className="w-full bg-transparent outline-none caret-current"
            style={{ color: th.text, textShadow: `0 0 6px ${th.glow}` }}
            spellCheck={false}
            autoComplete="off"
          />
          {showSuggestions && (
            <div
              className="absolute left-0 z-[500] max-h-48 min-w-[220px] max-w-[360px] animate-[fadeIn_120ms_ease-out] overflow-y-auto border"
              style={{ bottom: "calc(100% + 6px)", background: "#1e1509", borderColor: th.dim, boxShadow: "0 10px 28px rgba(0,0,0,0.55)" }}
            >
              {suggestions.map((s, i) => {
                const active = i === activeIndex;
                return (
                  <button
                    key={s}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      acceptSuggestion(s);
                    }}
                    onMouseEnter={() => setSuggestIndex(i)}
                    className="flex w-full items-center px-2.5 py-1 text-left text-xs"
                    style={{ background: active ? th.text : "transparent", color: active ? "#0b0906" : th.text }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dock / Taskbar                                                     */
/* ------------------------------------------------------------------ */

function Clock24() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000 * 15);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-medium text-violet-700">
      <Clock size={12} />
      {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </div>
  );
}

function Dock({ windows, openWindow, focusWindow, restoreWindow, minimizeWindow }) {
  const [startOpen, setStartOpen] = useState(false);

  const label = (w) => {
    if (w.kind === "terminal") return "Terminal";
    if (w.kind === "file-manager") return "Boards";
    if (w.kind === "graph") return "Graph";
    if (w.kind === "board") return w.boardName;
    if (w.kind === "project") return w.projectName;
    return w.kind;
  };
  const iconFor = (kind) =>
    kind === "terminal" ? <TerminalIcon size={13} /> :
    kind === "file-manager" ? <Kanban size={13} /> :
    kind === "graph" ? <Network size={13} /> :
    kind === "project" ? <Rocket size={13} /> : <Folder size={13} />;

  const topZ = windows.reduce((m, w) => Math.max(m, w.z), 0);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[9000] flex justify-center">
      <div className="pointer-events-auto flex animate-[slideUp_260ms_cubic-bezier(0.16,1,0.3,1)] items-center gap-1 rounded-2xl border border-white/60 bg-white/60 px-2 py-1.5 shadow-xl backdrop-blur-xl">
        <div className="relative">
          <button
            onClick={() => setStartOpen((s) => !s)}
            className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow transition-transform hover:scale-110 active:scale-95"
            title="Artemis"
          >
            <Sparkles size={16} />
          </button>
          {startOpen && (
            <div
              className="absolute bottom-12 left-0 w-44 origin-bottom-left animate-[popIn_140ms_ease-out] overflow-hidden rounded-xl border border-violet-100 bg-white shadow-2xl"
              onMouseLeave={() => setStartOpen(false)}
            >
              <button
                onClick={() => {
                  openWindow("terminal");
                  setStartOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-violet-700 hover:bg-violet-50"
              >
                <TerminalIcon size={13} /> Open Terminal
              </button>
              <button
                onClick={() => {
                  openWindow("file-manager");
                  setStartOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-violet-700 hover:bg-violet-50"
              >
                <Kanban size={13} /> Boards
              </button>
              <button
                onClick={() => {
                  openWindow("graph");
                  setStartOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-violet-700 hover:bg-violet-50"
              >
                <Network size={13} /> Graph View
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => openWindow("file-manager")}
          className="grid h-9 w-9 place-items-center rounded-xl text-violet-600 transition-transform hover:scale-110 hover:bg-violet-100 active:scale-95"
          title="Boards"
        >
          <Kanban size={17} />
        </button>
        <button
          onClick={() => openWindow("terminal")}
          className="grid h-9 w-9 place-items-center rounded-xl text-violet-600 transition-transform hover:scale-110 hover:bg-violet-100 active:scale-95"
          title="Terminal (Shift+T)"
        >
          <TerminalIcon size={17} />
        </button>

        {windows.length > 0 && <div className="mx-1 h-6 w-px bg-violet-200" />}

        {windows.map((w) => {
          const active = !w.minimized && w.z === topZ;
          return (
            <button
              key={w.id}
              onClick={() => (w.minimized ? restoreWindow(w.id) : active ? minimizeWindow(w.id) : focusWindow(w.id))}
              className={`flex max-w-[120px] animate-[popIn_180ms_ease-out] items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-medium transition-transform hover:scale-105 active:scale-95 ${
                active ? "bg-violet-600 text-white" : "bg-violet-100/80 text-violet-700 hover:bg-violet-200"
              }`}
            >
              {iconFor(w.kind)}
              <span className="truncate">{label(w)}</span>
            </button>
          );
        })}

        <div className="mx-1 h-6 w-px bg-violet-200" />
        <div className="px-2">
          <Clock24 />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Desktop icons                                                      */
/* ------------------------------------------------------------------ */

function DesktopIcon({ icon, label, onDoubleClick }) {
  return (
    <button
      onDoubleClick={onDoubleClick}
      className="flex w-20 flex-col items-center gap-1 rounded-lg p-2 text-center transition-transform hover:-translate-y-0.5 hover:bg-white/30 active:scale-95"
    >
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/50 text-violet-600 shadow backdrop-blur">{icon}</div>
      <span className="text-[10px] font-medium text-violet-800 drop-shadow-sm">{label}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Root App                                                            */
/* ------------------------------------------------------------------ */

export default function ArtemisOS() {
  const [state, dispatch] = useReducer(osReducer, undefined, makeInitialState);
  const [theme, setTheme] = useState("amber");
  const desktopRef = useRef(null);
  const dragRef = useRef(null);
  const zRef = useRef(0);
  const [loaded, setLoaded] = useState(false);
  const storageAvailable = typeof window !== "undefined" && !!window.storage;

  const getRect = () => desktopRef.current?.getBoundingClientRect() || { width: 1200, height: 700 };

  const openWindow = useCallback((kind, extra = {}) => {
    dispatch({ type: "OPEN_WINDOW", kind, rect: getRect(), ...extra });
  }, []);

  /* load persisted state once */
  useEffect(() => {
    let cancelled = false;
    if (!storageAvailable) {
      setLoaded(true);
      return undefined;
    }
    (async () => {
      try {
        const result = await window.storage.get(STORAGE_KEY, false);
        if (!cancelled && result?.value) {
          const data = JSON.parse(result.value);
          dispatch({
            type: "HYDRATE",
            payload: {
              boards: data.boards || {},
              projects: Array.isArray(data.projects) ? data.projects : [],
              windows: Array.isArray(data.windows) ? data.windows : [],
              activeBoard: data.activeBoard ?? null,
            },
          });
          if (data.theme) setTheme(data.theme);
        }
      } catch (e) {
        /* nothing saved yet */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* open the file manager by default once we know whether we hydrated */
  useEffect(() => {
    if (!loaded) return;
    if (state.windows.length === 0) openWindow("file-manager");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  /* debounced save */
  useEffect(() => {
    if (!loaded || !storageAvailable) return undefined;
    const t = setTimeout(() => {
      window.storage
        .set(
          STORAGE_KEY,
          JSON.stringify({
            boards: state.boards,
            projects: state.projects,
            windows: state.windows,
            activeBoard: state.activeBoard,
            theme,
          }),
          false
        )
        .catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [state.boards, state.projects, state.windows, state.activeBoard, theme, loaded, storageAvailable]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.shiftKey && (e.key === "T" || e.key === "t")) {
        const active = e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA";
        if (active) return;
        e.preventDefault();
        openWindow("terminal");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openWindow]);

  const startDrag = (win, e) => {
    dragRef.current = { id: win.id, offsetX: e.clientX - win.x, offsetY: e.clientY - win.y };
  };

  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d) return;
      const win = state.windows.find((w) => w.id === d.id);
      if (!win || win.maximized) return;
      const rect = getRect();
      const x = clamp(e.clientX - d.offsetX, 0, Math.max(0, rect.width - 120));
      const y = clamp(e.clientY - d.offsetY, 0, Math.max(0, rect.height - 40));
      dispatch({ type: "MOVE_WINDOW", id: d.id, x, y });
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [state.windows]);

  const topZ = state.windows.reduce((m, w) => Math.max(m, w.z), 0);

  return (
    <div
      ref={desktopRef}
      className="relative h-[700px] w-full select-none overflow-hidden rounded-2xl"
      style={{
        cursor: "none",
        background:
          "radial-gradient(1200px 600px at 15% -10%, #f3effc 0%, transparent 60%), radial-gradient(1000px 700px at 100% 110%, #ded4f7 0%, transparent 55%), linear-gradient(160deg, #eae6f8 0%, #e2dbf5 45%, #d8cdf1 100%)",
      }}
    >
      <style>{`
        @keyframes winIn { 0% { opacity:0; transform: scale(0.96) translateY(6px);} 100% { opacity:1; transform: scale(1) translateY(0);} }
        @keyframes popIn { 0% { opacity:0; transform: scale(0.85);} 100% { opacity:1; transform: scale(1);} }
        @keyframes fadeIn { 0% { opacity:0;} 100% { opacity:1;} }
        @keyframes slideIn { 0% { opacity:0; transform: translateX(-4px);} 100% { opacity:1; transform: translateX(0);} }
        @keyframes slideUp { 0% { opacity:0; transform: translateY(14px);} 100% { opacity:1; transform: translateY(0);} }
        @keyframes lineIn { 0% { opacity:0; transform: translateY(3px);} 100% { opacity:1; transform: translateY(0);} }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.35);} 50% { box-shadow: 0 0 0 6px rgba(124,58,237,0);} }
        .line-clamp-1 { display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden; }
        * { cursor: none !important; }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; cursor: auto !important; }
        }
      `}</style>

      <div className="absolute left-6 top-6 flex flex-col gap-1">
        <DesktopIcon icon={<Kanban size={19} />} label="Boards" onDoubleClick={() => openWindow("file-manager")} />
        <DesktopIcon icon={<TerminalIcon size={19} />} label="Terminal" onDoubleClick={() => openWindow("terminal")} />
        <DesktopIcon icon={<Network size={19} />} label="Graph" onDoubleClick={() => openWindow("graph")} />
      </div>

      {state.windows.map((w) => {
        const commonProps = {
          win: w,
          isTop: w.z === topZ,
          onClose: () => dispatch({ type: "CLOSE_WINDOW", id: w.id }),
          onMinimize: () => dispatch({ type: "MINIMIZE_WINDOW", id: w.id }),
          onToggleMax: () => dispatch({ type: "TOGGLE_MAXIMIZE", id: w.id, rect: getRect() }),
          onFocus: () => dispatch({ type: "FOCUS_WINDOW", id: w.id }),
          onDragStart: (e) => startDrag(w, e),
        };
        if (w.kind === "terminal") {
          return (
            <WindowFrame key={w.id} {...commonProps} title="terminal — artemis" icon={<TerminalIcon size={13} />} dark>
              <TerminalApp
                boards={state.boards}
                projects={state.projects}
                windows={state.windows}
                dispatch={dispatch}
                openWindow={openWindow}
                theme={theme}
                setTheme={setTheme}
              />
            </WindowFrame>
          );
        }
        if (w.kind === "file-manager") {
          return (
            <WindowFrame key={w.id} {...commonProps} title="Boards" icon={<Kanban size={13} />}>
              <FileManagerApp boards={state.boards} dispatch={dispatch} openWindow={openWindow} />
            </WindowFrame>
          );
        }
        if (w.kind === "board") {
          return (
            <WindowFrame key={w.id} {...commonProps} title={w.boardName} icon={<ListTree size={13} />}>
              <BoardApp boardName={w.boardName} boards={state.boards} dispatch={dispatch} />
            </WindowFrame>
          );
        }
        if (w.kind === "graph") {
          return (
            <WindowFrame key={w.id} {...commonProps} title="Graph View" icon={<Network size={13} />}>
              <GraphApp boards={state.boards} openWindow={openWindow} />
            </WindowFrame>
          );
        }
        if (w.kind === "project") {
          return (
            <WindowFrame key={w.id} {...commonProps} title={w.projectName} icon={<Rocket size={13} />}>
              <ProjectApp projectName={w.projectName} boards={state.boards} dispatch={dispatch} openWindow={openWindow} />
            </WindowFrame>
          );
        }
        return null;
      })}

      <Dock
        windows={state.windows}
        openWindow={openWindow}
        focusWindow={(id) => dispatch({ type: "FOCUS_WINDOW", id })}
        restoreWindow={(id) => dispatch({ type: "RESTORE_WINDOW", id })}
        minimizeWindow={(id) => dispatch({ type: "MINIMIZE_WINDOW", id })}
      />

      <CustomCursor containerRef={desktopRef} />
    </div>
  );
}