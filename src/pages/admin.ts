import '../styles/base.css';
import '../styles/admin.css';
import { escapeHtml, initCommon, setupDialogClose } from '../components/common';
import { icon, hydrateIcons } from '../lib/icons';
import { formatMinutes, yen } from '../lib/menu';
import { BOOKABLE_STAFF, findStaff } from '../lib/staff';
import { CLOSE, OPEN, addDays, dayOfWeek, closedReason, formatDateJa, fromMin, jstNow, toMin } from '../lib/schedule';
import { repo, type Reservation, type Status } from '../lib/store';

/*
 * 店側の予約管理（デモ）。
 * パスワード「demo」は体験用の入口で、本番の認証機能ではありません。
 */
const AUTH_KEY = 'nagi-demo:admin-entered';
const root = document.querySelector<HTMLElement>('[data-admin]')!;
const dialog = document.getElementById('booking-dialog') as HTMLDialogElement;
const dialogBody = dialog.querySelector<HTMLElement>('[data-booking-body]')!;
const wide = window.matchMedia('(min-width: 900px)');

const STATUS_LABEL: Record<Status, string> = { confirmed: '確定', visited: '来店済み', cancelled: 'キャンセル' };

let list: Reservation[] = [];
let date = '';
let staffFilter: string = 'all';
let message = '';
let messageKind: 'ok' | 'error' = 'ok';
let highlightId: string | null = new URLSearchParams(location.search).get('id');
let opener: HTMLElement | null = null;

const entered = () => {
  try {
    return sessionStorage.getItem(AUTH_KEY) === '1';
  } catch {
    return false;
  }
};

function gate() {
  root.innerHTML = `
    <section class="gate" aria-labelledby="gate-title">
      <h1 id="gate-title" class="serif">店側の予約管理画面（デモ）</h1>
      <p>オーナー様に「予約管理もできます」をご覧いただくための体験用画面です。</p>
      <div class="alert alert--demo">${icon('lock')}<p style="margin:0">体験用パスワード：<b class="pw">demo</b><br /><span class="note">※画面に表示している体験用の入口です。本番の認証機能ではありません。</span></p></div>
      <form class="gate-form" data-gate novalidate>
        <div class="field">
          <label for="pw">パスワード</label>
          <input id="pw" name="pw" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-describedby="pw-err" />
          <p class="field-error" id="pw-err" role="alert"></p>
        </div>
        <button class="btn" type="submit">${icon('lock')}管理画面に入る</button>
      </form>
    </section>`;
  root.querySelector<HTMLFormElement>('[data-gate]')!.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = root.querySelector<HTMLInputElement>('#pw')!;
    if (input.value.trim().toLowerCase() === 'demo') {
      try {
        sessionStorage.setItem(AUTH_KEY, '1');
      } catch {
        /* noop */
      }
      void start();
    } else {
      input.setAttribute('aria-invalid', 'true');
      root.querySelector('#pw-err')!.innerHTML = `${icon('warning-circle', { size: 18 })}パスワードが違います。体験用パスワードは「demo」です。`;
      input.focus();
    }
  });
}

/** 初期表示の日付：指定がなければ、今日から7日間で予約がいちばん多い営業日（同数なら早い日） */
function pickInitialDate(): string {
  const p = new URLSearchParams(location.search).get('date');
  if (p && /^\d{4}-\d{2}-\d{2}$/.test(p)) return p;
  const today = jstNow().date;
  const limit = addDays(today, 7);
  const counts = new Map<string, number>();
  for (const r of list) {
    if (r.status === 'cancelled' || r.date < today || r.date > limit) continue;
    counts.set(r.date, (counts.get(r.date) ?? 0) + 1);
  }
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  return best?.[0] ?? today;
}

const dayList = () =>
  list
    .filter((r) => r.date === date)
    .sort((a, b) => a.start.localeCompare(b.start) || a.staffId.localeCompare(b.staffId));

function statsHtml(rs: Reservation[]) {
  const active = rs.filter((r) => r.status !== 'cancelled');
  const sales = active.reduce((s, r) => s + r.total, 0);
  const noms = active.filter((r) => r.nominated).length;
  return `
    <ul class="stats" aria-label="この日の概要">
      <li><span>予約</span><b>${active.length}<small>件</small></b></li>
      <li><span>指名</span><b>${noms}<small>件</small></b></li>
      <li><span>キャンセル</span><b>${rs.length - active.length}<small>件</small></b></li>
      <li><span>売上見込み（税込）</span><b>${sales.toLocaleString('ja-JP')}<small>円</small></b></li>
    </ul>`;
}

function badge(r: Reservation) {
  return `<span class="status status--${r.status}">${STATUS_LABEL[r.status]}</span>`;
}

const menuText = (r: Reservation) => r.items.map((i) => i.name).join('＋');

/* ---------- PC：スタッフ別タイムライン ---------- */
const PX = 1.5; // 1分あたりの高さ

function timelineHtml(rs: Reservation[]) {
  const height = (CLOSE - OPEN) * PX;
  const hours: string[] = [];
  for (let m = OPEN; m <= CLOSE; m += 30) {
    hours.push(`<div class="tl-hour ${m % 60 === 0 ? 'is-full' : ''}" style="top:${(m - OPEN) * PX}px"><span>${m % 60 === 0 || m === OPEN ? fromMin(m) : ''}</span></div>`);
  }
  const dow = dayOfWeek(date);
  const cols = BOOKABLE_STAFF.map((s) => {
    const shift = s.week[dow];
    const blocks = rs
      .filter((r) => r.staffId === s.id)
      .map((r) => {
        const top = (toMin(r.start) - OPEN) * PX;
        const h = r.minutes * PX;
        return `<button type="button" class="tl-block status-bg--${r.status} ${r.id === highlightId ? 'is-highlight' : ''}" style="top:${top}px;height:${h - 3}px" data-open="${r.id}"
            aria-label="${r.start}〜${r.end} ${escapeHtml(r.customer.name)} ${menuText(r)} ${yen(r.total)} ${r.nominated ? '指名あり' : '指名なし'} ${STATUS_LABEL[r.status]}">
            <span class="tl-time">${r.start}〜${r.end}</span>
            <span class="tl-name">${escapeHtml(r.customer.name)}</span>
            <span class="tl-menu">${menuText(r)}</span>
            <span class="tl-foot">${badge(r)}${r.nominated ? '<span class="nom">指名</span>' : ''}${r.usesSpaRoom ? '<span class="nom">個室</span>' : ''}<span class="tl-yen">${yen(r.total)}</span></span>
          </button>`;
      })
      .join('');
    const off = !shift || closedReason(date);
    const brk = shift
      ? `<div class="tl-break" style="top:${(toMin(shift.breakStart) - OPEN) * PX}px;height:${(toMin(shift.breakEnd) - toMin(shift.breakStart)) * PX}px"><span>休憩</span></div>
         ${toMin(shift.start) > OPEN ? `<div class="tl-break" style="top:0;height:${(toMin(shift.start) - OPEN) * PX}px"><span>勤務前</span></div>` : ''}`
      : '';
    return `
      <div class="tl-col" role="group" aria-label="${s.name}の予約">
        <div class="tl-col-head"><b>${s.name}</b><span>${s.role}${shift ? `｜${shift.start}〜${shift.end}` : ''}</span></div>
        <div class="tl-body" style="height:${height}px">${off ? `<div class="tl-off">${closedReason(date) ?? 'お休み'}</div>` : ''}${brk}${blocks}</div>
      </div>`;
  }).join('');
  // スパルームの使用状況（参考表示）
  const spa = rs
    .filter((r) => r.usesSpaRoom && r.status !== 'cancelled')
    .map((r) => `<div class="tl-spa" style="top:${(toMin(r.start) - OPEN) * PX}px;height:${r.minutes * PX - 3}px"><span>${r.start}〜${r.end}</span></div>`)
    .join('');
  return `
    <div class="timeline" style="--h:${height}px">
      <div class="tl-axis"><div class="tl-col-head" aria-hidden="true"></div><div class="tl-body" style="height:${height}px">${hours.join('')}</div></div>
      ${cols}
      <div class="tl-col tl-col--spa" role="group" aria-label="個室スパルームの使用状況">
        <div class="tl-col-head"><b>個室スパルーム</b><span>1室</span></div>
        <div class="tl-body" style="height:${height}px">${spa}</div>
      </div>
    </div>`;
}

/* ---------- スマホ：予約一覧 ---------- */
function listHtml(rs: Reservation[]) {
  const filtered = staffFilter === 'all' ? rs : rs.filter((r) => r.staffId === staffFilter);
  const tabs = [`<button type="button" class="chip" data-staff-filter="all" aria-pressed="${staffFilter === 'all'}">全員</button>`]
    .concat(BOOKABLE_STAFF.map((s) => `<button type="button" class="chip" data-staff-filter="${s.id}" aria-pressed="${staffFilter === s.id}">${s.name}</button>`))
    .join('');
  return `
    <div class="filter-chips" role="group" aria-label="担当者で絞り込む">${tabs}</div>
    ${
      filtered.length
        ? `<ul class="bk-list">${filtered
            .map(
              (r) => `
          <li class="bk-card status-line--${r.status} ${r.id === highlightId ? 'is-highlight' : ''}">
            <div class="bk-top"><span class="bk-time">${r.start}〜${r.end}</span>${badge(r)}</div>
            <p class="bk-name">${escapeHtml(r.customer.name)}</p>
            <p class="bk-menu">${menuText(r)}</p>
            <dl class="bk-dl">
              <div><dt>担当</dt><dd>${findStaff(r.staffId)?.name ?? ''}（${r.nominated ? '指名' : '指名なし'}）</dd></div>
              <div><dt>合計</dt><dd>${yen(r.total)}（税込）</dd></div>
              <div><dt>番号</dt><dd>${r.id}</dd></div>
            </dl>
            ${statusButtons(r)}
          </li>`,
            )
            .join('')}</ul>`
        : `<p class="summary-empty">この日の予約はありません。</p>`
    }`;
}

function statusButtons(r: Reservation) {
  return `<div class="status-btns" role="group" aria-label="${r.id} のステータス変更">
    ${(['confirmed', 'visited', 'cancelled'] as Status[])
      .map((s) => `<button type="button" class="chip chip--${s}" data-status="${s}" data-id="${r.id}" aria-pressed="${r.status === s}">${STATUS_LABEL[s]}</button>`)
      .join('')}
  </div>`;
}

function detailHtml(r: Reservation) {
  return `
    <h2 id="booking-title">${r.start}〜${r.end}　${escapeHtml(r.customer.name)}</h2>
    <p class="note" style="margin-top:-.5rem">${formatDateJa(r.date)}｜予約番号 ${r.id}</p>
    <ul class="summary-lines">
      ${r.items.map((i) => `<li><span>${i.kind === 'option' ? '＋ ' : ''}${i.name}</span><span class="sub">${formatMinutes(i.minutes)}｜${yen(i.price)}</span></li>`).join('')}
      ${r.nominated ? `<li><span>指名料</span><span class="sub">${yen(r.nominationFee)}</span></li>` : ''}
    </ul>
    <dl class="bk-dl">
      <div><dt>合計</dt><dd><b>${yen(r.total)}</b>（税込・予約時点の料金）</dd></div>
      <div><dt>所要</dt><dd>約${formatMinutes(r.minutes)}${r.usesSpaRoom ? '（個室スパルーム使用）' : ''}</dd></div>
      <div><dt>担当</dt><dd>${findStaff(r.staffId)?.name ?? ''}（${r.nominated ? '指名' : '指名なし・自動割当'}）</dd></div>
      <div><dt>電話</dt><dd>${escapeHtml(r.customer.phone)}</dd></div>
      ${r.customer.email ? `<div><dt>メール</dt><dd>${escapeHtml(r.customer.email)}</dd></div>` : ''}
      ${r.customer.note ? `<div><dt>ご要望</dt><dd>${escapeHtml(r.customer.note)}</dd></div>` : ''}
    </dl>
    <p class="sub-title" style="margin:1rem 0 .5rem;font-weight:700">ステータス</p>
    ${statusButtons(r)}
    <p class="field-error" data-dialog-msg role="alert"></p>`;
}

function render() {
  const rs = dayList();
  const today = jstNow().date;
  const closed = closedReason(date);
  root.innerHTML = `
    <div class="admin-top">
      <h1 class="serif admin-title">予約管理</h1>
      <div class="alert alert--demo">${icon('info-circle')}<p style="margin:0">この見本の予約は、お使いのブラウザ内に保存されます。別端末への共有や店舗への通知はありません。<br /><span class="note">体験用パスワードでの入室は、本番の認証機能ではありません。</span></p></div>
    </div>
    <div class="day-nav">
      <button type="button" class="btn btn--ghost btn--sm" data-day="-1">${icon('nav-arrow-left')}前日</button>
      <div class="day-pick">
        <label for="day-input" class="visually-hidden">表示する日付</label>
        <input id="day-input" type="date" value="${date}" />
        <p class="day-label" aria-live="polite">${formatDateJa(date)}${date === today ? '（今日）' : ''}${closed ? `<span class="day-closed">${closed.replace('です', '')}</span>` : ''}</p>
      </div>
      <button type="button" class="btn btn--ghost btn--sm" data-day="1">翌日${icon('nav-arrow-right')}</button>
    </div>
    ${message ? `<div class="alert ${messageKind === 'error' ? 'alert--error' : ''}" role="status">${icon(messageKind === 'error' ? 'warning-circle' : 'check')}<p style="margin:0">${escapeHtml(message)}</p></div>` : ''}
    ${statsHtml(rs)}
    <div class="admin-view">${wide.matches ? timelineHtml(rs) : listHtml(rs)}</div>
    <p class="note">キャンセルにした予約は空き枠に戻り、Web予約で選べるようになります。キャンセルから「確定」に戻すときは、重なる予約がないか確認します。</p>
    <div class="admin-foot">
      <a class="btn btn--sm" href="/reserve/">${icon('calendar')}予約を入れてみる（お客様画面）</a>
      <button type="button" class="btn btn--ghost btn--sm" data-reset>${icon('refresh')}デモデータを初期状態に戻す</button>
    </div>`;
  message = '';
  hydrateIcons(root);
  if (highlightId) {
    root.querySelector('.is-highlight')?.scrollIntoView({ block: 'center' });
  }
}

async function changeStatus(id: string, status: Status, fromDialog: boolean) {
  const res = await repo.updateStatus(id, status);
  list = await repo.list();
  if (res.ok) {
    message = `${res.value.start}〜 ${res.value.customer.name} を「${STATUS_LABEL[status]}」にしました。`;
    messageKind = 'ok';
  } else {
    message = res.reason;
    messageKind = 'error';
  }
  if (fromDialog) {
    const r = list.find((x) => x.id === id)!;
    dialogBody.innerHTML = detailHtml(r);
    if (!res.ok) dialogBody.querySelector('[data-dialog-msg]')!.textContent = res.reason;
    dialogBody.querySelector<HTMLElement>(`[data-status="${res.ok ? status : r.status}"]`)?.focus();
  }
  render();
  if (!fromDialog) root.querySelector<HTMLElement>(`[data-id="${id}"][data-status="${res.ok ? status : list.find((x) => x.id === id)!.status}"]`)?.focus();
}

function bind() {
  root.addEventListener('click', async (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('button');
    if (!b) return;
    if (b.dataset.day) {
      date = addDays(date, Number(b.dataset.day));
      highlightId = null;
      render();
      root.querySelector<HTMLElement>(`[data-day="${b.dataset.day}"]`)?.focus();
    } else if (b.dataset.staffFilter) {
      staffFilter = b.dataset.staffFilter;
      render();
      root.querySelector<HTMLElement>(`[data-staff-filter="${staffFilter}"]`)?.focus();
    } else if (b.dataset.status) {
      await changeStatus(b.dataset.id!, b.dataset.status as Status, false);
    } else if (b.dataset.open) {
      const r = list.find((x) => x.id === b.dataset.open);
      if (!r) return;
      opener = b;
      dialogBody.innerHTML = detailHtml(r);
      dialog.showModal();
    } else if (b.matches('[data-reset]')) {
      if (!confirm('この見本が保存した予約データを、初期状態に戻します。よろしいですか？')) return;
      await repo.reset();
      list = await repo.list();
      highlightId = null;
      date = pickInitialDate();
      message = 'デモデータを初期状態に戻しました。';
      messageKind = 'ok';
      render();
    }
  });
  root.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.id === 'day-input' && t.value) {
      date = t.value;
      highlightId = null;
      render();
      root.querySelector<HTMLElement>('#day-input')?.focus();
    }
  });
  dialogBody.addEventListener('click', async (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-status]');
    if (b) await changeStatus(b.dataset.id!, b.dataset.status as Status, true);
  });
  setupDialogClose(dialog, () => {
    const id = opener?.dataset.open;
    (id ? root.querySelector<HTMLElement>(`[data-open="${id}"]`) : null)?.focus();
  });
  wide.addEventListener('change', render);
}

async function start() {
  list = await repo.list();
  date = pickInitialDate();
  bind();
  render();
  root.querySelector<HTMLElement>('.admin-title')?.setAttribute('tabindex', '-1');
}

initCommon();
if (entered()) void start();
else gate();
