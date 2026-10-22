import { BASE_MENUS, yen } from '../lib/menu';
import { STAFF, staffCannotReason } from '../lib/staff';
import { icon } from '../lib/icons';
import { loadChoice, reserveUrl } from './common';

const WEEK = ['日', '月', '火', '水', '木', '金', '土'];

export function renderStaff(root: HTMLElement) {
  root.innerHTML = STAFF.map((s) => {
    const off = s.week.map((w, d) => (w || d === 1 ? null : WEEK[d])).filter(Boolean);
    const shift = s.week.find(Boolean)!;
    const menus = s.bookable
      ? BASE_MENUS.filter((m) => !staffCannotReason(s, m.includes)).map((m) => m.name)
      : [];
    const cannot = s.bookable ? BASE_MENUS.filter((m) => staffCannotReason(s, m.includes)).map((m) => m.name) : [];
    return `
    <article class="staff-card ${s.bookable ? '' : 'staff-card--assist'}" aria-labelledby="staff-${s.id}">
      <div class="staff-head">
        <figure class="staff-portrait">
          <span class="initials" aria-hidden="true">${s.initials}</span>
          <figcaption>スタッフ写真（見本）</figcaption>
        </figure>
        <div>
          <p class="staff-role">${s.role}</p>
          <h3 id="staff-${s.id}">${s.name}<small>${s.kana}</small></h3>
        </div>
      </div>
      <div class="staff-body">
        <dl class="staff-dl">
          <div><dt>得意なスタイル</dt><dd><ul class="tags">${s.specialties.map((t) => `<li>${t}</li>`).join('')}</ul></dd></div>
          <div><dt>大切にしていること</dt><dd>${s.approach}</dd></div>
          ${
            s.bookable
              ? `<div><dt>担当できるメニュー</dt><dd>${menus.join('・')}${cannot.length ? `<br /><span class="note">※${cannot.join('・')}は担当していません</span>` : ''}</dd></div>
                 <div><dt>勤務</dt><dd>${shift.start}〜${shift.end}（${off.join('・')}曜休み）</dd></div>
                 <div><dt>指名料</dt><dd class="fee">${yen(s.nominationFee)}<span class="note">（指名した場合のみ・1回）</span></dd></div>`
              : `<div><dt>担当</dt><dd>${s.supportNote}</dd></div>`
          }
        </dl>
        ${
          s.bookable
            ? `<a class="btn" href="${reserveUrl({ staffId: s.id })}" data-staff-reserve="${s.id}">${icon('calendar')}${s.name.split(' ')[0]}を指名して予約する</a>`
            : ''
        }
      </div>
    </article>`;
  }).join('');

  // シミュレーターで選んだメニューも、担当できるものなら引き継ぐ
  root.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('[data-staff-reserve]');
    if (!a) return;
    const c = loadChoice();
    a.href = reserveUrl({ baseId: c?.baseId ?? null, optionIds: c?.optionIds ?? [], staffId: a.dataset.staffReserve! });
  });
}
