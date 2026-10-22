import '../styles/base.css';
import '../styles/reserve.css';
import { escapeHtml, initCommon, saveChoice } from '../components/common';
import { summaryLinesHtml } from '../components/price';
import { icon, hydrateIcons } from '../lib/icons';
import {
  BASE_MENUS,
  OPTION_MENUS,
  findBase,
  findOption,
  formatMinutes,
  normalizeSelection,
  optionBlockedReason,
  quote,
  selectionFromParams,
  yen,
  type Selection,
} from '../lib/menu';
import { BOOKABLE_STAFF, findStaff, staffCannotReason } from '../lib/staff';
import {
  BOOKING_DAYS_AHEAD,
  addDays,
  checkSlot,
  dayOfWeek,
  dayStatus,
  formatDateJa,
  jstNow,
  slotsFor,
  toMin,
  weekJa,
  type Slot,
} from '../lib/schedule';
import { repo, type Reservation } from '../lib/store';

/* ---------------- 状態 ---------------- */

interface Customer {
  name: string;
  phone: string;
  email: string;
  note: string;
}

interface Draft {
  step: 1 | 2 | 3 | 4;
  sel: Selection;
  staffId: string | null;
  date: string | null;
  start: string | null;
  customer: Customer;
  requestId: string;
}

const DRAFT_KEY = 'nagi-demo:reserve-draft';
const stepsEl = document.querySelector<HTMLElement>('[data-steps]')!;
const asideEl = document.querySelector<HTMLElement>('[data-aside]')!;
const progressEl = document.querySelector<HTMLElement>('[data-progress]')!;

const newRequestId = () =>
  'crypto' in window && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function initialDraft(): Draft {
  const params = new URLSearchParams(location.search);
  const emptyCustomer = { name: '', phone: '', email: '', note: '' };
  // URL で指定があれば（シミュレーター・スタッフ紹介から来た場合）それを優先
  if (params.has('menu') || params.has('staff')) {
    return {
      step: 1,
      sel: selectionFromParams(params),
      staffId: findStaff(params.get('staff'))?.bookable ? params.get('staff') : null,
      date: null,
      start: null,
      customer: emptyCustomer,
      requestId: newRequestId(),
    };
  }
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (raw) {
      const d = JSON.parse(raw) as Draft;
      d.sel = normalizeSelection(d.sel).selection;
      return d;
    }
  } catch {
    /* noop */
  }
  return { step: 1, sel: { baseId: null, optionIds: [] }, staffId: null, date: null, start: null, customer: emptyCustomer, requestId: newRequestId() };
}

const d: Draft = initialDraft();
let booked: Reservation[] = [];
let monthCursor: string; // その月の1日
let flash = ''; // 次の描画で表示する案内
let saving = false;
let saveError = '';
let completed: Reservation | null = null;
let errors: Partial<Record<keyof Customer, string>> = {};
// スマホでは内訳を閉じた状態で始める（合計と所要時間は見出し行に常に表示）
let asideOpen = window.matchMedia('(min-width: 960px)').matches;

function persist() {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch {
    /* noop */
  }
  saveChoice({ ...d.sel, staffId: d.staffId });
}

const staffFee = () => (d.staffId ? (findStaff(d.staffId)?.nominationFee ?? 0) : 0);
const currentQuote = () => quote(d.sel, staffFee());

/** メニュー・スタッフ・日付の変更後、無効になった選択を外して理由を伝える */
function revalidate() {
  const q = currentQuote();
  const staff = findStaff(d.staffId);
  if (staff && q.valid) {
    const why = staffCannotReason(staff, q.treatments);
    if (why) {
      flash += `${staff.name}は${why}ため、指名を「指名なし」に戻しました。`;
      d.staffId = null;
    }
  }
  if (!q.valid) {
    d.start = null;
    return;
  }
  if (d.date) {
    const q2 = currentQuote();
    const status = dayStatus(d.date, q2, d.staffId, booked);
    if (status.status === 'closed') {
      flash += `${formatDateJa(d.date)}は選べなくなりました（${status.reason}）。日付を選び直してください。`;
      d.date = null;
      d.start = null;
    }
  }
  if (d.date && d.start) {
    const q2 = currentQuote();
    const res = checkSlot(
      { date: d.date, start: toMin(d.start), minutes: q2.minutes, treatments: q2.treatments, usesSpaRoom: q2.usesSpaRoom, staffId: d.staffId },
      booked,
    );
    if (!res.ok) {
      flash += `選んでいた ${d.start} は予約できなくなりました（${res.reason}）。時間を選び直してください。`;
      d.start = null;
    }
  }
}

/* ---------------- 共通パーツ ---------------- */

function asideHtml(): string {
  const q = currentQuote();
  const staff = findStaff(d.staffId);
  const body = q.valid
    ? summaryLinesHtml(q, staff ? staff.name : '指名なし')
    : `<p class="summary-empty">${icon('info-circle', { size: 20 })} ${q.message}</p>`;
  const when =
    d.date && d.start
      ? `${formatDateJa(d.date)} ${d.start}〜`
      : d.date
        ? `${formatDateJa(d.date)}（時間は未選択）`
        : '日時は未選択';
  return `
    <details class="aside-box" ${asideOpen ? 'open' : ''}>
      <summary>
        <span class="aside-title">選択中の内容</span>
        <span class="aside-total">${q.valid ? `${yen(q.total)}／約${formatMinutes(q.minutes)}` : '未選択'}</span>
      </summary>
      <div class="summary">
        ${body}
        <dl class="aside-dl">
          <div><dt>担当</dt><dd>${staff ? `${staff.name}（指名）` : '指名なし'}</dd></div>
          <div><dt>日時</dt><dd>${when}</dd></div>
        </dl>
        <div class="summary-total">
          <span class="price">${q.valid ? q.total.toLocaleString('ja-JP') : 0}<small>円（税込）</small></span>
          <span class="time">${icon('clock', { size: 20 })}${q.valid ? `約${formatMinutes(q.minutes)}` : '—'}</span>
        </div>
      </div>
    </details>`;
}

function navHtml(opts: { back?: boolean; nextLabel: string; nextDisabled?: boolean; nextHint?: string }) {
  return `
    <div class="step-nav">
      ${opts.back ? `<button type="button" class="btn btn--ghost" data-back>${icon('nav-arrow-left')}戻る</button>` : ''}
      <button type="button" class="btn" data-next ${opts.nextDisabled ? 'aria-disabled="true"' : ''} ${opts.nextHint ? 'aria-describedby="next-hint"' : ''}>${opts.nextLabel}${icon('nav-arrow-right')}</button>
    </div>
    ${opts.nextHint ? `<p class="note step-hint" id="next-hint">${opts.nextHint}</p>` : ''}`;
}

const flashHtml = () => (flash ? `<div class="alert" role="status">${icon('info-circle')}<p style="margin:0">${escapeHtml(flash)}</p></div>` : '');

/* ---------------- ステップ1：メニュー ---------------- */

function step1(): string {
  const q = quote(d.sel);
  return `
    <section class="step" aria-labelledby="step-title">
      <h2 id="step-title" class="step-title" tabindex="-1"><span class="step-no">1</span>メニューを選ぶ</h2>
      ${flashHtml()}
      <fieldset class="sim-group">
        <legend>基本メニュー（1つ選んでください）</legend>
        <div class="choice-list">
          ${BASE_MENUS.map(
            (m) => `
            <label class="choice"><input type="radio" name="base" value="${m.id}" ${d.sel.baseId === m.id ? 'checked' : ''} />
              <span class="choice-body"><span class="choice-name">${m.name}</span><span class="choice-meta">${formatMinutes(m.minutes)}<b>${yen(m.price)}</b></span></span>
            </label>`,
          ).join('')}
        </div>
      </fieldset>
      <fieldset class="sim-group">
        <legend>追加オプション（任意）</legend>
        <div class="choice-list">
          ${OPTION_MENUS.map((o) => {
            const why = optionBlockedReason(d.sel.baseId, o.id);
            return `
            <label class="choice choice--check ${why ? 'is-disabled' : ''}"><input type="checkbox" name="opt" value="${o.id}" ${d.sel.optionIds.includes(o.id) ? 'checked' : ''} ${why ? 'disabled' : ''} aria-describedby="why-${o.id}" />
              <span class="choice-body"><span class="choice-name">＋ ${o.name}</span><span class="choice-meta">追加${formatMinutes(o.minutes)}<b>＋${yen(o.price)}</b></span>
              <span class="choice-why" id="why-${o.id}">${why ? `選べません：${why}` : ''}</span></span>
            </label>`;
          }).join('')}
        </div>
      </fieldset>
      <p class="note">価格はすべて税込・シャンプー・ブロー込みです。ロング料金はありません。</p>
      ${navHtml({ nextLabel: '担当と日時を選ぶ', nextDisabled: !q.valid, nextHint: q.valid ? '' : '次へ進むには、基本メニューを1つ選んでください。' })}
    </section>`;
}

/* ---------------- ステップ2：担当・日付・時間 ---------------- */

function calendarHtml(): string {
  const q = currentQuote();
  const now = jstNow();
  const [y, m] = monthCursor.split('-').map(Number);
  const first = monthCursor;
  const firstDow = dayOfWeek(first);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const minMonth = now.date.slice(0, 7);
  const maxMonth = addDays(now.date, BOOKING_DAYS_AHEAD).slice(0, 7);
  const ym = monthCursor.slice(0, 7);
  const cells: string[] = [];
  for (let i = 0; i < firstDow; i++) cells.push('<span class="cal-cell is-empty" aria-hidden="true"></span>');
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${ym}-${String(day).padStart(2, '0')}`;
    const st = dayStatus(date, q, d.staffId, booked, now);
    const mark = { closed: '休', full: '×', few: '△', open: '○' }[st.status];
    const label = `${m}月${day}日（${weekJa(date)}）${st.status === 'open' ? '空きあり' : st.status === 'few' ? '残りわずか' : st.reason ?? ''}`;
    const disabled = st.status === 'closed' || st.status === 'full';
    const dow = dayOfWeek(date);
    cells.push(
      `<button type="button" class="cal-cell is-${st.status} ${d.date === date ? 'is-selected' : ''} ${dow === 0 ? 'is-sun' : dow === 6 ? 'is-sat' : ''} ${date === now.date ? 'is-today' : ''}"
        data-date="${date}" ${disabled ? 'disabled' : ''} aria-pressed="${d.date === date}" aria-label="${label}">
        <span class="cal-day">${day}</span><span class="cal-mark" aria-hidden="true">${mark}</span>
      </button>`,
    );
  }
  return `
    <div class="calendar">
      <div class="cal-head">
        <button type="button" class="cal-nav" data-month="-1" ${ym <= minMonth ? 'disabled' : ''} aria-label="前の月">${icon('nav-arrow-left')}</button>
        <p class="cal-title" aria-live="polite">${y}年${m}月</p>
        <button type="button" class="cal-nav" data-month="1" ${ym >= maxMonth ? 'disabled' : ''} aria-label="次の月">${icon('nav-arrow-right')}</button>
      </div>
      <div class="cal-grid" role="group" aria-label="${y}年${m}月の日付">
        ${['日', '月', '火', '水', '木', '金', '土'].map((w, i) => `<span class="cal-week ${i === 0 ? 'is-sun' : i === 6 ? 'is-sat' : ''}" aria-hidden="true">${w}</span>`).join('')}
        ${cells.join('')}
      </div>
      <p class="cal-legend note"><span>○ 空きあり</span><span>△ 残りわずか</span><span>× 満席</span><span>休 定休日・お休み・受付期間外</span></p>
    </div>`;
}

function slotsHtml(): string {
  if (!d.date) return `<p class="summary-empty">${icon('calendar', { size: 20 })} 先に日付を選んでください。</p>`;
  const q = currentQuote();
  const slots: Slot[] = slotsFor(d.date, q, d.staffId, booked);
  const any = slots.some((s) => s.available);
  return `
    <p class="slot-date">${formatDateJa(d.date)}　所要 約${formatMinutes(q.minutes)}</p>
    ${any ? '' : '<p class="alert">この日は、選んだメニューと担当で予約できる時間がありません。別の日を選んでください。</p>'}
    <div class="slots" role="group" aria-label="開始時刻">
      ${slots
        .map((s) => {
          const label = s.available
            ? `${s.start}開始（${s.end}終了予定）${s.few ? '残りわずか' : '空きあり'}`
            : `${s.start} 予約できません：${s.reason}`;
          return `<button type="button" class="slot ${s.available ? (s.few ? 'is-few' : '') : 'is-full'} ${d.start === s.start ? 'is-selected' : ''}"
            data-start="${s.start}" ${s.available ? '' : 'disabled'} aria-pressed="${d.start === s.start}" aria-label="${label}">
            <span class="slot-time">${s.start}</span><span class="slot-state" aria-hidden="true">${s.available ? (s.few ? '残りわずか' : '〜' + s.end) : '×'}</span>
          </button>`;
        })
        .join('')}
    </div>
    <p class="note">終了時刻まで同じ担当者が施術します。×の時間は、満席・休憩・閉店時刻（19:00）を過ぎる等の理由で選べません。</p>`;
}

function step2(): string {
  const q0 = quote(d.sel);
  const ready = !!(d.date && d.start);
  return `
    <section class="step" aria-labelledby="step-title">
      <h2 id="step-title" class="step-title" tabindex="-1"><span class="step-no">2</span>担当・日付・時間を選ぶ</h2>
      ${flashHtml()}
      <fieldset class="sim-group">
        <legend>担当（指名は任意です）</legend>
        <div class="choice-list choice-list--row">
          <label class="choice choice--compact"><input type="radio" name="staff" value="" ${d.staffId ? '' : 'checked'} />
            <span class="choice-body"><span class="choice-name">指名なし</span><span class="choice-meta">空いている美容師が担当<b>0円</b></span></span></label>
          ${BOOKABLE_STAFF.map((s) => {
            const why = staffCannotReason(s, q0.treatments);
            return `<label class="choice choice--compact ${why ? 'is-disabled' : ''}"><input type="radio" name="staff" value="${s.id}" ${d.staffId === s.id ? 'checked' : ''} ${why ? 'disabled' : ''} aria-describedby="why-st-${s.id}" />
              <span class="choice-body"><span class="choice-name">${s.name}</span><span class="choice-meta">${s.role}<b>指名料 ${yen(s.nominationFee)}</b></span>
              <span class="choice-why" id="why-st-${s.id}">${why ? `選べません：${why}` : ''}</span></span></label>`;
          }).join('')}
        </div>
      </fieldset>
      <div class="when-grid">
        <div>
          <h3 class="sub-title">日付</h3>
          ${calendarHtml()}
        </div>
        <div>
          <h3 class="sub-title" id="slots-title">開始時刻</h3>
          <div data-slots>${slotsHtml()}</div>
        </div>
      </div>
      ${navHtml({ back: true, nextLabel: 'お客様情報の入力へ', nextDisabled: !ready, nextHint: ready ? '' : '次へ進むには、日付と開始時刻を選んでください。' })}
    </section>`;
}

/* ---------------- ステップ3：お客様情報 ---------------- */

const SAMPLE: Customer = { name: '見本 花子', phone: '000-0000-0000', email: 'sample@example.com', note: '肩につくくらいの長さにしたいです（デモ入力）' };

function normalizePhone(v: string) {
  return v.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/[ー－‐−]/g, '-').trim();
}

function validate(c: Customer): Partial<Record<keyof Customer, string>> {
  const e: Partial<Record<keyof Customer, string>> = {};
  if (!c.name.trim()) e.name = 'お名前を入力してください。';
  else if (c.name.length > 40) e.name = 'お名前は40文字以内で入力してください。';
  const phone = normalizePhone(c.phone);
  const digits = phone.replace(/-/g, '');
  if (!phone) e.phone = '電話番号を入力してください。';
  else if (!/^[0-9-]+$/.test(phone) || !/^0\d{9,10}$/.test(digits))
    e.phone = '電話番号は、0から始まる10桁または11桁の数字で入力してください（例：090-1234-5678）。';
  if (c.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim()))
    e.email = 'メールアドレスの形式が正しくありません（例：name@example.com）。空欄でもかまいません。';
  if (c.note.length > 200) e.note = `ご要望は200文字以内でお願いします（現在${c.note.length}文字）。`;
  return e;
}

function field(key: keyof Customer, label: string, opts: { required?: boolean; type?: string; autocomplete?: string; hint?: string; textarea?: boolean; inputmode?: string }) {
  const err = errors[key];
  const describedby = [opts.hint ? `${key}-hint` : '', `${key}-err`].filter(Boolean).join(' ');
  const common = `id="f-${key}" name="${key}" ${opts.required ? 'required aria-required="true"' : ''} aria-invalid="${!!err}" aria-describedby="${describedby}" ${opts.autocomplete ? `autocomplete="${opts.autocomplete}"` : ''}`;
  const control = opts.textarea
    ? `<textarea ${common} maxlength="400">${escapeHtml(d.customer[key])}</textarea>`
    : `<input type="${opts.type ?? 'text'}" ${common} ${opts.inputmode ? `inputmode="${opts.inputmode}"` : ''} value="${escapeHtml(d.customer[key])}" />`;
  return `
    <div class="field">
      <label for="f-${key}">${label}${opts.required ? '<span class="req">必須</span>' : '<span class="opt">任意</span>'}</label>
      ${opts.hint ? `<span class="note" id="${key}-hint">${opts.hint}</span>` : ''}
      ${control}
      <p class="field-error" id="${key}-err">${err ? `${icon('warning-circle', { size: 18 })}${err}` : ''}</p>
    </div>`;
}

function step3(): string {
  const errList = Object.entries(errors).filter(([, v]) => v);
  return `
    <section class="step" aria-labelledby="step-title">
      <h2 id="step-title" class="step-title" tabindex="-1"><span class="step-no">3</span>お客様情報</h2>
      ${flashHtml()}
      <div class="alert alert--demo">
        ${icon('lock')}
        <div>
          <p style="margin:0"><b>実在の個人情報は入力しないでください。</b>このデモでは送信は行われませんが、入力内容はこのブラウザ内に保存されます。</p>
          <button type="button" class="btn btn--ghost btn--sm sample-btn" data-sample>サンプル情報を入力する</button>
        </div>
      </div>
      ${
        errList.length
          ? `<div class="alert alert--error" role="alert" tabindex="-1" data-err-summary>
              ${icon('warning-circle')}
              <div><p style="margin:0 0 .25rem"><b>入力内容を確認してください（${errList.length}件）</b></p>
              <ul class="err-list">${errList.map(([k, v]) => `<li><a href="#f-${k}">${v}</a></li>`).join('')}</ul></div>
            </div>`
          : ''
      }
      <form class="customer-form" novalidate data-form>
        ${field('name', 'お名前', { required: true, autocomplete: 'name', hint: '例：見本 花子' })}
        ${field('phone', '電話番号', { required: true, type: 'tel', autocomplete: 'tel', inputmode: 'tel', hint: 'ハイフンはあってもなくても大丈夫です。例：090-1234-5678' })}
        ${field('email', 'メールアドレス', { type: 'email', autocomplete: 'email', inputmode: 'email' })}
        ${field('note', 'ご要望・ご相談', { textarea: true, hint: '髪のお悩み、なりたい雰囲気など（200文字以内）' })}
      </form>
      ${navHtml({ back: true, nextLabel: '入力内容を確認する' })}
    </section>`;
}

/* ---------------- ステップ4：確認 ---------------- */

function step4(): string {
  const q = currentQuote();
  const staff = findStaff(d.staffId);
  const res =
    d.date && d.start
      ? checkSlot({ date: d.date, start: toMin(d.start), minutes: q.minutes, treatments: q.treatments, usesSpaRoom: q.usesSpaRoom, staffId: d.staffId }, booked)
      : null;
  const assigned = res?.ok ? findStaff(res.staffId) : null;
  const endMin = d.start ? toMin(d.start) + q.minutes : 0;
  const end = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
  return `
    <section class="step" aria-labelledby="step-title">
      <h2 id="step-title" class="step-title" tabindex="-1"><span class="step-no">4</span>内容の確認</h2>
      ${flashHtml()}
      ${saveError ? `<div class="alert alert--error" role="alert">${icon('warning-circle')}<div><p style="margin:0">${escapeHtml(saveError)}</p></div></div>` : ''}
      <div class="confirm">
        <h3 class="sub-title">メニュー</h3>
        ${summaryLinesHtml(q, staff ? staff.name : '指名なし')}
        <div class="summary-total confirm-total">
          <span>合計（税込）</span>
          <span class="price">${q.total.toLocaleString('ja-JP')}<small>円</small></span>
        </div>
        <dl class="confirm-dl">
          <div><dt>所要時間</dt><dd>約${formatMinutes(q.minutes)}</dd></div>
          <div><dt>日時</dt><dd>${d.date ? formatDateJa(d.date) : ''} ${d.start}〜${end}（終了予定）</dd></div>
          <div><dt>担当</dt><dd>${staff ? `${staff.name}（指名・指名料 ${yen(staff.nominationFee)}）` : `指名なし${assigned ? `（担当予定：${assigned.name}）` : ''}`}</dd></div>
          <div><dt>お名前</dt><dd>${escapeHtml(d.customer.name)}</dd></div>
          <div><dt>電話番号</dt><dd>${escapeHtml(normalizePhone(d.customer.phone))}</dd></div>
          <div><dt>メール</dt><dd>${escapeHtml(d.customer.email) || '（なし）'}</dd></div>
          <div><dt>ご要望</dt><dd>${escapeHtml(d.customer.note) || '（なし）'}</dd></div>
        </dl>
        <p class="note">※指名なしの場合、指名料はかかりません。担当予定は空き状況により固定の順番で決まります。</p>
      </div>
      <div class="alert alert--demo">${icon('info-circle')}<p style="margin:0">これは<b>デモ予約</b>です。お店への送信・通知は行われず、このブラウザ内にだけ保存されます。</p></div>
      <div class="step-nav">
        <button type="button" class="btn btn--ghost" data-back ${saving ? 'disabled' : ''}>${icon('nav-arrow-left')}戻る</button>
        <button type="button" class="btn" data-submit ${saving ? 'disabled aria-busy="true"' : ''}>${saving ? '保存しています…' : `${icon('check')}デモ予約を完了する`}</button>
      </div>
    </section>`;
}

/* ---------------- 完了 ---------------- */

function doneHtml(r: Reservation): string {
  const staff = findStaff(r.staffId);
  return `
    <section class="step done" aria-labelledby="step-title">
      <p class="eyebrow">Thank you</p>
      <h2 id="step-title" class="step-title" tabindex="-1">デモ予約が完了しました</h2>
      <div class="done-no">
        <span>予約番号</span>
        <strong>${r.id}</strong>
      </div>
      <div class="alert alert--demo">${icon('info-circle')}<p style="margin:0"><b>この予約は見本のため、実際には送信されません。</b>お店への通知や確認メールもありません。</p></div>
      <div class="confirm">
        <ul class="summary-lines">${r.items
          .map((i) => `<li><span>${i.kind === 'option' ? '＋ ' : ''}${i.name}</span><span class="sub">${yen(i.price)}</span></li>`)
          .join('')}${r.nominationFee ? `<li><span>指名料</span><span class="sub">${yen(r.nominationFee)}</span></li>` : ''}</ul>
        <div class="summary-total confirm-total"><span>合計（税込）</span><span class="price">${r.total.toLocaleString('ja-JP')}<small>円</small></span></div>
        <dl class="confirm-dl">
          <div><dt>日時</dt><dd>${formatDateJa(r.date)} ${r.start}〜${r.end}</dd></div>
          <div><dt>所要時間</dt><dd>約${formatMinutes(r.minutes)}</dd></div>
          <div><dt>担当</dt><dd>${staff?.name ?? ''}${r.nominated ? '（指名）' : '（指名なし）'}</dd></div>
          <div><dt>お名前</dt><dd>${escapeHtml(r.customer.name)}</dd></div>
        </dl>
      </div>
      <div class="done-actions">
        <a class="btn" href="/admin/?date=${r.date}&amp;id=${r.id}">${icon('eye')}お店側の管理画面で確認する</a>
        <a class="btn btn--ghost" href="/">トップページへ戻る</a>
        <button type="button" class="btn btn--ghost" data-again>${icon('refresh')}別の予約を試す</button>
      </div>
      <p class="note">管理画面のデモ用パスワードは <b>demo</b> です（画面にも表示されています）。</p>
    </section>`;
}

/* ---------------- 描画とイベント ---------------- */

function render(focus = false) {
  const step = completed ? 5 : d.step;
  progressEl.querySelectorAll<HTMLElement>('li').forEach((li) => {
    const n = Number(li.dataset.step);
    li.classList.toggle('is-current', n === step);
    li.classList.toggle('is-done', n < step);
    if (n === step) li.setAttribute('aria-current', 'step');
    else li.removeAttribute('aria-current');
  });
  stepsEl.innerHTML = completed ? doneHtml(completed) : [step1, step2, step3, step4][d.step - 1]();
  asideEl.innerHTML = completed ? '' : asideHtml();
  asideEl.hidden = !!completed;
  flash = '';
  hydrateIcons(stepsEl);
  if (focus) {
    stepsEl.querySelector<HTMLElement>('#step-title')?.focus({ preventScroll: true });
    document.querySelector('.reserve-head')?.scrollIntoView({ block: 'start' });
  }
  persist();
}

/** 時間枠と右側の合計だけを更新（スクロール位置・フォーカスを保つ） */
function rerenderStep2Parts() {
  const active = document.activeElement as HTMLElement | null;
  const key = active?.dataset.date ? `[data-date="${active.dataset.date}"]` : active?.dataset.start ? `[data-start="${active.dataset.start}"]` : null;
  render();
  if (key) stepsEl.querySelector<HTMLElement>(key)?.focus({ preventScroll: true });
}

function goto(step: Draft['step']) {
  d.step = step;
  render(true);
}

async function refreshBooked() {
  booked = await repo.list();
}

stepsEl.addEventListener('change', (e) => {
  const t = e.target as HTMLInputElement;
  if (t.name === 'base') {
    const res = normalizeSelection({ baseId: t.value, optionIds: d.sel.optionIds });
    d.sel = res.selection;
    if (res.removed.length) flash = res.removed.map((r) => `「${findOption(r.id)?.name}」を外しました（${r.reason}）。`).join('');
    revalidate();
    rerenderKeepFocus(`input[name="base"][value="${t.value}"]`);
  } else if (t.name === 'opt') {
    const ids = t.checked ? [...d.sel.optionIds, t.value] : d.sel.optionIds.filter((x) => x !== t.value);
    d.sel = normalizeSelection({ baseId: d.sel.baseId, optionIds: ids }).selection;
    revalidate();
    rerenderKeepFocus(`input[name="opt"][value="${t.value}"]`);
  } else if (t.name === 'staff') {
    d.staffId = t.value || null;
    revalidate();
    rerenderKeepFocus(`input[name="staff"][value="${t.value}"]`);
  }
});

function rerenderKeepFocus(selector: string) {
  render();
  stepsEl.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true });
}

stepsEl.addEventListener('input', (e) => {
  const t = e.target as HTMLInputElement;
  if (t.closest('[data-form]')) {
    d.customer[t.name as keyof Customer] = t.value;
    persist();
  }
});

stepsEl.addEventListener(
  'blur',
  (e) => {
    const t = e.target as HTMLInputElement;
    if (!t.closest?.('[data-form]')) return;
    const key = t.name as keyof Customer;
    const err = validate(d.customer)[key];
    // 入力済みの欄だけ、その場でエラーを出す（未入力の欄は「次へ」で案内）
    if (t.value || errors[key]) {
      errors[key] = err;
      t.setAttribute('aria-invalid', String(!!err));
      const p = stepsEl.querySelector(`#${key}-err`)!;
      p.innerHTML = err ? `${icon('warning-circle', { size: 18 })}${err}` : '';
    }
  },
  true,
);

stepsEl.addEventListener('click', async (e) => {
  const t = e.target as HTMLElement;
  const btn = t.closest<HTMLElement>('button, a');
  if (!btn) return;

  if (btn.matches('[data-back]')) {
    goto((d.step - 1) as Draft['step']);
    return;
  }
  if (btn.matches('[data-next]')) {
    if (btn.getAttribute('aria-disabled') === 'true') {
      stepsEl.querySelector<HTMLElement>('#next-hint')?.classList.add('is-alert');
      return;
    }
    if (d.step === 1) {
      await refreshBooked();
      revalidate();
      if (!monthCursor) monthCursor = `${(d.date ?? jstNow().date).slice(0, 7)}-01`;
      goto(2);
    } else if (d.step === 2) {
      await refreshBooked();
      revalidate();
      if (!d.start) {
        render(true);
        return;
      }
      goto(3);
    } else if (d.step === 3) {
      errors = validate(d.customer);
      if (Object.values(errors).some(Boolean)) {
        render();
        stepsEl.querySelector<HTMLElement>('[data-err-summary]')?.focus();
        return;
      }
      d.customer.phone = normalizePhone(d.customer.phone);
      await refreshBooked();
      goto(4);
    }
    return;
  }
  if (btn.matches('[data-month]')) {
    const [y, m] = monthCursor.split('-').map(Number);
    const next = new Date(Date.UTC(y, m - 1 + Number(btn.dataset.month), 1)).toISOString().slice(0, 10);
    monthCursor = next;
    render();
    stepsEl.querySelector<HTMLElement>(`[data-month="${btn.dataset.month}"]`)?.focus();
    return;
  }
  if (btn.matches('[data-date]')) {
    d.date = btn.dataset.date!;
    revalidate();
    rerenderStep2Parts();
    return;
  }
  if (btn.matches('[data-start]')) {
    d.start = btn.dataset.start!;
    rerenderStep2Parts();
    return;
  }
  if (btn.matches('[data-sample]')) {
    d.customer = { ...SAMPLE };
    errors = {};
    render();
    stepsEl.querySelector<HTMLElement>('#f-name')?.focus();
    return;
  }
  if (btn.matches('[data-submit]')) {
    if (saving) return; // 二重クリック防止
    saving = true;
    saveError = '';
    render();
    try {
      const res = await repo.create({
        requestId: d.requestId,
        selection: d.sel,
        staffId: d.staffId,
        date: d.date!,
        start: d.start!,
        customer: { ...d.customer, phone: normalizePhone(d.customer.phone) },
      });
      if (res.ok) {
        completed = res.value;
        try {
          sessionStorage.removeItem(DRAFT_KEY);
        } catch {
          /* noop */
        }
        saving = false;
        render(true);
        return;
      }
      saveError = `${res.reason} 「戻る」から時間を選び直すか、もう一度お試しください。`;
    } catch {
      saveError = '保存に失敗しました。もう一度「デモ予約を完了する」を押してください。';
    }
    saving = false;
    await refreshBooked();
    render();
    stepsEl.querySelector<HTMLElement>('[role=alert]')?.focus();
    return;
  }
  if (btn.matches('[data-again]')) {
    completed = null;
    Object.assign(d, { step: 1, date: null, start: null, requestId: newRequestId(), customer: { name: '', phone: '', email: '', note: '' } });
    history.replaceState(null, '', '/reserve/');
    render(true);
  }
});

asideEl.addEventListener(
  'toggle',
  (e) => {
    asideOpen = (e.target as HTMLDetailsElement).open;
  },
  true,
);

/* ---------------- 起動 ---------------- */

(async () => {
  initCommon();
  await refreshBooked();
  // 指名スタッフが担当できないメニューが URL にある場合は、メニューを外して案内
  const staff = findStaff(d.staffId);
  const q = quote(d.sel);
  if (staff && q.valid && staffCannotReason(staff, q.treatments)) {
    flash = `${staff.name}は${staffCannotReason(staff, q.treatments)}ため、「${findBase(d.sel.baseId)?.name}」の選択を外しました。メニューを選び直してください。`;
    d.sel = { baseId: null, optionIds: [] };
  } else if (staff) {
    flash = `${staff.name}を指名した状態で予約を始めます（指名料 ${yen(staff.nominationFee)}）。`;
  }
  revalidate();
  if (d.step > 1 && !quote(d.sel).valid) d.step = 1;
  if (d.step > 2 && !(d.date && d.start)) d.step = 2;
  monthCursor = `${(d.date ?? jstNow().date).slice(0, 7)}-01`;
  render();
})();
