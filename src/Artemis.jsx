import React, { useState, useRef, useEffect, useCallback } from "react";

/* ---------- palette (CRT amber phosphor terminal) ---------- */
const C = {
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

/* ---------- phosphor themes (swap the "ink" colors) ---------- */
const THEMES = {
  amber: {
    amber: "#ffb200",
    amberDim: "#a97a1f",
    amberFaint: "#6b4c17",
    glow: "rgba(255,178,0,0.45)",
    border: "#4a3311",
    borderHi: "#7a5619",
  },
  green: {
    amber: "#33ff66",
    amberDim: "#1f9e42",
    amberFaint: "#155c29",
    glow: "rgba(51,255,102,0.45)",
    border: "#123a1c",
    borderHi: "#1d5c2c",
  },
  cyan: {
    amber: "#4ee7ff",
    amberDim: "#2b93a8",
    amberFaint: "#1a5866",
    glow: "rgba(78,231,255,0.45)",
    border: "#0f3138",
    borderHi: "#175160",
  },
  paper: {
    amber: "#f2ead8",
    amberDim: "#a89d84",
    amberFaint: "#5f5748",
    glow: "rgba(242,234,216,0.35)",
    border: "#3a352a",
    borderHi: "#585141",
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

function findProjectKey(projects, name) {
  const n = norm(name);
  return projects.find((p) => norm(p) === n) || null;
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

/* splits the terminal input into "already-typed context tokens" and the
   partial word currently being completed, plus the string to prepend
   any accepted suggestion with */
function splitInputContext(val) {
  const trailingSpace = /\s$/.test(val);
  const rawTokens = val.split(/\s+/).filter(Boolean);
  const currentToken = trailingSpace ? "" : rawTokens[rawTokens.length - 1] || "";
  const ctx = trailingSpace ? rawTokens : rawTokens.slice(0, -1);
  const basePrefix = ctx.length ? ctx.join(" ") + " " : "";
  return { ctx, currentToken, basePrefix };
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
  "  init <project>                     create a project tag",
  "  init -rename <old> -> <new>        rename a project",
  "  init -del <project>                remove a project (untags its boards)",
  "  board -add <name> @<project>       tag a new board with a project",
  "  <project> -add <name>              same thing, project name as the verb",
  "  board -tag <board> @<project>      tag an existing board",
  "  board -untag <board> @<project>    remove a tag from a board",
  "  projects                           list projects and their board counts",
  "  open -project <name>               open every board tagged with a project",
  "  open -close -project <name>        close that window",
  "",
  "  vis <name>                         open a board window",
  "  vis -node                          show how boards connect (or vis #)",
  "  vis -close <name>|#                close a window",
  "  drag the ⇢ handle on a board window onto another to link them",
  "",
  "  find <text>                        search task names across all boards",
  "  stats                              show overall progress",
  "  history                            show recently run commands",
  "  theme <name>                       amber | green | cyan | paper",
  "  date                               show the current date and time",
  "  clear                              clear the screen",
  "  reset -yes                        erase every board, task & saved file",
  "  help                               show this list",
  "",
  "  press tab to accept a suggestion — ↑↓ to pick one, esc to dismiss",
  "",
  "  boards and tasks are saved automatically as you go.",
  "",
  "  aliases: mkdir = board -add   touch = task -add",
  "           rmdir = board -del  rm = task -del / board -del",
];

const BOOT_LINES = [
  "╔════════════════════════════════╗",
  "║          ☜(⌒▽⌒)☞            ║",
  "║             TODO               ║",
  "╚════════════════════════════════╝",
  "",
  "type `help` to see available commands.",
  "",
];

const STORAGE_KEY = "todo-shell-state-v1";

/* ================================================================== */

export default function TodoTerminalApp() {
  const [boards, setBoards] = useState({});
  const [projects, setProjects] = useState([]);
  const [currentBoard, setCurrentBoard] = useState(null);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [cmdLog, setCmdLog] = useState([]);
  const [cmdPtr, setCmdPtr] = useState(-1);
  const [windows, setWindows] = useState([]);
  const [booted, setBooted] = useState(false);
  const [themeName, setThemeName] = useState("amber");
  const [draggingId, setDraggingId] = useState(null);
  const [linkPos, setLinkPos] = useState(null);
  const [suggestIndex, setSuggestIndex] = useState(0);
  const [suggestOpen, setSuggestOpen] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
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
          if (data.boards) setBoards(data.boards);
          if (Array.isArray(data.projects)) setProjects(data.projects);
          if (typeof data.currentBoard !== "undefined") {
            setCurrentBoard(data.currentBoard);
          }
          if (data.themeName) {
            applyTheme(data.themeName);
            setThemeName(data.themeName);
          }
          if (Array.isArray(data.windows)) setWindows(data.windows);
          if (Array.isArray(data.cmdLog)) setCmdLog(data.cmdLog);
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
    setSaveStatus("saving");
    const t = setTimeout(async () => {
      try {
        const payload = JSON.stringify({
          boards,
          projects,
          currentBoard,
          themeName,
          windows,
          cmdLog,
          zCounter: zCounter.current,
          uidCounter,
        });
        await window.storage.set(STORAGE_KEY, payload, false);
        setSaveStatus("saved");
      } catch (e) {
        setSaveStatus("error");
      }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boards, projects, currentBoard, themeName, windows, cmdLog, loaded]);

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
    const pos = nextPos(400, 460);
    setWindows((ws) => [
      ...ws,
      {
        id: uid("win"),
        kind: "board",
        boardName: boardKey,
        x: pos.x,
        y: pos.y,
        width: 400,
        height: 460,
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

  const openProjectWindow = (projectKey) => {
    const existing = windows.find(
      (w) => w.kind === "project" && w.projectName === projectKey
    );
    if (existing) {
      bringToFront(existing.id);
      return;
    }
    zCounter.current += 1;
    const pos = nextPos(400, 460);
    setWindows((ws) => [
      ...ws,
      {
        id: uid("win"),
        kind: "project",
        projectName: projectKey,
        x: pos.x,
        y: pos.y,
        width: 400,
        height: 460,
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
  const addTaskTo = (boardKey, name, parentId = null) => {
    if (!name) return;
    setBoards((b) => {
      const board = b[boardKey];
      if (findTaskIndex(board.tasks, name) !== -1) return b;
      return {
        ...b,
        [boardKey]: {
          ...board,
          tasks: [
            ...board.tasks,
            { id: uid("task"), name, done: false, parentId: parentId || null },
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

  const addBoard = (name, parent = null, tags = []) => {
    setBoards((b) => ({ ...b, [name]: { tasks: [], parent, tags } }));
  };

  function doCreateBoard(name, parentName, tagKey) {
    if (!name) {
      print("usage: board -add <name> [| <parent>] [@<project>]", "err");
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
    addBoard(name, parentKey, tagKey ? [tagKey] : []);
    const bits = [];
    if (parentKey) bits.push(`under '${parentKey}'`);
    if (tagKey) bits.push(`tagged @${tagKey}`);
    print(`created board '${name}'${bits.length ? " " + bits.join(" ") : ""}`);
  }

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

      case "vis": {
        if (tokens[1] === "-close") {
          const arg = tokens.slice(2).join(" ");
          if (arg === "#") {
            const win = windows.find((w) => w.kind === "graph");
            if (!win) {
              print("no graph window is open", "err");
              break;
            }
            closeWindow(win.id);
            print("closed board graph");
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
        if (!arg) {
          print("usage: vis <board name>   or   vis -node", "err");
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

      case "init": {
        if (tokens[1] === "-del") {
          const name = tokens.slice(2).join(" ");
          const key = findProjectKey(projects, name);
          if (!key) {
            print(`no project named '${name}'`, "err");
            break;
          }
          setProjects((p) => p.filter((x) => norm(x) !== norm(key)));
          setBoards((b) => {
            const next = { ...b };
            Object.keys(next).forEach((k) => {
              const tags = next[k].tags || [];
              if (tags.some((t) => norm(t) === norm(key))) {
                next[k] = {
                  ...next[k],
                  tags: tags.filter((t) => norm(t) !== norm(key)),
                };
              }
            });
            return next;
          });
          print(`removed project '${key}'`);
          break;
        }
        if (tokens[1] === "-rename") {
          const rest = tokens.slice(2).join(" ");
          const arrowIdx = rest.indexOf(" -> ");
          if (arrowIdx === -1) {
            print("usage: init -rename <old> -> <new>", "err");
            break;
          }
          const oldName = rest.slice(0, arrowIdx).trim();
          const newName = rest.slice(arrowIdx + 4).trim();
          const key = findProjectKey(projects, oldName);
          if (!key) {
            print(`no project named '${oldName}'`, "err");
            break;
          }
          if (!newName) {
            print("usage: init -rename <old> -> <new>", "err");
            break;
          }
          if (findProjectKey(projects, newName)) {
            print(`project '${newName}' already exists`, "err");
            break;
          }
          setProjects((p) => p.map((x) => (norm(x) === norm(key) ? newName : x)));
          setBoards((b) => {
            const next = { ...b };
            Object.keys(next).forEach((k) => {
              const tags = next[k].tags || [];
              if (tags.some((t) => norm(t) === norm(key))) {
                next[k] = {
                  ...next[k],
                  tags: tags.map((t) => (norm(t) === norm(key) ? newName : t)),
                };
              }
            });
            return next;
          });
          print(`renamed project '${key}' to '${newName}'`);
          break;
        }
        const name = tokens.slice(1).join(" ");
        if (!name) {
          print("usage: init <project name>", "err");
          break;
        }
        if (findProjectKey(projects, name)) {
          print(`project '${name}' already exists`, "err");
          break;
        }
        setProjects((p) => [...p, name]);
        print(
          `initialized project '${name}' — try 'board -add <name> @${name}' or '${name} -add <name>'`
        );
        break;
      }

      case "projects": {
        if (projects.length === 0) {
          print("no projects yet — try `init <project name>`");
          break;
        }
        const width = Math.max(...projects.map((p) => p.length)) + 2;
        const lines = [
          `${projects.length} project${projects.length === 1 ? "" : "s"}:`,
        ];
        projects.forEach((p) => {
          const count = Object.keys(boards).filter((k) =>
            (boards[k].tags || []).some((t) => norm(t) === norm(p))
          ).length;
          lines.push(`  ${padName(p, width)}${count} board${count === 1 ? "" : "s"}`);
        });
        print(lines.join("\n"));
        break;
      }

      case "open": {
        if (tokens[1] === "-project") {
          const name = tokens.slice(2).join(" ");
          const key = findProjectKey(projects, name);
          if (!key) {
            print(`no project named '${name}' — try 'init ${name}' first`, "err");
            break;
          }
          openProjectWindow(key);
          print(`opened project '${key}'`);
          break;
        }
        if (tokens[1] === "-close" && tokens[2] === "-project") {
          const name = tokens.slice(3).join(" ");
          const key = findProjectKey(projects, name);
          const win = key
            ? windows.find((w) => w.kind === "project" && w.projectName === key)
            : null;
          if (!win) {
            print(`no open window for project '${name}'`, "err");
            break;
          }
          closeWindow(win.id);
          print(`closed project '${key}'`);
          break;
        }
        print("usage: open -project <name>", "err");
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
        const projKey = findProjectKey(projects, tokens[0]);
        if (projKey && tokens[1] === "-add") {
          const rest = tokens.slice(2).join(" ");
          const pipeIdx = rest.indexOf(" | ");
          const name = (pipeIdx === -1 ? rest : rest.slice(0, pipeIdx)).trim();
          const parentName =
            pipeIdx === -1 ? "" : rest.slice(pipeIdx + 3).trim();
          doCreateBoard(name, parentName, projKey);
        } else {
          print(`unknown command: '${tokens[0]}' — try 'help'`, "err");
        }
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
      const tags = boards[k].tags || [];
      const tagBits = tags.length ? `  ${tags.map((t) => `@${t}`).join(" ")}` : "";
      lines.push(
        `  ${padName(k, width)}${done}/${total} done${
          kids ? `  (${kids} sub)` : ""
        }${tagBits}`
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
    if (board.tags && board.tags.length) {
      lines.push(`tags: ${board.tags.map((t) => `@${t}`).join(", ")}`);
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
      const argTokens = tokens.slice(2);
      let tagKey = null;
      const tagIdx = argTokens.findIndex((t) => t.startsWith("@") && t.length > 1);
      if (tagIdx !== -1) {
        const tagName = argTokens[tagIdx].slice(1);
        const foundProject = findProjectKey(projects, tagName);
        if (!foundProject) {
          print(`no project named '${tagName}' — try 'init ${tagName}' first`, "err");
          return;
        }
        tagKey = foundProject;
        argTokens.splice(tagIdx, 1);
      }
      const rest = argTokens.join(" ");
      const pipeIdx = rest.indexOf(" | ");
      const name = (pipeIdx === -1 ? rest : rest.slice(0, pipeIdx)).trim();
      const parentName = pipeIdx === -1 ? "" : rest.slice(pipeIdx + 3).trim();
      doCreateBoard(name, parentName, tagKey);
      return;
    }
    if (sub === "-tag" || sub === "-untag") {
      const argTokens = tokens.slice(2);
      const tagIdx = argTokens.findIndex((t) => t.startsWith("@") && t.length > 1);
      if (tagIdx === -1) {
        print(`usage: board ${sub} <board> @<project>`, "err");
        return;
      }
      const tagName = argTokens[tagIdx].slice(1);
      argTokens.splice(tagIdx, 1);
      const boardName = argTokens.join(" ").trim();
      const key = findBoardKey(boards, boardName);
      if (!key) {
        print(`no board named '${boardName}'`, "err");
        return;
      }
      const projKey = findProjectKey(projects, tagName);
      if (!projKey) {
        print(`no project named '${tagName}' — try 'init ${tagName}' first`, "err");
        return;
      }
      setBoards((b) => {
        const cur = b[key].tags || [];
        const nextTags =
          sub === "-tag"
            ? cur.some((t) => norm(t) === norm(projKey))
              ? cur
              : [...cur, projKey]
            : cur.filter((t) => norm(t) !== norm(projKey));
        return { ...b, [key]: { ...b[key], tags: nextTags } };
      });
      print(
        sub === "-tag"
          ? `tagged '${key}' @${projKey}`
          : `untagged '${key}' from @${projKey}`
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
      setBoards((b) => ({
        ...b,
        [currentBoard]: {
          ...b[currentBoard],
          tasks: b[currentBoard].tasks.map((t) =>
            t.id === taskId ? { ...t, name: newName } : t
          ),
        },
      }));
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

  /* ---------- input handlers ---------- */
  const COMMAND_WORDS = [
    "board",
    "task",
    "vis",
    "open",
    "init",
    "projects",
    "ls",
    "cd",
    "pwd",
    "whoami",
    "clear",
    "help",
    "find",
    "stats",
    "history",
    "theme",
    "date",
    "reset",
    "mkdir",
    "touch",
    "rm",
    "rmdir",
  ];

  function getCompletionCandidates(ctx) {
    const boardNames = Object.keys(boards);
    const taskNames = currentBoard ? boards[currentBoard].tasks.map((t) => t.name) : [];
    const themeNames = Object.keys(THEMES);

    if (ctx.length === 0) {
      return [...COMMAND_WORDS, ...projects];
    }

    const last = ctx[ctx.length - 1];
    const head = ctx[0].toLowerCase();
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
    if (head === "theme") return themeNames;
    if (head === "vis") {
      if (ctx.length === 1) return [...boardNames, "#", "-node", "-close"];
      if (ctx[1] === "-close") return [...boardNames, "#"];
      return [];
    }
    if (head === "open") {
      if (ctx.length === 1) return ["-project", "-close"];
      if (ctx[1] === "-project") return projects;
      if (ctx[1] === "-close") return ["-project"];
      if (ctx[1] === "-close" && ctx[2] === "-project") return projects;
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
          : ["-add", "-del", "-parent", "-unparent", "-rename", "-tag", "-untag", "@show", "-show"];
      }
      if (["-del", "-unparent", "-parent", "-rename"].includes(sub)) return boardNames;
      if (sub === "-tag" || sub === "-untag") return boardNames;
      return [];
    }
    if (head === "task") {
      const sub = ctx[1];
      if (ctx.length === 1) {
        return [
          "-add",
          "-check",
          "-uncheck",
          "-check-all",
          "-uncheck-all",
          "-del",
          "-clear",
          "-rename",
          "-move",
          "-parent",
          "-unparent",
        ];
      }
      if (
        ["-check", "-uncheck", "-del", "-rename", "-move", "-parent", "-unparent"].includes(sub)
      ) {
        return taskNames;
      }
      return [];
    }
    return [];
  }

  /* live suggestion list, recomputed from the current input on every render */
  const { ctx: suggestCtx, currentToken: suggestToken, basePrefix: suggestBase } =
    splitInputContext(input);
  const suggestPool = suggestToken.startsWith("@")
    ? projects.map((p) => `@${p}`)
    : getCompletionCandidates(suggestCtx);
  const suggestions = suggestPool.filter((c) =>
    c.toLowerCase().startsWith(suggestToken.toLowerCase())
  );
  const activeIndex = suggestions.length
    ? Math.min(suggestIndex, suggestions.length - 1)
    : 0;
  const showSuggestions = suggestOpen && input.length > 0 && suggestions.length > 0;

  const acceptSuggestion = (choice) => {
    if (!choice) return;
    setInput(suggestBase + choice + " ");
    setSuggestIndex(0);
    setSuggestOpen(true);
    if (inputRef.current) inputRef.current.focus();
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
      runCommand(input);
      setInput("");
      setSuggestIndex(0);
      setSuggestOpen(true);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (showSuggestions) {
        setSuggestIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (cmdLog.length === 0) return;
      const idx = cmdPtr === -1 ? cmdLog.length - 1 : Math.max(0, cmdPtr - 1);
      setCmdPtr(idx);
      setInput(cmdLog[idx]);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (showSuggestions) {
        setSuggestIndex((i) => (i + 1) % suggestions.length);
        return;
      }
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
            rgba(0,0,0,0.16) 3px
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
          {storageAvailable && (
            <span
              className="ml-3"
              style={{ color: C.amberFaint, fontSize: 10 }}
              title={
                saveStatus === "error"
                  ? "couldn't save — your changes may not persist"
                  : "boards and tasks are saved automatically"
              }
            >
              {saveStatus === "saving" && "· saving…"}
              {saveStatus === "saved" && "· saved"}
              {saveStatus === "error" && "· save failed"}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            {Object.keys(THEMES).map((name) => (
              <button
                key={name}
                onClick={(e) => {
                  e.stopPropagation();
                  changeTheme(name);
                }}
                aria-label={`${name} theme`}
                title={name}
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
            <div className="relative flex items-center mt-1">
              <span style={{ color: C.amberDim }}>{promptStr}</span>
              <input
                ref={inputRef}
                className="tt-input flex-1 bg-transparent outline-none ml-2 text-sm"
                style={{ color: C.amber, fontFamily: FONT }}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setSuggestIndex(0);
                  setSuggestOpen(true);
                }}
                onKeyDown={onKeyDown}
                spellCheck={false}
                autoComplete="off"
                autoFocus
              />
              <span className="tt-cursor" style={{ color: C.amber }}>
                ▮
              </span>

              {showSuggestions && (
                <div
                  className="tt-fade-in absolute left-0"
                  style={{
                    bottom: "calc(100% + 4px)",
                    zIndex: 500,
                    minWidth: 220,
                    maxWidth: 360,
                    maxHeight: 190,
                    overflowY: "auto",
                    background: C.surfaceHi,
                    border: `1px solid ${C.borderHi}`,
                    boxShadow: "0 10px 28px rgba(0,0,0,0.55)",
                  }}
                >
                  {suggestions.map((s, i) => {
                    const matched = s.slice(0, suggestToken.length);
                    const rest = s.slice(suggestToken.length);
                    const active = i === activeIndex;
                    return (
                      <button
                        key={s}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          acceptSuggestion(s);
                        }}
                        onMouseEnter={() => setSuggestIndex(i)}
                        className="w-full text-left px-2.5 py-1 text-xs flex items-center"
                        style={{
                          fontFamily: FONT,
                          background: active ? C.amber : "transparent",
                          color: active ? C.bg : C.amber,
                        }}
                      >
                        <span style={{ fontWeight: active ? 700 : 400 }}>
                          {matched}
                        </span>
                        <span style={{ color: active ? C.bg : C.amberDim }}>
                          {rest}
                        </span>
                      </button>
                    );
                  })}
                  <div
                    className="px-2.5 py-1 text-xs"
                    style={{
                      color: C.amberFaint,
                      borderTop: `1px solid ${C.border}`,
                      fontSize: 9,
                    }}
                  >
                    tab / click to accept · esc to dismiss
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* floating windows layer */}
      <div className="absolute inset-0 pointer-events-none">
        {windows.map((w) => {
          if (w.kind === "board") {
            return (
              <BoardWindow
                key={w.id}
                win={w}
                board={boards[w.boardName]}
                isDragging={draggingId === w.id}
                onClose={() => closeWindow(w.id)}
                onDragStart={(e) => startDrag(e, w)}
                onFocus={() => bringToFront(w.id)}
                onLinkStart={(e) => startLink(e, w.boardName)}
                onAddTask={(taskName) => addTaskTo(w.boardName, taskName)}
                onToggleTask={(taskId, done) =>
                  toggleTask(w.boardName, taskId, done)
                }
                onRemoveTask={(taskId) => removeTask(w.boardName, taskId)}
              />
            );
          }
          if (w.kind === "project") {
            return (
              <ProjectWindow
                key={w.id}
                win={w}
                boards={boards}
                isDragging={draggingId === w.id}
                onClose={() => closeWindow(w.id)}
                onDragStart={(e) => startDrag(e, w)}
                onFocus={() => bringToFront(w.id)}
                onOpenBoard={(key) => openBoardWindow(key)}
                onAddBoard={(name) => {
                  if (!findBoardKey(boards, name)) {
                    addBoard(name, null, [w.projectName]);
                  }
                }}
              />
            );
          }
          return (
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
          );
        })}
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

function ProgressBar({ done, total }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="w-full" style={{ background: C.bg2, height: 4 }}>
      <div
        style={{
          width: `${pct}%`,
          height: 4,
          background: C.amber,
          boxShadow: `0 0 6px ${C.glow}`,
          transition: "width 200ms ease",
        }}
      />
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

/* ---------- single board graphical window (dual: pending / done) ---------- */
function BoardWindow({
  win,
  board,
  isDragging,
  onClose,
  onDragStart,
  onFocus,
  onLinkStart,
  onAddTask,
  onToggleTask,
  onRemoveTask,
}) {
  const [draft, setDraft] = useState("");
  if (!board) return null;
  const { total, done } = boardStats(board);

  const submit = () => {
    const name = draft.trim();
    if (!name) return;
    onAddTask(name);
    setDraft("");
  };

  return (
    <WindowShell
      win={win}
      title={`board / ${win.boardName}${
        board.tags && board.tags.length
          ? "  " + board.tags.map((t) => `@${t}`).join(" ")
          : ""
      }`}
      onClose={onClose}
      onDragStart={onDragStart}
      onFocus={onFocus}
      onLinkStart={onLinkStart}
      dataBoardKey={win.boardName}
      isDragging={isDragging}
      minW={340}
    >
      <div className="px-3 pt-2 pb-2 shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between text-xs mb-1" style={{ color: C.amberDim }}>
          <span>{win.boardName}</span>
          <span>{done}/{total} done</span>
        </div>
        <ProgressBar done={done} total={total} />
      </div>

      <div className="flex-1 min-h-0 relative">
        <DualView tasks={board.tasks} onToggle={onToggleTask} onRemove={onRemoveTask} />
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
          placeholder="add task…"
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: C.amber, fontFamily: FONT }}
          spellCheck={false}
        />
      </div>
    </WindowShell>
  );
}

/* ---------- dual view: pending / done, tree-aware ---------- */
function DualView({ tasks, onToggle, onRemove }) {
  if (tasks.length === 0) return <EmptyHint />;

  const Column = ({ label, doneFlag }) => {
    const items = tasks.filter((t) => t.done === doneFlag);
    const flat = flattenTreeWithDepth(buildTree(items));
    return (
      <div className="flex-1 min-w-0 flex flex-col h-full">
        <div
          className="px-2 py-1.5 text-xs shrink-0 flex items-center justify-between"
          style={{ color: C.amberDim, borderBottom: `1px solid ${C.border}` }}
        >
          <span>{label}</span>
          <span>{items.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto tt-scroll px-2 py-2 space-y-1.5">
          {items.length === 0 && (
            <div className="text-xs italic" style={{ color: C.amberFaint }}>
              —
            </div>
          )}
          {flat.map((t) => {
            const realParent = t.parentId
              ? tasks.find((x) => x.id === t.parentId)
              : null;
            const crossColumnParent =
              realParent && realParent.done !== doneFlag ? realParent : null;
            return (
              <div
                key={t.id}
                className="tt-fade-in tt-card-hover group px-2 py-1.5 text-xs flex items-center gap-2"
                style={{
                  marginLeft: t.depth * 14,
                  background: C.surfaceHi,
                  border: `1px solid ${C.border}`,
                }}
              >
                <Checkbox
                  checked={doneFlag}
                  onChange={() => onToggle(t.id, !doneFlag)}
                  size={14}
                />
                <div className="flex-1 min-w-0 flex flex-col">
                  <span
                    className="truncate"
                    style={{
                      color: doneFlag ? C.amberFaint : C.amber,
                      textDecoration: doneFlag ? "line-through" : "none",
                    }}
                  >
                    {t.name}
                  </span>
                  {crossColumnParent && (
                    <span
                      className="truncate"
                      style={{ color: C.amberFaint, fontSize: 10 }}
                    >
                      ↳ under {crossColumnParent.name}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onRemove(t.id)}
                  className="opacity-0 group-hover:opacity-100 text-xs px-1"
                  style={{ color: C.danger }}
                  aria-label="delete task"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex">
      <Column label="pending" doneFlag={false} />
      <div style={{ width: 1, background: C.border }} />
      <Column label="done" doneFlag={true} />
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

/* ---------- project window: every board tagged with a project ---------- */
function ProjectWindow({
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
  const keys = Object.keys(boards).filter((k) =>
    (boards[k].tags || []).some((t) => norm(t) === norm(win.projectName))
  );

  const submit = () => {
    const name = draft.trim();
    if (!name) return;
    onAddBoard(name);
    setDraft("");
  };

  return (
    <WindowShell
      win={win}
      title={`project / @${win.projectName}`}
      onClose={onClose}
      onDragStart={onDragStart}
      onFocus={onFocus}
      isDragging={isDragging}
      minW={320}
    >
      <div className="flex-1 overflow-y-auto tt-scroll px-3 py-3 space-y-2">
        {keys.length === 0 && (
          <div className="text-xs italic" style={{ color: C.amberFaint }}>
            no boards tagged @{win.projectName} yet — add one below
          </div>
        )}
        {keys.map((k) => {
          const { total, done } = boardStats(boards[k]);
          return (
            <button
              key={k}
              onClick={() => onOpenBoard(k)}
              className="tt-fade-in tt-card-hover w-full text-left px-3 py-2"
              style={{
                background: C.surfaceHi,
                border: `1px solid ${C.border}`,
              }}
            >
              <div className="flex items-center justify-between text-sm mb-1">
                <span style={{ color: C.amber }}>{k}</span>
                <span style={{ color: C.amberDim, fontSize: 11 }}>
                  {done}/{total}
                </span>
              </div>
              <ProgressBar done={done} total={total} />
            </button>
          );
        })}
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
          placeholder={`new board in @${win.projectName}…`}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: C.amber, fontFamily: FONT }}
          spellCheck={false}
        />
      </div>
    </WindowShell>
  );
}

function EmptyHint() {
  return (
    <div
      className="h-full flex items-center justify-center text-xs italic"
      style={{ color: C.amberFaint }}
    >
      no tasks yet — add one below
    </div>
  );
}