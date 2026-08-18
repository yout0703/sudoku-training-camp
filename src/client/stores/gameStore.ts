/**
 * 游戏状态管理（Zustand）
 * 盘面、选中、候选数、撤销/重做、提示
 * 对错只在交卷时判断，填数过程不给实时反馈
 */
import { create } from "zustand";
import type { PuzzleDTO } from "../../shared/api-types";

interface HistoryEntry {
  userGrid: number[];
  candidates: Set<number>[];
  errorCells: number[];
}

export interface CheckResult {
  filled: boolean;
  correct: boolean;
  wrongCount: number;
}

interface GameStore {
  puzzle: PuzzleDTO | null;
  givens: number[];
  solution: number[];
  userGrid: number[];
  candidates: Set<number>[];
  selectedCell: number | null;
  noteMode: boolean;
  /** 交卷未通过的次数 */
  mistakes: number;
  hintsUsed: number;
  startTime: number;
  /** 交卷后标出的错误格（填数过程中不更新） */
  errorCells: number[];
  history: HistoryEntry[];
  future: HistoryEntry[];

  loadPuzzle: (puzzle: PuzzleDTO) => void;
  selectCell: (cell: number | null) => void;
  inputNumber: (num: number) => void;
  eraseCell: () => void;
  toggleNoteMode: () => void;
  undo: () => void;
  redo: () => void;
  useHint: () => boolean;
  checkBoard: () => CheckResult;
  isCellGiven: (cell: number) => boolean;
  isFilled: () => boolean;
  isComplete: () => boolean;
  canUndo: () => boolean;
  canRedo: () => boolean;
  reset: () => void;
}

function cloneCands(cands: Set<number>[]): Set<number>[] {
  return cands.map((s) => new Set(s));
}

function snapshot(s: {
  userGrid: number[];
  candidates: Set<number>[];
  errorCells: number[];
}): HistoryEntry {
  return {
    userGrid: [...s.userGrid],
    candidates: cloneCands(s.candidates),
    errorCells: [...s.errorCells],
  };
}

function peerCells(cell: number, size: number, boxRows: number, boxCols: number): number[] {
  const row = Math.floor(cell / size);
  const col = cell % size;
  const peers = new Set<number>();
  for (let k = 0; k < size; k++) {
    peers.add(row * size + k);
    peers.add(k * size + col);
  }
  const br = Math.floor(row / boxRows) * boxRows;
  const bc = Math.floor(col / boxCols) * boxCols;
  for (let r = 0; r < boxRows; r++) {
    for (let c = 0; c < boxCols; c++) {
      peers.add((br + r) * size + (bc + c));
    }
  }
  peers.delete(cell);
  return [...peers];
}

function emptyState() {
  return {
    puzzle: null as PuzzleDTO | null,
    givens: [] as number[],
    solution: [] as number[],
    userGrid: [] as number[],
    candidates: [] as Set<number>[],
    selectedCell: null as number | null,
    noteMode: false,
    mistakes: 0,
    hintsUsed: 0,
    startTime: 0,
    errorCells: [] as number[],
    history: [] as HistoryEntry[],
    future: [] as HistoryEntry[],
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...emptyState(),

  loadPuzzle: (puzzle) => {
    const size = puzzle.meta.size;
    const total = size * size;
    set({
      puzzle,
      givens: [...puzzle.givens],
      solution: puzzle.solution ?? [],
      userGrid: [...puzzle.givens],
      candidates: Array.from({ length: total }, () => new Set<number>()),
      selectedCell: null,
      noteMode: false,
      mistakes: 0,
      hintsUsed: 0,
      startTime: Date.now(),
      errorCells: [],
      history: [],
      future: [],
    });
  },

  selectCell: (cell) => set({ selectedCell: cell }),

  inputNumber: (num) => {
    const state = get();
    const { selectedCell, userGrid, givens, candidates, noteMode, puzzle } = state;
    if (selectedCell === null || !puzzle) return;
    if (givens[selectedCell] !== 0) return;

    const prev = snapshot(state);
    const errorCells = state.errorCells.filter((c) => c !== selectedCell);

    if (noteMode) {
      const newGrid = [...userGrid];
      if (newGrid[selectedCell] !== 0) newGrid[selectedCell] = 0;
      const newCands = cloneCands(candidates);
      const s = new Set(newCands[selectedCell]);
      if (s.has(num)) s.delete(num);
      else s.add(num);
      newCands[selectedCell] = s;
      set({
        userGrid: newGrid,
        candidates: newCands,
        errorCells,
        history: [...state.history, prev].slice(-50),
        future: [],
      });
      return;
    }

    const newGrid = [...userGrid];
    newGrid[selectedCell] = num;
    const newCands = cloneCands(candidates);
    newCands[selectedCell] = new Set();
    for (const peer of peerCells(selectedCell, puzzle.meta.size, puzzle.meta.boxRows, puzzle.meta.boxCols)) {
      if (newCands[peer]?.has(num)) {
        const next = new Set(newCands[peer]);
        next.delete(num);
        newCands[peer] = next;
      }
    }

    set({
      userGrid: newGrid,
      candidates: newCands,
      errorCells,
      history: [...state.history, prev].slice(-50),
      future: [],
    });
  },

  eraseCell: () => {
    const state = get();
    const { selectedCell, userGrid, givens, candidates } = state;
    if (selectedCell === null) return;
    if (givens[selectedCell] !== 0) return;
    if (userGrid[selectedCell] === 0 && candidates[selectedCell].size === 0) return;

    const prev = snapshot(state);
    const newGrid = [...userGrid];
    newGrid[selectedCell] = 0;
    const newCands = cloneCands(candidates);
    newCands[selectedCell] = new Set();
    const errorCells = state.errorCells.filter((c) => c !== selectedCell);

    set({
      userGrid: newGrid,
      candidates: newCands,
      errorCells,
      history: [...state.history, prev].slice(-50),
      future: [],
    });
  },

  toggleNoteMode: () => set((s) => ({ noteMode: !s.noteMode })),

  undo: () => {
    const state = get();
    if (state.history.length === 0) return;
    const prev = state.history[state.history.length - 1];
    const current = snapshot(state);
    set({
      userGrid: prev.userGrid,
      candidates: prev.candidates,
      errorCells: prev.errorCells,
      history: state.history.slice(0, -1),
      future: [current, ...state.future].slice(0, 50),
    });
  },

  redo: () => {
    const state = get();
    if (state.future.length === 0) return;
    const next = state.future[0];
    const current = snapshot(state);
    set({
      userGrid: next.userGrid,
      candidates: next.candidates,
      errorCells: next.errorCells,
      history: [...state.history, current],
      future: state.future.slice(1),
    });
  },

  useHint: () => {
    const state = get();
    const { userGrid, solution, givens, selectedCell, candidates } = state;
    if (!solution.length) return false;

    // 优先当前选中空格，否则找第一个空/错误格
    let target = selectedCell;
    if (target === null || givens[target] !== 0 || userGrid[target] === solution[target]) {
      target = userGrid.findIndex((v, i) => givens[i] === 0 && v !== solution[i]);
    }
    if (target < 0) return false;

    const prev = snapshot(state);
    const newGrid = [...userGrid];
    newGrid[target] = solution[target];
    const newCands = cloneCands(candidates);
    newCands[target] = new Set();
    const errorCells = state.errorCells.filter((c) => c !== target);

    set({
      userGrid: newGrid,
      candidates: newCands,
      selectedCell: target,
      errorCells,
      hintsUsed: state.hintsUsed + 1,
      history: [...state.history, prev].slice(-50),
      future: [],
    });
    return true;
  },

  checkBoard: () => {
    const { userGrid, solution, givens } = get();
    if (!userGrid.length) return { filled: false, correct: false, wrongCount: 0 };
    const filled = userGrid.every((v) => v !== 0);
    if (!filled) return { filled: false, correct: false, wrongCount: 0 };

    const wrongCells: number[] = [];
    if (solution.length === userGrid.length) {
      for (let i = 0; i < userGrid.length; i++) {
        if (givens[i] !== 0) continue;
        if (userGrid[i] !== solution[i]) wrongCells.push(i);
      }
    }

    if (wrongCells.length === 0) {
      set({ errorCells: [] });
      return { filled: true, correct: true, wrongCount: 0 };
    }

    set((s) => ({
      errorCells: wrongCells,
      mistakes: s.mistakes + 1,
    }));
    return { filled: true, correct: false, wrongCount: wrongCells.length };
  },

  isCellGiven: (cell) => get().givens[cell] !== 0,

  isFilled: () => {
    const { userGrid } = get();
    return userGrid.length > 0 && userGrid.every((v) => v !== 0);
  },

  isComplete: () => {
    const { userGrid, solution } = get();
    if (!userGrid.length || solution.length !== userGrid.length) return false;
    return userGrid.every((v, i) => v === solution[i]);
  },

  canUndo: () => get().history.length > 0,
  canRedo: () => get().future.length > 0,

  reset: () => set(emptyState()),
}));
