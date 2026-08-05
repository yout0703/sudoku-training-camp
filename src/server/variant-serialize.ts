/**
 * 变体数据序列化：Set/Map → JSON 友好结构
 */
import type { VariantData } from "../engine";

export function serializeVariantData(data: VariantData | undefined | null): unknown {
  if (!data) return null;
  const out: Record<string, unknown> = { ...data };

  if (data.consecutive?.pairs) {
    out.consecutive = {
      pairs: Array.from(data.consecutive.pairs),
    };
  }
  if (data.sum56?.sums) {
    out.sum56 = {
      sums: Object.fromEntries(data.sum56.sums),
    };
  }
  if (data.greaterThan) {
    out.greaterThan = {
      horizontal: Object.fromEntries(data.greaterThan.horizontal),
      vertical: Object.fromEntries(data.greaterThan.vertical),
    };
  }
  if (data.irregular) {
    out.irregular = {
      boxOf: Array.from(data.irregular.boxOf),
      boxCells: data.irregular.boxCells,
    };
  }
  if (data.oddEven) {
    out.oddEven = { parity: Array.from(data.oddEven.parity) };
  }
  if (data.fortress) {
    out.fortress = { grey: Array.from(data.fortress.grey) };
  }
  if (data.bigSmall) {
    out.bigSmall = {
      grey: Array.from(data.bigSmall.grey),
      bigValues: data.bigSmall.bigValues,
      smallValues: data.bigSmall.smallValues,
    };
  }
  if (data.ratio) {
    out.ratio = {
      ratios: Object.fromEntries(data.ratio.ratios),
    };
  }

  return out;
}

/** 客户端/服务端统一解析 */
export function normalizeVariantData(raw: unknown): VariantData {
  if (!raw || typeof raw !== "object") return {};
  const d = raw as Record<string, any>;
  const out: VariantData = {};

  if (d.irregular) {
    out.irregular = {
      boxOf: Int8Array.from(d.irregular.boxOf ?? []),
      boxCells: d.irregular.boxCells ?? [],
    };
  }
  if (d.killer) out.killer = d.killer;
  if (d.oddEven) {
    out.oddEven = { parity: Int8Array.from(d.oddEven.parity ?? []) };
  }
  if (d.consecutive) {
    const pairs = d.consecutive.pairs;
    out.consecutive = {
      pairs: new Set(Array.isArray(pairs) ? pairs : Object.keys(pairs ?? {})),
    };
  }
  if (d.fortress) {
    out.fortress = { grey: Int8Array.from(d.fortress.grey ?? []) };
  }
  if (d.sum56) {
    const sums = d.sum56.sums;
    out.sum56 = {
      sums: new Map(
        Array.isArray(sums)
          ? sums
          : Object.entries(sums ?? {}).map(([k, v]) => [k, Number(v)]),
      ),
    };
  }
  if (d.thermometer) out.thermometer = d.thermometer;
  if (d.greaterThan) {
    out.greaterThan = {
      horizontal: new Map(Object.entries(d.greaterThan.horizontal ?? {})),
      vertical: new Map(Object.entries(d.greaterThan.vertical ?? {})),
    };
  }
  if (d.bigSmall) {
    out.bigSmall = {
      grey: Int8Array.from(d.bigSmall.grey ?? []),
      bigValues: d.bigSmall.bigValues ?? [],
      smallValues: d.bigSmall.smallValues ?? [],
    };
  }
  if (d.extraRegion) out.extraRegion = d.extraRegion;
  if (d.arrow) out.arrow = d.arrow;
  if (d.ratio) {
    const ratios = d.ratio.ratios;
    out.ratio = {
      ratios: new Map(
        Object.entries(ratios ?? {}).map(([k, v]) => [k, String(v)]),
      ),
    };
  }

  return out;
}
