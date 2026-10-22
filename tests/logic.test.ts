import { describe, expect, it } from 'vitest';
import { normalizeSelection, optionBlockedReason, quote } from '../src/lib/menu';
import { checkSlot, closedReason, dateBlockedReason, slotsFor, toMin, type Booked } from '../src/lib/schedule';
import { createSeed } from '../src/lib/store';

// 2026-10-22 は木曜日（水野は休み）。2026-10-23 金曜日で検証する。
const NOW = { date: '2026-10-22', minutes: 8 * 60 };
const FRI = '2026-10-23';

const b = (p: Partial<Booked> & Pick<Booked, 'staffId' | 'start' | 'end'>): Booked => ({
  id: Math.random().toString(36),
  date: FRI,
  usesSpaRoom: false,
  status: 'confirmed',
  ...p,
});

describe('料金計算', () => {
  it('カット＋カラー＋トリートメント = 13,200円 / 150分', () => {
    const q = quote({ baseId: 'cut-color', optionIds: ['treatment'] });
    expect(q.total).toBe(13200);
    expect(q.minutes).toBe(150);
  });

  it('指名料は1回だけ加算、指名なしは0円', () => {
    expect(quote({ baseId: 'cut-color', optionIds: ['treatment'] }, 1100).total).toBe(14300);
    expect(quote({ baseId: 'cut-color', optionIds: ['treatment'] }, 0).total).toBe(13200);
  });

  it('同じオプションの重複・不適切な組み合わせを除外する', () => {
    const { selection, removed } = normalizeSelection({ baseId: 'spa', optionIds: ['spa-add', 'treatment', 'treatment'] });
    expect(selection.optionIds).toEqual(['treatment']);
    expect(removed.map((r) => r.id)).toEqual(['spa-add']);
    expect(optionBlockedReason('kids-cut', 'treatment')).not.toBeNull();
    expect(optionBlockedReason('cut', 'spa-add')).toBeNull();
  });

  it('基本メニュー未選択では予約に進めない', () => {
    const q = quote({ baseId: null, optionIds: ['treatment'] });
    expect(q.valid).toBe(false);
    expect(q.message).toBeTruthy();
  });
});

describe('営業日', () => {
  it('月曜・第3火曜（15〜21日の火曜）は定休日', () => {
    expect(closedReason('2026-10-26')).toMatch('月曜');
    expect(closedReason('2026-10-20')).toMatch('第3火曜');
    expect(closedReason('2026-10-13')).toBeNull();
    expect(closedReason('2026-12-15')).toMatch('第3火曜');
  });
  it('過去日と91日以降は選べない', () => {
    expect(dateBlockedReason('2026-10-21', NOW)).toBeTruthy();
    expect(dateBlockedReason('2027-01-20', NOW)).toBeNull(); // 90日後（水曜）
    expect(dateBlockedReason('2027-01-21', NOW)).toMatch('90日先');
  });
});

describe('予約枠', () => {
  const cutColorTr = quote({ baseId: 'cut-color', optionIds: ['treatment'] });

  it('休憩をまたぐ施術は選べない（水野 13:00-14:00 休憩）', () => {
    const r = checkSlot({ date: FRI, start: toMin('11:00'), minutes: 150, treatments: cutColorTr.treatments, usesSpaRoom: false, staffId: 'mizuno' }, [], NOW);
    expect(r.ok).toBe(false);
  });

  it('閉店を超える施術は選べない', () => {
    const r = checkSlot({ date: FRI, start: toMin('17:00'), minutes: 150, treatments: cutColorTr.treatments, usesSpaRoom: false, staffId: 'mizuno' }, [], NOW);
    expect(r.ok).toBe(false);
  });

  it('終了時刻＝次の開始時刻は重複としない', () => {
    const booked = [b({ staffId: 'mizuno', start: '09:30', end: '10:30' })];
    const r = checkSlot({ date: FRI, start: toMin('10:30'), minutes: 60, treatments: ['cut'], usesSpaRoom: false, staffId: 'mizuno' }, booked, NOW);
    expect(r.ok).toBe(true);
  });

  it('指名なしでも1人が施術全体を担当できる枠だけ。継ぎ足しはしない', () => {
    // 森下 10:00-12:00 埋まり / 水野 12:00-13:00 埋まり → 10:00から120分は誰も連続で担当できない
    const booked = [b({ staffId: 'morishita', start: '10:00', end: '12:00' }), b({ staffId: 'mizuno', start: '11:00', end: '12:00' })];
    const r = checkSlot({ date: FRI, start: toMin('10:00'), minutes: 120, treatments: ['cut', 'color'], usesSpaRoom: false, staffId: null }, booked, NOW);
    expect(r.ok).toBe(false);
  });

  it('指名なしは固定順（森下→水野）で割り当てる', () => {
    const r = checkSlot({ date: FRI, start: toMin('15:00'), minutes: 60, treatments: ['cut'], usesSpaRoom: false, staffId: null }, [], NOW);
    expect(r).toEqual({ ok: true, staffId: 'morishita' });
  });

  it('縮毛矯正は対応できる水野だけに割り当てる', () => {
    const r = checkSlot({ date: FRI, start: toMin('15:00'), minutes: 180, treatments: ['cut', 'straight'], usesSpaRoom: false, staffId: null }, [], NOW);
    expect(r).toEqual({ ok: true, staffId: 'mizuno' });
  });

  it('別スタッフの予約でもスパルームは重複しない', () => {
    const booked = [b({ staffId: 'mizuno', start: '15:00', end: '16:00', usesSpaRoom: true })];
    const r = checkSlot({ date: FRI, start: toMin('15:30'), minutes: 60, treatments: ['spa'], usesSpaRoom: true, staffId: 'morishita' }, booked, NOW);
    expect(r.ok).toBe(false);
  });

  it('キャンセルした予約は空き枠を塞がない', () => {
    const booked = [b({ staffId: 'mizuno', start: '15:00', end: '16:00', status: 'cancelled' })];
    const r = checkSlot({ date: FRI, start: toMin('15:00'), minutes: 60, treatments: ['cut'], usesSpaRoom: false, staffId: 'mizuno' }, booked, NOW);
    expect(r.ok).toBe(true);
  });

  it('当日の経過済み時刻は選べない', () => {
    const now = { date: FRI, minutes: toMin('12:10') };
    const slots = slotsFor(FRI, quote({ baseId: 'cut', optionIds: [] }), null, [], now);
    expect(slots.find((s) => s.start === '12:00')!.available).toBe(false);
    expect(slots.find((s) => s.start === '12:30')!.available).toBe(true);
  });
});

describe('デモ初期データ', () => {
  it('毎回同じ内容で、重複がない', () => {
    const a = createSeed(NOW).map((r) => r.id + r.start + r.staffId);
    const c = createSeed(NOW).map((r) => r.id + r.start + r.staffId);
    expect(a).toEqual(c);
    expect(a.length).toBeGreaterThan(20);
  });
  it('満席の日が含まれる', () => {
    const seed = createSeed(NOW);
    const dates = [...new Set(seed.map((r) => r.date))];
    const q = quote({ baseId: 'kids-cut', optionIds: [] });
    const full = dates.some((d) => slotsFor(d, q, null, seed, { date: NOW.date, minutes: 0 }).every((s) => !s.available));
    expect(full).toBe(true);
  });
});
