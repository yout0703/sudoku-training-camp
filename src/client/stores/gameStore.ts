/**
 * 游戏状态管理（Zustand）
 * 盘面、选中、候选数、错误、撤销/重做、提示
 */
import { create } from "zustand";
import type { PuzzleDTO } from "../../shared/api-types";

interface HistoryEntry {
  userGrid: number[];
  candidates: Set<number>[];
  mistakes: number;
  errorCells: number[];
}

interface GameStore {
  puzzle: PuzzleDTO | null;
  givens: number[];
  solution: number[];
  userGrid: number[];
  candidates: Set<number>[];
  selectedCell: number | null;
  noteMode: boolean;
  mistakes: number;
  hintsUsed: number;
  startTime: number;
  /** 当前标红的错误格 */
  errorCells: number[];
  /** 刚填错的高亮（短暂） */
  flashError: number | null;
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
  clearFlash: () => void;
  isCellGiven: (cell: number) => boolean;
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
  mistakes: number;
  errorCells: number[];
}): HistoryEntry {
  return {
    userGrid: [...s.userGrid],
    candidates: cloneCands(s.candidates),
    mistakes: s.mistakes,
    errorCells: [...s.errorCells],
  };
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
    flashError: null as number | null,
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
      flashError: null,
      history: [],
      future: [],
    });
  },

  selectCell: (cell) => set({ selectedCell: cell, flashError: null }),

  inputNumber: (num) => {
    const state = get();
    const { selectedCell, userGrid, givens, candidates, noteMode, puzzle, solution } = state;
    if (selectedCell === null || !puzzle) return;
    if (givens[selectedCell] !== 0) return;

    const prev = snapshot(state);

    if (noteMode) {
      const newCands = cloneCands(candidates);
      const s = new Set(newCands[selectedCell]);
      if (s.has(num)) s.delete(num);
      else s.add(num);
      newCands[selectedCell] = s;
      // 候选数不计入错误
      const newErrors = state.errorCells.filter((c) => c !== selectedCell);
      set({
        candidates: newCands,
        errorCells: newErrors,
        history: [...state.history, prev].slice(-50),
        future: [],
        flashError: null,
      });
      return;
    }

    const newGrid = [...userGrid];
    newGrid[selectedCell] = num;
    const newCands = cloneCands(candidates);
    newCands[selectedCell] = new Set();

    const correct = solution.length > 0 ? solution[selectedCell] === num : true;
    let mistakes = state.mistakes;
    let errorCells = state.errorCells.filter((c) => c !== selectedCell);
    let flashError: number | null = null;

    if (!correct) {
      mistakes += 1;
      if (!errorCells.includes(selectedCell)) errorCells = [...errorCells, selectedCell];
      flashError = selectedCell;
    }

    set({
      userGrid: newGrid,
      candidates: newCands,
      mistakes,
      errorCells,
      flashError,
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
      flashError: null,
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
      mistakes: prev.mistakes,
      errorCells: prev.errorCells,
      flashError: null,
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
      mistakes: next.mistakes,
      errorCells: next.errorCells,
      flashError: null,
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
      flashError: null,
      hintsUsed: state.hintsUsed + 1,
      history: [...state.history, prev].slice(-50),
      future: [],
    });
    return true;
  },

  clearFlash: () => set({ flashError: null }),

  isCellGiven: (cell) => get().givens[cell] !== 0,

  isComplete: () => {
    const { userGrid, solution } = get();
    if (!userGrid.length) return false;
    if (solution.length === userGrid.length) {
      return userGrid.every((v, i) => v === solution[i]);
    }
    return userGrid.every((v) => v !== 0);
  },

  canUndo: () => get().history.length > 0,
  canRedo: () => get().future.length > 0,

  reset: () => set(emptyState()),
}));
