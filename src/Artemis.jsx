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
  FolderPlus,
  FolderOpen,
  X,
  Minus,
  Square,
  Maximize2,
  ChevronRight,
  Check,
  Trash2,
  Pencil,
  Plus,
  LayoutGrid,
  Network,
  Rocket,
  Clock,
  GripVertical,
  CornerDownLeft,
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

function countStats(board) {
  const total = board.tasks.length;
  const done = board.tasks.filter((t) => t.done).length;
  return { total, done, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

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
      "sprint-1": {
        tasks: [],
        parent: null,
        tags: [],
      },
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
    case "ADD_BOARD": {
      const name = action.name.trim();
      if (!name || state.boards[name]) return state;
      return {
        ...state,
        boards: { ...state.boards, [name]: { tasks: [], parent: null, tags: [] } },
      };
    }
    case "DELETE_BOARD": {
      const { name } = action;
      if (!state.boards[name]) return state;
      const boards = { ...state.boards };
      delete boards[name];
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
      const windows = state.windows.map((w) =>
        w.kind === "board" && w.boardName === oldName
          ? { ...w, boardName: clean }
          : w
      );
      return {
        ...state,
        boards,
        windows,
        activeBoard: state.activeBoard === oldName ? clean : state.activeBoard,
      };
    }
    case "TAG_BOARD": {
      const { name, tag } = action;
      const board = state.boards[name];
      if (!board) return state;
      if (board.tags.includes(tag)) return state;
      return {
        ...state,
        boards: {
          ...state.boards,
          [name]: { ...board, tags: [...board.tags, tag] },
        },
      };
    }
    case "ADD_TASK": {
      const { board, name, parentId } = action;
      const b = state.boards[board];
      if (!b) return state;
      const task = { id: uid("t"), name: name.trim(), done: false, parentId: parentId || null };
      if (!task.name) return state;
      return {
        ...state,
        boards: { ...state.boards, [board]: { ...b, tasks: [...b.tasks, task] } },
      };
    }
    case "TOGGLE_TASK": {
      const { board, taskId } = action;
      const b = state.boards[board];
      if (!b) return state;
      return {
        ...state,
        boards: {
          ...state.boards,
          [board]: {
            ...b,
            tasks: b.tasks.map((t) =>
              t.id === taskId ? { ...t, done: !t.done } : t
            ),
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
        boards: {
          ...state.boards,
          [board]: {
            ...b,
            tasks: b.tasks.map((t) => (t.id === taskId ? { ...t, name: clean } : t)),
          },
        },
      };
    }
    case "DELETE_TASK": {
      const { board, taskId } = action;
      const b = state.boards[board];
      if (!b) return state;
      return {
        ...state,
        boards: {
          ...state.boards,
          [board]: {
            ...b,
            tasks: b.tasks
              .filter((t) => t.id !== taskId)
              .map((t) => (t.parentId === taskId ? { ...t, parentId: null } : t)),
          },
        },
      };
    }
    case "SET_PARENT": {
      const { board, taskId, parentId } = action;
      const b = state.boards[board];
      if (!b) return state;
      if (taskId === parentId) return state;
      // prevent cycles
      let cursor = parentId;
      const byId = Object.fromEntries(b.tasks.map((t) => [t.id, t]));
      while (cursor) {
        if (cursor === taskId) return state;
        cursor = byId[cursor] ? byId[cursor].parentId : null;
      }
      return {
        ...state,
        boards: {
          ...state.boards,
          [board]: {
            ...b,
            tasks: b.tasks.map((t) => (t.id === taskId ? { ...t, parentId } : t)),
          },
        },
      };
    }
    case "ADD_PROJECT": {
      const name = action.name.trim();
      if (!name || state.projects.includes(name)) return state;
      return { ...state, projects: [...state.projects, name] };
    }
    case "SET_ACTIVE_BOARD":
      return { ...state, activeBoard: action.name };
    case "OPEN_WINDOW": {
      const { kind, boardName, projectName, rect } = action;
      const singleton = kind === "terminal" || kind === "file-manager" || kind === "graph";
      let existing = null;
      if (singleton) {
        existing = state.windows.find((w) => w.kind === kind);
      } else if (kind === "board") {
        existing = state.windows.find((w) => w.kind === "board" && w.boardName === boardName);
      } else if (kind === "project") {
        existing = state.windows.find((w) => w.kind === "project" && w.projectName === projectName);
      }
      const maxZ = state.windows.reduce((m, w) => Math.max(m, w.z), 0);
      if (existing) {
        return {
          ...state,
          windows: state.windows.map((w) =>
            w.id === existing.id ? { ...w, minimized: false, z: maxZ + 1 } : w
          ),
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
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.id ? { ...w, z: maxZ + 1 } : w
        ),
      };
    }
    case "MINIMIZE_WINDOW":
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.id ? { ...w, minimized: true } : w
        ),
      };
    case "RESTORE_WINDOW": {
      const maxZ = state.windows.reduce((m, w) => Math.max(m, w.z), 0);
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.id ? { ...w, minimized: false, z: maxZ + 1 } : w
        ),
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
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.id ? { ...w, x: action.x, y: action.y } : w
        ),
      };
    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/*  Small reusable UI: modal dialog (replaces window.prompt/confirm)   */
/* ------------------------------------------------------------------ */

function Modal({ title, children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[360px] rounded-2xl border border-white/60 bg-white/90 shadow-2xl backdrop-blur-xl p-5">
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
            className="rounded-lg px-3 py-1.5 text-sm text-violet-700 hover:bg-violet-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
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
          className="rounded-lg px-3 py-1.5 text-sm text-violet-700 hover:bg-violet-100"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium text-white ${
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
      className={`absolute flex flex-col overflow-hidden rounded-xl border shadow-2xl transition-shadow ${
        dark
          ? "border-amber-900/60 bg-[#0b0906]"
          : "border-white/60 bg-white/75 backdrop-blur-xl"
      } ${isTop ? "ring-1 ring-violet-300/70" : ""}`}
      style={{ left: win.x, top: win.y, width: win.width, height: win.height, zIndex: win.z }}
      onMouseDown={onFocus}
    >
      <div
        className={`flex select-none items-center gap-2 px-3 py-2 ${
          dark
            ? "bg-gradient-to-b from-amber-950/80 to-[#0b0906] text-amber-300"
            : "bg-white/70 text-violet-900"
        } cursor-grab active:cursor-grabbing`}
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
            className={`grid h-5 w-5 place-items-center rounded-full ${
              dark ? "bg-amber-900/40 hover:bg-amber-800/60 text-amber-300" : "bg-violet-100 hover:bg-violet-200 text-violet-700"
            }`}
            title="Minimize"
          >
            <Minus size={11} />
          </button>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onToggleMax}
            className={`grid h-5 w-5 place-items-center rounded-full ${
              dark ? "bg-amber-900/40 hover:bg-amber-800/60 text-amber-300" : "bg-violet-100 hover:bg-violet-200 text-violet-700"
            }`}
            title="Maximize"
          >
            {win.maximized ? <Square size={9} /> : <Maximize2 size={9} />}
          </button>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onClose}
            className="grid h-5 w-5 place-items-center rounded-full bg-rose-400/80 hover:bg-rose-500 text-white"
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
  const [menu, setMenu] = useState(null); // {name, x, y}
  const [modal, setModal] = useState(null); // {type,...}

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
          className="flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-medium text-white shadow hover:bg-violet-700"
        >
          <FolderPlus size={13} /> New Board
        </button>
      </div>

      <div className="grid flex-1 auto-rows-min grid-cols-3 gap-4 overflow-auto p-4 sm:grid-cols-4">
        {names.length === 0 && (
          <div className="col-span-full mt-10 text-center text-sm text-violet-400">
            No boards yet — create one to get started.
          </div>
        )}
        {names.map((name) => {
          const { total, done, pct } = countStats(boards[name]);
          return (
            <button
              key={name}
              onDoubleClick={() => openWindow("board", { boardName: name })}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenu({ name, x: e.clientX, y: e.clientY });
              }}
              className="group flex flex-col items-center gap-1.5 rounded-xl p-2 text-center hover:bg-violet-100/70"
            >
              <div className="relative">
                <Folder size={40} className="text-violet-400 drop-shadow-sm group-hover:text-violet-500" strokeWidth={1.5} />
                <span className="absolute -bottom-1 -right-1 rounded-full bg-violet-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                  {done}/{total}
                </span>
              </div>
              <span className="line-clamp-1 max-w-[92px] text-[11px] font-medium text-violet-800">{name}</span>
              <div className="h-1 w-16 overflow-hidden rounded-full bg-violet-100">
                <div className="h-full bg-violet-500" style={{ width: `${pct}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      {menu && (
        <div
          className="fixed z-[9998] w-40 overflow-hidden rounded-lg border border-violet-100 bg-white shadow-xl"
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

function buildTree(tasks) {
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
      className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 ${
        over ? "bg-violet-200/70 ring-1 ring-violet-400" : "hover:bg-white/70"
      }`}
    >
      <GripVertical size={12} className="shrink-0 cursor-grab text-violet-300" />
      <button
        onClick={() => dispatch({ type: "TOGGLE_TASK", board, taskId: task.id })}
        className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${
          task.done ? "border-violet-500 bg-violet-500 text-white" : "border-violet-300 bg-white"
        }`}
      >
        {task.done && <Check size={11} strokeWidth={3} />}
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
          className={`flex-1 truncate text-xs ${task.done ? "text-violet-400 line-through" : "text-violet-900"}`}
        >
          {task.name}
        </span>
      )}
      <button
        onClick={() => dispatch({ type: "DELETE_TASK", board, taskId: task.id })}
        className="invisible shrink-0 rounded p-1 text-violet-300 hover:bg-rose-50 hover:text-rose-500 group-hover:visible"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

function TaskColumn({ label, tasks, board, dispatch, accent }) {
  const tree = useMemo(() => buildTree(tasks), [tasks]);

  const handleDrop = useCallback(
    (draggedId, targetId) => {
      dispatch({ type: "SET_PARENT", board, taskId: draggedId, parentId: targetId });
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
        if (draggedId) dispatch({ type: "SET_PARENT", board, taskId: draggedId, parentId: null });
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
          <div className="h-full bg-gradient-to-r from-violet-400 to-violet-600 transition-all" style={{ width: `${pct}%` }} />
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
          <button type="submit" className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700">
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
/*  Graph view                                                         */
/* ------------------------------------------------------------------ */

function GraphApp({ boards, openWindow }) {
  const names = Object.keys(boards);
  const cx = 300, cy = 210, r = 140;
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-white/40 to-violet-50/40 p-3">
      <div className="mb-1 text-xs font-medium text-violet-500">Board relationship graph</div>
      <svg viewBox="0 0 600 420" className="w-full flex-1">
        {names.map((name, i) => {
          const angle = (i / Math.max(1, names.length)) * Math.PI * 2 - Math.PI / 2;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          const { total, done } = countStats(boards[name]);
          const radius = 18 + Math.min(20, total * 3);
          return (
            <g key={name}>
              <line x1={cx} y1={cy} x2={x} y2={y} stroke="#c4b5fd" strokeWidth={1.5} />
              <circle
                cx={x}
                cy={y}
                r={radius}
                fill={done === total && total > 0 ? "#a78bfa" : "#ede9fe"}
                stroke="#8b5cf6"
                strokeWidth={1.5}
                className="cursor-pointer"
                onClick={() => openWindow("board", { boardName: name })}
              />
              <text x={x} y={y - radius - 6} textAnchor="middle" fontSize="10" fill="#6d28d9" fontWeight={600}>
                {name}
              </text>
              <text x={x} y={y + 3} textAnchor="middle" fontSize="9" fill="#4c1d95">
                {done}/{total}
              </text>
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={30} fill="#7c3aed" />
        <text x={cx} y={cy + 3} textAnchor="middle" fontSize="9" fill="white" fontWeight={700}>
          ARTEMIS
        </text>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Project view                                                       */
/* ------------------------------------------------------------------ */

function ProjectApp({ projectName, boards, dispatch, openWindow }) {
  const hasBoard = Boolean(boards[projectName]);
  const names = Object.keys(boards).sort();
  return (
    <div className="flex h-full flex-col gap-3 bg-gradient-to-b from-white/40 to-violet-50/40 p-4">
      <div className="flex items-center gap-2">
        <Rocket size={16} className="text-violet-500" />
        <div className="text-sm font-semibold text-violet-900">{projectName}</div>
      </div>
      <div className="rounded-xl bg-white/60 p-3 text-xs text-violet-600">
        {hasBoard ? (
          <button
            onClick={() => openWindow("board", { boardName: projectName })}
            className="flex items-center gap-1.5 font-medium text-violet-700 hover:underline"
          >
            <Folder size={13} /> Open matching board "{projectName}"
          </button>
        ) : (
          <div className="flex items-center justify-between">
            <span>No board named "{projectName}" yet.</span>
            <button
              onClick={() => dispatch({ type: "ADD_BOARD", name: projectName })}
              className="rounded-lg bg-violet-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-violet-700"
            >
              Create it
            </button>
          </div>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto rounded-xl bg-white/60 p-3">
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-violet-400">All boards</div>
        <div className="space-y-1">
          {names.map((n) => (
            <button
              key={n}
              onClick={() => openWindow("board", { boardName: n })}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-violet-700 hover:bg-violet-100"
            >
              <Folder size={13} className="text-violet-400" /> {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Terminal                                                            */
/* ------------------------------------------------------------------ */

const THEMES = {
  amber: { text: "#ffb000", dim: "#a86800", glow: "rgba(255,176,0,0.55)" },
  green: { text: "#3ef07c", dim: "#1f8f4d", glow: "rgba(62,240,124,0.5)" },
  blue: { text: "#63c7ff", dim: "#2f6f96", glow: "rgba(99,199,255,0.5)" },
};

const COMMANDS = ["help", "clear", "ls", "cd", "board", "task", "init", "theme", "vis", "graph", "pwd", "whoami", "date", "echo", "open", "history"];

function TerminalApp({ boards, projects, dispatch, openWindow, theme, setTheme }) {
  const [cwd, setCwd] = useState(null);
  const [lines, setLines] = useState([
    { id: uid("l"), type: "sys", text: "Artemis Terminal v1.0 — type 'help' for commands." },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [lines]);

  useEffect(() => {
    if (cwd && !boards[cwd]) setCwd(null);
  }, [boards, cwd]);

  const print = useCallback((text, type = "out") => {
    setLines((L) => [...L, { id: uid("l"), type, text }]);
  }, []);

  const findTask = (board, needle) => {
    const b = boards[board];
    if (!b) return { error: `no such board: ${board}` };
    const n = needle.trim().toLowerCase();
    const matches = b.tasks.filter((t) => t.name.toLowerCase().includes(n));
    if (matches.length === 0) return { error: `no task matching "${needle}"` };
    if (matches.length > 1) return { error: `ambiguous match for "${needle}" (${matches.length} tasks) — be more specific` };
    return { task: matches[0] };
  };

  const run = useCallback(
    (raw) => {
      const cmd = raw.trim();
      print(`${cwd ? cwd + " " : ""}$ ${raw}`, "in");
      if (!cmd) return;
      setHistory((h) => [...h, cmd]);
      setHistIdx(null);

      const parts = cmd.split(/\s+/);
      const head = parts[0];
      const rest = cmd.slice(head.length).trim();

      if (head === "help") {
        print(
          [
            "board -add <name>        create a board",
            "board -del <name>        delete a board",
            "board -rename <a> -> <b> rename a board",
            "board -tag <name> <tag>  tag a board",
            "task -add <name>         add a task to cwd board",
            "task -check <name>       toggle a task done",
            "task -del <name>         delete a task",
            "cd <board> | cd ..       change working board",
            "ls                       list boards or tasks",
            "pwd                      show current board",
            "vis | open <board>       open the visual board window",
            "graph                    open the relationship graph",
            "init <project>           register a new project",
            "theme <amber|green|blue> change terminal theme",
            "echo <text> · date · whoami · history · clear",
          ].join("\n")
        );
        return;
      }

      if (head === "clear") {
        setLines([]);
        return;
      }

      if (head === "pwd") {
        print(cwd || "/ (root)");
        return;
      }

      if (head === "ls") {
        if (!cwd) {
          const names = Object.keys(boards);
          if (names.length === 0) return print("no boards yet — try: board -add my-board");
          print(names.map((n) => {
            const { total, done } = countStats(boards[n]);
            return `${n}/  (${done}/${total})`;
          }).join("\n"));
        } else {
          const b = boards[cwd];
          if (!b || b.tasks.length === 0) return print("(empty)");
          print(b.tasks.map((t) => `${t.done ? "[x]" : "[ ]"} ${t.name}`).join("\n"));
        }
        return;
      }

      if (head === "cd") {
        const target = rest.trim();
        if (!target || target === "/" || target === "..") {
          setCwd(null);
          return;
        }
        if (!boards[target]) return print(`no such board: ${target}`, "err");
        setCwd(target);
        dispatch({ type: "SET_ACTIVE_BOARD", name: target });
        return;
      }

      if (head === "board") {
        if (rest.startsWith("-add")) {
          const name = rest.slice(4).trim();
          if (!name) return print("usage: board -add <name>", "err");
          if (boards[name]) return print(`board "${name}" already exists`, "err");
          dispatch({ type: "ADD_BOARD", name });
          print(`created board "${name}"`, "ok");
          return;
        }
        if (rest.startsWith("-del")) {
          const name = rest.slice(4).trim();
          if (!boards[name]) return print(`no such board: ${name}`, "err");
          dispatch({ type: "DELETE_BOARD", name });
          print(`deleted board "${name}"`, "ok");
          return;
        }
        if (rest.startsWith("-rename")) {
          const body = rest.slice(7).trim();
          const [oldName, newName] = body.split("->").map((s) => s.trim());
          if (!oldName || !newName) return print("usage: board -rename <old> -> <new>", "err");
          if (!boards[oldName]) return print(`no such board: ${oldName}`, "err");
          if (boards[newName]) return print(`board "${newName}" already exists`, "err");
          dispatch({ type: "RENAME_BOARD", oldName, newName });
          print(`renamed "${oldName}" -> "${newName}"`, "ok");
          return;
        }
        if (rest.startsWith("-tag")) {
          const body = rest.slice(4).trim();
          const [name, tag] = body.split(/\s+/);
          if (!name || !tag) return print("usage: board -tag <name> <tag>", "err");
          if (!boards[name]) return print(`no such board: ${name}`, "err");
          dispatch({ type: "TAG_BOARD", name, tag });
          print(`tagged "${name}" with "${tag}"`, "ok");
          return;
        }
        print("usage: board -add|-del|-rename|-tag ...", "err");
        return;
      }

      if (head === "task") {
        if (!cwd) return print("no board selected — cd into a board first", "err");
        if (rest.startsWith("-add")) {
          const name = rest.slice(4).trim();
          if (!name) return print("usage: task -add <name>", "err");
          dispatch({ type: "ADD_TASK", board: cwd, name, parentId: null });
          print(`added task "${name}" to ${cwd}`, "ok");
          return;
        }
        if (rest.startsWith("-check")) {
          const name = rest.slice(6).trim();
          const { task, error } = findTask(cwd, name);
          if (error) return print(error, "err");
          dispatch({ type: "TOGGLE_TASK", board: cwd, taskId: task.id });
          print(`toggled "${task.name}"`, "ok");
          return;
        }
        if (rest.startsWith("-del")) {
          const name = rest.slice(4).trim();
          const { task, error } = findTask(cwd, name);
          if (error) return print(error, "err");
          dispatch({ type: "DELETE_TASK", board: cwd, taskId: task.id });
          print(`deleted "${task.name}"`, "ok");
          return;
        }
        print("usage: task -add|-check|-del ...", "err");
        return;
      }

      if (head === "init") {
        const name = rest.trim();
        if (!name) return print("usage: init <project>", "err");
        dispatch({ type: "ADD_PROJECT", name });
        if (!boards[name]) dispatch({ type: "ADD_BOARD", name });
        print(`initialized project "${name}"`, "ok");
        openWindow("project", { projectName: name });
        return;
      }

      if (head === "theme") {
        const name = rest.trim();
        if (!THEMES[name]) return print(`unknown theme "${name}" — try amber, green, or blue`, "err");
        setTheme(name);
        print(`theme set to ${name}`, "ok");
        return;
      }

      if (head === "vis") {
        if (cwd) openWindow("board", { boardName: cwd });
        else openWindow("file-manager");
        print("opening visual view…");
        return;
      }

      if (head === "open") {
        const name = rest.trim() || cwd;
        if (!name) return print("usage: open <board>", "err");
        if (!boards[name]) return print(`no such board: ${name}`, "err");
        openWindow("board", { boardName: name });
        print(`opening "${name}"…`);
        return;
      }

      if (head === "graph") {
        openWindow("graph");
        print("opening graph view…");
        return;
      }

      if (head === "whoami") {
        print("operator@artemis-os");
        return;
      }

      if (head === "date") {
        print(new Date().toString());
        return;
      }

      if (head === "echo") {
        print(rest);
        return;
      }

      if (head === "history") {
        print(history.join("\n") || "(empty)");
        return;
      }

      print(`command not found: ${head} — type 'help'`, "err");
    },
    [boards, cwd, dispatch, history, openWindow, print, setTheme]
  );

  const handleTab = () => {
    const parts = input.split(" ");
    const lastIdx = parts.length - 1;
    const last = parts[lastIdx];
    let pool = COMMANDS;
    if (parts.length > 1 && ["cd", "open", "vis"].includes(parts[0])) {
      pool = Object.keys(boards);
    }
    const matches = pool.filter((p) => p.startsWith(last));
    if (matches.length === 1) {
      parts[lastIdx] = matches[0];
      setInput(parts.join(" ") + (parts.length === 1 ? " " : ""));
    } else if (matches.length > 1) {
      print(matches.join("   "));
    }
  };

  const th = THEMES[theme];

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden font-mono"
      style={{ background: "#0b0906", color: th.text }}
      onMouseDown={() => inputRef.current?.focus()}
    >
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.15]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, #000 0px, transparent 1px, transparent 2px, #000 3px)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.55)_100%)]" />
      <div
        className="relative z-0 flex-1 overflow-auto px-3 py-2 text-[12.5px] leading-[1.5]"
        style={{ textShadow: `0 0 6px ${th.glow}` }}
      >
        {lines.map((l) => (
          <pre
            key={l.id}
            className="whitespace-pre-wrap break-words"
            style={{
              color: l.type === "err" ? "#ff5c5c" : l.type === "ok" ? "#8dffb0" : l.type === "sys" ? th.dim : th.text,
              opacity: l.type === "in" ? 0.85 : 1,
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
        <span style={{ color: th.text, textShadow: `0 0 6px ${th.glow}` }}>{cwd ? `${cwd}` : "~"}$</span>
        <input
          ref={inputRef}
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              e.preventDefault();
              handleTab();
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              if (history.length === 0) return;
              const idx = histIdx === null ? history.length - 1 : Math.max(0, histIdx - 1);
              setHistIdx(idx);
              setInput(history[idx]);
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              if (histIdx === null) return;
              const idx = histIdx + 1;
              if (idx >= history.length) {
                setHistIdx(null);
                setInput("");
              } else {
                setHistIdx(idx);
                setInput(history[idx]);
              }
            }
          }}
          className="flex-1 bg-transparent outline-none caret-current"
          style={{ color: th.text, textShadow: `0 0 6px ${th.glow}` }}
          spellCheck={false}
          autoComplete="off"
        />
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
    if (w.kind === "file-manager") return "Files";
    if (w.kind === "graph") return "Graph";
    if (w.kind === "board") return w.boardName;
    if (w.kind === "project") return w.projectName;
    return w.kind;
  };
  const iconFor = (kind) =>
    kind === "terminal" ? <TerminalIcon size={13} /> :
    kind === "file-manager" ? <Folder size={13} /> :
    kind === "graph" ? <Network size={13} /> :
    kind === "project" ? <Rocket size={13} /> : <Folder size={13} />;

  const topZ = windows.reduce((m, w) => Math.max(m, w.z), 0);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[9000] flex justify-center">
      <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-white/60 bg-white/60 px-2 py-1.5 shadow-xl backdrop-blur-xl">
        <div className="relative">
          <button
            onClick={() => setStartOpen((s) => !s)}
            className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow"
            title="Artemis"
          >
            <Sparkles size={16} />
          </button>
          {startOpen && (
            <div
              className="absolute bottom-12 left-0 w-44 overflow-hidden rounded-xl border border-violet-100 bg-white shadow-2xl"
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
                <Folder size={13} /> File Manager
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
          className="grid h-9 w-9 place-items-center rounded-xl text-violet-600 hover:bg-violet-100"
          title="File Manager"
        >
          <Folder size={17} />
        </button>
        <button
          onClick={() => openWindow("terminal")}
          className="grid h-9 w-9 place-items-center rounded-xl text-violet-600 hover:bg-violet-100"
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
              className={`flex max-w-[120px] items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-medium ${
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
      className="flex w-20 flex-col items-center gap-1 rounded-lg p-2 text-center hover:bg-white/30"
    >
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/50 text-violet-600 shadow backdrop-blur">
        {icon}
      </div>
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
  const dragRef = useRef(null); // { id, offsetX, offsetY }
  const [, forceTick] = useState(0);

  const getRect = () => desktopRef.current?.getBoundingClientRect() || { width: 1200, height: 700 };

  const openWindow = useCallback(
    (kind, extra = {}) => {
      dispatch({ type: "OPEN_WINDOW", kind, rect: getRect(), ...extra });
    },
    []
  );

  useEffect(() => {
    openWindow("file-manager");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        background:
          "radial-gradient(1200px 600px at 15% -10%, #f3effc 0%, transparent 60%), radial-gradient(1000px 700px at 100% 110%, #ded4f7 0%, transparent 55%), linear-gradient(160deg, #eae6f8 0%, #e2dbf5 45%, #d8cdf1 100%)",
      }}
    >
      <style>{`
        @keyframes crtFlicker { 0%,100%{opacity:1} 50%{opacity:0.985} }
        .line-clamp-1 { display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      `}</style>

      <div className="absolute left-6 top-6 flex flex-col gap-1">
        <DesktopIcon icon={<Folder size={19} />} label="File Manager" onDoubleClick={() => openWindow("file-manager")} />
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
            <WindowFrame key={w.id} {...commonProps} title="File Manager" icon={<Folder size={13} />}>
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
    </div>
  );
}