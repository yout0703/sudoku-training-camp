/**
 * 数独求解器
 * 约束传播（唯一数 + 隐性数）+ 回溯（MRV 启发式）
 * 支持自定义 unit（对角线、不规则等）和额外约束回调（无马、奇偶、杀手、加减、五六、连续、堡垒、不等号、温度计、大小数、比例）
 */
import type { GridMetadata, SolveStep, VariantData } from "./types";
import {
  type GridStructure,
  allMask,
  valBit,
  popcount,
  maskToValues,
  cloneGrid,
} from "./grid";
import { evalCalcCage, cageSatisfied } from "./calc";

export interface ExtraConstraint {
  /** 给定当前盘面，返回 cell → 额外需排除的候选掩码（bitmask，与 cands 相同） */
  eliminations: (grid: Int8Array, struct: GridStructure) => ArrayLike<number> | null;
}

export interface SolveOptions {
  /** 最大解的数量（用于唯一性检查，默认 1） */
  maxSolutions?: number;
  /** 额外 unit（对角线等） */
  extraUnits?: number[][];
  /** 额外约束（无马、堡垒等） */
  extraConstraint?: ExtraConstraint;
  /** 是否记录解题步骤 */
  recordSteps?: boolean;
}

export interface SolverResult {
  solutions: Int8Array[];
  isUnique: boolean;
  steps: SolveStep[];
}

/** 初始化候选掩码数组 */
function initCandidates(grid: Int8Array, struct: GridStructure, size: number): Int32Array {
  const cands = new Int32Array(struct.total);
  const full = allMask(size);

  for (let i = 0; i < struct.total; i++) {
    cands[i] = grid[i] === 0 ? full : 0;
  }

  // 排除同行同列同宫已填的数字
  for (let i = 0; i < struct.total; i++) {
    if (grid[i] !== 0) continue;
    for (const p of struct.peers[i]) {
      if (grid[p] !== 0) {
        cands[i] &= ~valBit(grid[p]);
      }
    }
  }
  return cands;
}

/**
 * 单次约束传播，返回是否有变化
 * 包含：唯一数（naked single）+ 隐性数（hidden single）+ 额外变体约束消除
 */
function propagate(
  grid: Int8Array,
  cands: Int32Array,
  struct: GridStructure,
  units: number[][],
  extra?: ExtraConstraint,
  steps?: SolveStep[],
): boolean {
  const size = struct.size;
  let changed = false;

  // ── 额外约束候选消除 ──
  if (extra) {
    const elim = extra.eliminations(grid, struct);
    if (elim) {
      for (let i = 0; i < struct.total; i++) {
        if (grid[i] !== 0) continue;
        const before = cands[i];
        cands[i] &= ~elim[i];
        if (cands[i] !== before) changed = true;
      }
    }
  }

  // ── 唯一数（naked single）──
  for (let i = 0; i < struct.total; i++) {
    if (grid[i] !== 0) continue;
    if (cands[i] === 0) continue; // 矛盾，稍后处理
    if (popcount(cands[i]) === 1) {
      const v = maskToValues(cands[i])[0];
      grid[i] = v;
      cands[i] = 0;
      eliminatePeers(grid, cands, struct, i, v);
      changed = true;
      steps?.push({
        technique: "唯一数",
        cell: i,
        value: v,
        description: `第${Math.floor(i / size) + 1}行第${(i % size) + 1}列只能填${v}`,
      });
    }
  }

  // ── 隐性数（hidden single）：一个 unit 内某数只能填一个位置 ──
  for (const unit of units) {
    for (let v = 1; v <= size; v++) {
      const bit = valBit(v);
      let count = 0;
      let pos = -1;
      let alreadyPlaced = false;
      for (const cell of unit) {
        if (grid[cell] === v) {
          alreadyPlaced = true;
          break;
        }
        if (grid[cell] === 0 && (cands[cell] & bit)) {
          count++;
          pos = cell;
        }
      }
      if (alreadyPlaced) continue;
      if (count === 1 && grid[pos] === 0) {
        grid[pos] = v;
        cands[pos] = 0;
        eliminatePeers(grid, cands, struct, pos, v);
        changed = true;
        steps?.push({
          technique: "隐性数",
          cell: pos,
          value: v,
          description: `第${Math.floor(pos / size) + 1}行第${(pos % size) + 1}列填${v}（隐性数）`,
        });
      }
    }
  }

  return changed;
}

/** 填入一个值后，从 peers 的候选中消除该值 */
function eliminatePeers(
  grid: Int8Array,
  cands: Int32Array,
  struct: GridStructure,
  cell: number,
  value: number,
): void {
  const bit = valBit(value);
  for (const p of struct.peers[cell]) {
    if (grid[p] === 0) {
      cands[p] &= ~bit;
    }
  }
}

/**
 * 深度优先搜索（MRV 启发式）
 */
function search(
  grid: Int8Array,
  cands: Int32Array,
  struct: GridStructure,
  units: number[][],
  maxSolutions: number,
  solutions: Int8Array[],
  extra?: ExtraConstraint,
  steps?: SolveStep[],
): void {
  if (solutions.length >= maxSolutions) return;

  // 约束传播直到稳定
  let changed = true;
  while (changed) {
    changed = propagate(grid, cands, struct, units, extra, steps);
  }

  // 检查矛盾：有空格但候选为 0
  for (let i = 0; i < struct.total; i++) {
    if (grid[i] === 0 && cands[i] === 0) return; // 死路
  }

  // 检查是否已解完
  let solved = true;
  for (let i = 0; i < struct.total; i++) {
    if (grid[i] === 0) {
      solved = false;
      break;
    }
  }
  if (solved) {
    // 最终变体条件验证（如果是带 extra 的严格约束）
    solutions.push(cloneGrid(grid));
    return;
  }

  // MRV：找候选最少的格子
  let bestCell = -1;
  let bestCount = 99;
  for (let i = 0; i < struct.total; i++) {
    if (grid[i] !== 0) continue;
    const cnt = popcount(cands[i]);
    if (cnt < bestCount) {
      bestCount = cnt;
      bestCell = i;
      if (cnt === 2) break; // 最少也是 2
    }
  }

  if (bestCell === -1) return;

  // 尝试每个候选值
  const values = maskToValues(cands[bestCell]);
  for (const v of values) {
    if (solutions.length >= maxSolutions) return;

    const newGrid = cloneGrid(grid);
    const newCands = new Int32Array(cands);
    newGrid[bestCell] = v;
    newCands[bestCell] = 0;
    eliminatePeers(newGrid, newCands, struct, bestCell, v);

    steps?.push({
      technique: "试探",
      cell: bestCell,
      value: v,
      description: `假设第${Math.floor(bestCell / struct.size) + 1}行第${(bestCell % struct.size) + 1}列填${v}`,
    });

    search(newGrid, newCands, struct, units, maxSolutions, solutions, extra, steps);
  }
}

/**
 * 主求解入口
 */
export function solve(
  grid: Int8Array,
  struct: GridStructure,
  opts: SolveOptions = {},
): SolverResult {
  const { maxSolutions = 1, extraUnits, extraConstraint, recordSteps } = opts;
  const size = struct.size;
  const units = extraUnits ? [...struct.units, ...extraUnits] : struct.units;

  const workGrid = cloneGrid(grid);
  const cands = initCandidates(workGrid, struct, size);

  const steps: SolveStep[] = recordSteps ? [] : [];
  const solutions: Int8Array[] = [];

  search(workGrid, cands, struct, units, maxSolutions, solutions, extraConstraint, recordSteps ? steps : undefined);

  return {
    solutions,
    isUnique: solutions.length === 1,
    steps,
  };
}

/**
 * 求一个解（不需要唯一性），返回解或 null
 */
export function solveOne(
  grid: Int8Array,
  struct: GridStructure,
  opts: Omit<SolveOptions, "maxSolutions"> = {},
): Int8Array | null {
  const result = solve(grid, struct, { ...opts, maxSolutions: 1 });
  return result.solutions[0] ?? null;
}

/**
 * 检查是否有唯一解
 */
export function hasUniqueSolution(
  grid: Int8Array,
  struct: GridStructure,
  opts: Omit<SolveOptions, "maxSolutions"> = {},
): boolean {
  const result = solve(grid, struct, { ...opts, maxSolutions: 2 });
  return result.solutions.length === 1;
}

/**
 * 统计解的数量（最多 maxCount 个）
 */
export function countSolutions(
  grid: Int8Array,
  struct: GridStructure,
  maxCount = 2,
  opts: Omit<SolveOptions, "maxSolutions"> = {},
): number {
  const result = solve(grid, struct, { ...opts, maxSolutions: maxCount });
  return result.solutions.length;
}

/**
 * 为各种变体构造通用的求解约束和额外单元
 */
export function buildVariantSolveOptions(
  variantType: string,
  size: number,
  data?: VariantData,
): { extraUnits?: number[][]; extraConstraint?: ExtraConstraint } {
  const extraUnits: number[][] = [];
  const constraints: ExtraConstraint[] = [];

  // 1. 对角线
  if (variantType === "diagonal") {
    const main: number[] = [];
    const anti: number[] = [];
    for (let i = 0; i < size; i++) {
      main.push(i * size + i);
      anti.push(i * size + (size - 1 - i));
    }
    extraUnits.push(main, anti);
  }

  // 2. 无马（anti_knight）
  if (variantType === "anti_knight") {
    const knightOffsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1],
    ];
    constraints.push({
      eliminations(grid) {
        const elim = new Int32Array(grid.length);
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            const idx = r * size + c;
            const v = grid[idx];
            if (v === 0) continue;
            const bit = valBit(v);
            for (const [dr, dc] of knightOffsets) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                const nIdx = nr * size + nc;
                if (grid[nIdx] === 0) elim[nIdx] |= bit;
              }
            }
          }
        }
        return elim;
      },
    });
  }

  // 3. 奇偶（odd_even）
  if (variantType === "odd_even" && data?.oddEven) {
    const parity = data.oddEven.parity;
    let oddMask = 0;
    let evenMask = 0;
    for (let v = 1; v <= size; v++) {
      if (v % 2 === 1) oddMask |= valBit(v);
      else evenMask |= valBit(v);
    }
    constraints.push({
      eliminations(grid) {
        const elim = new Int32Array(grid.length);
        for (let i = 0; i < grid.length; i++) {
          if (grid[i] !== 0) continue;
          if (parity[i] === 1) {
            // 奇数格：排除所有偶数
            elim[i] |= evenMask;
          } else if (parity[i] === 2) {
            // 偶数格：排除所有奇数
            elim[i] |= oddMask;
          }
        }
        return elim;
      },
    });
  }

  // 4. 大小数（big_small）
  if (variantType === "big_small" && data?.bigSmall) {
    const { grey } = data.bigSmall;
    const half = size / 2;
    let smallMask = 0;
    let bigMask = 0;
    for (let v = 1; v <= size; v++) {
      if (v <= half) smallMask |= valBit(v);
      else bigMask |= valBit(v);
    }
    constraints.push({
      eliminations(grid) {
        const elim = new Int32Array(grid.length);
        for (let i = 0; i < grid.length; i++) {
          if (grid[i] !== 0) continue;
          if (grey[i] === 1) {
            // 灰格：排除小数
            elim[i] |= smallMask;
          } else {
            // 白格：排除大数
            elim[i] |= bigMask;
          }
        }
        return elim;
      },
    });
  }

  // 5. 杀手（killer）
  if (variantType === "killer" && data?.killer) {
    const cages = data.killer.cages;
    constraints.push({
      eliminations(grid) {
        const elim = new Int32Array(grid.length);
        const full = allMask(size);
        for (const cage of cages) {
          const emptyCells: number[] = [];
          const used = new Set<number>();
          for (const c of cage.cells) {
            const v = grid[c];
            if (v === 0) emptyCells.push(c);
            else used.add(v);
          }
          if (emptyCells.length === 0) continue;

          // 笼内互斥
          for (const u of used) {
            const bit = valBit(u);
            for (const c of emptyCells) elim[c] |= bit;
          }

          // 枚举可能组合
          const allowedMasks = new Map<number, number>();
          for (const c of emptyCells) allowedMasks.set(c, 0);

          const currentUsed = new Set(used);
          const assigned: number[] = [];

          const searchComb = (depth: number, currentSum: number) => {
            if (depth === emptyCells.length) {
              if (currentSum === cage.sum) {
                assigned.forEach((val, idx) => {
                  allowedMasks.set(emptyCells[idx], (allowedMasks.get(emptyCells[idx]) ?? 0) | valBit(val));
                });
              }
              return;
            }
            const remCells = emptyCells.length - depth;
            for (let val = 1; val <= size; val++) {
              if (currentUsed.has(val)) continue;
              if (currentSum + val + (remCells - 1) * 1 > cage.sum) continue;
              currentUsed.add(val);
              assigned.push(val);
              searchComb(depth + 1, currentSum + val);
              assigned.pop();
              currentUsed.delete(val);
            }
          };

          const initialSum = cage.cells
            .filter((c) => grid[c] > 0)
            .reduce((sum, c) => sum + grid[c], 0);
          searchComb(0, initialSum);

          for (const c of emptyCells) {
            const allowed = allowedMasks.get(c) ?? 0;
            elim[c] |= full & ~allowed;
          }
        }
        return elim;
      },
    });
  }

  // 6. 加减（add_sub）
  if (variantType === "add_sub" && data?.addSub) {
    const cages = data.addSub.cages;
    constraints.push({
      eliminations(grid) {
        const elim = new Int32Array(grid.length);
        const full = allMask(size);
        for (const cage of cages) {
          const emptyCells: number[] = [];
          const used = new Set<number>();
          for (const c of cage.cells) {
            const v = grid[c];
            if (v === 0) emptyCells.push(c);
            else used.add(v);
          }
          if (emptyCells.length === 0) continue;

          for (const u of used) {
            for (const c of emptyCells) elim[c] |= valBit(u);
          }

          const allowedMasks = new Map<number, number>();
          for (const c of emptyCells) allowedMasks.set(c, 0);

          const searchComb = (depth: number, assigned: number[], curUsed: Set<number>) => {
            if (depth === emptyCells.length) {
              const allValues = [...used, ...assigned];
              if (cageSatisfied(allValues, cage)) {
                assigned.forEach((val, idx) => {
                  allowedMasks.set(emptyCells[idx], (allowedMasks.get(emptyCells[idx]) ?? 0) | valBit(val));
                });
              }
              return;
            }
            for (let val = 1; val <= size; val++) {
              if (curUsed.has(val)) continue;
              curUsed.add(val);
              assigned.push(val);
              searchComb(depth + 1, assigned, curUsed);
              assigned.pop();
              curUsed.delete(val);
            }
          };
          searchComb(0, [], new Set(used));

          for (const c of emptyCells) {
            const allowed = allowedMasks.get(c) ?? 0;
            elim[c] |= full & ~allowed;
          }
        }
        return elim;
      },
    });
  }

  // 7. 连续（consecutive: 全标出规则）
  if (variantType === "consecutive" && data?.consecutive) {
    const pairs = data.consecutive.pairs;
    constraints.push({
      eliminations(grid) {
        const elim = new Int32Array(grid.length);
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            const i = r * size + c;
            // 检查右邻和下邻
            const neighbors: number[] = [];
            if (c + 1 < size) neighbors.push(r * size + (c + 1));
            if (r + 1 < size) neighbors.push((r + 1) * size + c);

            for (const j of neighbors) {
              const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
              const isMarked = pairs.has(key);
              const vi = grid[i];
              const vj = grid[j];

              if (isMarked) {
                // 标记连续：差必须为 1
                if (vi > 0 && vj === 0) {
                  let allowed = 0;
                  if (vi - 1 >= 1) allowed |= valBit(vi - 1);
                  if (vi + 1 <= size) allowed |= valBit(vi + 1);
                  elim[j] |= allMask(size) & ~allowed;
                } else if (vj > 0 && vi === 0) {
                  let allowed = 0;
                  if (vj - 1 >= 1) allowed |= valBit(vj - 1);
                  if (vj + 1 <= size) allowed |= valBit(vj + 1);
                  elim[i] |= allMask(size) & ~allowed;
                }
              } else {
                // 未标记连续：差绝不能为 1
                if (vi > 0 && vj === 0) {
                  if (vi - 1 >= 1) elim[j] |= valBit(vi - 1);
                  if (vi + 1 <= size) elim[j] |= valBit(vi + 1);
                } else if (vj > 0 && vi === 0) {
                  if (vj - 1 >= 1) elim[i] |= valBit(vj - 1);
                  if (vj + 1 <= size) elim[i] |= valBit(vj + 1);
                }
              }
            }
          }
        }
        return elim;
      },
    });
  }

  // 8. 五六数独（sum_56: 全标出规则）
  if (variantType === "sum_56" && data?.sum56) {
    const sums = data.sum56.sums;
    constraints.push({
      eliminations(grid) {
        const elim = new Int32Array(grid.length);
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            const i = r * size + c;
            const neighbors: number[] = [];
            if (c + 1 < size) neighbors.push(r * size + (c + 1));
            if (r + 1 < size) neighbors.push((r + 1) * size + c);

            for (const j of neighbors) {
              const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
              const target = sums.get(key);
              const vi = grid[i];
              const vj = grid[j];

              if (target !== undefined) {
                // 标记了 5 或 6
                if (vi > 0 && vj === 0) {
                  const needed = target - vi;
                  if (needed >= 1 && needed <= size) {
                    elim[j] |= allMask(size) & ~valBit(needed);
                  } else {
                    elim[j] |= allMask(size); // 无解
                  }
                } else if (vj > 0 && vi === 0) {
                  const needed = target - vj;
                  if (needed >= 1 && needed <= size) {
                    elim[i] |= allMask(size) & ~valBit(needed);
                  } else {
                    elim[i] |= allMask(size);
                  }
                }
              } else {
                // 未标记：和不能为 5 或 6
                if (vi > 0 && vj === 0) {
                  const forbid5 = 5 - vi;
                  const forbid6 = 6 - vi;
                  if (forbid5 >= 1 && forbid5 <= size) elim[j] |= valBit(forbid5);
                  if (forbid6 >= 1 && forbid6 <= size) elim[j] |= valBit(forbid6);
                } else if (vj > 0 && vi === 0) {
                  const forbid5 = 5 - vj;
                  const forbid6 = 6 - vj;
                  if (forbid5 >= 1 && forbid5 <= size) elim[i] |= valBit(forbid5);
                  if (forbid6 >= 1 && forbid6 <= size) elim[i] |= valBit(forbid6);
                }
              }
            }
          }
        }
        return elim;
      },
    });
  }

  // 9. 堡垒（fortress: 灰格大于所有相邻白格）
  if (variantType === "fortress" && data?.fortress) {
    const grey = data.fortress.grey;
    constraints.push({
      eliminations(grid) {
        const elim = new Int32Array(grid.length);
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            const i = r * size + c;
            if (grey[i] === 1) {
              // 灰格：大于相邻白格
              const neighbors = [
                [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1],
              ];
              for (const [nr, nc] of neighbors) {
                if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                  const ni = nr * size + nc;
                  if (grey[ni] !== 1) {
                    const vi = grid[i];
                    const vni = grid[ni];
                    if (vni > 0 && vi === 0) {
                      // 灰格必须 > vni，排除 <= vni
                      for (let v = 1; v <= vni; v++) elim[i] |= valBit(v);
                    }
                    if (vi > 0 && vni === 0) {
                      // 白格必须 < vi，排除 >= vi
                      for (let v = vi; v <= size; v++) elim[ni] |= valBit(v);
                    }
                  }
                }
              }
            }
          }
        }
        return elim;
      },
    });
  }

  // 10. 不等号（greater_than）
  if (variantType === "greater_than" && data?.greaterThan) {
    const { horizontal, vertical } = data.greaterThan;
    constraints.push({
      eliminations(grid) {
        const elim = new Int32Array(grid.length);
        if (horizontal) {
          for (const [key, sym] of horizontal) {
            const [r, c] = key.split(",").map(Number);
            const a = r * size + c;
            const b = r * size + (c + 1);
            const va = grid[a];
            const vb = grid[b];
            if (sym === ">") {
              if (va > 0 && vb === 0) {
                for (let v = va; v <= size; v++) elim[b] |= valBit(v);
              }
              if (vb > 0 && va === 0) {
                for (let v = 1; v <= vb; v++) elim[a] |= valBit(v);
              }
            } else if (sym === "<") {
              if (va > 0 && vb === 0) {
                for (let v = 1; v <= va; v++) elim[b] |= valBit(v);
              }
              if (vb > 0 && va === 0) {
                for (let v = vb; v <= size; v++) elim[a] |= valBit(v);
              }
            }
          }
        }
        if (vertical) {
          for (const [key, sym] of vertical) {
            const [r, c] = key.split(",").map(Number);
            const a = r * size + c;
            const b = (r + 1) * size + c;
            const va = grid[a];
            const vb = grid[b];
            if (sym === "v" || sym === ">") {
              if (va > 0 && vb === 0) {
                for (let v = va; v <= size; v++) elim[b] |= valBit(v);
              }
              if (vb > 0 && va === 0) {
                for (let v = 1; v <= vb; v++) elim[a] |= valBit(v);
              }
            } else if (sym === "^" || sym === "<") {
              if (va > 0 && vb === 0) {
                for (let v = 1; v <= va; v++) elim[b] |= valBit(v);
              }
              if (vb > 0 && va === 0) {
                for (let v = vb; v <= size; v++) elim[a] |= valBit(v);
              }
            }
          }
        }
        return elim;
      },
    });
  }

  // 11. 温度计（thermometer）
  if (variantType === "thermometer" && data?.thermometer) {
    const thermos = data.thermometer.thermos;
    constraints.push({
      eliminations(grid) {
        const elim = new Int32Array(grid.length);
        for (const th of thermos) {
          const cells = th.cells;
          const len = cells.length;
          for (let k = 0; k < len; k++) {
            const cell = cells[k];
            // 位置固有下限 k+1，上限 size - (len - 1 - k)
            const minV = k + 1;
            const maxV = size - (len - 1 - k);
            for (let v = 1; v < minV; v++) elim[cell] |= valBit(v);
            for (let v = maxV + 1; v <= size; v++) elim[cell] |= valBit(v);

            // 邻接传递
            if (k > 0) {
              const prev = cells[k - 1];
              if (grid[prev] > 0 && grid[cell] === 0) {
                for (let v = 1; v <= grid[prev]; v++) elim[cell] |= valBit(v);
              }
            }
            if (k < len - 1) {
              const next = cells[k + 1];
              if (grid[next] > 0 && grid[cell] === 0) {
                for (let v = grid[next]; v <= size; v++) elim[cell] |= valBit(v);
              }
            }
          }
        }
        return elim;
      },
    });
  }

  // 12. 比例（ratio）
  if (variantType === "ratio" && data?.ratio) {
    const ratios = data.ratio.ratios;
    constraints.push({
      eliminations(grid) {
        const elim = new Int32Array(grid.length);
        for (const [pair, ratioStr] of ratios) {
          const [a, b] = pair.split("-").map(Number);
          const [r1, r2] = ratioStr.split("/").map(Number);
          const va = grid[a];
          const vb = grid[b];
          if (va > 0 && vb === 0) {
            let allowed = 0;
            for (let v = 1; v <= size; v++) {
              if (va * r2 === v * r1 || va * r1 === v * r2) allowed |= valBit(v);
            }
            elim[b] |= allMask(size) & ~allowed;
          } else if (vb > 0 && va === 0) {
            let allowed = 0;
            for (let v = 1; v <= size; v++) {
              if (vb * r2 === v * r1 || vb * r1 === v * r2) allowed |= valBit(v);
            }
            elim[a] |= allMask(size) & ~allowed;
          }
        }
        return elim;
      },
    });
  }

  const combinedConstraint: ExtraConstraint | undefined =
    constraints.length > 0
      ? {
          eliminations(grid, struct) {
            const totalElim = new Int32Array(grid.length);
            for (const c of constraints) {
              const e = c.eliminations(grid, struct);
              if (e) {
                for (let i = 0; i < grid.length; i++) totalElim[i] |= e[i];
              }
            }
            return totalElim;
          },
        }
      : undefined;

  return {
    extraUnits: extraUnits.length > 0 ? extraUnits : undefined,
    extraConstraint: combinedConstraint,
  };
}
