import {
  BASE_MENUS,
  OPTION_MENUS,
  findOption,
  formatMinutes,
  normalizeSelection,
  optionBlockedReason,
  quote,
  yen,
  type Quote,
  type Selection,
} from '../lib/menu';
import { BOOKABLE_STAFF, findStaff, staffCannotReason } from '../lib/staff';
import { CLOSE, fromMin } from '../lib/schedule';
import { icon } from '../lib/icons';
import { loadChoice, prefersReducedMotion, reserveUrl, saveChoice } from './common';

const CATEGORIES: { key: string; label: string; en: string; icon: Parameters<typeof icon>[0] }[] = [
  { key: 'cut', label: 'カット', en: 'Cut', icon: 'scissor' },
  { key: 'color', label: 'カラー', en: 'Color', icon: 'palette' },
  { key: 'perm', label: 'パーマ', en: 'Perm', icon: 'perm' },
  { key: 'straight', label: '縮毛矯正', en: 'Straight', icon: 'comb' },
  { key: 'spa', label: 'ヘッドスパ', en: 'Head Spa', icon: 'spa' },
  { key: 'kids', label: 'キッズ', en: 'Kids', icon: 'kids' },
];

/** 料金表（共通データから描画） */
export function renderPriceTable(root: HTMLElement) {
  const blocks = CATEGORIES.map((c) => {
    const rows = BASE_MENUS.filter((m) => m.category === c.key)
      .map(
        (m) => `
        <li class="price-row">
          <div class="price-name">
            <h4>${m.name}</h4>
            ${m.audience ? `<span class="tag">${m.audience}</span>` : ''}
            <p>${m.description}</p>
          </div>
          <div class="price-meta">
            <span class="price-time">${icon('clock', { size: 18 })}${formatMinutes(m.minutes)}<small>（最終受付 ${fromMin(CLOSE - m.minutes)}）</small></span>
            <span class="price-yen">${yen(m.price)}<small>税込</small></span>
          </div>
        </li>`,
      )
      .join('');
    return `
      <section class="price-cat">
        <h3>${icon(c.icon, { size: 28 })}<span>${c.label}</span><span class="en">${c.en}</span></h3>
        <ul>${rows}</ul>
        ${c.key === 'cut' ? '<p class="note price-mens">メンズの方：カット・カラーなど、すべて同じ料金です（メンズ料金の加算はありません）。</p>' : ''}
      </section>`;
  }).join('');

  const options = OPTION_MENUS.map(
    (o) => `
      <li class="price-row">
        <div class="price-name"><h4>${o.name}</h4><p>${o.description}</p></div>
        <div class="price-meta">
          <span class="price-time">${icon('clock', { size: 18 })}追加 ${formatMinutes(o.minutes)}</span>
          <span class="price-yen">＋${yen(o.price)}<small>税込</small></span>
        </div>
      </li>`,
  ).join('');

  const fees = BOOKABLE_STAFF.map(
    (s) => `<li class="price-row price-row--fee"><div class="price-name"><h4>${s.name}<small>（${s.role}）</small></h4></div><div class="price-meta"><span class="price-yen">＋${yen(s.nominationFee)}</span></div></li>`,
  ).join('');

  root.innerHTML = `
    <div class="price-cats">${blocks}</div>
    <div class="price-extra">
      <section class="price-cat">
        <h3>${icon('sparks', { size: 28 })}<span>追加オプション</span><span class="en">Option</span></h3>
        <p class="note">基本メニューに追加できるメニューです。表示は追加分の料金と時間です。</p>
        <ul>${options}</ul>
      </section>
      <section class="price-cat">
        <h3>${icon('user', { size: 28 })}<span>指名料</span><span class="en">Nomination</span></h3>
        <p class="note">指名した場合のみ、ご予約1件につき1回かかります。指名なしは0円です。</p>
        <ul>${fees}<li class="price-row price-row--fee"><div class="price-name"><h4>指名なし</h4></div><div class="price-meta"><span class="price-yen">0円</span></div></li></ul>
      </section>
    </div>`;
}

/* ---------------- 合計表示（シミュレーター・予約画面で共通） ---------------- */

export function summaryLinesHtml(q: Quote, staffLabel?: string): string {
  const lines = q.items
    .map(
      (i) =>
        `<li><span>${i.kind === 'option' ? '＋ ' : ''}${i.name}</span><span class="sub">${i.kind === 'option' ? '追加' : ''}${formatMinutes(i.minutes)}｜${yen(i.price)}</span></li>`,
    )
    .join('');
  const fee =
    q.nominationFee > 0
      ? `<li><span>指名料${staffLabel ? `（${staffLabel}）` : ''}</span><span class="sub">${yen(q.nominationFee)}</span></li>`
      : staffLabel
        ? `<li><span>指名なし</span><span class="sub">0円</span></li>`
        : '';
  return `<ul class="summary-lines">${lines}${fee}</ul>`;
}

/** 金額表示を短くカウントアップさせる（装飾のみ。待たせない） */
function animateNumber(el: HTMLElement, to: number) {
  const from = Number(el.dataset.value ?? 0);
  el.dataset.value = String(to);
  if (prefersReducedMotion() || from === to) {
    el.textContent = to.toLocaleString('ja-JP');
    return;
  }
  const start = performance.now();
  const dur = 350;
  const step = (t: number) => {
    const p = Math.min(1, (t - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (to - from) * eased).toLocaleString('ja-JP');
    if (p < 1 && el.dataset.value === String(to)) requestAnimationFrame(step);
    else if (el.dataset.value === String(to)) el.textContent = to.toLocaleString('ja-JP');
  };
  requestAnimationFrame(step);
}

/* ---------------- 料金シミュレーター ---------------- */

export function initSimulator(root: HTMLElement) {
  const baseList = root.querySelector<HTMLElement>('[data-base-list]')!;
  const optList = root.querySelector<HTMLElement>('[data-option-list]')!;
  const staffList = root.querySelector<HTMLElement>('[data-staff-list]')!;
  const summary = root.querySelector<HTMLElement>('[data-sim-summary]')!;

  const saved = loadChoice();
  let sel: Selection = normalizeSelection({ baseId: saved?.baseId ?? null, optionIds: saved?.optionIds ?? [] }).selection;
  let staffId: string | null = saved?.staffId ?? null;
  let notice = '';

  baseList.innerHTML = BASE_MENUS.map(
    (m) => `
      <label class="choice">
        <input type="radio" name="sim-base" value="${m.id}" />
        <span class="choice-body">
          <span class="choice-name">${m.name}</span>
          <span class="choice-meta">${formatMinutes(m.minutes)}<b>${yen(m.price)}</b></span>
        </span>
      </label>`,
  ).join('');

  optList.innerHTML = OPTION_MENUS.map(
    (o) => `
      <label class="choice choice--check">
        <input type="checkbox" name="sim-opt" value="${o.id}" aria-describedby="why-${o.id}" />
        <span class="choice-body">
          <span class="choice-name">＋ ${o.name}</span>
          <span class="choice-meta">追加${formatMinutes(o.minutes)}<b>＋${yen(o.price)}</b></span>
          <span class="choice-why" id="why-${o.id}"></span>
        </span>
      </label>`,
  ).join('');

  staffList.innerHTML = [
    `<label class="choice choice--compact"><input type="radio" name="sim-staff" value="" /><span class="choice-body"><span class="choice-name">指名なし</span><span class="choice-meta"><b>0円</b></span></span></label>`,
    ...BOOKABLE_STAFF.map(
      (s) => `<label class="choice choice--compact"><input type="radio" name="sim-staff" value="${s.id}" aria-describedby="why-staff-${s.id}" /><span class="choice-body"><span class="choice-name">${s.name}</span><span class="choice-meta">指名料<b>＋${yen(s.nominationFee)}</b></span><span class="choice-why" id="why-staff-${s.id}"></span></span></label>`,
    ),
  ].join('');

  summary.innerHTML = `
    <div class="summary" aria-labelledby="sim-sum-title">
      <h3 id="sim-sum-title">選んだ内容と合計</h3>
      <div data-sum-body></div>
      <div class="summary-total">
        <span class="price"><span data-sum-price aria-hidden="true">0</span><small aria-hidden="true">円（税込）</small></span>
        <span class="time" aria-hidden="true">${icon('clock', { size: 20 })}<span data-sum-time>—</span></span>
      </div>
      <p class="visually-hidden" aria-live="polite" data-sum-live></p>
      <p class="sim-notice" data-sum-notice role="status"></p>
      <div class="sum-cta" data-sum-cta></div>
    </div>
    <div class="sim-mini" data-sim-mini aria-hidden="true">
      <span><b data-mini-price>—</b><small data-mini-time></small></span>
      <a href="#sim-sum-title" tabindex="-1">内訳を見る</a>
    </div>`;

  const body = summary.querySelector<HTMLElement>('[data-sum-body]')!;
  const priceEl = summary.querySelector<HTMLElement>('[data-sum-price]')!;
  const timeEl = summary.querySelector<HTMLElement>('[data-sum-time]')!;
  const live = summary.querySelector<HTMLElement>('[data-sum-live]')!;
  const noticeEl = summary.querySelector<HTMLElement>('[data-sum-notice]')!;
  const cta = summary.querySelector<HTMLElement>('[data-sum-cta]')!;
  const mini = summary.querySelector<HTMLElement>('[data-sim-mini]')!;
  let liveTimer = 0;

  // スマホ：シミュレーターを見ている間だけ、画面下に合計の帯を出す（内訳が見えている間は隠す）
  if ('IntersectionObserver' in window) {
    let inSim = false;
    let sumVisible = false;
    const update = () => mini.classList.toggle('is-shown', inSim && !sumVisible);
    new IntersectionObserver(([e]) => {
      inSim = e.isIntersecting;
      update();
    }).observe(root.querySelector('.sim-steps')!);
    new IntersectionObserver(([e]) => {
      sumVisible = e.isIntersecting;
      update();
    }, { threshold: 0.3 }).observe(summary.querySelector('.summary')!);
  }

  function render() {
    const q0 = quote(sel);
    // 選んだ担当が施術を担当できない場合は指名を外す
    const staff = findStaff(staffId);
    if (staff && q0.valid && staffCannotReason(staff, q0.treatments)) {
      notice = `指名を外しました（${staff.name}：${staffCannotReason(staff, q0.treatments)}）。`;
      staffId = null;
    }
    const fee = findStaff(staffId)?.nominationFee ?? 0;
    const q = quote(sel, fee);

    baseList.querySelectorAll<HTMLInputElement>('input').forEach((i) => (i.checked = i.value === sel.baseId));
    optList.querySelectorAll<HTMLInputElement>('input').forEach((i) => {
      const reason = optionBlockedReason(sel.baseId, i.value);
      i.checked = sel.optionIds.includes(i.value);
      i.disabled = !!reason;
      i.closest('.choice')!.classList.toggle('is-disabled', !!reason);
      const why = document.getElementById(`why-${i.value}`)!;
      // 未選択のときは注意ではなく案内として表示する
      why.textContent = reason ? (sel.baseId ? `選べません：${reason}` : reason) : '';
      why.classList.toggle('is-hint', !sel.baseId);
    });
    staffList.querySelectorAll<HTMLInputElement>('input').forEach((i) => {
      const s = findStaff(i.value);
      const reason = s && q0.valid ? staffCannotReason(s, q0.treatments) : null;
      i.checked = (i.value || null) === staffId;
      i.disabled = !!reason;
      i.closest('.choice')!.classList.toggle('is-disabled', !!reason);
      if (s) document.getElementById(`why-staff-${s.id}`)!.textContent = reason ? `選べません：${reason}` : '';
    });

    if (!q.valid) {
      body.innerHTML = `<p class="summary-empty">${icon('info-circle', { size: 20 })} ${q.message}</p>`;
      timeEl.textContent = '—';
      cta.innerHTML = `<button type="button" class="btn btn--block" disabled aria-describedby="sim-need">このメニューで予約する</button><p class="note" id="sim-need">予約に進むには、基本メニューを1つ選んでください。</p>`;
    } else {
      body.innerHTML = summaryLinesHtml(q, findStaff(staffId)?.name ?? '指名なし');
      timeEl.textContent = `約${formatMinutes(q.minutes)}`;
      const href = reserveUrl({ ...sel, staffId });
      cta.innerHTML = `<a class="btn btn--block" href="${href}">${icon('calendar')}このメニューで予約する</a>`;
    }
    animateNumber(priceEl, q.total);
    mini.querySelector('[data-mini-price]')!.textContent = q.valid ? yen(q.total) : '基本メニューを選んでください';
    mini.querySelector('[data-mini-time]')!.textContent = q.valid ? `約${formatMinutes(q.minutes)}` : '';
    noticeEl.textContent = notice;
    notice = '';
    // 読み上げは最終結果だけ（連続通知しない）
    window.clearTimeout(liveTimer);
    liveTimer = window.setTimeout(() => {
      live.textContent = q.valid ? `合計 ${yen(q.total)}（税込）、所要時間 約${formatMinutes(q.minutes)}` : q.message ?? '';
    }, 600);
    saveChoice({ ...sel, staffId });
  }

  root.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name === 'sim-base') {
      const res = normalizeSelection({ baseId: t.value, optionIds: sel.optionIds });
      sel = res.selection;
      if (res.removed.length) {
        notice = res.removed.map((r) => `「${findOption(r.id)?.name}」を外しました（${r.reason}）`).join(' ');
      }
    } else if (t.name === 'sim-opt') {
      const ids = t.checked ? [...sel.optionIds, t.value] : sel.optionIds.filter((x) => x !== t.value);
      sel = normalizeSelection({ baseId: sel.baseId, optionIds: ids }).selection;
    } else if (t.name === 'sim-staff') {
      staffId = t.value || null;
    }
    render();
  });

  render();
}
