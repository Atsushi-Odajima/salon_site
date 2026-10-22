/**
 * 予約データの保存処理（このファイルだけが保存先を知っている）。
 *
 * 現在は「デモモード」：ブラウザの localStorage に保存します。
 * 別端末との共有・店舗への通知は行われません。
 *
 * ▼ Supabase へ切り替える場合
 *   `LocalStorageRepository` と同じ `ReservationRepository` インターフェースを持つ
 *   `SupabaseRepository` を作り、ファイル末尾の `export const repo = ...` を差し替えます。
 *   ただし保存先を変えるだけでは本番運用になりません。認証・権限管理（RLS）、
 *   同時予約の競合防止（DB 側の排他制約やトランザクション）、通知、外部連携は別途必要です。
 */
import { quote, type LineItem, type Selection } from './menu';
import { findStaff } from './staff';
import { addDays, checkSlot, dayOfWeek, fromMin, jstNow, toMin, type Booked } from './schedule';

export type Status = 'confirmed' | 'visited' | 'cancelled';

export interface Reservation extends Booked {
  /** 予約番号 例: GRC-20261022-0007 */
  id: string;
  createdAt: string;
  /** 二重送信防止用。同じ requestId の予約は1件しか作らない */
  requestId: string;
  minutes: number;
  /** 予約時点のメニュー名・料金・所要時間（後から設定を変えても書き換えない） */
  items: LineItem[];
  nominated: boolean;
  nominationFee: number;
  total: number;
  customer: { name: string; phone: string; email: string; note: string };
  source: 'web' | 'demo-seed';
}

export interface NewReservation {
  requestId: string;
  selection: Selection;
  /** 指名スタッフ id。指名なしは null */
  staffId: string | null;
  /** デモ初期データ用：担当を固定するが指名ではない（指名料なし） */
  assignOnly?: boolean;
  date: string;
  start: string;
  customer: Reservation['customer'];
}

export type Result<T> = { ok: true; value: T } | { ok: false; reason: string };

export interface ReservationRepository {
  list(): Promise<Reservation[]>;
  create(input: NewReservation): Promise<Result<Reservation>>;
  updateStatus(id: string, status: Status): Promise<Result<Reservation>>;
  /** この見本が保存したデータだけを初期状態に戻す */
  reset(): Promise<void>;
}

// 保存キーの接頭辞は画面に出ないため旧名のまま（既存データの初期化範囲を変えないため）
const PREFIX = 'nagi-demo:';
// v2：予約番号の接頭辞を GRC に変更（v1 の旧番号データは使わず、初期データを作り直す）
const KEY = `${PREFIX}reservations-v2`;
const ID_PREFIX = 'GRC';

function makeId(date: string, existing: Reservation[]): string {
  const ymd = date.replaceAll('-', '');
  const seq =
    existing
      .filter((r) => r.id.startsWith(`${ID_PREFIX}-${ymd}-`))
      .map((r) => Number(r.id.slice(-4)))
      .reduce((a, b) => Math.max(a, b), 0) + 1;
  return `${ID_PREFIX}-${ymd}-${String(seq).padStart(4, '0')}`;
}

/** 選択内容から保存用の予約を組み立てる（空き確認込み） */
function build(input: NewReservation, existing: Reservation[], now = jstNow(), source: Reservation['source'] = 'web'): Result<Reservation> {
  const nominated = !!input.staffId && !input.assignOnly;
  const staff = findStaff(input.staffId);
  const q = quote(input.selection, nominated && staff ? staff.nominationFee : 0);
  if (!q.valid) return { ok: false, reason: q.message ?? 'メニューを選んでください' };
  const check = checkSlot(
    { date: input.date, start: toMin(input.start), minutes: q.minutes, treatments: q.treatments, usesSpaRoom: q.usesSpaRoom, staffId: input.staffId },
    existing,
    now,
  );
  if (!check.ok) return { ok: false, reason: `この時間は予約できなくなりました（${check.reason}）` };
  return {
    ok: true,
    value: {
      id: makeId(input.date, existing),
      requestId: input.requestId,
      createdAt: new Date().toISOString(),
      date: input.date,
      start: input.start,
      end: fromMin(toMin(input.start) + q.minutes),
      minutes: q.minutes,
      staffId: check.staffId,
      usesSpaRoom: q.usesSpaRoom,
      status: 'confirmed',
      items: q.items,
      nominated,
      nominationFee: q.nominationFee,
      total: q.total,
      customer: input.customer,
      source,
    },
  };
}

/* ---------- デモ用の初期予約（日付から決まる固定パターン。ランダムではない） ---------- */

const SEED_NAMES = ['青木', '石川', '上田', '大西', '加藤', '北村', '小松', '佐野', '杉本', '高田', '千葉', '中村', '野口', '橋本', '藤井', '松田'];

// nominated=false は「指名なしで、この美容師が担当」した予約
type SeedPlan = [staffId: string | null, start: string, baseId: string, opts: string[], nominated?: boolean];

// 曜日ごとではなく「営業日の何日目か」で回す固定パターン
const DAY_PLANS: SeedPlan[][] = [
  [
    ['mizuno', '10:00', 'cut', []],
    ['morishita', '10:30', 'cut-color', ['treatment'], false],
    ['mizuno', '15:00', 'cut-straight', []],
    [null, '16:00', 'spa', []],
  ],
  [
    ['morishita', '11:00', 'color', []],
    ['mizuno', '09:30', 'cut-perm', []],
    ['mizuno', '14:00', 'cut', ['spa-add'], false],
    ['morishita', '16:30', 'cut', []],
  ],
  [
    ['mizuno', '11:00', 'cut-color', []],
    ['morishita', '15:00', 'cut-perm', ['treatment'], false],
    [null, '17:30', 'kids-cut', []],
  ],
];

// 満席デモ用：両スタイリストの勤務時間をすべて埋める
const FULL_DAY: SeedPlan[] = [
  ['mizuno', '09:30', 'cut-straight', []],
  ['mizuno', '12:30', 'kids-cut', [], false],
  ['mizuno', '14:00', 'cut-color', []],
  ['mizuno', '16:00', 'cut-straight', []],
  ['morishita', '10:00', 'cut-color', []],
  ['morishita', '12:00', 'cut-color', [], false],
  ['morishita', '15:00', 'cut-perm', []],
  ['morishita', '17:30', 'color', [], false],
];

export function createSeed(now = jstNow()): Reservation[] {
  const list: Reservation[] = [];
  // 種データは「その日の始業前」として判定し、当日分も入れられるようにする
  const seedNow = { date: now.date, minutes: 0 };
  let nameIdx = 0;
  let openDay = 0;
  let fullDone = false;
  for (let i = 0; i <= 28; i++) {
    const date = addDays(now.date, i);
    const dow = dayOfWeek(date);
    const bothWork = !!findStaff('mizuno')!.week[dow] && !!findStaff('morishita')!.week[dow];
    let plan: SeedPlan[];
    if (!fullDone && i >= 2 && bothWork && checkSlot({ date, start: toMin('10:00'), minutes: 30, treatments: ['cut'], usesSpaRoom: false, staffId: null }, [], seedNow).ok) {
      plan = FULL_DAY;
      fullDone = true;
    } else {
      plan = DAY_PLANS[openDay % DAY_PLANS.length];
    }
    let added = 0;
    for (const [staffId, start, baseId, opts, nominated = true] of plan) {
      const name = SEED_NAMES[nameIdx % SEED_NAMES.length];
      const res = build(
        {
          requestId: `seed-${date}-${start}-${staffId ?? 'any'}`,
          selection: { baseId, optionIds: opts },
          staffId,
          assignOnly: !nominated,
          date,
          start,
          customer: { name: `${name} 様（見本）`, phone: `000-0000-${String(1000 + nameIdx).slice(-4)}`, email: '', note: '' },
        },
        list,
        seedNow,
        'demo-seed',
      );
      if (res.ok) {
        list.push(res.value);
        nameIdx++;
        added++;
      }
    }
    if (added > 0) openDay++;
  }
  return list;
}

/* ---------- localStorage 実装 ---------- */

class LocalStorageRepository implements ReservationRepository {
  private read(): Reservation[] {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw) as Reservation[];
    } catch {
      /* 読めない場合は初期データで作り直す */
    }
    const seed = createSeed();
    this.write(seed);
    return seed;
  }

  private write(list: Reservation[]) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  async list() {
    return this.read();
  }

  async create(input: NewReservation): Promise<Result<Reservation>> {
    try {
      const list = this.read();
      const dup = list.find((r) => r.requestId === input.requestId);
      if (dup) return { ok: true, value: dup };
      // 保存直前にもう一度空きを確認する
      const res = build(input, list);
      if (!res.ok) return res;
      list.push(res.value);
      this.write(list);
      return res;
    } catch {
      return { ok: false, reason: '保存できませんでした。ブラウザの保存領域が使えない可能性があります。' };
    }
  }

  async updateStatus(id: string, status: Status): Promise<Result<Reservation>> {
    try {
      const list = this.read();
      const r = list.find((x) => x.id === id);
      if (!r) return { ok: false, reason: '予約が見つかりません' };
      if (r.status === 'cancelled' && status !== 'cancelled') {
        // キャンセルから戻すときは、その間に入った予約と重ならないか再確認する
        const check = checkSlot(
          {
            date: r.date,
            start: toMin(r.start),
            minutes: r.minutes,
            treatments: [],
            usesSpaRoom: r.usesSpaRoom,
            staffId: r.staffId,
          },
          list,
          { date: r.date, minutes: 0 },
          r.id,
        );
        if (!check.ok) return { ok: false, reason: `元に戻せません：${check.reason}` };
      }
      r.status = status;
      this.write(list);
      return { ok: true, value: r };
    } catch {
      return { ok: false, reason: '保存できませんでした' };
    }
  }

  async reset() {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX)) localStorage.removeItem(k);
    }
    this.read();
  }
}

// ▼ Supabase に切り替える場合はここを差し替える（例：export const repo = new SupabaseRepository(client)）
export const repo: ReservationRepository = new LocalStorageRepository();
