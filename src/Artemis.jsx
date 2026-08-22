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

/* ---------- helpers ---------- */
let uidCounter = 0;
const uid = (p) => {
  uidCounter += 1;
  return `${p}-${uidCounter}-${Date.now().toString(36)}`;
};

const norm = (s) => s.trim().toLowerCase();

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

/* ---------- help text ---------- */
const HELP_LINES = [
  "commands:",
  "  board -add <name>          create a new board",
  "  board -del <name>          delete a board",
  "  board -rename <a> -> <b>   rename a board",
  "  board @show                list tasks in the current board",
  "  board <name> -show         list tasks in any board, by name",
  "  ls                         list boards, or tasks if inside one",
  "  cd <name>                  enter a board",
  "  cd .                       leave the current board",
  "  pwd                        show where you are",
  "  task -add <name>           add a task to the current board",
  "  task -check <name>         mark a task done",
  "  task -uncheck <name>       mark a task not done",
  "  task -del <name>           delete a task",
  "  task -rename <a> -> <b>    rename a task",
  "  task -clear                remove completed tasks in this board",
  "  sort -az | -za | -done     sort tasks in the current board",
  "  find <term>                search task names across all boards",
  "  stats                      show overall progress across boards",
  "  history                    show recently run commands",
  "  date                       show the current date and time",
  "  vis <name>                 open a graphical view of a board",
  "  vis #                      open a graphical view of all boards",
  "  clear                      clear the screen",
  "  help                       show this list",
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

/* ================================================================== */

export default function TodoTerminalApp() {
  const [boards, setBoards] = useState({});
  const [currentBoard, setCurrentBoard] = useState(null); // key or null
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [cmdLog, setCmdLog] = useState([]);
  const [cmdPtr, setCmdPtr] = useState(-1);
  const [windows, setWindows] = useState([]);
  const [booted, setBooted] = useState(false);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const dragRef = useRef(null);
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
    const vw = containerRef.current
      ? containerRef.current.clientWidth
      : 1000;
    const vh = containerRef.current
      ? containerRef.current.clientHeight
      : 700;
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

  const openOverviewWindow = () => {
    const existing = windows.find((w) => w.kind === "overview");
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
        kind: "overview",
        x: pos.x,
        y: pos.y,
        width: 440,
        height: 500,
        z: zCounter.current,
      },
    ]);
  };

  /* dragging */
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
    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("mouseup", onDragEnd);
  }, [onDragMove]);

  const startDrag = (e, win) => {
    e.preventDefault();
    bringToFront(win.id);
    dragRef.current = {
      id: win.id,
      offsetX: e.clientX - win.x,
      offsetY: e.clientY - win.y,
    };
    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("mouseup", onDragEnd);
  };

  /* ---------- data ops (used by both terminal + windows) ---------- */
  const addTaskTo = (boardKey, name) => {
    if (!name) return;
    setBoards((b) => {
      const board = b[boardKey];
      if (findTaskIndex(board.tasks, name) !== -1) return b;
      return {
        ...b,
        [boardKey]: {
          ...board,
          tasks: [...board.tasks, { id: uid("task"), name, done: false }],
        },
      };
    });
  };

  const toggleTask = (boardKey, taskId, done) => {
    setBoards((b) => {
      const board = b[boardKey];
      return {
        ...b,
        [boardKey]: {
          ...board,
          tasks: board.tasks.map((t) =>
            t.id === taskId ? { ...t, done } : t
          ),
        },
      };
    });
  };

  const removeTask = (boardKey, taskId) => {
    setBoards((b) => {
      const board = b[boardKey];
      return {
        ...b,
        [boardKey]: {
          ...board,
          tasks: board.tasks.filter((t) => t.id !== taskId),
        },
      };
    });
  };

  const renameTaskIn = (boardKey, taskId, newName) => {
    setBoards((b) => {
      const board = b[boardKey];
      return {
        ...b,
        [boardKey]: {
          ...board,
          tasks: board.tasks.map((t) =>
            t.id === taskId ? { ...t, name: newName } : t
          ),
        },
      };
    });
  };

  const clearDoneTasks = (boardKey) => {
    setBoards((b) => {
      const board = b[boardKey];
      return {
        ...b,
        [boardKey]: {
          ...board,
          tasks: board.tasks.filter((t) => !t.done),
        },
      };
    });
  };

  const sortTasksIn = (boardKey, mode) => {
    setBoards((b) => {
      const board = b[boardKey];
      const tasks = [...board.tasks];
      if (mode === "-az") {
        tasks.sort((a, c) => a.name.localeCompare(c.name));
      } else if (mode === "-za") {
        tasks.sort((a, c) => c.name.localeCompare(a.name));
      } else if (mode === "-done") {
        tasks.sort((a, c) => Number(a.done) - Number(c.done));
      }
      return { ...b, [boardKey]: { ...board, tasks } };
    });
  };

  const addBoard = (name) => {
    setBoards((b) => ({ ...b, [name]: { tasks: [] } }));
  };

  const renameBoard = (oldKey, newName) => {
    setBoards((b) => {
      if (!(oldKey in b)) return b;
      const next = {};
      Object.keys(b).forEach((k) => {
        next[k === oldKey ? newName : k] = b[k];
      });
      return next;
    });
    setCurrentBoard((cb) => (cb === oldKey ? newName : cb));
    setWindows((ws) =>
      ws.map((w) =>
        w.kind === "board" && w.boardName === oldKey
          ? { ...w, boardName: newName }
          : w
      )
    );
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

      case "sort": {
        if (!currentBoard) {
          print("you're not inside a board — try `cd <board>` first", "err");
          break;
        }
        const mode = tokens[1];
        if (!["-az", "-za", "-done"].includes(mode)) {
          print("usage: sort -az | -za | -done", "err");
          break;
        }
        sortTasksIn(currentBoard, mode);
        print(`sorted '${currentBoard}' by ${mode.slice(1)}`);
        break;
      }

      case "find": {
        const term = tokens.slice(1).join(" ");
        if (!term) {
          print("usage: find <term>", "err");
          break;
        }
        const q = norm(term);
        const hits = [];
        Object.keys(boards).forEach((k) => {
          boards[k].tasks.forEach((t) => {
            if (norm(t.name).includes(q)) {
              hits.push(`  ${padName(k, 14)}[${t.done ? "x" : " "}] ${t.name}`);
            }
          });
        });
        if (hits.length === 0) {
          print(`no tasks matching '${term}'`);
        } else {
          print([`${hits.length} match${hits.length === 1 ? "" : "es"} for '${term}':`, ...hits].join("\n"));
        }
        break;
      }

      case "stats": {
        const keys = Object.keys(boards);
        if (keys.length === 0) {
          print("no boards yet — try `board -add <name>`");
          break;
        }
        let totalTasks = 0;
        let totalDone = 0;
        const lines = ["overall progress:"];
        keys.forEach((k) => {
          const { total, done } = boardStats(boards[k]);
          totalTasks += total;
          totalDone += done;
          const pct = total === 0 ? 0 : Math.round((done / total) * 100);
          lines.push(`  ${padName(k, 14)}${done}/${total}  (${pct}%)`);
        });
        const overallPct =
          totalTasks === 0 ? 0 : Math.round((totalDone / totalTasks) * 100);
        lines.push("");
        lines.push(
          `  ${keys.length} board${keys.length === 1 ? "" : "s"}, ${totalDone}/${totalTasks} tasks done (${overallPct}%)`
        );
        print(lines.join("\n"));
        break;
      }

      case "history": {
        if (cmdLog.length === 0) {
          print("no commands run yet");
          break;
        }
        const recent = cmdLog.slice(-15);
        const lines = recent.map((c, i) => `  ${cmdLog.length - recent.length + i + 1}  ${c}`);
        print(lines.join("\n"));
        break;
      }

      case "date": {
        print(new Date().toString());
        break;
      }

      case "vis": {
        const arg = tokens.slice(1).join(" ");
        if (arg === "#") {
          openOverviewWindow();
          print("opened board overview");
          break;
        }
        if (!arg) {
          print("usage: vis <board name>   or   vis #", "err");
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

      default: {
        print(`unknown command: '${tokens[0]}' — try 'help'`, "err");
      }
    }
  };

  function printBoardList() {
    const keys = Object.keys(boards);
    if (keys.length === 0) {
      print("no boards yet — try `board -add <name>`");
      return;
    }
    const width = Math.max(...keys.map((k) => k.length)) + 2;
    const lines = [`${keys.length} board${keys.length === 1 ? "" : "s"}:`];
    keys.forEach((k) => {
      const { total, done } = boardStats(boards[k]);
      lines.push(`  ${padName(k, width)}${done}/${total} done`);
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
      board.tasks.forEach((t) => {
        lines.push(`  [${t.done ? "x" : " "}] ${t.name}`);
      });
    }
    print(lines.join("\n"));
  }

  function handleBoardCommand(tokens) {
    const sub = tokens[1];
    if (!sub) {
      print("usage: board -add|-del <name>   board @show   board <name> -show", "err");
      return;
    }
    if (sub === "-add") {
      const name = tokens.slice(2).join(" ");
      if (!name) {
        print("usage: board -add <name>", "err");
        return;
      }
      if (findBoardKey(boards, name)) {
        print(`board '${name}' already exists`, "err");
        return;
      }
      addBoard(name);
      print(`created board '${name}'`);
      return;
    }
    if (sub === "-del") {
      const name = tokens.slice(2).join(" ");
      const key = findBoardKey(boards, name);
      if (!key) {
        print(`no board named '${name}'`, "err");
        return;
      }
      setBoards((b) => {
        const next = { ...b };
        delete next[key];
        return next;
      });
      if (currentBoard && norm(currentBoard) === norm(key)) {
        setCurrentBoard(null);
      }
      setWindows((ws) => ws.filter((w) => w.boardName !== key));
      print(`deleted board '${key}'`);
      return;
    }
    if (sub === "-rename") {
      const rest = tokens.slice(2).join(" ");
      const arrowIdx = rest.indexOf("->");
      if (arrowIdx === -1) {
        print("usage: board -rename <old name> -> <new name>", "err");
        return;
      }
      const oldName = rest.slice(0, arrowIdx).trim();
      const newName = rest.slice(arrowIdx + 2).trim();
      const key = findBoardKey(boards, oldName);
      if (!key) {
        print(`no board named '${oldName}'`, "err");
        return;
      }
      if (!newName) {
        print("usage: board -rename <old name> -> <new name>", "err");
        return;
      }
      if (findBoardKey(boards, newName)) {
        print(`board '${newName}' already exists`, "err");
        return;
      }
      renameBoard(key, newName);
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
      if (!name) {
        print("usage: task -add <name>", "err");
        return;
      }
      if (findTaskIndex(board.tasks, name) !== -1) {
        print(`task '${name}' already exists`, "err");
        return;
      }
      addTaskTo(currentBoard, name);
      print(`added task '${name}'`);
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
    if (sub === "-rename") {
      const arrowIdx = name.indexOf("->");
      if (arrowIdx === -1) {
        print("usage: task -rename <old name> -> <new name>", "err");
        return;
      }
      const oldName = name.slice(0, arrowIdx).trim();
      const newName = name.slice(arrowIdx + 2).trim();
      const idx = findTaskIndex(board.tasks, oldName);
      if (idx === -1) {
        print(`no task named '${oldName}'`, "err");
        return;
      }
      if (!newName) {
        print("usage: task -rename <old name> -> <new name>", "err");
        return;
      }
      if (findTaskIndex(board.tasks, newName) !== -1) {
        print(`task '${newName}' already exists`, "err");
        return;
      }
      renameTaskIn(currentBoard, board.tasks[idx].id, newName);
      print(`renamed '${oldName}' to '${newName}'`);
      return;
    }
    if (sub === "-clear") {
      const doneCount = board.tasks.filter((t) => t.done).length;
      if (doneCount === 0) {
        print("no completed tasks to clear");
        return;
      }
      clearDoneTasks(currentBoard);
      print(`cleared ${doneCount} completed task${doneCount === 1 ? "" : "s"}`);
      return;
    }
    print(`unknown task command: '${sub}' — try 'help'`, "err");
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
      const idx =
        cmdPtr === -1 ? cmdLog.length - 1 : Math.max(0, cmdPtr - 1);
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

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none"
      style={{
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
        @media (prefers-reduced-motion: reduce) {
          .tt-flicker { animation: none !important; }
          .tt-win { animation: none !important; }
        }
        .tt-flicker { animation: tt-flicker 6s infinite; }
        input.tt-input { caret-color: ${C.amber}; }
        input.tt-input::selection { background: ${C.amberFaint}; }
      `}</style>

      {/* terminal layer */}
      <div className="tt-scanlines tt-flicker absolute inset-0 flex flex-col">
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
        </div>

        <div
          ref={scrollRef}
          className="tt-scroll flex-1 overflow-y-auto px-4 py-3 text-sm leading-6"
          style={{ color: C.amber }}
        >
          {history.map((line) => (
            <div key={line.id} className="whitespace-pre-wrap tt-glow">
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
              board={boards[w.boardName]}
              onClose={() => closeWindow(w.id)}
              onDragStart={(e) => startDrag(e, w)}
              onFocus={() => bringToFront(w.id)}
              onAddTask={(name) => addTaskTo(w.boardName, name)}
              onToggleTask={(taskId, done) =>
                toggleTask(w.boardName, taskId, done)
              }
              onRemoveTask={(taskId) => removeTask(w.boardName, taskId)}
            />
          ) : (
            <OverviewWindow
              key={w.id}
              win={w}
              boards={boards}
              onClose={() => closeWindow(w.id)}
              onDragStart={(e) => startDrag(e, w)}
              onFocus={() => bringToFront(w.id)}
              onOpenBoard={(key) => openBoardWindow(key)}
              onAddBoard={(name) => {
                if (!findBoardKey(boards, name)) addBoard(name);
              }}
            />
          )
        )}
      </div>
    </div>
  );
}

function getPromptStr(currentBoard) {
  return currentBoard ? `guest:~/${currentBoard}$` : "guest:~$";
}

/* ================================================================== */
/* window chrome shared styling                                        */

function WindowShell({ win, title, onClose, onDragStart, onFocus, children, minW = 280, minH = 220 }) {
  return (
    <div
      className="tt-win pointer-events-auto absolute flex flex-col"
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

function Checkbox({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className="shrink-0 flex items-center justify-center"
      style={{
        width: 16,
        height: 16,
        border: `1px solid ${checked ? C.amber : C.amberDim}`,
        background: checked ? C.amber : "transparent",
        color: C.bg,
        fontSize: 11,
        lineHeight: 1,
      }}
      aria-label={checked ? "mark as not done" : "mark as done"}
    >
      {checked ? "✓" : ""}
    </button>
  );
}

/* ---------- single board graphical window ---------- */
function BoardWindow({
  win,
  board,
  onClose,
  onDragStart,
  onFocus,
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
      title={`board / ${win.boardName}`}
      onClose={onClose}
      onDragStart={onDragStart}
      onFocus={onFocus}
    >
      <div className="px-3 pt-2 pb-2" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between text-xs mb-1" style={{ color: C.amberDim }}>
          <span>{win.boardName}</span>
          <span>{done}/{total} done</span>
        </div>
        <ProgressBar done={done} total={total} />
      </div>

      <div className="flex-1 overflow-y-auto tt-scroll px-3 py-2 space-y-1.5">
        {board.tasks.length === 0 && (
          <div className="text-xs italic" style={{ color: C.amberFaint }}>
            no tasks yet — add one below
          </div>
        )}
        {board.tasks.map((t) => (
          <div key={t.id} className="group flex items-center gap-2 text-sm">
            <Checkbox
              checked={t.done}
              onChange={() => onToggleTask(t.id, !t.done)}
            />
            <span
              className="flex-1 truncate"
              style={{
                color: t.done ? C.amberFaint : C.amber,
                textDecoration: t.done ? "line-through" : "none",
              }}
            >
              {t.name}
            </span>
            <button
              onClick={() => onRemoveTask(t.id)}
              className="opacity-0 group-hover:opacity-100 text-xs px-1"
              style={{ color: C.danger }}
              aria-label="delete task"
            >
              ×
            </button>
          </div>
        ))}
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

/* ---------- overview window: all boards ---------- */
function OverviewWindow({ win, boards, onClose, onDragStart, onFocus, onOpenBoard, onAddBoard }) {
  const [draft, setDraft] = useState("");
  const keys = Object.keys(boards);

  const submit = () => {
    const name = draft.trim();
    if (!name) return;
    onAddBoard(name);
    setDraft("");
  };

  return (
    <WindowShell
      win={win}
      title="boards / overview"
      onClose={onClose}
      onDragStart={onDragStart}
      onFocus={onFocus}
      minW={320}
    >
      <div className="flex-1 overflow-y-auto tt-scroll px-3 py-3 space-y-2">
        {keys.length === 0 && (
          <div className="text-xs italic" style={{ color: C.amberFaint }}>
            no boards yet — create one below
          </div>
        )}
        {keys.map((k) => {
          const { total, done } = boardStats(boards[k]);
          return (
            <button
              key={k}
              onClick={() => onOpenBoard(k)}
              className="w-full text-left px-3 py-2"
              style={{
                background: C.surfaceHi,
                border: `1px solid ${C.border}`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.borderHi)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
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
          placeholder="new board…"
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: C.amber, fontFamily: FONT }}
          spellCheck={false}
        />
      </div>
    </WindowShell>
  );
}