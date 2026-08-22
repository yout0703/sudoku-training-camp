/**
 * 盘面验证器：检查行/列/宫及各类变体规则是否有冲突
 */
import type { GridStructure } from "./grid";
import type { VariantData } from "./types";
import { evalCalcCage } from "./calc";

/**
 * 检查基础盘面是否有冲突（已填数字在同行/列/宫中重复）
 * 不要求填满，只检查已有数字不冲突
 */
export function isValid(grid: ArrayLike<number>, struct: GridStructure): boolean {
  const size = struct.size;

  for (let i = 0; i < struct.total; i++) {
    if (grid[i] === 0) continue;
    const v = grid[i];
    if (v < 1 || v > size) return false;

    // 检查 peers 中是否有相同值
    for (const p of struct.peers[i]) {
      if (grid[p] === v) return false;
    }
  }
  return true;
}

/**
 * 检查盘面是否完全填满且无冲突（即已正确解出）
 */
export function isSolved(grid: ArrayLike<number>, struct: GridStructure): boolean {
  for (let i = 0; i < struct.total; i++) {
    if (grid[i] === 0) return false;
  }
  return isValid(grid, struct);
}

/**
 * 找出所有冲突的格子对
 */
export function findConflicts(grid: ArrayLike<number>, struct: GridStructure): [number, number][] {
  const conflicts: [number, number][] = [];
  const seen = new Set<string>();

  for (let i = 0; i < struct.total; i++) {
    if (grid[i] === 0) continue;
    for (const p of struct.peers[i]) {
      if (grid[p] === grid[i]) {
        const key = i < p ? `${i}-${p}` : `${p}-${i}`;
        if (!seen.has(key)) {
          seen.add(key);
          conflicts.push([Math.min(i, p), Math.max(i, p)]);
        }
      }
    }
  }
  return conflicts;
}

/**
 * 变体规则全面校验结果
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * 对完整解（或盘面）进行变体规则的严格校验
 */
export function validateVariantRules(
  grid: ArrayLike<number>,
  size: number,
  variantType: string,
  data?: VariantData,
  struct?: GridStructure,
): ValidationResult {
  const errors: string[] = [];

  // 1. 基础行/列校验
  for (let r = 0; r < size; r++) {
    const seen = new Set<number>();
    for (let c = 0; c < size; c++) {
      const v = grid[r * size + c];
      if (v > 0) {
        if (seen.has(v)) errors.push(`第 ${r + 1} 行存在重复数字 ${v}`);
        seen.add(v);
      }
    }
  }

  for (let c = 0; c < size; c++) {
    const seen = new Set<number>();
    for (let r = 0; r < size; r++) {
      const v = grid[r * size + c];
      if (v > 0) {
        if (seen.has(v)) errors.push(`第 ${c + 1} 列存在重复数字 ${v}`);
        seen.add(v);
      }
    }
  }

  // 2. 宫校验（不规则或标准）
  if (variantType === "irregular" && data?.irregular) {
    const boxMap = new Map<number, number[]>();
    for (let i = 0; i < size * size; i++) {
      const b = data.irregular.boxOf[i];
      if (!boxMap.has(b)) boxMap.set(b, []);
      boxMap.get(b)!.push(grid[i]);
    }
    for (const [boxIdx, vals] of boxMap) {
      const seen = new Set<number>();
      for (const v of vals) {
        if (v > 0) {
          if (seen.has(v)) errors.push(`不规则宫 ${boxIdx + 1} 存在重复数字 ${v}`);
          seen.add(v);
        }
      }
    }
  } else if (struct) {
    for (let b = 0; b < struct.boxes.length; b++) {
      const seen = new Set<number>();
      for (const cell of struct.boxes[b]) {
        const v = grid[cell];
        if (v > 0) {
          if (seen.has(v)) errors.push(`第 ${b + 1} 宫存在重复数字 ${v}`);
          seen.add(v);
        }
      }
    }
  }

  // 3. 对角线
  if (variantType === "diagonal") {
    const mainSeen = new Set<number>();
    const antiSeen = new Set<number>();
    for (let i = 0; i < size; i++) {
      const v1 = grid[i * size + i];
      if (v1 > 0) {
        if (mainSeen.has(v1)) errors.push(`主对角线存在重复数字 ${v1}`);
        mainSeen.add(v1);
      }
      const v2 = grid[i * size + (size - 1 - i)];
      if (v2 > 0) {
        if (antiSeen.has(v2)) errors.push(`副对角线存在重复数字 ${v2}`);
        antiSeen.add(v2);
      }
    }
  }

  // 4. 无马数独（anti_knight）
  if (variantType === "anti_knight") {
    const knightOffsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1],
    ];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const idx = r * size + c;
        const v = grid[idx];
        if (v === 0) continue;
        for (const [dr, dc] of knightOffsets) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
            const nIdx = nr * size + nc;
            if (nIdx > idx && grid[nIdx] === v) {
              errors.push(`位置 (${r + 1},${c + 1}) 与马步位置 (${nr + 1},${nc + 1}) 均填入 ${v}，违反无马规则`);
            }
          }
        }
      }
    }
  }

  // 5. 奇偶（odd_even）
  if (variantType === "odd_even" && data?.oddEven) {
    const parity = data.oddEven.parity;
    for (let i = 0; i < size * size; i++) {
      const v = grid[i];
      if (v === 0) continue;
      const p = parity[i];
      if (p === 1 && v % 2 !== 1) {
        errors.push(`第 ${Math.floor(i / size) + 1} 行第 ${(i % size) + 1} 列应为奇数，实际填入 ${v}`);
      } else if (p === 2 && v % 2 !== 0) {
        errors.push(`第 ${Math.floor(i / size) + 1} 行第 ${(i % size) + 1} 列应为偶数，实际填入 ${v}`);
      }
    }
  }

  // 6. 杀手（killer）
  if (variantType === "killer" && data?.killer) {
    for (let ci = 0; ci < data.killer.cages.length; ci++) {
      const cage = data.killer.cages[ci];
      const vals = cage.cells.map((c) => grid[c]);
      const nonZero = vals.filter((v) => v > 0);
      const seen = new Set<number>();
      for (const v of nonZero) {
        if (seen.has(v)) {
          errors.push(`杀手笼 ${ci + 1} 内部出现重复数字 ${v}`);
        }
        seen.add(v);
      }
      if (vals.every((v) => v > 0)) {
        const sum = vals.reduce((a, b) => a + b, 0);
        if (sum !== cage.sum) {
          errors.push(`杀手笼 ${ci + 1} 实际和为 ${sum}，与目标值 ${cage.sum} 不符`);
        }
      }
    }
  }

  // 7. 加减（add_sub）
  if (variantType === "add_sub" && data?.addSub) {
    for (let ci = 0; ci < data.addSub.cages.length; ci++) {
      const cage = data.addSub.cages[ci];
      const vals = cage.cells.map((c) => grid[c]);
      if (vals.every((v) => v > 0)) {
        if (new Set(vals).size !== vals.length) {
          errors.push(`加减笼 ${ci + 1} 内部数字重复`);
        }
        const calc = evalCalcCage(vals, cage.op);
        if (calc !== cage.target) {
          errors.push(`加减笼 ${ci + 1} 运算结果为 ${calc}，与目标 ${cage.target}${cage.op} 不符`);
        }
      }
    }
  }

  // 8. 连续（consecutive: 全标出规则）
  if (variantType === "consecutive" && data?.consecutive) {
    const pairs = data.consecutive.pairs;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const i = r * size + c;
        const vi = grid[i];
        if (vi === 0) continue;
        // 右邻居
        if (c + 1 < size) {
          const j = r * size + (c + 1);
          const vj = grid[j];
          if (vj > 0) {
            const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
            const isConsec = Math.abs(vi - vj) === 1;
            const hasMark = pairs.has(key);
            if (hasMark && !isConsec) {
              errors.push(`标记为连续的相邻格 (${r + 1},${c + 1}) 与 (${r + 1},${c + 2}) 差值不为 1`);
            } else if (!hasMark && isConsec) {
              errors.push(`未标记连续的相邻格 (${r + 1},${c + 1}) 与 (${r + 1},${c + 2}) 差值为 1，违反全标出规则`);
            }
          }
        }
        // 下邻居
        if (r + 1 < size) {
          const j = (r + 1) * size + c;
          const vj = grid[j];
          if (vj > 0) {
            const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
            const isConsec = Math.abs(vi - vj) === 1;
            const hasMark = pairs.has(key);
            if (hasMark && !isConsec) {
              errors.push(`标记为连续的相邻格 (${r + 1},${c + 1}) 与 (${r + 2},${c + 1}) 差值不为 1`);
            } else if (!hasMark && isConsec) {
              errors.push(`未标记连续的相邻格 (${r + 1},${c + 1}) 与 (${r + 2},${c + 1}) 差值为 1，违反全标出规则`);
            }
          }
        }
      }
    }
  }

  // 9. 五六数独（sum_56: 全标出规则）
  if (variantType === "sum_56" && data?.sum56) {
    const sums = data.sum56.sums;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const i = r * size + c;
        const vi = grid[i];
        if (vi === 0) continue;
        // 右邻居
        if (c + 1 < size) {
          const j = r * size + (c + 1);
          const vj = grid[j];
          if (vj > 0) {
            const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
            const s = vi + vj;
            const targetSum = sums.get(key);
            if (targetSum !== undefined && s !== targetSum) {
              errors.push(`标记和为 ${targetSum} 的相邻格 (${r + 1},${c + 1}) 与 (${r + 1},${c + 2}) 实际和为 ${s}`);
            } else if (targetSum === undefined && (s === 5 || s === 6)) {
              errors.push(`未标记圆圈的相邻格 (${r + 1},${c + 1}) 与 (${r + 1},${c + 2}) 和为 ${s}，违反五六数独规则`);
            }
          }
        }
        // 下邻居
        if (r + 1 < size) {
          const j = (r + 1) * size + c;
          const vj = grid[j];
          if (vj > 0) {
            const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
            const s = vi + vj;
            const targetSum = sums.get(key);
            if (targetSum !== undefined && s !== targetSum) {
              errors.push(`标记和为 ${targetSum} 的相邻格 (${r + 1},${c + 1}) 与 (${r + 2},${c + 1}) 实际和为 ${s}`);
            } else if (targetSum === undefined && (s === 5 || s === 6)) {
              errors.push(`未标记圆圈的相邻格 (${r + 1},${c + 1}) 与 (${r + 2},${c + 1}) 和为 ${s}，违反五六数独规则`);
            }
          }
        }
      }
    }
  }

  // 10. 堡垒（fortress: 灰格大于正交相邻白格）
  if (variantType === "fortress" && data?.fortress) {
    const grey = data.fortress.grey;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const i = r * size + c;
        if (grey[i] === 1 && grid[i] > 0) {
          const gVal = grid[i];
          const neighbors = [
            [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1],
          ];
          for (const [nr, nc] of neighbors) {
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
              const ni = nr * size + nc;
              if (grey[ni] !== 1 && grid[ni] > 0) {
                if (gVal <= grid[ni]) {
                  errors.push(`堡垒灰格 (${r + 1},${c + 1}) 的值 ${gVal} 未大于相邻白格 (${nr + 1},${nc + 1}) 的值 ${grid[ni]}`);
                }
              }
            }
          }
        }
      }
    }
  }

  // 11. 大小数（big_small）
  if (variantType === "big_small" && data?.bigSmall) {
    const { grey } = data.bigSmall;
    const half = size / 2;
    for (let i = 0; i < size * size; i++) {
      const v = grid[i];
      if (v === 0) continue;
      if (grey[i] === 1 && v <= half) {
        errors.push(`第 ${Math.floor(i / size) + 1} 行第 ${(i % size) + 1} 列为灰格，只能填大数（>${half}），实际填入 ${v}`);
      } else if (grey[i] === 0 && v > half) {
        errors.push(`第 ${Math.floor(i / size) + 1} 行第 ${(i % size) + 1} 列为白格，只能填小数（<=${half}），实际填入 ${v}`);
      }
    }
  }

  // 12. 不等号（greater_than）
  if (variantType === "greater_than" && data?.greaterThan) {
    const { horizontal, vertical } = data.greaterThan;
    if (horizontal) {
      for (const [key, sym] of horizontal) {
        const [r, c] = key.split(",").map(Number);
        const left = grid[r * size + c];
        const right = grid[r * size + (c + 1)];
        if (left > 0 && right > 0) {
          if (sym === ">" && left <= right) {
            errors.push(`位置 (${r + 1},${c + 1}) [${left}] 未大于 (${r + 1},${c + 2}) [${right}]`);
          } else if (sym === "<" && left >= right) {
            errors.push(`位置 (${r + 1},${c + 1}) [${left}] 未小于 (${r + 1},${c + 2}) [${right}]`);
          }
        }
      }
    }
    if (vertical) {
      for (const [key, sym] of vertical) {
        const [r, c] = key.split(",").map(Number);
        const top = grid[r * size + c];
        const down = grid[(r + 1) * size + c];
        if (top > 0 && down > 0) {
          if ((sym === "v" || sym === ">") && top <= down) {
            errors.push(`位置 (${r + 1},${c + 1}) [${top}] 未大于 (${r + 2},${c + 1}) [${down}]`);
          } else if ((sym === "^" || sym === "<") && top >= down) {
            errors.push(`位置 (${r + 1},${c + 1}) [${top}] 未小于 (${r + 2},${c + 1}) [${down}]`);
          }
        }
      }
    }
  }

  // 13. 温度计（thermometer）
  if (variantType === "thermometer" && data?.thermometer) {
    for (let ti = 0; ti < data.thermometer.thermos.length; ti++) {
      const thermo = data.thermometer.thermos[ti];
      for (let k = 0; k < thermo.cells.length - 1; k++) {
        const a = grid[thermo.cells[k]];
        const b = grid[thermo.cells[k + 1]];
        if (a > 0 && b > 0 && a >= b) {
          errors.push(`温度计 ${ti + 1} 路径上未严格递增：${a} >= ${b}`);
        }
      }
    }
  }

  // 14. 比例（ratio）
  if (variantType === "ratio" && data?.ratio) {
    for (const [pair, ratioStr] of data.ratio.ratios) {
      const [i, j] = pair.split("-").map(Number);
      const vi = grid[i];
      const vj = grid[j];
      if (vi > 0 && vj > 0) {
        const [nr1, nr2] = ratioStr.split("/").map(Number);
        // 允许顺序 vi:vj = nr1:nr2 或者 vj:vi = nr1:nr2
        const match = (vi * nr2 === vj * nr1) || (vi * nr1 === vj * nr2);
        if (!match) {
          errors.push(`相邻格比例不匹配：实际为 ${vi}:${vj}，要求为 ${ratioStr}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
