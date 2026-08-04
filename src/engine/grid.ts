/**
 * 盘面网格工具函数
 * 提供 index/coord 转换、unit（行/列/宫）成员计算、peer 计算
 */
import type { GridMetadata } from "./types";

/** 全部值的掩码：size=9 → 0x1FF, size=6 → 0x3F, size=4 → 0xF */
export function allMask(size: number): number {
  return (1 << size) - 1;
}

/** value(1..N) → bitmask */
export function valBit(value: number): number {
  return 1 << (value - 1);
}

/** 统计掩码中 1 的个数（候选数） */
export function popcount(n: number): number {
  let c = 0;
  while (n) {
    n &= n - 1;
    c++;
  }
  return c;
}

/** 从掩码中提取所有 value */
export function maskToValues(mask: number): number[] {
  const vals: number[] = [];
  let bit = 1;
  let v = 1;
  while (mask) {
    if (mask & bit) vals.push(v);
    mask &= ~bit;
    bit <<= 1;
    v++;
  }
  return vals;
}

/** 索引 → 坐标 */
export function indexToCoord(idx: number, size: number): [number, number] {
  return [Math.floor(idx / size), idx % size];
}

/** 坐标 → 索引 */
export function coordToIndex(row: number, col: number, size: number): number {
  return row * size + col;
}

/**
 * 预计算盘面的结构信息：每个 unit 的成员索引列表
 * unit = 一行 / 一列 / 一宫
 */
export interface GridStructure {
  size: number;
  total: number;
  rows: number[][];
  cols: number[][];
  boxes: number[][];
  /** 每个格子的 box index */
  boxOf: Int8Array;
  /** 每个格子的 peers（同行同列同宫，排除自己） */
  peers: number[][];
  /** 所有 unit 的合集 */
  units: number[][];
}

/** 构建盘面结构（预计算，缓存复用） */
export function buildStructure(meta: GridMetadata): GridStructure {
  const { size, boxRows, boxCols } = meta;
  const total = size * size;
  const boxesPerRow = size / boxCols;
  const boxesPerCol = size / boxRows;

  const rows: number[][] = [];
  const cols: number[][] = [];
  const boxes: number[][] = [];
  const boxOf = new Int8Array(total);

  for (let r = 0; r < size; r++) {
    const row: number[] = [];
    for (let c = 0; c < size; c++) {
      row.push(r * size + c);
    }
    rows.push(row);
  }

  for (let c = 0; c < size; c++) {
    const col: number[] = [];
    for (let r = 0; r < size; r++) {
      col.push(r * size + c);
    }
    cols.push(col);
  }

  for (let br = 0; br < boxesPerCol; br++) {
    for (let bc = 0; bc < boxesPerRow; bc++) {
      const box: number[] = [];
      for (let r = br * boxRows; r < (br + 1) * boxRows; r++) {
        for (let c = bc * boxCols; c < (bc + 1) * boxCols; c++) {
          const idx = r * size + c;
          box.push(idx);
          boxOf[idx] = br * boxesPerRow + bc;
        }
      }
      boxes.push(box);
    }
  }

  // peers
  const peers: number[][] = [];
  for (let i = 0; i < total; i++) {
    const [r, c] = indexToCoord(i, size);
    const b = boxOf[i];
    const peerSet = new Set<number>();
    for (let k = 0; k < size; k++) {
      peerSet.add(r * size + k); // same row
      peerSet.add(k * size + c); // same col
    }
    for (const cell of boxes[b]) {
      peerSet.add(cell);
    }
    peerSet.delete(i);
    peers.push([...peerSet]);
  }

  const units = [...rows, ...cols, ...boxes];

  return { size, total, rows, cols, boxes, boxOf, peers, units };
}

/** 构建不规则宫的盘面结构 */
export function buildIrregularStructure(
  meta: GridMetadata,
  irregularBoxOf: Int8Array,
): GridStructure {
  const { size } = meta;
  const total = size * size;

  const rows: number[][] = [];
  const cols: number[][] = [];
  for (let r = 0; r < size; r++) {
    rows.push(Array.from({ length: size }, (_, c) => r * size + c));
  }
  for (let c = 0; c < size; c++) {
    cols.push(Array.from({ length: size }, (_, r) => r * size + c));
  }

  // group cells by box index
  const boxMap = new Map<number, number[]>();
  for (let i = 0; i < total; i++) {
    const b = irregularBoxOf[i];
    if (!boxMap.has(b)) boxMap.set(b, []);
    boxMap.get(b)!.push(i);
  }
  const boxes = [...boxMap.values()];

  const peers: number[][] = [];
  for (let i = 0; i < total; i++) {
    const [r, c] = indexToCoord(i, size);
    const b = irregularBoxOf[i];
    const peerSet = new Set<number>();
    for (let k = 0; k < size; k++) {
      peerSet.add(r * size + k);
      peerSet.add(k * size + c);
    }
    for (const cell of boxMap.get(b)!) {
      peerSet.add(cell);
    }
    peerSet.delete(i);
    peers.push([...peerSet]);
  }

  const units = [...rows, ...cols, ...boxes];
  return { size, total, rows, cols, boxes, boxOf: irregularBoxOf, peers, units };
}

/** 创建空盘面 */
export function createGrid(total: number): Int8Array {
  return new Int8Array(total);
}

/** 从数组创建盘面 */
export function gridFromArray(arr: number[]): Int8Array {
  return Int8Array.from(arr);
}

/** 复制盘面 */
export function cloneGrid(grid: Int8Array): Int8Array {
  return new Int8Array(grid);
}

/** 检查是否所有格子都已填满 */
export function isGridFull(grid: Int8Array): boolean {
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === 0) return false;
  }
  return true;
}

/** 格式化为字符串（调试用） */
export function gridToString(grid: Int8Array, size: number): string {
  const lines: string[] = [];
  for (let r = 0; r < size; r++) {
    const cells: string[] = [];
    for (let c = 0; c < size; c++) {
      const v = grid[r * size + c];
      cells.push(v === 0 ? "." : String(v));
    }
    lines.push(cells.join(" "));
  }
  return lines.join("\n");
}
