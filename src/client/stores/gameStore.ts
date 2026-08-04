/**
 * 游戏状态管理（Zustand）
 * 管理当前盘面、选中格子、候选数、错误、计时
 */
import { create } from "zustand";
import type { PuzzleDTO } from "../../shared/api-types";

interface GameStore {
  // 题目数据
  puzzle: PuzzleDTO | null;
  givens: number[]; // 初始提示（不可修改）
  solution: number[];
  userGrid: number[]; // 用户当前盘面
  candidates: Set<number>[]; // 每格的候选数
  // UI 状态
  selectedCell: number | null;
  noteMode: boolean; // 候选数模式
  mistakes: number;
  hintsUsed: number;
  startTime: number;
  // 设置题目
  loadPuzzle: (puzzle: PuzzleDTO) => void;
  // 交互
  selectCell: (cell: number | null) => void;
  inputNumber: (num: number) => void;
  eraseCell: () => void;
  toggleNoteMode: () => void;
  // 检查
  isCellGiven: (cell: number) => boolean;
  isCellCorrect: (cell: number) => boolean;
  isComplete: () => boolean;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  puzzle: null,
  givens: [],
  solution: [],
  userGrid: [],
  candidates: [],
  selectedCell: null,
  noteMode: false,
  mistakes: 0,
  hintsUsed: 0,
  startTime: 0,

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
    });
  },

  selectCell: (cell) => set({ selectedCell: cell }),

  inputNumber: (num) => {
    const { selectedCell, userGrid, givens, candidates, noteMode, puzzle } = get();
    if (selectedCell === null || !puzzle) return;
    if (givens[selectedCell] !== 0) return; // 不能修改提示数

    if (noteMode) {
      // 候选数模式：切换
      const newCands = [...candidates];
      const s = new Set(newCands[selectedCell]);
      if (s.has(num)) s.delete(num);
      else s.add(num);
      newCands[selectedCell] = s;
      set({ candidates: newCands });
    } else {
      // 填数模式
      const newGrid = [...userGrid];
      newGrid[selectedCell] = num;
      // 清除该格的候选数
      const newCands = [...candidates];
      newCands[selectedCell] = new Set<number>();
      set({ userGrid: newGrid, candidates: newCands });
    }
  },

  eraseCell: () => {
    const { selectedCell, userGrid, givens, candidates } = get();
    if (selectedCell === null) return;
    if (givens[selectedCell] !== 0) return;

    const newGrid = [...userGrid];
    newGrid[selectedCell] = 0;
    const newCands = [...candidates];
    newCands[selectedCell] = new Set<number>();
    set({ userGrid: newGrid, candidates: newCands });
  },

  toggleNoteMode: () => set((s) => ({ noteMode: !s.noteMode })),

  isCellGiven: (cell) => get().givens[cell] !== 0,

  isCellCorrect: (cell) => {
    const { userGrid, puzzle } = get();
    if (!puzzle) return true;
    // 不做前端验证（解答不在前端），只检查是否填满
    return userGrid[cell] !== 0;
  },

  isComplete: () => {
    const { userGrid } = get();
    return userGrid.every((v) => v !== 0);
  },

  reset: () =>
    set({
      puzzle: null,
      givens: [],
      solution: [],
      userGrid: [],
      candidates: [],
      selectedCell: null,
      noteMode: false,
      mistakes: 0,
      hintsUsed: 0,
      startTime: 0,
    }),
}));
