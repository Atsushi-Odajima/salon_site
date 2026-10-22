/**
 * 営業日・予約枠の判定。日付は日本時間の "YYYY-MM-DD"、時刻は 0時からの分で扱う。
 *
 * 簡略モデル
 * - 1人の美容師が予約の開始から終了まで担当する（放置時間中の掛け持ち・途中交代は扱わない）。
 * - ヘッドスパを含む予約は、開始から終了まで個室スパルーム（1室）を確保する。
 * - 予約の終了時刻と次の予約の開始時刻が同じ場合は重複としない（半開区間）。
 */
import { AUTO_ASSIGN_ORDER, findStaff, staffCannotReason, type Staff } from './staff';
import type { Quote, Treatment } from './menu';

export const OPEN = toMin('09:30');
export const CLOSE = toMin('19:00');
export const STEP = 30;
export const BOOKING_DAYS_AHEAD = 90;

export function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function fromMin(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

/** 日本時間の現在日付と時刻（分） */
export function jstNow(now = new Date()): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return { date: `${get('year')}-${get('month')}-${get('day')}`, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

function parse(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return { y, m, d };
}

export function addDays(date: string, n: number): string {
  const { y, m, d } = parse(date);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

export function dayOfWeek(date: string): number {
  const { y, m, d } = parse(date);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function daysBetween(a: string, b: string): number {
  const pa = parse(a);
  const pb = parse(b);
  return Math.round((Date.UTC(pb.y, pb.m - 1, pb.d) - Date.UTC(pa.y, pa.m - 1, pa.d)) / 86400000);
}

const WEEK_JA = ['日', '月', '火', '水', '木', '金', '土'];

export function formatDateJa(date: string, withWeek = true): string {
  const { y, m, d } = parse(date);
  return `${y}年${m}月${d}日${withWeek ? `（${WEEK_JA[dayOfWeek(date)]}）` : ''}`;
}

export function weekJa(date: string): string {
  return WEEK_JA[dayOfWeek(date)];
}

/** 定休日の理由（営業日なら null）。第3火曜日は「その月の15〜21日にあたる火曜日」。 */
export function closedReason(date: string): string | null {
  const dow = dayOfWeek(date);
  if (dow === 1) return '月曜日は定休日です';
  const { d } = parse(date);
  if (dow === 2 && d >= 15 && d <= 21) return '第3火曜日は定休日です';
  return null;
}

/** 予約できない日の理由（過去・受付期間外・定休日） */
export function dateBlockedReason(date: string, now = jstNow()): string | null {
  const diff = daysBetween(now.date, date);
  if (diff < 0) return '過去の日付は選べません';
  if (diff > BOOKING_DAYS_AHEAD) return `ご予約は${BOOKING_DAYS_AHEAD}日先までです`;
  return closedReason(date);
}

export interface Booked {
  id: string;
  date: string;
  start: string;
  end: string;
  staffId: string;
  usesSpaRoom: boolean;
  status: 'confirmed' | 'visited' | 'cancelled';
}

const overlaps = (a1: number, a2: number, b1: number, b2: number) => a1 < b2 && b1 < a2;

const active = (list: Booked[], date: string, ignoreId?: string) =>
  list.filter((r) => r.date === date && r.status !== 'cancelled' && r.id !== ignoreId);

/** スタッフがこの時間帯を最初から最後まで担当できない理由。担当できるなら null。 */
export function staffBusyReason(
  staff: Staff,
  date: string,
  start: number,
  minutes: number,
  booked: Booked[],
  ignoreId?: string,
): string | null {
  const shift = staff.week[dayOfWeek(date)];
  if (!shift) return `${staff.name}はお休みです`;
  const end = start + minutes;
  if (start < toMin(shift.start) || end > toMin(shift.end)) return '勤務時間外にかかります';
  if (overlaps(start, end, toMin(shift.breakStart), toMin(shift.breakEnd))) return '休憩時間にかかります';
  const clash = active(booked, date, ignoreId).some(
    (r) => r.staffId === staff.id && overlaps(start, end, toMin(r.start), toMin(r.end)),
  );
  return clash ? 'ほかのご予約と重なります' : null;
}

export function spaRoomBusy(date: string, start: number, end: number, booked: Booked[], ignoreId?: string): boolean {
  return active(booked, date, ignoreId).some((r) => r.usesSpaRoom && overlaps(start, end, toMin(r.start), toMin(r.end)));
}

export interface SlotRequest {
  date: string;
  start: number;
  minutes: number;
  treatments: Treatment[];
  usesSpaRoom: boolean;
  /** 指名スタッフの id。指名なしは null */
  staffId: string | null;
}

export type CheckResult = { ok: true; staffId: string } | { ok: false; reason: string };

/**
 * 1件の予約がとれるか判定する。保存直前・キャンセル取り消し時にも使う。
 * 指名なしは AUTO_ASSIGN_ORDER の順で、施術全体を1人で担当できる最初の美容師を割り当てる。
 */
export function checkSlot(req: SlotRequest, booked: Booked[], now = jstNow(), ignoreId?: string): CheckResult {
  const dateReason = dateBlockedReason(req.date, now);
  if (dateReason) return { ok: false, reason: dateReason };
  const end = req.start + req.minutes;
  if (req.date === now.date && req.start <= now.minutes) return { ok: false, reason: 'すでに過ぎた時刻です' };
  if (req.start < OPEN || end > CLOSE) return { ok: false, reason: '19:00の閉店までに終わりません' };
  if (req.usesSpaRoom && spaRoomBusy(req.date, req.start, end, booked, ignoreId)) {
    return { ok: false, reason: '個室スパルームが埋まっています' };
  }
  const candidates = req.staffId ? [req.staffId] : AUTO_ASSIGN_ORDER;
  let lastReason = '担当できるスタッフがいません';
  for (const id of candidates) {
    const staff = findStaff(id);
    if (!staff) continue;
    const cannot = staffCannotReason(staff, req.treatments);
    if (cannot) {
      lastReason = cannot;
      continue;
    }
    const busy = staffBusyReason(staff, req.date, req.start, req.minutes, booked, ignoreId);
    if (!busy) return { ok: true, staffId: staff.id };
    lastReason = req.staffId ? busy : '担当できる美容師が空いていません';
  }
  return { ok: false, reason: lastReason };
}

export interface Slot {
  start: string;
  end: string;
  available: boolean;
  /** 指名なしで、担当できる美容師が1人だけの枠 */
  few: boolean;
  reason: string | null;
  staffId: string | null;
}

/** 30分刻みの開始時刻ごとに、予約できるかを返す */
export function slotsFor(
  date: string,
  q: Pick<Quote, 'minutes' | 'treatments' | 'usesSpaRoom'>,
  staffId: string | null,
  booked: Booked[],
  now = jstNow(),
): Slot[] {
  const slots: Slot[] = [];
  for (let s = OPEN; s < CLOSE; s += STEP) {
    const req: SlotRequest = { date, start: s, minutes: q.minutes, treatments: q.treatments, usesSpaRoom: q.usesSpaRoom, staffId };
    const res = checkSlot(req, booked, now);
    let few = false;
    if (res.ok && !staffId) {
      const free = AUTO_ASSIGN_ORDER.filter((id) => checkSlot({ ...req, staffId: id }, booked, now).ok);
      few = free.length === 1;
    }
    slots.push({
      start: fromMin(s),
      end: fromMin(s + q.minutes),
      available: res.ok,
      few,
      reason: res.ok ? null : res.reason,
      staffId: res.ok ? res.staffId : null,
    });
  }
  return slots;
}

export type DayStatus = 'closed' | 'full' | 'few' | 'open';

export function dayStatus(
  date: string,
  q: Pick<Quote, 'minutes' | 'treatments' | 'usesSpaRoom'>,
  staffId: string | null,
  booked: Booked[],
  now = jstNow(),
): { status: DayStatus; reason: string | null } {
  const blocked = dateBlockedReason(date, now);
  if (blocked) return { status: 'closed', reason: blocked };
  if (staffId) {
    const staff = findStaff(staffId);
    if (staff && !staff.week[dayOfWeek(date)]) return { status: 'closed', reason: `${staff.name}のお休みの日です` };
  }
  const n = slotsFor(date, q, staffId, booked, now).filter((s) => s.available).length;
  if (n === 0) return { status: 'full', reason: '満席です' };
  return { status: n <= 3 ? 'few' : 'open', reason: null };
}
