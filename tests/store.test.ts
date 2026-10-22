import { beforeEach, describe, expect, it, vi } from 'vitest';

// node 環境用の簡易 localStorage
const mem = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
  key: (i: number) => [...mem.keys()][i] ?? null,
  get length() {
    return mem.size;
  },
});

const { repo } = await import('../src/lib/store');
const { jstNow, addDays, closedReason, dayOfWeek } = await import('../src/lib/schedule');

/** 30日以上先の、水野・森下とも出勤する営業日（初期データが入らない日） */
function freeDay() {
  let d = addDays(jstNow().date, 40);
  while (closedReason(d) || [3, 4].includes(dayOfWeek(d))) d = addDays(d, 1);
  return d;
}
const customer = { name: 'テスト', phone: '000-0000-0000', email: '', note: '' };

describe('保存処理', () => {
  beforeEach(async () => {
    mem.clear();
    await repo.reset();
  });

  it('同じ requestId は1件しか登録されない（二重クリック対策）', async () => {
    const date = freeDay();
    const input = { requestId: 'r1', selection: { baseId: 'cut', optionIds: [] }, staffId: 'mizuno', date, start: '10:00', customer };
    const [a, b] = await Promise.all([repo.create(input), repo.create(input)]);
    expect(a.ok && b.ok && a.value.id === b.value.id).toBe(true);
    expect((await repo.list()).filter((r) => r.date === date)).toHaveLength(1);
  });

  it('指名料は指名時のみ1回、予約時点の金額を保存する', async () => {
    const date = freeDay();
    const a = await repo.create({ requestId: 'n1', selection: { baseId: 'cut-color', optionIds: ['treatment'] }, staffId: 'mizuno', date, start: '09:30', customer });
    const b = await repo.create({ requestId: 'n2', selection: { baseId: 'cut-color', optionIds: ['treatment'] }, staffId: null, date, start: '15:00', customer });
    expect(a.ok && a.value.total).toBe(14300);
    expect(b.ok && b.value.total).toBe(13200);
    expect(b.ok && b.value.nominated).toBe(false);
  });

  it('重なる予約は保存直前の確認で拒否され、キャンセルすると空きに戻る', async () => {
    const date = freeDay();
    const first = await repo.create({ requestId: 'c1', selection: { baseId: 'cut', optionIds: [] }, staffId: 'mizuno', date, start: '10:00', customer });
    const dup = await repo.create({ requestId: 'c2', selection: { baseId: 'cut', optionIds: [] }, staffId: 'mizuno', date, start: '10:30', customer });
    expect(dup.ok).toBe(false);
    if (!first.ok) throw new Error();
    await repo.updateStatus(first.value.id, 'cancelled');
    const again = await repo.create({ requestId: 'c3', selection: { baseId: 'cut', optionIds: [] }, staffId: 'mizuno', date, start: '10:30', customer });
    expect(again.ok).toBe(true);
    // キャンセルから確定へ戻すと重複するので拒否される
    const back = await repo.updateStatus(first.value.id, 'confirmed');
    expect(back.ok).toBe(false);
  });

  it('リセットはこの見本のデータだけを消す', async () => {
    mem.set('other-app', 'keep');
    await repo.reset();
    expect(mem.get('other-app')).toBe('keep');
  });
});
