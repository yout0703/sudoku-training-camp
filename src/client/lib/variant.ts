/**
 * 客户端变体数据归一化（兼容 JSON 反序列化后的 Array/Object）
 */
import type {
  VariantData,
  ConsecutiveData,
  Sum56Data,
  GreaterThanData,
  BigSmallData,
  RatioData,
  IrregularData,
  OddEvenData,
  FortressData,
  CalcData,
} from "../../engine";

export function normalizeVariantData(raw: unknown): VariantData {
  if (!raw || typeof raw !== "object") return {};
  const d = raw as Record<string, any>;
  const out: VariantData = {};

  if (d.irregular) {
    out.irregular = {
      boxOf: Int8Array.from(d.irregular.boxOf ?? []),
      boxCells: d.irregular.boxCells ?? [],
    } as IrregularData;
  }
  if (d.killer) out.killer = d.killer;
  if (d.oddEven) {
    out.oddEven = { parity: Int8Array.from(d.oddEven.parity ?? []) } as OddEvenData;
  }
  if (d.consecutive) {
    const pairs = d.consecutive.pairs;
    out.consecutive = {
      pairs: new Set(Array.isArray(pairs) ? pairs : Object.keys(pairs ?? {})),
    } as ConsecutiveData;
  }
  if (d.fortress) {
    out.fortress = { grey: Int8Array.from(d.fortress.grey ?? []) } as FortressData;
  }
  if (d.sum56) {
    const sums = d.sum56.sums;
    out.sum56 = {
      sums: new Map(
        Array.isArray(sums)
          ? sums
          : Object.entries(sums ?? {}).map(([k, v]) => [k, Number(v)]),
      ),
    } as Sum56Data;
  }
  if (d.thermometer) out.thermometer = d.thermometer;
  if (d.greaterThan) {
    out.greaterThan = {
      horizontal: new Map(Object.entries(d.greaterThan.horizontal ?? {})),
      vertical: new Map(Object.entries(d.greaterThan.vertical ?? {})),
    } as GreaterThanData;
  }
  if (d.bigSmall) {
    out.bigSmall = {
      grey: Int8Array.from(d.bigSmall.grey ?? []),
      bigValues: d.bigSmall.bigValues ?? [],
      smallValues: d.bigSmall.smallValues ?? [],
    } as BigSmallData;
  }
  if (d.extraRegion) out.extraRegion = d.extraRegion;
  if (d.arrow) out.arrow = d.arrow;
  if (d.ratio) {
    const ratios = d.ratio.ratios;
    out.ratio = {
      ratios: new Map(Object.entries(ratios ?? {}).map(([k, v]) => [k, String(v)])),
    } as RatioData;
  }
  if (d.addSub) {
    out.addSub = {
      cages: Array.isArray(d.addSub.cages)
        ? d.addSub.cages.map((c: { cells?: number[]; target?: number; op?: string }) => ({
            cells: Array.isArray(c.cells) ? c.cells.map(Number) : [],
            target: Number(c.target),
            op: c.op === "-" ? "-" : "+",
          }))
        : [],
    } as CalcData;
  }

  return out;
}
