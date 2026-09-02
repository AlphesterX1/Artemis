import React, { useState, useRef, useEffect, useCallback } from "react";

/* ---------- palette (mutated live by theme) ---------- */
const C = {
  mode: "dark",
  bg: "#0b0906",
  bg2: "#120d07",
  surface: "#171009",
  surfaceHi: "#1e1509",
  border: "#4a3311",
  borderHi: "#7a5619",
  amber: "#ffb200",
  amberDim: "#a97a1f",
  amberFaint: "#6b4c17",
  danger: "#ff6b4a",
  glow: "rgba(255,178,0,0.45)",
};

const FONT =
  "ui-monospace, 'SF Mono', 'Cascadia Mono', Consolas, 'Liberation Mono', Menlo, monospace";

/* ---------- 8 themes: 4 dark, 4 light ---------- */
const THEMES = {
  amber: {
    mode: "dark",
    bg: "#0b0906", bg2: "#120d07", surface: "#171009", surfaceHi: "#1e1509",
    border: "#4a3311", borderHi: "#7a5619",
    amber: "#ffb200", amberDim: "#a97a1f", amberFaint: "#6b4c17",
    danger: "#ff6b4a", glow: "rgba(255,178,0,0.45)",
  },
  green: {
    mode: "dark",
    bg: "#040b06", bg2: "#07130a", surface: "#0b1a0f", surfaceHi: "#102513",
    border: "#123a1c", borderHi: "#1d5c2c",
    amber: "#33ff66", amberDim: "#1f9e42", amberFaint: "#155c29",
    danger: "#ff5f5f", glow: "rgba(51,255,102,0.45)",
  },
  cyan: {
    mode: "dark",
    bg: "#04090b", bg2: "#071318", surface: "#0b1a1f", surfaceHi: "#102429",
    border: "#0f3138", borderHi: "#175160",
    amber: "#4ee7ff", amberDim: "#2b93a8", amberFaint: "#1a5866",
    danger: "#ff6b81", glow: "rgba(78,231,255,0.45)",
  },
  violet: {
    mode: "dark",
    bg: "#0a0714", bg2: "#120b1f", surface: "#191029", surfaceHi: "#221536",
    border: "#3a2159", borderHi: "#5a3486",
    amber: "#c084fc", amberDim: "#8b5cf6", amberFaint: "#5b3aa0",
    danger: "#ff6b9d", glow: "rgba(192,132,252,0.45)",
  },
  paper: {
    mode: "light",
    bg: "#f4ecd8", bg2: "#ede2c8", surface: "#fbf5e6", surfaceHi: "#f1e6cc",
    border: "#d8c9a3", borderHi: "#b9a476",
    amber: "#5b4326", amberDim: "#8a6d3f", amberFaint: "#b3a077",
    danger: "#c2452e", glow: "rgba(91,67,38,0.25)",
  },
  daylight: {
    mode: "light",
    bg: "#eef2f7", bg2: "#e4eaf2", surface: "#ffffff", surfaceHi: "#f3f6fa",
    border: "#c9d4e0", borderHi: "#9fb2c8",
    amber: "#1d4ed8", amberDim: "#3f65c4", amberFaint: "#7f97c4",
    danger: "#dc2626", glow: "rgba(29,78,216,0.25)",
  },
  mint: {
    mode: "light",
    bg: "#eef7f1", bg2: "#e3f2e9", surface: "#fbfffc", surfaceHi: "#eefaf2",
    border: "#bfe3cd", borderHi: "#8fcaa9",
    amber: "#0f7a4d", amberDim: "#2f9468", amberFaint: "#79b79a",
    danger: "#d1495b", glow: "rgba(15,122,77,0.25)",
  },
  blush: {
    mode: "light",
    bg: "#fbeef1", bg2: "#f7e2e7", surface: "#fffbfc", surfaceHi: "#fdf1f4",
    border: "#f0c9d3", borderHi: "#dba0b1",
    amber: "#b5305a", amberDim: "#c96a86", amberFaint: "#d99aad",
    danger: "#a3193a", glow: "rgba(181,48,90,0.25)",
  },
};

function applyTheme(name) {
  const t = THEMES[name];
  if (!t) return false;
  Object.assign(C, t);
  return true;
}

/* ---------- generic helpers ---------- */
let uidCounter = 0;
const uid = (p) => {
  uidCounter += 1;
  return `${p}-${uidCounter}-${Date.now().toString(36)}`;
};

const norm = (s) => (s || "").trim().toLowerCase();

function findBoardKey(boards, name) {
  const n = norm(name);
  return Object.keys(boards).find((k) => norm(k) === n) || null;
}

function findTaskIndex(tasks, name) {
  const n = norm(name);
  return tasks.findIndex((t) => norm(t.name) === n);
}

function boardStats(board) {
  const total = board.tasks.length;
  const done = board.tasks.filter((t) => t.done).length;
  return { total, done };
}

function padName(name, width) {
  if (name.length >= width) return name + " ";
  return name + " ".repeat(width - name.length);
}

function useElementSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!ref.current) return undefined;
    const el = ref.current;
    const update = () =>
      setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function daysUntil(dateStr) {
  const today = new Date(todayStr() + "T00:00:00");
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target - today) / 86400000);
}

/* ---------- tree helpers (tasks, keyed by id) ---------- */
function buildTree(items) {
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

function flattenTreeWithDepth(nodes, depth = 0, out = []) {
  nodes.forEach((n) => {
    const { children, ...rest } = n;
    out.push({ ...rest, depth });
    if (children && children.length) {
      flattenTreeWithDepth(children, depth + 1, out);
    }
  });
  return out;
}

function collectDescendantIds(tasks, rootId) {
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

/* ---------- tree helpers (boards, keyed by name) ---------- */
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

function layoutBoardForest(boards, w, h) {
  const keys = Object.keys(boards);
  const isRoot = (k) => !boards[k].parent || !boards[boards[k].parent];
  const rootKeys = keys.filter(isRoot);
  const childrenOf = (k) => keys.filter((kk) => boards[kk].parent === k);
  const cx = w / 2;
  const cy = h / 2;
  const ringGap = Math.max(58, Math.min(w, h) / 5.4);
  const positions = {};

  function place(key, depth, aFrom, aTo) {
    const angle = (aFrom + aTo) / 2;
    const r = depth * ringGap;
    const rad = ((angle - 90) * Math.PI) / 180;
    positions[key] = {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
      depth,
    };
    const kids = childrenOf(key);
    if (kids.length) {
      const span = aTo - aFrom;
      const step = span / kids.length;
      kids.forEach((ck, i) =>
        place(ck, depth + 1, aFrom + i * step, aFrom + (i + 1) * step)
      );
    }
  }

  const angleStep = 360 / Math.max(rootKeys.length, 1);
  rootKeys.forEach((k, i) => place(k, 1, i * angleStep, (i + 1) * angleStep));
  return positions;
}

/* ---------- board data normalization ---------- */
function normalizeBoardData(board) {
  const tasks = (board.tasks || []).map((t, i) => ({
    ...t,
    x: typeof t.x === "number" ? t.x : 40 + (i % 4) * 170,
    y: typeof t.y === "number" ? t.y : 40 + Math.floor(i / 4) * 100,
  }));
  return {
    tasks,
    parent: board.parent || null,
    drawings: board.drawings || [],
    files: board.files || [],
    canvas: board.canvas || { tx: 40, ty: 40, scale: 1 },
  };
}
function normalizeAllBoards(boards) {
  const out = {};
  Object.keys(boards).forEach((k) => {
    out[k] = normalizeBoardData(boards[k]);
  });
  return out;
}

/* ---------- help text ---------- */
const HELP_LINES = [
  "commands:",
  "  board -add <name>                  create a new board",
  "  board -add <name> | <parent>       create it as a subboard",
  "  board -parent <board> | <parent>   move a board under a parent",
  "  board -unparent <board>            make a board top-level again",
  "  board -del <name>                  delete a board",
  "  board -rename <old> -> <new>       rename a board",
  "  board @show                        show tasks + subboards here",
  "  board <name> -show                 show tasks in any board",
  "  ls                                 list boards, or tasks if inside one",
  "  cd <name>                          enter a board",
  "  cd .                               leave the current board",
  "  pwd                                show where you are",
  "",
  "  task -add <name>                   add a task to the current board",
  "  task -add <name> | <parent task>   add it as a subtask",
  "  task -parent <task> | <parent>     move a task under a parent task",
  "  task -unparent <task>              make a task top-level again",
  "  task -check <name>                 mark a task (+ subtasks) done",
  "  task -uncheck <name>               mark a task (+ subtasks) not done",
  "  task -check-all / -uncheck-all     mark every task in the board",
  "  task -del <name>                   delete a task (subtasks move up)",
  "  task -clear                        delete all completed tasks",
  "  task -rename <old> -> <new>        rename a task",
  "  task -move <task> -> <board>       move a task (+ subtasks) to another board",
  "",
  "  cal -add <title> | <date>          add a reminder (date = yyyy-mm-dd)",
  "  cal -add <title> | <date> | <board> attach it to a project/board",
  "  cal -del <title>                   remove a reminder",
  "  cal -show                          list all reminders",
  "  vis -cal   (or vis @)              open the calendar window",
  "",
  "  vis <name>                         open a board as a freeform canvas",
  "  vis -node  (or vis #)              show how boards connect",
  "  vis -close <name>|#|@              close a window",
  "  drag the ⇢ handle on a board window onto another to link them",
  "",
  "  inside a board canvas window:",
  "    double-click empty space           add a task card there",
  "    drag a card                        reposition it",
  "    double-click a card                rename it",
  "    ✏️ draw                            freehand sketch on the board",
  "    📎 file                            attach a local file / image",
  "    scroll wheel                       zoom the canvas",
  "    drag empty space                   pan around",
  "",
  "  find <text>                        search task names across all boards",
  "  stats                              show overall progress",
  "  history                            show recently run commands",
  "  theme <name>                       amber/green/cyan/violet (dark)",
  "                                      paper/daylight/mint/blush (light)",
  "  date                               show the current date and time",
  "  clear                              clear the screen",
  "  reset -yes                        erase every board, task & saved file",
  "  help                               show this list",
  "",
  "  boards and tasks are saved automatically as you go.",
  "",
  "  aliases: mkdir = board -add   touch = task -add",
  "           rmdir = board -del  rm = task -del / board -del",
];

const BOOT_LINES = [
  "╔════════════════════════════════╗",
  "║           TODO SHELL           ║",
  "║        v1.1 — type help        ║",
  "╚════════════════════════════════╝",
  "",
  "type `help` to see available commands.",
  "",
];

const STORAGE_KEY = "todo-shell-state-v1";

/* ================================================================== */

export default function TodoTerminalApp() {
  const [boards, setBoards] = useState({});
  const [currentBoard, setCurrentBoard] = useState(null);
  const [events, setEvents] = useState([]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [cmdLog, setCmdLog] = useState([]);
  const [cmdPtr, setCmdPtr] = useState(-1);
  const [windows, setWindows] = useState([]);
  const [booted, setBooted] = useState(false);
  const [themeName, setThemeName] = useState("amber");
  const [draggingId, setDraggingId] = useState(null);
  const [linkPos, setLinkPos] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const storageAvailable =
    typeof window !== "undefined" && !!window.storage;

  const changeTheme = (name) => {
    if (applyTheme(name)) setThemeName(name);
  };

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const dragRef = useRef(null);
  const linkDragRef = useRef(null);
  const containerRef = useRef(null);
  const zCounter = useRef(10);

  /* make sure the page truly fills the viewport */
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const prev = {
      rootH: root.style.height,
      bodyH: body.style.height,
      bodyM: body.style.margin,
      bodyO: body.style.overflow,
    };
    root.style.height = "100%";
    body.style.height = "100%";
    body.style.margin = "0";
    body.style.overflow = "hidden";
    return () => {
      root.style.height = prev.rootH;
      body.style.height = prev.bodyH;
      body.style.margin = prev.bodyM;
      body.style.overflow = prev.bodyO;
    };
  }, []);

  /* boot sequence */
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      if (i >= BOOT_LINES.length) {
        clearInterval(t);
        setBooted(true);
        return;
      }
      setHistory((h) => [
        ...h,
        { id: uid("boot"), kind: "sys", text: BOOT_LINES[i] },
      ]);
      i += 1;
    }, 70);
    return () => clearInterval(t);
  }, []);

  /* load saved state once, on mount */
  useEffect(() => {
    let cancelled = false;
    if (!storageAvailable) {
      setLoaded(true);
      return undefined;
    }
    (async () => {
      try {
        const result = await window.storage.get(STORAGE_KEY, false);
        if (!cancelled && result && result.value) {
          const data = JSON.parse(result.value);
          if (data.boards) setBoards(normalizeAllBoards(data.boards));
          if (typeof data.currentBoard !== "undefined") {
            setCurrentBoard(data.currentBoard);
          }
          if (data.themeName) {
            applyTheme(data.themeName);
            setThemeName(data.themeName);
          }
          if (Array.isArray(data.windows)) setWindows(data.windows);
          if (Array.isArray(data.cmdLog)) setCmdLog(data.cmdLog);
          if (Array.isArray(data.events)) setEvents(data.events);
          if (typeof data.zCounter === "number") {
            zCounter.current = data.zCounter;
          }
          if (typeof data.uidCounter === "number") {
            uidCounter = Math.max(uidCounter, data.uidCounter);
          }
        }
      } catch (e) {
        // nothing saved yet, or storage unavailable — start fresh
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* save state whenever it changes (debounced), after the initial load */
  useEffect(() => {
    if (!loaded || !storageAvailable) return undefined;
    const t = setTimeout(async () => {
      try {
        const payload = JSON.stringify({
          boards,
          currentBoard,
          themeName,
          windows,
          cmdLog,
          events,
          zCounter: zCounter.current,
          uidCounter,
        });
        await window.storage.set(STORAGE_KEY, payload, false);
      } catch (e) {
        // ignore
      }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boards, currentBoard, themeName, windows, cmdLog, events, loaded]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    if (booted && inputRef.current) inputRef.current.focus();
  }, [booted]);

  const print = useCallback((text, kind = "out") => {
    setHistory((h) => [...h, { id: uid("l"), kind, text }]);
  }, []);

  /* ---------- window management ---------- */
  const bringToFront = (id) => {
    zCounter.current += 1;
    const z = zCounter.current;
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, z } : w)));
  };

  const closeWindow = (id) => {
    setWindows((ws) => ws.filter((w) => w.id !== id));
  };

  const nextPos = (w = 420, h = 480) => {
    const vw = containerRef.current ? containerRef.current.clientWidth : 1000;
    const vh = containerRef.current ? containerRef.current.clientHeight : 700;
    const count = windows.length;
    const x = Math.min(60 + (count % 6) * 34, Math.max(20, vw - w - 20));
    const y = Math.min(50 + (count % 6) * 30, Math.max(20, vh - h - 20));
    return { x, y };
  };

  const openBoardWindow = (boardKey) => {
    const existing = windows.find(
      (w) => w.kind === "board" && w.boardName === boardKey
    );
    if (existing) {
      bringToFront(existing.id);
      return;
    }
    zCounter.current += 1;
    const pos = nextPos(440, 500);
    setWindows((ws) => [
      ...ws,
      {
        id: uid("win"),
        kind: "board",
        boardName: boardKey,
        x: pos.x,
        y: pos.y,
        width: 440,
        height: 500,
        z: zCounter.current,
      },
    ]);
  };

  const openGraphWindow = () => {
    const existing = windows.find((w) => w.kind === "graph");
    if (existing) {
      bringToFront(existing.id);
      return;
    }
    zCounter.current += 1;
    const pos = nextPos(460, 500);
    setWindows((ws) => [
      ...ws,
      {
        id: uid("win"),
        kind: "graph",
        x: pos.x,
        y: pos.y,
        width: 460,
        height: 500,
        z: zCounter.current,
      },
    ]);
  };

  const openCalendarWindow = () => {
    const existing = windows.find((w) => w.kind === "calendar");
    if (existing) {
      bringToFront(existing.id);
      return;
    }
    zCounter.current += 1;
    const pos = nextPos(360, 500);
    setWindows((ws) => [
      ...ws,
      {
        id: uid("win"),
        kind: "calendar",
        x: pos.x,
        y: pos.y,
        width: 360,
        height: 500,
        z: zCounter.current,
      },
    ]);
  };

  /* ---------- window dragging ---------- */
  const onDragMove = useCallback((e) => {
    if (!dragRef.current) return;
    const { id, offsetX, offsetY } = dragRef.current;
    const bounds = containerRef.current
      ? containerRef.current.getBoundingClientRect()
      : { width: 2000, height: 2000 };
    const x = Math.min(Math.max(0, e.clientX - offsetX), bounds.width - 60);
    const y = Math.min(Math.max(0, e.clientY - offsetY), bounds.height - 40);
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, x, y } : w)));
  }, []);

  const onDragEnd = useCallback(() => {
    dragRef.current = null;
    setDraggingId(null);
    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("mouseup", onDragEnd);
  }, [onDragMove]);

  const startDrag = (e, win) => {
    e.preventDefault();
    bringToFront(win.id);
    setDraggingId(win.id);
    dragRef.current = {
      id: win.id,
      offsetX: e.clientX - win.x,
      offsetY: e.clientY - win.y,
    };
    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("mouseup", onDragEnd);
  };

  /* ---------- link dragging: connect board windows to set parent/child ---------- */
  const onLinkMove = useCallback((e) => {
    if (!linkDragRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLinkPos((p) => (p ? { ...p, x2: x, y2: y } : p));
  }, []);

  const onLinkEnd = useCallback(
    (e) => {
      document.removeEventListener("mousemove", onLinkMove);
      document.removeEventListener("mouseup", onLinkEnd);
      const source = linkDragRef.current ? linkDragRef.current.sourceKey : null;
      linkDragRef.current = null;
      setLinkPos(null);
      if (!source) return;

      const el = document.elementFromPoint(e.clientX, e.clientY);
      const targetEl = el ? el.closest("[data-vis-board]") : null;
      if (!targetEl) return;
      const targetKey = targetEl.getAttribute("data-vis-board");
      if (!targetKey || norm(targetKey) === norm(source)) return;

      setBoards((b) => {
        if (isAncestorBoard(b, targetKey, source)) {
          print(
            `can't link — '${targetKey}' is already inside '${source}'`,
            "err"
          );
          return b;
        }
        print(`linked '${targetKey}' as a subboard of '${source}'`);
        return { ...b, [targetKey]: { ...b[targetKey], parent: source } };
      });
    },
    [onLinkMove, print]
  );

  const startLink = (e, boardKey) => {
    e.preventDefault();
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    linkDragRef.current = { sourceKey: boardKey };
    setLinkPos({ x1: x, y1: y, x2: x, y2: y });
    document.addEventListener("mousemove", onLinkMove);
    document.addEventListener("mouseup", onLinkEnd);
  };

  /* ---------- data ops (used by both terminal + windows) ---------- */
  const addTaskTo = (boardKey, name, parentId = null, pos = null) => {
    if (!name) return;
    setBoards((b) => {
      const board = b[boardKey];
      if (findTaskIndex(board.tasks, name) !== -1) return b;
      const idx = board.tasks.length;
      const defaultPos = {
        x: 40 + (idx % 4) * 170,
        y: 40 + Math.floor(idx / 4) * 100,
      };
      return {
        ...b,
        [boardKey]: {
          ...board,
          tasks: [
            ...board.tasks,
            {
              id: uid("task"),
              name,
              done: false,
              parentId: parentId || null,
              x: pos && typeof pos.x === "number" ? pos.x : defaultPos.x,
              y: pos && typeof pos.y === "number" ? pos.y : defaultPos.y,
            },
          ],
        },
      };
    });
  };

  const toggleTask = (boardKey, taskId, done) => {
    setBoards((b) => {
      const board = b[boardKey];
      const affected = new Set(collectDescendantIds(board.tasks, taskId));
      return {
        ...b,
        [boardKey]: {
          ...board,
          tasks: board.tasks.map((t) =>
            affected.has(t.id) ? { ...t, done } : t
          ),
        },
      };
    });
  };

  const removeTask = (boardKey, taskId) => {
    setBoards((b) => {
      const board = b[boardKey];
      const task = board.tasks.find((t) => t.id === taskId);
      const grandParentId = task ? task.parentId : null;
      return {
        ...b,
        [boardKey]: {
          ...board,
          tasks: board.tasks
            .filter((t) => t.id !== taskId)
            .map((t) =>
              t.parentId === taskId ? { ...t, parentId: grandParentId } : t
            ),
        },
      };
    });
  };

  const renameTask = (boardKey, taskId, newName) => {
    setBoards((b) => ({
      ...b,
      [boardKey]: {
        ...b[boardKey],
        tasks: b[boardKey].tasks.map((t) =>
          t.id === taskId ? { ...t, name: newName } : t
        ),
      },
    }));
  };

  const moveTaskPos = (boardKey, taskId, x, y) => {
    setBoards((b) => ({
      ...b,
      [boardKey]: {
        ...b[boardKey],
        tasks: b[boardKey].tasks.map((t) =>
          t.id === taskId ? { ...t, x, y } : t
        ),
      },
    }));
  };

  const addDrawing = (boardKey, stroke) => {
    setBoards((b) => ({
      ...b,
      [boardKey]: {
        ...b[boardKey],
        drawings: [
          ...(b[boardKey].drawings || []),
          { id: uid("ink"), points: stroke.points, color: stroke.color },
        ],
      },
    }));
  };

  const clearDrawings = (boardKey) => {
    setBoards((b) => ({ ...b, [boardKey]: { ...b[boardKey], drawings: [] } }));
  };

  const addFile = (boardKey, file) => {
    setBoards((b) => ({
      ...b,
      [boardKey]: {
        ...b[boardKey],
        files: [...(b[boardKey].files || []), { id: uid("file"), ...file }],
      },
    }));
  };

  const removeFile = (boardKey, fileId) => {
    setBoards((b) => ({
      ...b,
      [boardKey]: {
        ...b[boardKey],
        files: (b[boardKey].files || []).filter((f) => f.id !== fileId),
      },
    }));
  };

  const moveFile = (boardKey, fileId, x, y) => {
    setBoards((b) => ({
      ...b,
      [boardKey]: {
        ...b[boardKey],
        files: (b[boardKey].files || []).map((f) =>
          f.id === fileId ? { ...f, x, y } : f
        ),
      },
    }));
  };

  const updateCanvasView = (boardKey, view) => {
    setBoards((b) => ({ ...b, [boardKey]: { ...b[boardKey], canvas: view } }));
  };

  const addBoard = (name, parent = null) => {
    setBoards((b) => ({
      ...b,
      [name]: { tasks: [], parent, drawings: [], files: [], canvas: { tx: 40, ty: 40, scale: 1 } },
    }));
  };

  const addEvent = (title, date, boardName = null) => {
    setEvents((ev) => [...ev, { id: uid("ev"), title, date, boardName }]);
  };
  const removeEvent = (id) => setEvents((ev) => ev.filter((e) => e.id !== id));

  const boardOps = {
    addTask: addTaskTo,
    toggleTask,
    removeTask,
    renameTask,
    moveTask: moveTaskPos,
    addDrawing,
    clearDrawings,
    addFile,
    removeFile,
    moveFile,
    updateCanvasView,
  };

  /* ---------- command execution ---------- */
  const runCommand = (raw) => {
    const cmdStr = raw.trim();
    const prompt = getPromptStr(currentBoard);
    setHistory((h) => [
      ...h,
      { id: uid("cmd"), kind: "cmd", prompt, text: cmdStr },
    ]);
    if (!cmdStr) return;

    setCmdLog((log) => [...log, cmdStr]);
    setCmdPtr(-1);

    const tokens = cmdStr.split(/\s+/);
    const head = tokens[0].toLowerCase();

    switch (head) {
      case "help": {
        print(HELP_LINES.join("\n"));
        break;
      }

      case "clear": {
        setHistory([]);
        break;
      }

      case "pwd": {
        print(currentBoard ? `/${currentBoard}` : "/");
        break;
      }

      case "whoami": {
        print("guest — just you and your lists");
        break;
      }

      case "ls": {
        if (currentBoard) {
          printBoardTasks(currentBoard);
        } else {
          printBoardList();
        }
        break;
      }

      case "cd": {
        const arg = tokens.slice(1).join(" ");
        if (!arg || arg === "." || arg === "..") {
          setCurrentBoard(null);
          print("back at root");
          break;
        }
        const key = findBoardKey(boards, arg);
        if (!key) {
          print(`no board named '${arg}'`, "err");
          break;
        }
        setCurrentBoard(key);
        print(`now in '${key}'`);
        break;
      }

      case "board": {
        handleBoardCommand(tokens);
        break;
      }

      case "task": {
        handleTaskCommand(tokens);
        break;
      }

      case "cal": {
        handleCalCommand(tokens);
        break;
      }

      case "vis": {
        if (tokens[1] === "-close") {
          const arg = tokens.slice(2).join(" ").trim();
          if (arg === "#" || arg === "-node") {
            const win = windows.find((w) => w.kind === "graph");
            if (!win) {
              print("no graph window is open", "err");
              break;
            }
            closeWindow(win.id);
            print("closed board graph");
            break;
          }
          if (arg === "@" || arg === "-cal") {
            const win = windows.find((w) => w.kind === "calendar");
            if (!win) {
              print("no calendar window is open", "err");
              break;
            }
            closeWindow(win.id);
            print("closed calendar");
            break;
          }
          const key = findBoardKey(boards, arg);
          const win = key
            ? windows.find((w) => w.kind === "board" && w.boardName === key)
            : null;
          if (!win) {
            print(`no open window for '${arg}'`, "err");
            break;
          }
          closeWindow(win.id);
          print(`closed '${key}'`);
          break;
        }

        const arg = tokens.slice(1).join(" ").trim();
        if (arg === "#" || arg === "-node") {
          openGraphWindow();
          print("opened board graph");
          break;
        }
        if (arg === "@" || arg === "-cal") {
          openCalendarWindow();
          print("opened calendar");
          break;
        }
        if (!arg) {
          print("usage: vis <board name>   vis -node (#)   vis -cal (@)", "err");
          break;
        }
        const key = findBoardKey(boards, arg);
        if (!key) {
          print(`no board named '${arg}'`, "err");
          break;
        }
        openBoardWindow(key);
        print(`opened '${key}'`);
        break;
      }

      case "find": {
        const query = tokens.slice(1).join(" ");
        if (!query) {
          print("usage: find <text>", "err");
          break;
        }
        const q = query.toLowerCase();
        const lines = [`results for '${query}':`];
        let matches = 0;
        Object.keys(boards).forEach((k) => {
          const hits = boards[k].tasks.filter((t) =>
            t.name.toLowerCase().includes(q)
          );
          if (hits.length) {
            lines.push(`  ${k}:`);
            hits.forEach((t) => {
              lines.push(`    [${t.done ? "x" : " "}] ${t.name}`);
              matches += 1;
            });
          }
        });
        print(matches ? lines.join("\n") : `no tasks match '${query}'`);
        break;
      }

      case "stats": {
        const boardKeys = Object.keys(boards);
        let total = 0;
        let done = 0;
        boardKeys.forEach((k) => {
          const s = boardStats(boards[k]);
          total += s.total;
          done += s.done;
        });
        const pct = total === 0 ? 0 : Math.round((done / total) * 100);
        print(
          [
            `boards: ${boardKeys.length}`,
            `tasks:  ${done}/${total} done (${pct}%)`,
            `reminders: ${events.length}`,
            `open windows: ${windows.length}`,
          ].join("\n")
        );
        break;
      }

      case "history": {
        if (cmdLog.length === 0) {
          print("no commands yet");
          break;
        }
        print(cmdLog.map((c, i) => `  ${i + 1}  ${c}`).join("\n"));
        break;
      }

      case "theme": {
        const arg = (tokens[1] || "").toLowerCase();
        const names = Object.keys(THEMES);
        if (!arg) {
          print(`current theme: ${themeName}\navailable: ${names.join(", ")}`);
          break;
        }
        if (!names.includes(arg)) {
          print(`unknown theme '${arg}' — try: ${names.join(", ")}`, "err");
          break;
        }
        changeTheme(arg);
        print(`theme set to '${arg}'`);
        break;
      }

      case "date": {
        print(new Date().toString());
        break;
      }

      case "reset": {
        if (tokens[1] !== "-yes") {
          print(
            "this deletes every board, task, and saved file — type `reset -yes` to confirm",
            "err"
          );
          break;
        }
        setBoards({});
        setCurrentBoard(null);
        setWindows([]);
        setCmdLog([]);
        setEvents([]);
        if (storageAvailable) {
          window.storage.delete(STORAGE_KEY, false).catch(() => {});
        }
        print("everything cleared");
        break;
      }

      case "mkdir": {
        const name = tokens.slice(1).join(" ");
        if (!name) {
          print("usage: mkdir <board name>", "err");
          break;
        }
        if (findBoardKey(boards, name)) {
          print(`board '${name}' already exists`, "err");
          break;
        }
        addBoard(name);
        print(`created board '${name}'`);
        break;
      }

      case "rmdir": {
        const name = tokens.slice(1).join(" ");
        const key = findBoardKey(boards, name);
        if (!key) {
          print(`no board named '${name}'`, "err");
          break;
        }
        deleteBoard(key);
        print(`deleted board '${key}'`);
        break;
      }

      case "touch": {
        if (!currentBoard) {
          print("you're not inside a board — try `cd <board>` first", "err");
          break;
        }
        const name = tokens.slice(1).join(" ");
        if (!name) {
          print("usage: touch <task name>", "err");
          break;
        }
        const board = boards[currentBoard];
        if (findTaskIndex(board.tasks, name) !== -1) {
          print(`task '${name}' already exists`, "err");
          break;
        }
        addTaskTo(currentBoard, name);
        print(`added task '${name}'`);
        break;
      }

      case "rm": {
        const name = tokens.slice(1).join(" ");
        if (!name) {
          print("usage: rm <name>", "err");
          break;
        }
        if (currentBoard) {
          const board = boards[currentBoard];
          const idx = findTaskIndex(board.tasks, name);
          if (idx === -1) {
            print(`no task named '${name}'`, "err");
            break;
          }
          removeTask(currentBoard, board.tasks[idx].id);
          print(`deleted task '${name}'`);
        } else {
          const key = findBoardKey(boards, name);
          if (!key) {
            print(`no board named '${name}'`, "err");
            break;
          }
          deleteBoard(key);
          print(`deleted board '${key}'`);
        }
        break;
      }

      default: {
        print(`unknown command: '${tokens[0]}' — try 'help'`, "err");
      }
    }
  };

  function deleteBoard(key) {
    const children = boardChildren(boards, key);
    const grandParent = boards[key] ? boards[key].parent : null;
    setBoards((b) => {
      const next = { ...b };
      delete next[key];
      children.forEach((ck) => {
        next[ck] = { ...next[ck], parent: grandParent };
      });
      return next;
    });
    if (currentBoard && norm(currentBoard) === norm(key)) {
      setCurrentBoard(null);
    }
    setWindows((ws) => ws.filter((w) => w.boardName !== key));
  }

  function printBoardList() {
    const allKeys = Object.keys(boards);
    const rootKeys = allKeys.filter((k) => !boards[k].parent);
    if (allKeys.length === 0) {
      print("no boards yet — try `board -add <name>`");
      return;
    }
    if (rootKeys.length === 0) {
      print("no top-level boards — every board is nested somewhere");
      return;
    }
    const width = Math.max(...rootKeys.map((k) => k.length)) + 2;
    const lines = [
      `${rootKeys.length} board${rootKeys.length === 1 ? "" : "s"}` +
        (allKeys.length !== rootKeys.length
          ? ` (+${allKeys.length - rootKeys.length} nested)`
          : "") +
        ":",
    ];
    rootKeys.forEach((k) => {
      const { total, done } = boardStats(boards[k]);
      const kids = boardChildren(boards, k).length;
      lines.push(
        `  ${padName(k, width)}${done}/${total} done${
          kids ? `  (${kids} sub)` : ""
        }`
      );
    });
    print(lines.join("\n"));
  }

  function printBoardTasks(key) {
    const board = boards[key];
    const { total, done } = boardStats(board);
    const lines = [`board: ${key} — ${done}/${total} done`];
    if (total === 0) {
      lines.push("  (no tasks yet — try `task -add <name>`)");
    } else {
      const flat = flattenTreeWithDepth(buildTree(board.tasks));
      flat.forEach((t) => {
        lines.push(
          `  ${"  ".repeat(t.depth)}[${t.done ? "x" : " "}] ${t.name}`
        );
      });
    }
    const kids = boardChildren(boards, key);
    if (kids.length) {
      lines.push(`subboards: ${kids.join(", ")}`);
    }
    print(lines.join("\n"));
  }

  function handleBoardCommand(tokens) {
    const sub = tokens[1];
    if (!sub) {
      print(
        "usage: board -add|-del|-parent|-unparent <name>   board @show   board <name> -show",
        "err"
      );
      return;
    }
    if (sub === "-add") {
      const rest = tokens.slice(2).join(" ");
      const pipeIdx = rest.indexOf(" | ");
      const name = (pipeIdx === -1 ? rest : rest.slice(0, pipeIdx)).trim();
      const parentName = pipeIdx === -1 ? "" : rest.slice(pipeIdx + 3).trim();
      if (!name) {
        print("usage: board -add <name> [| <parent board>]", "err");
        return;
      }
      if (findBoardKey(boards, name)) {
        print(`board '${name}' already exists`, "err");
        return;
      }
      let parentKey = null;
      if (parentName) {
        parentKey = findBoardKey(boards, parentName);
        if (!parentKey) {
          print(`no board named '${parentName}'`, "err");
          return;
        }
      }
      addBoard(name, parentKey);
      print(
        parentKey
          ? `created board '${name}' under '${parentKey}'`
          : `created board '${name}'`
      );
      return;
    }
    if (sub === "-del") {
      const name = tokens.slice(2).join(" ");
      const key = findBoardKey(boards, name);
      if (!key) {
        print(`no board named '${name}'`, "err");
        return;
      }
      deleteBoard(key);
      print(`deleted board '${key}'`);
      return;
    }
    if (sub === "-parent") {
      const rest = tokens.slice(2).join(" ");
      const pipeIdx = rest.indexOf(" | ");
      if (pipeIdx === -1) {
        print("usage: board -parent <board> | <parent board>", "err");
        return;
      }
      const childName = rest.slice(0, pipeIdx).trim();
      const parentName = rest.slice(pipeIdx + 3).trim();
      const childKey = findBoardKey(boards, childName);
      const parentKey = findBoardKey(boards, parentName);
      if (!childKey) {
        print(`no board named '${childName}'`, "err");
        return;
      }
      if (!parentKey) {
        print(`no board named '${parentName}'`, "err");
        return;
      }
      if (norm(childKey) === norm(parentKey)) {
        print("a board can't be its own parent", "err");
        return;
      }
      if (isAncestorBoard(boards, childKey, parentKey)) {
        print(
          `can't link — '${parentKey}' is already inside '${childKey}'`,
          "err"
        );
        return;
      }
      setBoards((b) => ({
        ...b,
        [childKey]: { ...b[childKey], parent: parentKey },
      }));
      print(`'${childKey}' is now a subboard of '${parentKey}'`);
      return;
    }
    if (sub === "-unparent") {
      const name = tokens.slice(2).join(" ");
      const key = findBoardKey(boards, name);
      if (!key) {
        print(`no board named '${name}'`, "err");
        return;
      }
      if (!boards[key].parent) {
        print(`'${key}' is already top-level`, "err");
        return;
      }
      setBoards((b) => ({ ...b, [key]: { ...b[key], parent: null } }));
      print(`'${key}' is now top-level`);
      return;
    }
    if (sub === "-rename") {
      const rest = tokens.slice(2).join(" ");
      const arrowIdx = rest.indexOf(" -> ");
      if (arrowIdx === -1) {
        print("usage: board -rename <old name> -> <new name>", "err");
        return;
      }
      const oldName = rest.slice(0, arrowIdx).trim();
      const newName = rest.slice(arrowIdx + 4).trim();
      const key = findBoardKey(boards, oldName);
      if (!key) {
        print(`no board named '${oldName}'`, "err");
        return;
      }
      if (!newName) {
        print("usage: board -rename <old name> -> <new name>", "err");
        return;
      }
      const clash = findBoardKey(boards, newName);
      if (clash && norm(clash) !== norm(key)) {
        print(`board '${newName}' already exists`, "err");
        return;
      }
      setBoards((b) => {
        const next = { ...b };
        const data = next[key];
        delete next[key];
        next[newName] = data;
        Object.keys(next).forEach((k) => {
          if (next[k].parent && norm(next[k].parent) === norm(key)) {
            next[k] = { ...next[k], parent: newName };
          }
        });
        return next;
      });
      if (currentBoard && norm(currentBoard) === norm(key)) {
        setCurrentBoard(newName);
      }
      setWindows((ws) =>
        ws.map((w) =>
          w.kind === "board" && w.boardName === key
            ? { ...w, boardName: newName }
            : w
        )
      );
      setEvents((ev) =>
        ev.map((e) =>
          e.boardName && norm(e.boardName) === norm(key)
            ? { ...e, boardName: newName }
            : e
        )
      );
      print(`renamed '${key}' to '${newName}'`);
      return;
    }
    if (sub === "@show") {
      if (!currentBoard) {
        print("you're not inside a board — try `cd <board>` first", "err");
        return;
      }
      printBoardTasks(currentBoard);
      return;
    }
    if (tokens[tokens.length - 1] === "-show") {
      const name = tokens.slice(1, -1).join(" ");
      const key = findBoardKey(boards, name);
      if (!key) {
        print(`no board named '${name}'`, "err");
        return;
      }
      printBoardTasks(key);
      return;
    }
    print(`unknown board command: '${sub}' — try 'help'`, "err");
  }

  function handleTaskCommand(tokens) {
    if (!currentBoard) {
      print("you're not inside a board — try `cd <board>` first", "err");
      return;
    }
    const sub = tokens[1];
    const name = tokens.slice(2).join(" ");
    const board = boards[currentBoard];

    if (sub === "-add") {
      const pipeIdx = name.indexOf(" | ");
      const taskName = (pipeIdx === -1 ? name : name.slice(0, pipeIdx)).trim();
      const parentName = pipeIdx === -1 ? "" : name.slice(pipeIdx + 3).trim();
      if (!taskName) {
        print("usage: task -add <name> [| <parent task>]", "err");
        return;
      }
      if (findTaskIndex(board.tasks, taskName) !== -1) {
        print(`task '${taskName}' already exists`, "err");
        return;
      }
      let parentId = null;
      if (parentName) {
        const pIdx = findTaskIndex(board.tasks, parentName);
        if (pIdx === -1) {
          print(`no task named '${parentName}'`, "err");
          return;
        }
        parentId = board.tasks[pIdx].id;
      }
      addTaskTo(currentBoard, taskName, parentId);
      print(
        parentId
          ? `added subtask '${taskName}' under '${parentName}'`
          : `added task '${taskName}'`
      );
      return;
    }
    if (sub === "-parent") {
      const pipeIdx = name.indexOf(" | ");
      if (pipeIdx === -1) {
        print("usage: task -parent <task> | <parent task>", "err");
        return;
      }
      const childName = name.slice(0, pipeIdx).trim();
      const parentName = name.slice(pipeIdx + 3).trim();
      const childIdx = findTaskIndex(board.tasks, childName);
      const parentIdx = findTaskIndex(board.tasks, parentName);
      if (childIdx === -1) {
        print(`no task named '${childName}'`, "err");
        return;
      }
      if (parentIdx === -1) {
        print(`no task named '${parentName}'`, "err");
        return;
      }
      const childTask = board.tasks[childIdx];
      const parentTask = board.tasks[parentIdx];
      if (childTask.id === parentTask.id) {
        print("a task can't be its own parent", "err");
        return;
      }
      if (collectDescendantIds(board.tasks, childTask.id).includes(parentTask.id)) {
        print(
          `can't link — '${parentName}' is already inside '${childName}'`,
          "err"
        );
        return;
      }
      setBoards((b) => ({
        ...b,
        [currentBoard]: {
          ...b[currentBoard],
          tasks: b[currentBoard].tasks.map((t) =>
            t.id === childTask.id ? { ...t, parentId: parentTask.id } : t
          ),
        },
      }));
      print(`'${childName}' is now a subtask of '${parentName}'`);
      return;
    }
    if (sub === "-unparent") {
      const idx = findTaskIndex(board.tasks, name);
      if (idx === -1) {
        print(`no task named '${name}'`, "err");
        return;
      }
      if (!board.tasks[idx].parentId) {
        print(`'${name}' is already top-level`, "err");
        return;
      }
      const taskId = board.tasks[idx].id;
      setBoards((b) => ({
        ...b,
        [currentBoard]: {
          ...b[currentBoard],
          tasks: b[currentBoard].tasks.map((t) =>
            t.id === taskId ? { ...t, parentId: null } : t
          ),
        },
      }));
      print(`'${name}' is now top-level`);
      return;
    }
    if (sub === "-check" || sub === "-uncheck") {
      const idx = findTaskIndex(board.tasks, name);
      if (idx === -1) {
        print(`no task named '${name}'`, "err");
        return;
      }
      toggleTask(currentBoard, board.tasks[idx].id, sub === "-check");
      print(sub === "-check" ? `checked '${name}'` : `unchecked '${name}'`);
      return;
    }
    if (sub === "-del") {
      const idx = findTaskIndex(board.tasks, name);
      if (idx === -1) {
        print(`no task named '${name}'`, "err");
        return;
      }
      removeTask(currentBoard, board.tasks[idx].id);
      print(`deleted task '${name}'`);
      return;
    }
    if (sub === "-check-all" || sub === "-uncheck-all") {
      const mark = sub === "-check-all";
      setBoards((b) => ({
        ...b,
        [currentBoard]: {
          ...b[currentBoard],
          tasks: b[currentBoard].tasks.map((t) => ({ ...t, done: mark })),
        },
      }));
      print(mark ? "checked every task" : "unchecked every task");
      return;
    }
    if (sub === "-clear") {
      const doneIds = new Set(board.tasks.filter((t) => t.done).map((t) => t.id));
      const resolveParent = (pid) => {
        let cur = pid;
        while (cur && doneIds.has(cur)) {
          const parentTask = board.tasks.find((t) => t.id === cur);
          cur = parentTask ? parentTask.parentId : null;
        }
        return cur || null;
      };
      setBoards((b) => ({
        ...b,
        [currentBoard]: {
          ...b[currentBoard],
          tasks: b[currentBoard].tasks
            .filter((t) => !doneIds.has(t.id))
            .map((t) => ({ ...t, parentId: resolveParent(t.parentId) })),
        },
      }));
      const removed = doneIds.size;
      print(`cleared ${removed} completed task${removed === 1 ? "" : "s"}`);
      return;
    }
    if (sub === "-rename") {
      const rest = name;
      const arrowIdx = rest.indexOf(" -> ");
      if (arrowIdx === -1) {
        print("usage: task -rename <old name> -> <new name>", "err");
        return;
      }
      const oldName = rest.slice(0, arrowIdx).trim();
      const newName = rest.slice(arrowIdx + 4).trim();
      const idx = findTaskIndex(board.tasks, oldName);
      if (idx === -1) {
        print(`no task named '${oldName}'`, "err");
        return;
      }
      if (!newName) {
        print("usage: task -rename <old name> -> <new name>", "err");
        return;
      }
      if (
        findTaskIndex(board.tasks, newName) !== -1 &&
        norm(newName) !== norm(oldName)
      ) {
        print(`task '${newName}' already exists`, "err");
        return;
      }
      const taskId = board.tasks[idx].id;
      renameTask(currentBoard, taskId, newName);
      print(`renamed '${oldName}' to '${newName}'`);
      return;
    }
    if (sub === "-move") {
      const rest = name;
      const arrowIdx = rest.indexOf(" -> ");
      if (arrowIdx === -1) {
        print("usage: task -move <task name> -> <board name>", "err");
        return;
      }
      const taskName = rest.slice(0, arrowIdx).trim();
      const targetName = rest.slice(arrowIdx + 4).trim();
      const idx = findTaskIndex(board.tasks, taskName);
      if (idx === -1) {
        print(`no task named '${taskName}'`, "err");
        return;
      }
      const targetKey = findBoardKey(boards, targetName);
      if (!targetKey) {
        print(`no board named '${targetName}'`, "err");
        return;
      }
      if (norm(targetKey) === norm(currentBoard)) {
        print(`'${taskName}' is already in '${currentBoard}'`, "err");
        return;
      }
      const task = board.tasks[idx];
      if (findTaskIndex(boards[targetKey].tasks, task.name) !== -1) {
        print(`'${targetKey}' already has a task named '${task.name}'`, "err");
        return;
      }
      const subtreeIds = collectDescendantIds(board.tasks, task.id);
      setBoards((b) => {
        const src = b[currentBoard];
        const tgt = b[targetKey];
        const moving = src.tasks
          .filter((t) => subtreeIds.includes(t.id))
          .map((t) => (t.id === task.id ? { ...t, parentId: null } : t));
        return {
          ...b,
          [currentBoard]: {
            ...src,
            tasks: src.tasks.filter((t) => !subtreeIds.includes(t.id)),
          },
          [targetKey]: { ...tgt, tasks: [...tgt.tasks, ...moving] },
        };
      });
      const extra = subtreeIds.length - 1;
      print(
        `moved '${task.name}'${
          extra > 0 ? ` (+${extra} subtask${extra === 1 ? "" : "s"})` : ""
        } to '${targetKey}'`
      );
      return;
    }
    print(`unknown task command: '${sub}' — try 'help'`, "err");
  }

  function handleCalCommand(tokens) {
    const sub = tokens[1];
    if (!sub) {
      print(
        "usage: cal -add <title> | <yyyy-mm-dd> [| <board>]   cal -del <title>   cal -show",
        "err"
      );
      return;
    }
    if (sub === "-add") {
      const rest = tokens.slice(2).join(" ");
      const parts = rest.split(" | ").map((s) => s.trim());
      const title = parts[0];
      const date = parts[1];
      const boardName = parts[2];
      if (!title || !date) {
        print("usage: cal -add <title> | <yyyy-mm-dd> [| <board>]", "err");
        return;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        print("date must look like yyyy-mm-dd", "err");
        return;
      }
      let boardKey = null;
      if (boardName) {
        boardKey = findBoardKey(boards, boardName);
        if (!boardKey) {
          print(`no board named '${boardName}'`, "err");
          return;
        }
      }
      addEvent(title, date, boardKey);
      print(`reminder '${title}' set for ${date}${boardKey ? ` (${boardKey})` : ""}`);
      return;
    }
    if (sub === "-del") {
      const title = tokens.slice(2).join(" ");
      const ev = events.find((e) => norm(e.title) === norm(title));
      if (!ev) {
        print(`no reminder named '${title}'`, "err");
        return;
      }
      removeEvent(ev.id);
      print(`removed reminder '${title}'`);
      return;
    }
    if (sub === "-show") {
      if (events.length === 0) {
        print("no reminders yet — try `cal -add <title> | <yyyy-mm-dd>`");
        return;
      }
      const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
      print(
        sorted
          .map((e) => `  ${e.date}  ${e.title}${e.boardName ? `  [${e.boardName}]` : ""}`)
          .join("\n")
      );
      return;
    }
    print(`unknown cal command: '${sub}' — try 'help'`, "err");
  }

  /* ---------- input handlers ---------- */
  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      runCommand(input);
      setInput("");
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdLog.length === 0) return;
      const idx = cmdPtr === -1 ? cmdLog.length - 1 : Math.max(0, cmdPtr - 1);
      setCmdPtr(idx);
      setInput(cmdLog[idx]);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
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

  const focusInput = () => {
    if (inputRef.current) inputRef.current.focus();
  };

  const promptStr = getPromptStr(currentBoard);
  const upcoming = events
    .filter((e) => {
      const d = daysUntil(e.date);
      return d >= 0 && d <= 7;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden select-none"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        background: `radial-gradient(ellipse at 50% 20%, ${C.bg2} 0%, ${C.bg} 70%)`,
        fontFamily: FONT,
      }}
      onClick={focusInput}
    >
      <style>{`
        html, body, #root { height: 100%; margin: 0; }
        @keyframes tt-blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
        @keyframes tt-flicker {
          0%,100% { opacity: 1; }
          92% { opacity: 1; }
          93% { opacity: 0.86; }
          94% { opacity: 1; }
          96% { opacity: 0.92; }
          97% { opacity: 1; }
        }
        @keyframes tt-materialize {
          0% { opacity: 0; transform: scale(0.94); clip-path: inset(0 0 100% 0); }
          40% { opacity: 1; clip-path: inset(0 0 0% 0); }
          100% { opacity: 1; transform: scale(1); clip-path: inset(0 0 0% 0); }
        }
        @keyframes tt-line-in {
          0% { opacity: 0; transform: translateY(3px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes tt-pop {
          0% { transform: scale(1); }
          40% { transform: scale(1.35); }
          100% { transform: scale(1); }
        }
        @keyframes tt-node-pulse {
          0%,100% { filter: drop-shadow(0 0 2px var(--tt-glow)); }
          50% { filter: drop-shadow(0 0 7px var(--tt-glow)); }
        }
        @keyframes tt-fade-in {
          0% { opacity: 0; transform: translateY(6px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes tt-draw {
          from { stroke-dashoffset: var(--tt-len); }
          to { stroke-dashoffset: 0; }
        }
        .tt-scanlines::before {
          content: "";
          position: absolute; inset: 0;
          background: repeating-linear-gradient(
            to bottom,
            rgba(0,0,0,0) 0px,
            rgba(0,0,0,0) 2px,
            rgba(0,0,0,${C.mode === "light" ? 0.05 : 0.16}) 3px
          );
          pointer-events: none;
          z-index: 40;
        }
        .tt-glow { text-shadow: 0 0 6px ${C.glow}, 0 0 1px ${C.glow}; }
        .tt-cursor { animation: tt-blink 1s steps(1) infinite; }
        .tt-scroll::-webkit-scrollbar { width: 9px; height: 9px; }
        .tt-scroll::-webkit-scrollbar-track { background: transparent; }
        .tt-scroll::-webkit-scrollbar-thumb { background: ${C.amberFaint}; border-radius: 0; }
        .tt-win { animation: tt-materialize 260ms ease-out; }
        .tt-win.tt-dragging { box-shadow: 0 22px 50px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,0,0,0.4) !important; }
        .tt-line-in { animation: tt-line-in 180ms ease-out; }
        .tt-pop { animation: tt-pop 260ms ease-out; }
        .tt-node { transition: transform 150ms ease, filter 150ms ease; cursor: pointer; }
        .tt-node:hover { transform: scale(1.12); }
        .tt-node-glow { animation: tt-node-pulse 2.4s ease-in-out infinite; }
        .tt-card-hover { transition: transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease; }
        .tt-card-hover:hover { transform: translateY(-2px); border-color: ${C.borderHi}; }
        .tt-fade-in { animation: tt-fade-in 220ms ease-out; }
        .tt-edge { animation: tt-draw 500ms ease-out forwards; }
        .tt-link-handle { transition: color 150ms ease, border-color 150ms ease, transform 150ms ease; }
        .tt-link-handle:hover { transform: scale(1.15); }
        .tt-theme-fade, .tt-theme-fade * {
          transition: color 260ms ease, background-color 260ms ease,
            border-color 260ms ease, box-shadow 260ms ease, fill 260ms ease,
            stroke 260ms ease;
        }
        @media (prefers-reduced-motion: reduce) {
          .tt-flicker { animation: none !important; }
          .tt-win { animation: none !important; }
          .tt-line-in, .tt-pop, .tt-node-glow, .tt-fade-in, .tt-edge { animation: none !important; }
        }
        .tt-flicker { animation: tt-flicker 6s infinite; }
        input.tt-input { caret-color: ${C.amber}; }
        input.tt-input::selection { background: ${C.amberFaint}; }
      `}</style>

      {/* terminal layer */}
      <div className="tt-scanlines tt-flicker tt-theme-fade absolute inset-0 flex flex-col">
        <div
          className="flex items-center px-4 py-2 text-xs"
          style={{
            borderBottom: `1px solid ${C.border}`,
            color: C.amberDim,
            background: C.surface,
          }}
        >
          <span className="tt-glow" style={{ color: C.amber }}>
            todo://
          </span>
          <span className="ml-2">{currentBoard ? `/${currentBoard}` : "/"}</span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              openCalendarWindow();
            }}
            className="ml-3 text-xs px-2 py-0.5"
            style={{
              color: upcoming.length ? C.amber : C.amberFaint,
              border: `1px solid ${C.border}`,
              background: "transparent",
            }}
            title={
              upcoming.length
                ? upcoming.map((e) => `${e.date} — ${e.title}`).join("\n")
                : "no upcoming reminders"
            }
          >
            🔔{upcoming.length > 0 ? ` ${upcoming.length}` : ""}
          </button>

          <div className="ml-auto flex items-center gap-1.5 flex-wrap">
            {Object.keys(THEMES).map((name, i) => (
              <React.Fragment key={name}>
                {i === 4 && (
                  <span style={{ width: 1, height: 12, background: C.border, margin: "0 2px" }} />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    changeTheme(name);
                  }}
                  aria-label={`${name} theme`}
                  title={`${name} (${THEMES[name].mode})`}
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: "50%",
                    background: THEMES[name].amber,
                    border:
                      themeName === name
                        ? `1.5px solid ${C.amber}`
                        : "1.5px solid transparent",
                    boxShadow:
                      themeName === name ? `0 0 5px ${THEMES[name].glow}` : "none",
                  }}
                />
              </React.Fragment>
            ))}
          </div>
        </div>

        <div
          ref={scrollRef}
          className="tt-scroll flex-1 overflow-y-auto px-4 py-3 text-sm leading-6"
          style={{ color: C.amber }}
        >
          {history.map((line) => (
            <div key={line.id} className="whitespace-pre-wrap tt-glow tt-line-in">
              {line.kind === "cmd" ? (
                <span>
                  <span style={{ color: C.amberDim }}>{line.prompt}</span>{" "}
                  <span style={{ color: C.amber }}>{line.text}</span>
                </span>
              ) : line.kind === "err" ? (
                <span style={{ color: C.danger }}>{line.text}</span>
              ) : line.kind === "sys" ? (
                <span style={{ color: C.amber }}>{line.text}</span>
              ) : (
                <span style={{ color: C.amberDim }}>{line.text}</span>
              )}
            </div>
          ))}

          {booted && (
            <div className="flex items-center mt-1">
              <span style={{ color: C.amberDim }}>{promptStr}</span>
              <input
                ref={inputRef}
                className="tt-input flex-1 bg-transparent outline-none ml-2 text-sm"
                style={{ color: C.amber, fontFamily: FONT }}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                spellCheck={false}
                autoComplete="off"
                autoFocus
              />
              <span className="tt-cursor" style={{ color: C.amber }}>
                ▮
              </span>
            </div>
          )}
        </div>
      </div>

      {/* floating windows layer */}
      <div className="absolute inset-0 pointer-events-none">
        {windows.map((w) =>
          w.kind === "board" ? (
            <BoardWindow
              key={w.id}
              win={w}
              boardKey={w.boardName}
              board={boards[w.boardName]}
              isDragging={draggingId === w.id}
              onClose={() => closeWindow(w.id)}
              onDragStart={(e) => startDrag(e, w)}
              onFocus={() => bringToFront(w.id)}
              onLinkStart={(e) => startLink(e, w.boardName)}
              boardOps={boardOps}
            />
          ) : w.kind === "graph" ? (
            <GraphWindow
              key={w.id}
              win={w}
              boards={boards}
              isDragging={draggingId === w.id}
              onClose={() => closeWindow(w.id)}
              onDragStart={(e) => startDrag(e, w)}
              onFocus={() => bringToFront(w.id)}
              onOpenBoard={(key) => openBoardWindow(key)}
              onAddBoard={(name) => {
                if (!findBoardKey(boards, name)) addBoard(name);
              }}
            />
          ) : w.kind === "calendar" ? (
            <CalendarWindow
              key={w.id}
              win={w}
              events={events}
              boards={boards}
              isDragging={draggingId === w.id}
              onClose={() => closeWindow(w.id)}
              onDragStart={(e) => startDrag(e, w)}
              onFocus={() => bringToFront(w.id)}
              onAddEvent={addEvent}
              onRemoveEvent={removeEvent}
            />
          ) : null
        )}
      </div>

      {/* live link-drag overlay */}
      {linkPos && (
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 9999, width: "100%", height: "100%" }}
        >
          <line
            x1={linkPos.x1}
            y1={linkPos.y1}
            x2={linkPos.x2}
            y2={linkPos.y2}
            stroke={C.amber}
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />
          <circle cx={linkPos.x2} cy={linkPos.y2} r={4} fill={C.amber} />
        </svg>
      )}
    </div>
  );
}

function getPromptStr(currentBoard) {
  return currentBoard ? `guest:~/${currentBoard}$` : "guest:~$";
}

/* ================================================================== */
/* window chrome shared styling                                        */

function WindowShell({
  win,
  title,
  onClose,
  onDragStart,
  onFocus,
  children,
  minW = 280,
  minH = 220,
  isDragging = false,
  dataBoardKey,
  onLinkStart,
}) {
  return (
    <div
      className={`tt-win pointer-events-auto absolute flex flex-col${
        isDragging ? " tt-dragging" : ""
      }`}
      {...(dataBoardKey ? { "data-vis-board": dataBoardKey } : {})}
      style={{
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
        minWidth: minW,
        minHeight: minH,
        resize: "both",
        overflow: "hidden",
        zIndex: win.z,
        background: C.surface,
        border: `1px solid ${C.borderHi}`,
        boxShadow: `0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.4)`,
        transform: isDragging ? "scale(1.012)" : "scale(1)",
        transition: "transform 120ms ease",
      }}
      onClick={(e) => {
        e.stopPropagation();
        onFocus();
      }}
    >
      <div
        onMouseDown={onDragStart}
        className="flex items-center justify-between px-3 py-2 cursor-move shrink-0"
        style={{
          background: C.surfaceHi,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <span
          className="text-xs tracking-wide truncate"
          style={{ color: C.amber, fontFamily: FONT }}
        >
          {title}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {onLinkStart && (
            <button
              onMouseDown={(e) => {
                e.stopPropagation();
                onLinkStart(e);
              }}
              className="tt-link-handle text-xs px-1.5 leading-none"
              style={{
                color: C.amberDim,
                border: `1px solid ${C.border}`,
                fontFamily: FONT,
                cursor: "crosshair",
              }}
              title="drag onto another board window to link them"
              aria-label="link board"
            >
              ⇢
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-xs px-2 leading-none"
            style={{
              color: C.amberDim,
              border: `1px solid ${C.border}`,
              fontFamily: FONT,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.danger)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.amberDim)}
            aria-label="close"
          >
            ×
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col">{children}</div>
    </div>
  );
}

function Checkbox({ checked, onChange, size = 16 }) {
  return (
    <button
      onClick={onChange}
      className={`shrink-0 flex items-center justify-center${
        checked ? " tt-pop" : ""
      }`}
      key={checked ? "on" : "off"}
      style={{
        width: size,
        height: size,
        border: `1px solid ${checked ? C.amber : C.amberDim}`,
        background: checked ? C.amber : "transparent",
        color: C.bg,
        fontSize: Math.round(size * 0.7),
        lineHeight: 1,
        transition: "background-color 150ms ease, border-color 150ms ease",
      }}
      aria-label={checked ? "mark as not done" : "mark as done"}
    >
      {checked ? "✓" : ""}
    </button>
  );
}

/* ---------- single board window: now a freeform Milanote-style canvas ---------- */
function BoardWindow({
  win,
  boardKey,
  board,
  isDragging,
  onClose,
  onDragStart,
  onFocus,
  onLinkStart,
  boardOps,
}) {
  if (!board) return null;
  const { total, done } = boardStats(board);

  return (
    <WindowShell
      win={win}
      title={`board / ${boardKey}`}
      onClose={onClose}
      onDragStart={onDragStart}
      onFocus={onFocus}
      onLinkStart={onLinkStart}
      dataBoardKey={boardKey}
      isDragging={isDragging}
      minW={380}
      minH={340}
    >
      <div
        className="px-3 pt-2 pb-1.5 shrink-0 flex items-center justify-between text-xs"
        style={{ borderBottom: `1px solid ${C.border}`, color: C.amberDim }}
      >
        <span>{boardKey}</span>
        <span>{done}/{total} done</span>
      </div>
      <CanvasBoard
        board={board}
        onAddTask={(name, x, y) => boardOps.addTask(boardKey, name, null, { x, y })}
        onToggleTask={(id, doneFlag) => boardOps.toggleTask(boardKey, id, doneFlag)}
        onRemoveTask={(id) => boardOps.removeTask(boardKey, id)}
        onRenameTask={(id, name) => boardOps.renameTask(boardKey, id, name)}
        onMoveTask={(id, x, y) => boardOps.moveTask(boardKey, id, x, y)}
        onAddDrawing={(stroke) => boardOps.addDrawing(boardKey, stroke)}
        onClearDrawings={() => boardOps.clearDrawings(boardKey)}
        onAddFile={(file) => boardOps.addFile(boardKey, file)}
        onRemoveFile={(id) => boardOps.removeFile(boardKey, id)}
        onMoveFile={(id, x, y) => boardOps.moveFile(boardKey, id, x, y)}
        onUpdateCanvasView={(view) => boardOps.updateCanvasView(boardKey, view)}
      />
    </WindowShell>
  );
}

/* ---------- freeform canvas: pan, zoom, draggable cards, drawing, files ---------- */
function CanvasBoard({
  board,
  onAddTask,
  onToggleTask,
  onRemoveTask,
  onRenameTask,
  onMoveTask,
  onAddDrawing,
  onClearDrawings,
  onAddFile,
  onRemoveFile,
  onMoveFile,
  onUpdateCanvasView,
}) {
  const wrapRef = useRef(null);
  const fileInputRef = useRef(null);
  const [penMode, setPenMode] = useState(false);
  const [draft, setDraft] = useState("");
  const [stroke, setStroke] = useState(null);
  const [addingAt, setAddingAt] = useState(null);

  const view = board.canvas || { tx: 40, ty: 40, scale: 1 };
  const tasks = board.tasks || [];
  const files = board.files || [];
  const drawings = board.drawings || [];

  const clientToCanvas = (clientX, clientY, v = view) => {
    const rect = wrapRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - v.tx) / v.scale,
      y: (clientY - rect.top - v.ty) / v.scale,
    };
  };

  const startBgInteraction = (e) => {
    if (e.target !== e.currentTarget) return;
    if (penMode) {
      const pt = clientToCanvas(e.clientX, e.clientY);
      setStroke({ points: [pt], color: C.amber });
      const handleMove = (ev) => {
        const p = clientToCanvas(ev.clientX, ev.clientY);
        setStroke((s) => (s ? { ...s, points: [...s.points, p] } : s));
      };
      const handleUp = () => {
        setStroke((s) => {
          if (s && s.points.length > 1) onAddDrawing(s);
          return null;
        });
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleUp);
      };
      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleUp);
      return;
    }
    const start = { x: e.clientX, y: e.clientY, origTx: view.tx, origTy: view.ty };
    const handleMove = (ev) => {
      onUpdateCanvasView({
        tx: start.origTx + (ev.clientX - start.x),
        ty: start.origTy + (ev.clientY - start.y),
        scale: view.scale,
      });
    };
    const handleUp = () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  };

  const startCardDrag = (e, task) => {
    e.stopPropagation();
    const start = { x: e.clientX, y: e.clientY, origX: task.x || 0, origY: task.y || 0, scale: view.scale };
    const handleMove = (ev) => {
      const dx = (ev.clientX - start.x) / start.scale;
      const dy = (ev.clientY - start.y) / start.scale;
      onMoveTask(task.id, start.origX + dx, start.origY + dy);
    };
    const handleUp = () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  };

  const startFileDrag = (e, file) => {
    e.stopPropagation();
    const start = { x: e.clientX, y: e.clientY, origX: file.x || 0, origY: file.y || 0, scale: view.scale };
    const handleMove = (ev) => {
      const dx = (ev.clientX - start.x) / start.scale;
      const dy = (ev.clientY - start.y) / start.scale;
      onMoveFile(file.id, start.origX + dx, start.origY + dy);
    };
    const handleUp = () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  };

  const onWheel = (e) => {
    e.preventDefault();
    const rect = wrapRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(2.5, Math.max(0.3, view.scale * factor));
    const newTx = cx - ((cx - view.tx) / view.scale) * newScale;
    const newTy = cy - ((cy - view.ty) / view.scale) * newScale;
    onUpdateCanvasView({ tx: newTx, ty: newTy, scale: newScale });
  };

  const handleDoubleClick = (e) => {
    if (e.target !== e.currentTarget) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const pt = clientToCanvas(e.clientX, e.clientY);
    setAddingAt({
      screenX: e.clientX - rect.left,
      screenY: e.clientY - rect.top,
      x: pt.x,
      y: pt.y,
      text: "",
    });
  };

  const submitDraft = () => {
    const name = draft.trim();
    if (!name) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const pt = clientToCanvas(rect.left + rect.width / 2, rect.top + rect.height / 2);
    onAddTask(name, pt.x + (Math.random() * 60 - 30), pt.y + (Math.random() * 60 - 30));
    setDraft("");
  };

  const onFilePicked = (e) => {
    const picked = Array.from(e.target.files || []);
    const rect = wrapRef.current.getBoundingClientRect();
    const center = clientToCanvas(rect.left + rect.width / 2, rect.top + rect.height / 2);
    picked.forEach((f, i) => {
      const isImage = f.type.startsWith("image/");
      const tooBig = f.size > 4 * 1024 * 1024;
      const pos = { x: center.x + i * 24, y: center.y + i * 24 };
      if (tooBig) {
        onAddFile({ name: f.name, type: f.type, size: f.size, isImage: false, dataUrl: null, ...pos });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        onAddFile({ name: f.name, type: f.type, size: f.size, isImage, dataUrl: reader.result, ...pos });
      };
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  };

  const lines = [];
  tasks.forEach((t) => {
    if (t.parentId) {
      const p = tasks.find((x) => x.id === t.parentId);
      if (p) {
        lines.push({
          id: `${p.id}-${t.id}`,
          x1: (p.x || 0) + 70,
          y1: (p.y || 0) + 18,
          x2: (t.x || 0) + 70,
          y2: (t.y || 0) + 18,
        });
      }
    }
  });

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div
        className="flex items-center gap-2 px-2 py-1.5 shrink-0 flex-wrap"
        style={{ borderBottom: `1px solid ${C.border}`, background: C.surfaceHi }}
      >
        <button
          onClick={() => setPenMode((p) => !p)}
          className="text-xs px-2 py-1"
          style={{
            background: penMode ? C.amber : "transparent",
            color: penMode ? C.bg : C.amberDim,
            border: `1px solid ${C.amberDim}`,
          }}
        >
          ✏️ draw
        </button>
        <button
          onClick={onClearDrawings}
          className="text-xs px-2 py-1"
          style={{ color: C.amberDim, border: `1px solid ${C.border}` }}
        >
          clear ink
        </button>
        <button
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          className="text-xs px-2 py-1"
          style={{ color: C.amberDim, border: `1px solid ${C.border}` }}
        >
          📎 file
        </button>
        <input ref={fileInputRef} type="file" multiple onChange={onFilePicked} style={{ display: "none" }} />
        <button
          onClick={() => onUpdateCanvasView({ tx: 40, ty: 40, scale: 1 })}
          className="text-xs px-2 py-1"
          style={{ color: C.amberDim, border: `1px solid ${C.border}` }}
        >
          reset view
        </button>
        <span className="text-xs ml-auto" style={{ color: C.amberFaint }}>
          {Math.round(view.scale * 100)}%
        </span>
      </div>

      <div
        ref={wrapRef}
        className="flex-1 min-h-0 relative overflow-hidden"
        style={{
          background: C.bg2,
          backgroundImage: `radial-gradient(${C.border} 1px, transparent 1px)`,
          backgroundSize: `${24 * view.scale}px ${24 * view.scale}px`,
          backgroundPosition: `${view.tx}px ${view.ty}px`,
          cursor: penMode ? "crosshair" : "grab",
        }}
        onMouseDown={startBgInteraction}
        onDoubleClick={handleDoubleClick}
        onWheel={onWheel}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})`,
            transformOrigin: "0 0",
          }}
        >
          <svg style={{ position: "absolute", overflow: "visible" }} width={1} height={1}>
            {lines.map((l) => (
              <line
                key={l.id}
                x1={l.x1}
                y1={l.y1}
                x2={l.x2}
                y2={l.y2}
                stroke={C.amberFaint}
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
            ))}
            {drawings.map((d) => (
              <polyline
                key={d.id}
                points={d.points.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke={d.color || C.amber}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {stroke && (
              <polyline
                points={stroke.points.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke={stroke.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>

          {files.map((f) => (
            <div
              key={f.id}
              onMouseDown={(e) => startFileDrag(e, f)}
              className="tt-card-hover group absolute"
              style={{
                left: f.x,
                top: f.y,
                width: 140,
                background: C.surface,
                border: `1px solid ${C.border}`,
                padding: 6,
                cursor: "grab",
              }}
            >
              {f.isImage && f.dataUrl ? (
                <img
                  src={f.dataUrl}
                  alt={f.name}
                  style={{ width: "100%", height: 90, objectFit: "cover" }}
                  draggable={false}
                />
              ) : (
                <div
                  style={{
                    height: 60,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: C.amberDim,
                    fontSize: 22,
                  }}
                >
                  📄
                </div>
              )}
              <div className="text-xs mt-1 truncate" style={{ color: C.amberDim }} title={f.name}>
                {f.name}
              </div>
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => onRemoveFile(f.id)}
                className="opacity-0 group-hover:opacity-100 absolute -top-2 -right-2 text-xs w-5 h-5"
                style={{ color: C.danger, background: C.surface, border: `1px solid ${C.border}` }}
              >
                ×
              </button>
            </div>
          ))}

          {tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onMouseDownDrag={(e) => startCardDrag(e, t)}
              onToggle={() => onToggleTask(t.id, !t.done)}
              onRemove={() => onRemoveTask(t.id)}
              onRename={(name) => onRenameTask(t.id, name)}
            />
          ))}
        </div>

        {addingAt && (
          <input
            autoFocus
            className="absolute text-xs px-1.5 py-1 outline-none"
            style={{
              left: addingAt.screenX,
              top: addingAt.screenY,
              width: 150,
              background: C.surface,
              border: `1px solid ${C.amber}`,
              color: C.amber,
              zIndex: 5,
              fontFamily: FONT,
            }}
            value={addingAt.text}
            onChange={(e) => setAddingAt((a) => ({ ...a, text: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (addingAt.text.trim()) onAddTask(addingAt.text.trim(), addingAt.x, addingAt.y);
                setAddingAt(null);
              }
              if (e.key === "Escape") setAddingAt(null);
            }}
            onBlur={() => setAddingAt(null)}
            placeholder="new task…"
          />
        )}
      </div>

      <div
        className="flex items-center gap-2 px-3 py-2 shrink-0"
        style={{ borderTop: `1px solid ${C.border}` }}
      >
        <span style={{ color: C.amberDim, fontSize: 12 }}>+</span>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitDraft()}
          placeholder="add task… (or double-click the board)"
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: C.amber, fontFamily: FONT }}
          spellCheck={false}
        />
      </div>
    </div>
  );
}

function TaskCard({ task, onMouseDownDrag, onToggle, onRemove, onRename }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(task.name);
  useEffect(() => setVal(task.name), [task.name]);

  const commit = () => {
    setEditing(false);
    const v = val.trim();
    if (v && v !== task.name) onRename(v);
    else setVal(task.name);
  };

  return (
    <div
      onMouseDown={(e) => {
        if (!editing) onMouseDownDrag(e);
      }}
      className="tt-fade-in tt-card-hover group absolute"
      style={{
        left: task.x || 0,
        top: task.y || 0,
        width: 150,
        background: C.surface,
        border: `1px solid ${task.done ? C.border : C.amberDim}`,
        padding: 8,
        cursor: editing ? "text" : "grab",
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
    >
      <div className="flex items-start gap-2">
        <Checkbox
          checked={task.done}
          onChange={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          size={14}
        />
        {editing ? (
          <input
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setVal(task.name);
                setEditing(false);
              }
            }}
            onBlur={commit}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex-1 bg-transparent outline-none text-xs"
            style={{ color: C.amber, fontFamily: FONT, borderBottom: `1px solid ${C.amberDim}` }}
          />
        ) : (
          <span
            className="flex-1 text-xs break-words"
            style={{
              color: task.done ? C.amberFaint : C.amber,
              textDecoration: task.done ? "line-through" : "none",
            }}
          >
            {task.name}
          </span>
        )}
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 text-xs"
          style={{ color: C.danger }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

/* ---------- graph window: how boards & subboards connect ---------- */
function GraphWindow({
  win,
  boards,
  isDragging,
  onClose,
  onDragStart,
  onFocus,
  onOpenBoard,
  onAddBoard,
}) {
  const [draft, setDraft] = useState("");
  const [ref, size] = useElementSize();
  const keys = Object.keys(boards);

  const submit = () => {
    const name = draft.trim();
    if (!name) return;
    onAddBoard(name);
    setDraft("");
  };

  const w = size.width || 400;
  const h = size.height || 360;
  const positions = keys.length ? layoutBoardForest(boards, w, h) : {};

  return (
    <WindowShell
      win={win}
      title="boards / graph"
      onClose={onClose}
      onDragStart={onDragStart}
      onFocus={onFocus}
      isDragging={isDragging}
      minW={340}
    >
      <div ref={ref} className="flex-1 min-h-0 relative overflow-hidden">
        {keys.length === 0 && (
          <div
            className="h-full flex items-center justify-center text-xs italic"
            style={{ color: C.amberFaint }}
          >
            no boards yet — create one below
          </div>
        )}

        {keys.length > 0 && (
          <>
            <svg width={w} height={h} className="absolute inset-0">
              {keys.map((k) => {
                const parent = boards[k].parent;
                if (!parent || !positions[parent] || !positions[k]) return null;
                const p1 = positions[parent];
                const p2 = positions[k];
                const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                return (
                  <line
                    key={`edge-${k}`}
                    className="tt-edge"
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    style={{
                      stroke: C.amberFaint,
                      strokeWidth: 1.2,
                      "--tt-len": len,
                      strokeDasharray: len,
                    }}
                  />
                );
              })}
            </svg>

            {keys.map((k) => {
              const p = positions[k];
              if (!p) return null;
              const { total, done } = boardStats(boards[k]);
              return (
                <button
                  key={k}
                  onClick={() => onOpenBoard(k)}
                  className="tt-node absolute flex flex-col items-center justify-center text-center px-1"
                  style={{
                    left: p.x,
                    top: p.y,
                    transform: "translate(-50%,-50%)",
                    width: 62,
                    height: 62,
                    borderRadius: "50%",
                    background: p.depth === 1 ? C.surfaceHi : C.surface,
                    border: `1.5px solid ${p.depth === 1 ? C.amber : C.amberDim}`,
                    color: C.amber,
                    fontSize: 9,
                    boxShadow: p.depth === 1 ? `0 0 10px ${C.glow}` : "none",
                  }}
                  title={k}
                >
                  <span className="truncate w-full">{k}</span>
                  <span style={{ color: C.amberDim, fontSize: 8 }}>
                    {done}/{total}
                  </span>
                </button>
              );
            })}
          </>
        )}
      </div>

      <div
        className="flex items-center gap-2 px-3 py-2 shrink-0"
        style={{ borderTop: `1px solid ${C.border}` }}
      >
        <span style={{ color: C.amberDim, fontSize: 12 }}>+</span>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="new board…"
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: C.amber, fontFamily: FONT }}
          spellCheck={false}
        />
      </div>
    </WindowShell>
  );
}

/* ---------- calendar window: month grid + project-linked reminders ---------- */
function CalendarWindow({
  win,
  events,
  boards,
  isDragging,
  onClose,
  onDragStart,
  onFocus,
  onAddEvent,
  onRemoveEvent,
}) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [selected, setSelected] = useState(() => todayStr());
  const [title, setTitle] = useState("");
  const [boardSel, setBoardSel] = useState("");

  const first = new Date(cursor.y, cursor.m, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dateStr = (d) =>
    `${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const eventsByDate = {};
  events.forEach((e) => {
    (eventsByDate[e.date] = eventsByDate[e.date] || []).push(e);
  });

  const monthLabel = first.toLocaleString(undefined, { month: "long", year: "numeric" });

  const submit = () => {
    const t = title.trim();
    if (!t || !selected) return;
    onAddEvent(t, selected, boardSel || null);
    setTitle("");
  };

  return (
    <WindowShell
      win={win}
      title="calendar / reminders"
      onClose={onClose}
      onDragStart={onDragStart}
      onFocus={onFocus}
      isDragging={isDragging}
      minW={320}
      minH={420}
    >
      <div
        className="flex items-center justify-between px-3 py-2 shrink-0"
        style={{ borderBottom: `1px solid ${C.border}` }}
      >
        <button
          onClick={() =>
            setCursor((c) => {
              const m = c.m - 1;
              return m < 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m };
            })
          }
          style={{ color: C.amberDim }}
        >
          ‹
        </button>
        <span className="text-xs" style={{ color: C.amber }}>
          {monthLabel}
        </span>
        <button
          onClick={() =>
            setCursor((c) => {
              const m = c.m + 1;
              return m > 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m };
            })
          }
          style={{ color: C.amberDim }}
        >
          ›
        </button>
      </div>

      <div
        className="px-2 pt-2 grid grid-cols-7 gap-1 text-center text-[10px] shrink-0"
        style={{ color: C.amberFaint }}
      >
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      <div className="px-2 pb-2 grid grid-cols-7 gap-1 shrink-0">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const ds = dateStr(d);
          const has = eventsByDate[ds];
          const isToday = ds === todayStr();
          const isSel = ds === selected;
          return (
            <button
              key={i}
              onClick={() => setSelected(ds)}
              className="text-xs py-1 flex flex-col items-center"
              style={{
                background: isSel ? C.amber : isToday ? C.surfaceHi : "transparent",
                color: isSel ? C.bg : C.amber,
                border: `1px solid ${isToday && !isSel ? C.amberDim : "transparent"}`,
              }}
            >
              <span>{d}</span>
              {has && (
                <span
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: isSel ? C.bg : C.amber,
                    marginTop: 2,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div
        className="flex-1 min-h-0 overflow-y-auto tt-scroll px-3 py-2"
        style={{ borderTop: `1px solid ${C.border}` }}
      >
        <div className="text-xs mb-1" style={{ color: C.amberDim }}>
          {selected}
        </div>
        {(eventsByDate[selected] || []).length === 0 && (
          <div className="text-xs italic" style={{ color: C.amberFaint }}>
            no reminders
          </div>
        )}
        {(eventsByDate[selected] || []).map((e) => (
          <div
            key={e.id}
            className="flex items-center justify-between text-xs py-1"
            style={{ borderBottom: `1px solid ${C.border}` }}
          >
            <span style={{ color: C.amber }}>
              {e.title}
              {e.boardName ? <span style={{ color: C.amberFaint }}> · {e.boardName}</span> : null}
            </span>
            <button onClick={() => onRemoveEvent(e.id)} style={{ color: C.danger }}>
              ×
            </button>
          </div>
        ))}
      </div>

      <div
        className="flex items-center gap-2 px-3 py-2 shrink-0 flex-wrap"
        style={{ borderTop: `1px solid ${C.border}` }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="reminder…"
          className="flex-1 bg-transparent outline-none text-xs min-w-[100px]"
          style={{ color: C.amber, fontFamily: FONT }}
        />
        <select
          value={boardSel}
          onChange={(e) => setBoardSel(e.target.value)}
          className="text-xs bg-transparent outline-none"
          style={{ color: C.amberDim, border: `1px solid ${C.border}`, background: C.surface }}
        >
          <option value="">no project</option>
          {Object.keys(boards).map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <button
          onClick={submit}
          className="text-xs px-2 py-1"
          style={{ color: C.amberDim, border: `1px solid ${C.border}` }}
        >
          add
        </button>
      </div>
    </WindowShell>
  );
}