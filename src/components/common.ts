import { hydrateIcons, icon, brandIcon } from '../lib/icons';
import { selectionToParams, type Selection } from '../lib/menu';

const SIM_KEY = 'nagi-demo:simulator';

export interface SavedChoice extends Selection {
  staffId: string | null;
}

export function saveChoice(c: SavedChoice) {
  try {
    sessionStorage.setItem(SIM_KEY, JSON.stringify(c));
  } catch {
    /* 保存できなくても動作は続ける */
  }
}

export function loadChoice(): SavedChoice | null {
  try {
    const raw = sessionStorage.getItem(SIM_KEY);
    return raw ? (JSON.parse(raw) as SavedChoice) : null;
  } catch {
    return null;
  }
}

/** 予約ページへの URL（選んだメニュー・スタッフを引き継ぐ） */
export function reserveUrl(c: Partial<SavedChoice> | null): string {
  const params = new URLSearchParams();
  if (c) {
    selectionToParams({ baseId: c.baseId ?? null, optionIds: c.optionIds ?? [] }, params);
    if (c.staffId) params.set('staff', c.staffId);
  }
  const q = params.toString();
  return `/reserve/${q ? `?${q}` : ''}`;
}

type DemoKind = 'tel' | 'line' | 'hpb' | 'instagram' | 'x';

const DEMO_TEXT: Record<DemoKind, { title: string; icon: string; body: string }> = {
  tel: {
    title: '電話する（デモ）',
    icon: icon('phone'),
    body: `<p>実際のお店のサイトでは、このボタンを押すと<b>すぐにお店へ電話がかかります</b>（スマホの電話アプリが開きます）。</p>
      <p class="note">見本のため、ダミー番号 000-0000-0000 には接続しません。</p>`,
  },
  line: {
    title: '公式LINE（デモ）',
    icon: brandIcon('line'),
    body: `<p>実際には LINE アプリが開き、お店の公式アカウントを<b>友だち追加</b>できます。トークで予約の相談をしたり、お知らせを受け取ったりできます。</p>
      <p class="note">見本のため、実在のアカウントには接続しません。</p>`,
  },
  hpb: {
    title: 'ホットペッパービューティー（デモ）',
    icon: icon('calendar'),
    body: `<p>実際には、お店の<b>ホットペッパービューティー掲載ページ</b>が開き、そちらからも予約できます。</p>
      <p class="note">このサイトの予約データと、ホットペッパービューティーの空き状況は連携していません（リンクを置くだけの見本です）。</p>`,
  },
  instagram: {
    title: 'Instagram（デモ）',
    icon: brandIcon('instagram'),
    body: `<p>実際には、お店の<b>Instagram アカウント</b>が開き、最新のスタイル写真を見ていただけます。</p>
      <p class="note">このページの写真は「掲載イメージ」です。実際の投稿やアカウントとは連携していません。</p>`,
  },
  x: {
    title: 'X（デモ）',
    icon: brandIcon('x'),
    body: `<p>実際には、お店の<b>X アカウント</b>が開き、臨時休業や空き状況のお知らせを見ていただけます。</p>
      <p class="note">見本のため、実在のアカウントには接続しません。</p>`,
  },
};

function setupDemoDialog() {
  const dialog = document.getElementById('demo-dialog') as HTMLDialogElement | null;
  if (!dialog) return;
  let opener: HTMLElement | null = null;
  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-demo]');
    if (!btn) return;
    const kind = btn.dataset.demo as DemoKind;
    const t = DEMO_TEXT[kind];
    if (!t) return;
    e.preventDefault();
    opener = btn;
    dialog.querySelector('#demo-dialog-title')!.innerHTML = `${t.icon}<span>${t.title}</span>`;
    dialog.querySelector('[data-demo-body]')!.innerHTML = t.body;
    dialog.showModal();
  });
  setupDialogClose(dialog, () => opener?.focus());
}

/** 閉じるボタン・背景クリック・Esc で閉じ、元の位置へフォーカスを戻す */
export function setupDialogClose(dialog: HTMLDialogElement, onClose?: () => void) {
  dialog.querySelectorAll<HTMLElement>('.dialog-close').forEach((b) => {
    if (!b.innerHTML.trim()) b.innerHTML = icon('xmark', { size: 26 });
  });
  dialog.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t === dialog || t.closest('[data-close]')) dialog.close();
  });
  dialog.addEventListener('close', () => onClose?.());
}

function setupReserveLinks() {
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-reserve-link]');
    if (!a) return;
    const c = loadChoice();
    if (c?.baseId) a.href = reserveUrl(c);
  });
}

function setupHeader() {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

export function initCommon() {
  hydrateIcons();
  setupDemoDialog();
  setupReserveLinks();
  setupHeader();
}

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
