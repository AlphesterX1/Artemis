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
  Calendar as CalendarIcon,
  Palette,
  Sun,
  Moon,
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

/* ------------------------------------------------------------------ */
/*  Calendar helpers                                                   */
/* ------------------------------------------------------------------ */

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function getMonthCells(year, month) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday-first grid
  const gridStart = new Date(year, month, 1 - startOffset);
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push(d);
  }
  return cells;
}

const STORAGE_KEY = "artemis-os-state-v2";

/* Resolve a persistence backend at runtime: the platform's window.storage
   API when it's present, otherwise a plain localStorage adapter (works in
   any normal browser tab), otherwise null (in-memory only, for this
   session). Every call is wrapped so a blocked or missing API degrades
   gracefully instead of throwing. */
function resolvePersistBackend() {
  if (typeof window === "undefined") return null;
  if (window.storage && typeof window.storage.get === "function") {
    return {
      kind: "platform",
      get: (key) => window.storage.get(key, false),
      set: (key, value) => window.storage.set(key, value, false),
    };
  }
  try {
    const probeKey = "__artemis_probe__";
    window.localStorage.setItem(probeKey, "1");
    window.localStorage.removeItem(probeKey);
    return {
      kind: "local",
      get: async (key) => {
        const value = window.localStorage.getItem(key);
        return value == null ? null : { key, value };
      },
      set: async (key, value) => {
        window.localStorage.setItem(key, value);
        return { key, value };
      },
    };
  } catch (e) {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  OS-level themes (chrome, windows, dock) — independent of the       */
/*  terminal's own CRT phosphor themes.                                */
/* ------------------------------------------------------------------ */

const OS_THEMES = {
  aurora: {
    label: "Aurora",
    mode: "light",
    vars: {
      "--bg-a": "#f4f1fc",
      "--bg-b": "#eae2fa",
      "--bg-c": "#ddd0f4",
      "--surface": "rgba(255,255,255,0.78)",
      "--surface-solid": "#ffffff",
      "--surface-muted": "rgba(255,255,255,0.46)",
      "--border": "rgba(88,66,178,0.14)",
      "--border-strong": "rgba(88,66,178,0.26)",
      "--accent": "#6d5ae6",
      "--accent-soft": "rgba(109,90,230,0.12)",
      "--accent-contrast": "#ffffff",
      "--text": "#231c3f",
      "--text-muted": "#726a96",
      "--text-faint": "#a9a1c8",
      "--dock-bg": "rgba(255,255,255,0.66)",
      "--ring": "rgba(109,90,230,0.32)",
      "--danger": "#e2536e",
      "--success": "#1ea672",
      "--scrim": "rgba(35,28,63,0.14)",
    },
  },
  linen: {
    label: "Linen",
    mode: "light",
    vars: {
      "--bg-a": "#f8f4ea",
      "--bg-b": "#f0ead9",
      "--bg-c": "#e6dcc3",
      "--surface": "rgba(255,255,255,0.7)",
      "--surface-solid": "#fffdf8",
      "--surface-muted": "rgba(255,255,255,0.4)",
      "--border": "rgba(52,87,166,0.14)",
      "--border-strong": "rgba(52,87,166,0.26)",
      "--accent": "#33569f",
      "--accent-soft": "rgba(51,86,159,0.1)",
      "--accent-contrast": "#ffffff",
      "--text": "#312b1f",
      "--text-muted": "#847a63",
      "--text-faint": "#b3a68a",
      "--dock-bg": "rgba(255,253,248,0.72)",
      "--ring": "rgba(51,86,159,0.3)",
      "--danger": "#c1543f",
      "--success": "#3c7d4f",
      "--scrim": "rgba(49,43,31,0.14)",
    },
  },
  nightfall: {
    label: "Nightfall",
    mode: "dark",
    vars: {
      "--bg-a": "#171827",
      "--bg-b": "#12131d",
      "--bg-c": "#0d0e16",
      "--surface": "rgba(255,255,255,0.055)",
      "--surface-solid": "#1b1c29",
      "--surface-muted": "rgba(255,255,255,0.035)",
      "--border": "rgba(255,255,255,0.09)",
      "--border-strong": "rgba(255,255,255,0.16)",
      "--accent": "#8b93ff",
      "--accent-soft": "rgba(139,147,255,0.16)",
      "--accent-contrast": "#12131d",
      "--text": "#e8e8f5",
      "--text-muted": "#9a9ac0",
      "--text-faint": "#5f5f82",
      "--dock-bg": "rgba(23,24,39,0.72)",
      "--ring": "rgba(139,147,255,0.4)",
      "--danger": "#ff7a8a",
      "--success": "#5fd6a3",
      "--scrim": "rgba(0,0,0,0.4)",
    },
  },
  onyx: {
    label: "Onyx",
    mode: "dark",
    vars: {
      "--bg-a": "#131313",
      "--bg-b": "#0e0e0e",
      "--bg-c": "#0a0a0a",
      "--surface": "rgba(255,255,255,0.045)",
      "--surface-solid": "#161616",
      "--surface-muted": "rgba(255,255,255,0.03)",
      "--border": "rgba(255,255,255,0.08)",
      "--border-strong": "rgba(255,255,255,0.15)",
      "--accent": "#e8a24a",
      "--accent-soft": "rgba(232,162,74,0.15)",
      "--accent-contrast": "#161616",
      "--text": "#ececea",
      "--text-muted": "#96968f",
      "--text-faint": "#5c5c57",
      "--dock-bg": "rgba(19,19,19,0.72)",
      "--ring": "rgba(232,162,74,0.4)",
      "--danger": "#ff8b7a",
      "--success": "#6fd18f",
      "--scrim": "rgba(0,0,0,0.5)",
    },
  },
};
const OS_THEME_ORDER = ["aurora", "linen", "nightfall", "onyx"];

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
    calendarEvents: {},
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

    case "ADD_EVENT": {
      const { date, text } = action;
      const clean = text.trim();
      if (!clean) return state;
      const list = state.calendarEvents[date] || [];
      return {
        ...state,
        calendarEvents: { ...state.calendarEvents, [date]: [...list, { id: uid("ev"), text: clean }] },
      };
    }
    case "DELETE_EVENT": {
      const { date, id } = action;
      const list = state.calendarEvents[date] || [];
      return {
        ...state,
        calendarEvents: { ...state.calendarEvents, [date]: list.filter((e) => e.id !== id) },
      };
    }

    case "OPEN_WINDOW": {
      const { kind, boardName, projectName, rect } = action;
      const singleton = kind === "terminal" || kind === "file-manager" || kind === "graph" || kind === "calendar";
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
        calendar: { w: 600, h: 420 },
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

  const ringStyle =
    variant === "pointer"
      ? { width: 34, height: 34, border: "1.5px solid var(--accent)", background: "var(--accent-soft)", borderRadius: "9999px" }
      : variant === "drag"
      ? { width: 38, height: 38, border: "1.5px dashed var(--accent)", background: "var(--accent-soft)", borderRadius: "9999px" }
      : variant === "text"
      ? { width: 2, height: 18, borderRadius: 2, background: "var(--accent)" }
      : { width: 22, height: 22, border: "1px solid var(--border-strong)", background: "transparent", borderRadius: "9999px" };

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[10000]"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 150ms ease" }}
    >
      <div
        ref={ringRef}
        className="pointer-events-none absolute left-0 top-0 transition-[width,height,background-color,border-color] duration-150"
        style={ringStyle}
      />
      <div
        ref={dotRef}
        className="pointer-events-none absolute left-0 top-0 h-1 w-1 rounded-full"
        style={{ background: "var(--accent)" }}
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
      className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm animate-[fadeIn_120ms_ease-out]"
      style={{ background: "var(--scrim)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-[340px] scale-100 animate-[popIn_160ms_ease-out] rounded-xl border shadow-2xl backdrop-blur-xl p-5"
        style={{ background: "var(--surface-solid)", borderColor: "var(--border)" }}
      >
        <div className="mb-3 text-[13px] font-semibold" style={{ color: "var(--text)" }}>
          {title}
        </div>
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
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ background: "var(--surface-muted)", borderColor: "var(--border)", color: "var(--text)" }}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm transition-transform active:scale-95"
            style={{ color: "var(--text-muted)" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg px-3 py-1.5 text-sm font-medium transition-transform active:scale-95"
            style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
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
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {message}
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-lg px-3 py-1.5 text-sm transition-transform active:scale-95"
          style={{ color: "var(--text-muted)" }}
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-transform active:scale-95"
          style={{ background: danger ? "var(--danger)" : "var(--accent)" }}
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
      className={`absolute flex flex-col overflow-hidden rounded-lg border shadow-xl transition-shadow duration-200 will-change-transform ${
        dark ? "animate-[terminalIn_280ms_ease-out]" : "animate-[winIn_220ms_cubic-bezier(0.16,1,0.3,1)]"
      }`}
      style={{
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
        zIndex: win.z,
        background: dark ? "#0b0906" : "var(--surface)",
        borderColor: dark ? "rgba(120,80,20,0.35)" : isTop ? "var(--border-strong)" : "var(--border)",
        backdropFilter: dark ? "none" : "blur(18px)",
      }}
      onMouseDown={onFocus}
    >
      <div
        className="group/traffic flex select-none items-center gap-2 px-3 py-2"
        style={{
          background: dark ? "linear-gradient(180deg, rgba(60,38,0,0.55), rgba(11,9,6,0))" : "transparent",
          borderBottom: `1px solid ${dark ? "rgba(120,80,20,0.3)" : "var(--border)"}`,
          color: dark ? "#c98f2e" : "var(--text)",
          cursor: "inherit",
        }}
        data-cursor-drag
        onMouseDown={(e) => {
          onFocus();
          onDragStart(e);
        }}
        onDoubleClick={onToggleMax}
      >
        <div className="flex items-center gap-1.5 mr-1">
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onClose}
            className="grid h-2.5 w-2.5 place-items-center rounded-full transition-transform hover:scale-125 active:scale-90"
            style={{ background: "#ec6a5e" }}
            title="Close"
          >
            <X size={7} className="opacity-0 group-hover/traffic:opacity-70" style={{ color: "#5b130b" }} />
          </button>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onMinimize}
            className="grid h-2.5 w-2.5 place-items-center rounded-full transition-transform hover:scale-125 active:scale-90"
            style={{ background: "#f4bd4f" }}
            title="Minimize"
          >
            <Minus size={7} className="opacity-0 group-hover/traffic:opacity-70" style={{ color: "#6b4a05" }} />
          </button>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onToggleMax}
            className="grid h-2.5 w-2.5 place-items-center rounded-full transition-transform hover:scale-125 active:scale-90"
            style={{ background: "#61c454" }}
            title="Maximize"
          >
            <Maximize2 size={6} className="opacity-0 group-hover/traffic:opacity-70" style={{ color: "#0f4a0a" }} />
          </button>
        </div>
        <span style={{ color: dark ? "#c98f2e" : "var(--text-faint)" }}>{icon}</span>
        <span className="text-[11px] font-medium tracking-wide" style={{ color: dark ? "#e7b45b" : "var(--text)" }}>
          {title}
        </span>
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
    <div className="flex h-full flex-col" style={{ background: "var(--surface-muted)" }}>
      <div className="flex items-center justify-between border-b px-4 py-2.5" style={{ borderColor: "var(--border)" }}>
        <div className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
          Boards · {names.length}
        </div>
        <button
          onClick={() => setModal({ type: "new" })}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-transform active:scale-95"
          style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
        >
          <Kanban size={13} /> New Board
        </button>
      </div>

      <div className="grid flex-1 auto-rows-min grid-cols-3 gap-3 overflow-auto p-4 sm:grid-cols-4">
        {names.length === 0 && (
          <div className="col-span-full mt-10 text-center text-sm" style={{ color: "var(--text-faint)" }}>
            No boards yet — create one to get started.
          </div>
        )}
        {names.map((name, i) => {
          const { total, done, pct } = countStats(boards[name]);
          const parent = boards[name].parent;
          return (
            <button
              key={name}
              style={{ animationDelay: `${Math.min(i, 12) * 20}ms` }}
              onClick={() => openWindow("board", { boardName: name })}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenu({ name, x: e.clientX, y: e.clientY });
              }}
              className="group flex animate-[popIn_200ms_ease-out_backwards] flex-col items-center gap-1.5 rounded-lg p-2 text-center transition-colors"
            >
              <div className="relative">
                <Folder size={36} strokeWidth={1.4} style={{ color: "var(--text-faint)" }} />
                <span
                  className="absolute -bottom-1 -right-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                  style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
                >
                  {done}/{total}
                </span>
              </div>
              <span className="line-clamp-1 max-w-[92px] text-[11px] font-medium" style={{ color: "var(--text)" }}>
                {name}
              </span>
              {parent && (
                <span className="text-[9px]" style={{ color: "var(--text-faint)" }}>
                  in {parent}
                </span>
              )}
              <div className="h-1 w-14 overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: "var(--accent)" }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {menu && (
        <div
          className="fixed z-[9998] w-40 origin-top-left animate-[popIn_110ms_ease-out] overflow-hidden rounded-lg border shadow-xl"
          style={{ left: menu.x, top: menu.y, background: "var(--surface-solid)", borderColor: "var(--border)" }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              openWindow("board", { boardName: menu.name });
              setMenu(null);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs"
            style={{ color: "var(--text)" }}
          >
            <FolderOpen size={13} /> Open
          </button>
          <button
            onClick={() => {
              setModal({ type: "rename", name: menu.name });
              setMenu(null);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs"
            style={{ color: "var(--text)" }}
          >
            <Pencil size={13} /> Rename
          </button>
          {boards[menu.name]?.parent && (
            <button
              onClick={() => {
                dispatch({ type: "UNSET_BOARD_PARENT", name: menu.name });
                setMenu(null);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs"
              style={{ color: "var(--text)" }}
            >
              <ListTree size={13} /> Move to top level
            </button>
          )}
          <button
            onClick={() => {
              setModal({ type: "delete", name: menu.name });
              setMenu(null);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs"
            style={{ color: "var(--danger)" }}
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
      style={{
        marginLeft: depth * 16,
        background: over ? "var(--accent-soft)" : "transparent",
        boxShadow: over ? "inset 0 0 0 1px var(--ring)" : "none",
      }}
      className="group flex animate-[slideIn_140ms_ease-out] items-center gap-2 rounded-md px-2 py-1.5 transition-colors"
    >
      <GripVertical size={12} className="shrink-0" style={{ color: "var(--text-faint)" }} />
      <button
        onClick={() => dispatch({ type: "TOGGLE_TASK", board, taskId: task.id, done: !task.done })}
        className="grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border transition-transform active:scale-90"
        style={{
          borderColor: task.done ? "var(--accent)" : "var(--border-strong)",
          background: task.done ? "var(--accent)" : "transparent",
          color: "var(--accent-contrast)",
        }}
      >
        {task.done && <Check size={11} strokeWidth={3} className="animate-[popIn_160ms_ease-out]" />}
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
          className="flex-1 rounded border px-1.5 py-0.5 text-xs outline-none"
          style={{ borderColor: "var(--border-strong)", background: "var(--surface-solid)", color: "var(--text)" }}
        />
      ) : (
        <span
          onDoubleClick={() => setEditing(true)}
          className="flex-1 truncate text-xs transition-colors"
          style={{ color: task.done ? "var(--text-faint)" : "var(--text)", textDecoration: task.done ? "line-through" : "none" }}
        >
          {task.name}
        </span>
      )}
      <button
        onClick={() => dispatch({ type: "DELETE_TASK", board, taskId: task.id })}
        className="invisible shrink-0 rounded p-1 transition-transform group-hover:visible active:scale-90"
        style={{ color: "var(--text-faint)" }}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

function TaskColumn({ label, tasks, board, dispatch }) {
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
      className="flex min-h-0 flex-1 flex-col rounded-lg p-2"
      style={{ background: "var(--surface)" }}
    >
      <div
        className="mb-1.5 flex items-center border-b px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wide"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        {label}
        <span className="ml-auto" style={{ color: "var(--text-faint)" }}>
          {tasks.length}
        </span>
      </div>
      <div className="flex-1 space-y-0.5 overflow-auto pr-1">
        {tasks.length === 0 && (
          <div className="px-2 py-3 text-[11px]" style={{ color: "var(--text-faint)" }}>
            Nothing here
          </div>
        )}
        {renderLevel("__root__", 0)}
      </div>
    </div>
  );
}

function BoardApp({ boardName, boards, dispatch }) {
  const board = boards[boardName];
  const [draft, setDraft] = useState("");
  if (!board) {
    return (
      <div className="grid h-full place-items-center text-sm" style={{ color: "var(--text-faint)" }}>
        Board deleted.
      </div>
    );
  }
  const pending = board.tasks.filter((t) => !t.done);
  const done = board.tasks.filter((t) => t.done);
  const { pct, total } = countStats(board);

  return (
    <div className="flex h-full flex-col" style={{ background: "var(--surface-muted)" }}>
      <div className="border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between">
          <div className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>
            {boardName}
          </div>
          <div className="text-[10px]" style={{ color: "var(--text-faint)" }}>
            {total} tasks · {pct}% done
          </div>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${pct}%`, background: "var(--accent)" }}
          />
        </div>
        <form
          className="mt-3 flex gap-2"
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
            className="flex-1 rounded-lg border px-3 py-1.5 text-xs outline-none"
            style={{ background: "var(--surface-solid)", borderColor: "var(--border)", color: "var(--text)" }}
          />
          <button
            type="submit"
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-transform active:scale-95"
            style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
          >
            <Plus size={13} />
          </button>
        </form>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2.5 p-2.5">
        <TaskColumn label="Pending" tasks={pending} board={boardName} dispatch={dispatch} />
        <TaskColumn label="Done" tasks={done} board={boardName} dispatch={dispatch} />
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
    <div className="flex h-full flex-col p-3" style={{ background: "var(--surface-muted)" }}>
      <div className="mb-1 text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
        Board relationship graph
      </div>
      <div ref={setRef} className="relative flex-1 overflow-hidden">
        {keys.length === 0 && (
          <div className="grid h-full place-items-center text-xs" style={{ color: "var(--text-faint)" }}>
            No boards yet
          </div>
        )}
        <svg width={size.width} height={size.height} className="absolute inset-0">
          {keys.map((k) => {
            const parent = boards[k].parent;
            if (!parent || !positions[parent] || !positions[k]) return null;
            const p1 = positions[parent];
            const p2 = positions[k];
            return (
              <line
                key={`e-${k}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="var(--border-strong)"
                strokeWidth={1.5}
              />
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
                borderColor: "var(--accent)",
                background: complete ? "var(--accent)" : "var(--accent-soft)",
              }}
              onClick={() => openWindow("board", { boardName: k })}
              className="absolute flex flex-col items-center justify-center rounded-full border-2 text-center transition-transform animate-[popIn_200ms_ease-out_backwards] hover:scale-110"
            >
              <span
                className="w-full truncate px-1 text-[9px] font-semibold"
                style={{ color: complete ? "var(--accent-contrast)" : "var(--text)" }}
              >
                {k}
              </span>
              <span className="text-[8px]" style={{ color: complete ? "var(--accent-contrast)" : "var(--text-muted)" }}>
                {done}/{total}
              </span>
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

function ProjectApp({ projectName, boards, openWindow }) {
  const keys = Object.keys(boards).filter((k) => (boards[k].tags || []).some((t) => norm(t) === norm(projectName)));
  return (
    <div className="flex h-full flex-col gap-3 p-4" style={{ background: "var(--surface-muted)" }}>
      <div className="flex items-center gap-2">
        <Rocket size={15} style={{ color: "var(--accent)" }} />
        <div className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>
          @{projectName}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto rounded-lg p-3" style={{ background: "var(--surface)" }}>
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
          Tagged boards ({keys.length})
        </div>
        {keys.length === 0 && (
          <div className="px-1 text-xs" style={{ color: "var(--text-faint)" }}>
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
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-transform hover:translate-x-0.5"
                style={{ color: "var(--text)" }}
              >
                <Folder size={13} style={{ color: "var(--text-faint)" }} /> {n}
                <span className="ml-auto" style={{ color: "var(--text-faint)" }}>
                  {done}/{total}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Calendar view                                                      */
/* ------------------------------------------------------------------ */

const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function CalendarApp({ events, dispatch }) {
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [selected, setSelected] = useState(() => dateKey(new Date()));
  const [draft, setDraft] = useState("");

  const today = dateKey(new Date());
  const cells = useMemo(() => getMonthCells(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const dayEvents = events[selected] || [];

  return (
    <div className="flex h-full" style={{ background: "var(--surface-muted)" }}>
      <div className="flex min-w-0 flex-1 flex-col p-3">
        <div className="mb-2 flex items-center justify-between">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="grid h-6 w-6 place-items-center rounded-md text-xs transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            ‹
          </button>
          <div className="flex items-center gap-2">
            <div className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
              {monthLabel}
            </div>
            <button
              onClick={() => {
                const n = new Date();
                setCursor(new Date(n.getFullYear(), n.getMonth(), 1));
                setSelected(dateKey(n));
              }}
              className="rounded-md px-1.5 py-0.5 text-[9px] font-medium"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              Today
            </button>
          </div>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="grid h-6 w-6 place-items-center rounded-md text-xs transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            ›
          </button>
        </div>
        <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[9px] font-medium uppercase" style={{ color: "var(--text-faint)" }}>
          {WEEKDAY_LABELS.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid flex-1 grid-cols-7 gap-1">
          {cells.map((d, i) => {
            const key = dateKey(d);
            const inMonth = d.getMonth() === cursor.getMonth();
            const has = (events[key] || []).length > 0;
            const isToday = key === today;
            const isSel = key === selected;
            return (
              <button
                key={i}
                onClick={() => setSelected(key)}
                className="relative flex flex-col items-center justify-center rounded-md text-[11px] transition-colors"
                style={{
                  background: isSel ? "var(--accent)" : isToday ? "var(--accent-soft)" : "transparent",
                  color: isSel ? "var(--accent-contrast)" : inMonth ? "var(--text)" : "var(--text-faint)",
                  fontWeight: isToday && !isSel ? 700 : 500,
                }}
              >
                {d.getDate()}
                {has && (
                  <span
                    className="absolute bottom-1 h-1 w-1 rounded-full"
                    style={{ background: isSel ? "var(--accent-contrast)" : "var(--accent)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex w-48 shrink-0 flex-col border-l p-3" style={{ borderColor: "var(--border)" }}>
        <div className="mb-2 text-[11px] font-semibold" style={{ color: "var(--text)" }}>
          {new Date(selected + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
        </div>
        <form
          className="mb-2 flex gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) {
              dispatch({ type: "ADD_EVENT", date: selected, text: draft });
              setDraft("");
            }
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add event…"
            className="flex-1 rounded-md border px-2 py-1 text-[11px] outline-none"
            style={{ borderColor: "var(--border)", background: "var(--surface-solid)", color: "var(--text)" }}
          />
          <button
            type="submit"
            className="rounded-md px-2 text-[11px]"
            style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
          >
            <Plus size={12} />
          </button>
        </form>
        <div className="flex-1 space-y-1 overflow-auto">
          {dayEvents.length === 0 && (
            <div className="text-[11px]" style={{ color: "var(--text-faint)" }}>
              No events
            </div>
          )}
          {dayEvents.map((ev) => (
            <div
              key={ev.id}
              className="group flex items-center gap-1.5 rounded-md px-2 py-1"
              style={{ background: "var(--surface)" }}
            >
              <span className="flex-1 truncate text-[11px]" style={{ color: "var(--text)" }}>
                {ev.text}
              </span>
              <button
                onClick={() => dispatch({ type: "DELETE_EVENT", date: selected, id: ev.id })}
                className="opacity-0 transition-opacity group-hover:opacity-100"
                style={{ color: "var(--text-faint)" }}
              >
                <X size={11} />
              </button>
            </div>
          ))}
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
  "  graph                              open the board relationship graph",
  "  cal                                open the calendar",
  "",
  "  boards open automatically the moment you create or `cd` into them —",
  "  click a board in the Boards window or dock to bring it back up.",
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
  "board", "task", "graph", "cal", "open", "init", "projects", "ls", "cd", "pwd",
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
    openWindow("board", { boardName: name });
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
          openWindow("board", { boardName: key });
          return print(`now in '${key}'`, "ok");
        }
        case "board":
          return handleBoardCommand(tokens);
        case "task":
          return handleTaskCommand(tokens);
        case "graph":
          openWindow("graph");
          return print("opened board graph", "ok");
        case "cal":
          openWindow("calendar");
          return print("opened calendar", "ok");
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
          openWindow("board", { boardName: name });
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
    <div className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
      <Clock size={12} />
      {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </div>
  );
}

function ThemeSwitcher({ osTheme, setOsTheme }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="grid h-8 w-8 place-items-center rounded-lg transition-transform hover:scale-110 active:scale-95"
        style={{ color: "var(--text-muted)" }}
        title="Theme"
      >
        <Palette size={15} />
      </button>
      {open && (
        <div
          className="absolute bottom-11 right-0 w-40 origin-bottom-right animate-[popIn_120ms_ease-out] overflow-hidden rounded-xl border shadow-2xl"
          style={{ background: "var(--surface-solid)", borderColor: "var(--border)" }}
          onMouseLeave={() => setOpen(false)}
        >
          {OS_THEME_ORDER.map((key) => {
            const t = OS_THEMES[key];
            const active = key === osTheme;
            return (
              <button
                key={key}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setOsTheme(key);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs"
                style={{ color: "var(--text)", background: active ? "var(--accent-soft)" : "transparent" }}
              >
                {t.mode === "dark" ? <Moon size={12} /> : <Sun size={12} />}
                {t.label}
                {active && <Check size={11} className="ml-auto" style={{ color: "var(--accent)" }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Dock({ windows, openWindow, focusWindow, restoreWindow, minimizeWindow, osTheme, setOsTheme }) {
  const [startOpen, setStartOpen] = useState(false);

  const label = (w) => {
    if (w.kind === "terminal") return "Terminal";
    if (w.kind === "file-manager") return "Boards";
    if (w.kind === "graph") return "Graph";
    if (w.kind === "calendar") return "Calendar";
    if (w.kind === "board") return w.boardName;
    if (w.kind === "project") return w.projectName;
    return w.kind;
  };
  const iconFor = (kind) =>
    kind === "terminal" ? <TerminalIcon size={13} /> :
    kind === "file-manager" ? <Kanban size={13} /> :
    kind === "graph" ? <Network size={13} /> :
    kind === "calendar" ? <CalendarIcon size={13} /> :
    kind === "project" ? <Rocket size={13} /> : <Folder size={13} />;

  const topZ = windows.reduce((m, w) => Math.max(m, w.z), 0);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[9000] flex justify-center">
      <div
        className="pointer-events-auto flex animate-[slideUp_220ms_cubic-bezier(0.16,1,0.3,1)] items-center gap-1 rounded-2xl border px-2 py-1.5 shadow-xl backdrop-blur-xl"
        style={{ background: "var(--dock-bg)", borderColor: "var(--border)" }}
      >
        <div className="relative">
          <button
            onClick={() => setStartOpen((s) => !s)}
            className="grid h-9 w-9 place-items-center rounded-xl transition-transform hover:scale-110 active:scale-95"
            style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
            title="Artemis"
          >
            <Sparkles size={16} />
          </button>
          {startOpen && (
            <div
              className="absolute bottom-12 left-0 w-44 origin-bottom-left animate-[popIn_130ms_ease-out] overflow-hidden rounded-xl border shadow-2xl"
              style={{ background: "var(--surface-solid)", borderColor: "var(--border)" }}
              onMouseLeave={() => setStartOpen(false)}
            >
              <button
                onClick={() => {
                  openWindow("terminal");
                  setStartOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs"
                style={{ color: "var(--text)" }}
              >
                <TerminalIcon size={13} /> Open Terminal
              </button>
              <button
                onClick={() => {
                  openWindow("file-manager");
                  setStartOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs"
                style={{ color: "var(--text)" }}
              >
                <Kanban size={13} /> Boards
              </button>
              <button
                onClick={() => {
                  openWindow("calendar");
                  setStartOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs"
                style={{ color: "var(--text)" }}
              >
                <CalendarIcon size={13} /> Calendar
              </button>
              <button
                onClick={() => {
                  openWindow("graph");
                  setStartOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs"
                style={{ color: "var(--text)" }}
              >
                <Network size={13} /> Graph View
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => openWindow("file-manager")}
          className="grid h-9 w-9 place-items-center rounded-xl transition-transform hover:scale-110 active:scale-95"
          style={{ color: "var(--text-muted)" }}
          title="Boards"
        >
          <Kanban size={17} />
        </button>
        <button
          onClick={() => openWindow("terminal")}
          className="grid h-9 w-9 place-items-center rounded-xl transition-transform hover:scale-110 active:scale-95"
          style={{ color: "var(--text-muted)" }}
          title="Terminal (Shift+T)"
        >
          <TerminalIcon size={17} />
        </button>
        <button
          onClick={() => openWindow("calendar")}
          className="grid h-9 w-9 place-items-center rounded-xl transition-transform hover:scale-110 active:scale-95"
          style={{ color: "var(--text-muted)" }}
          title="Calendar"
        >
          <CalendarIcon size={17} />
        </button>

        {windows.length > 0 && <div className="mx-1 h-6 w-px" style={{ background: "var(--border)" }} />}

        {windows.map((w) => {
          const active = !w.minimized && w.z === topZ;
          return (
            <button
              key={w.id}
              onClick={() => (w.minimized ? restoreWindow(w.id) : active ? minimizeWindow(w.id) : focusWindow(w.id))}
              className="flex max-w-[120px] animate-[popIn_160ms_ease-out] items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-medium transition-transform hover:scale-105 active:scale-95"
              style={{
                background: active ? "var(--accent)" : "var(--accent-soft)",
                color: active ? "var(--accent-contrast)" : "var(--text-muted)",
              }}
            >
              {iconFor(w.kind)}
              <span className="truncate">{label(w)}</span>
            </button>
          );
        })}

        <div className="mx-1 h-6 w-px" style={{ background: "var(--border)" }} />
        <div className="flex items-center gap-1 px-1">
          <ThemeSwitcher osTheme={osTheme} setOsTheme={setOsTheme} />
          <div className="px-1">
            <Clock24 />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Desktop icons                                                      */
/* ------------------------------------------------------------------ */

function DesktopIcon({ icon, label, onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="flex w-20 flex-col items-center gap-1 rounded-lg p-2 text-center transition-transform hover:-translate-y-0.5 active:scale-95"
    >
      <div
        className="grid h-10 w-10 place-items-center rounded-xl shadow backdrop-blur"
        style={{ background: "var(--surface)", color: "var(--accent)" }}
      >
        {icon}
      </div>
      <span className="text-[10px] font-medium drop-shadow-sm" style={{ color: "var(--text)" }}>
        {label}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Root App                                                            */
/* ------------------------------------------------------------------ */

export default function ArtemisOS() {
  const [state, dispatch] = useReducer(osReducer, undefined, makeInitialState);
  const [theme, setTheme] = useState("amber"); // terminal CRT theme
  const [osTheme, setOsTheme] = useState("aurora"); // window-chrome theme
  const desktopRef = useRef(null);
  const dragRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const backendRef = useRef(null);
  if (backendRef.current === null) backendRef.current = resolvePersistBackend() || false;
  const backend = backendRef.current || null;

  const getRect = () => desktopRef.current?.getBoundingClientRect() || { width: 1200, height: 700 };

  const openWindow = useCallback((kind, extra = {}) => {
    dispatch({ type: "OPEN_WINDOW", kind, rect: getRect(), ...extra });
  }, []);

  /* load persisted state once */
  useEffect(() => {
    let cancelled = false;
    if (!backend) {
      setLoaded(true);
      return undefined;
    }
    (async () => {
      try {
        const result = await backend.get(STORAGE_KEY);
        if (!cancelled && result?.value) {
          const data = JSON.parse(result.value);
          dispatch({
            type: "HYDRATE",
            payload: {
              boards: data.boards || {},
              projects: Array.isArray(data.projects) ? data.projects : [],
              windows: Array.isArray(data.windows) ? data.windows : [],
              activeBoard: data.activeBoard ?? null,
              calendarEvents: data.calendarEvents || {},
            },
          });
          if (data.theme) setTheme(data.theme);
          if (data.osTheme && OS_THEMES[data.osTheme]) setOsTheme(data.osTheme);
        }
      } catch (e) {
        /* nothing saved yet, or the saved data was corrupt — start fresh */
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

  /* debounced, silent autosave */
  useEffect(() => {
    if (!loaded || !backend) return undefined;
    const t = setTimeout(async () => {
      try {
        await backend.set(
          STORAGE_KEY,
          JSON.stringify({
            boards: state.boards,
            projects: state.projects,
            windows: state.windows,
            activeBoard: state.activeBoard,
            calendarEvents: state.calendarEvents,
            theme,
            osTheme,
          })
        );
      } catch (e) {
        /* best-effort — a failed save doesn't interrupt the session */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [state.boards, state.projects, state.windows, state.activeBoard, state.calendarEvents, theme, osTheme, loaded, backend]);

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
  const themeVars = OS_THEMES[osTheme].vars;
  const rootVarsCss = `:root { ${Object.entries(themeVars).map(([k, v]) => `${k}: ${v};`).join(" ")} }`;

  return (
    <div
      ref={desktopRef}
      className="relative h-[700px] w-full select-none overflow-hidden rounded-2xl"
      style={{
        cursor: "none",
        background:
          "radial-gradient(1200px 600px at 15% -10%, var(--bg-a) 0%, transparent 60%), radial-gradient(1000px 700px at 100% 110%, var(--bg-b) 0%, transparent 55%), linear-gradient(160deg, var(--bg-a) 0%, var(--bg-b) 45%, var(--bg-c) 100%)",
      }}
    >
      <style>{`
        ${rootVarsCss}
        @keyframes winIn { 0% { opacity:0; transform: scale(0.94) translateY(6px);} 100% { opacity:1; transform: scale(1) translateY(0);} }
        @keyframes terminalIn { 0% { opacity:0; transform: scale(0.96); clip-path: inset(0 0 100% 0);} 45% { opacity:1; clip-path: inset(0 0 0% 0);} 100% { opacity:1; transform: scale(1); clip-path: inset(0 0 0% 0);} }
        @keyframes popIn { 0% { opacity:0; transform: scale(0.9);} 100% { opacity:1; transform: scale(1);} }
        @keyframes fadeIn { 0% { opacity:0;} 100% { opacity:1;} }
        @keyframes slideIn { 0% { opacity:0; transform: translateX(-4px);} 100% { opacity:1; transform: translateX(0);} }
        @keyframes slideUp { 0% { opacity:0; transform: translateY(10px);} 100% { opacity:1; transform: translateY(0);} }
        @keyframes lineIn { 0% { opacity:0; transform: translateY(3px);} 100% { opacity:1; transform: translateY(0);} }
        .line-clamp-1 { display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden; }
        * { cursor: none !important; }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; cursor: auto !important; }
        }
      `}</style>

      <div className="absolute left-6 top-6 flex flex-col gap-1">
        <DesktopIcon icon={<Kanban size={19} />} label="Boards" onOpen={() => openWindow("file-manager")} />
        <DesktopIcon icon={<TerminalIcon size={19} />} label="Terminal" onOpen={() => openWindow("terminal")} />
        <DesktopIcon icon={<CalendarIcon size={19} />} label="Calendar" onOpen={() => openWindow("calendar")} />
        <DesktopIcon icon={<Network size={19} />} label="Graph" onOpen={() => openWindow("graph")} />
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
        if (w.kind === "calendar") {
          return (
            <WindowFrame key={w.id} {...commonProps} title="Calendar" icon={<CalendarIcon size={13} />}>
              <CalendarApp events={state.calendarEvents} dispatch={dispatch} />
            </WindowFrame>
          );
        }
        if (w.kind === "project") {
          return (
            <WindowFrame key={w.id} {...commonProps} title={w.projectName} icon={<Rocket size={13} />}>
              <ProjectApp projectName={w.projectName} boards={state.boards} openWindow={openWindow} />
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
        osTheme={osTheme}
        setOsTheme={setOsTheme}
      />

      <CustomCursor containerRef={desktopRef} />
    </div>
  );
}