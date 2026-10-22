import { CATEGORY_LABEL, STYLES, catLabel, type Category } from '../lib/gallery';
import { prefersReducedMotion, setupDialogClose } from './common';

type Filter = Category | 'all';

/** スタイル一覧（カテゴリで絞り込み）。HAIR CATALOG のタイルからカテゴリを引き継いで絞り込める */
export function initGallery(section: HTMLElement) {
  const filtersEl = section.querySelector<HTMLElement>('[data-gallery-filters]')!;
  const grid = section.querySelector<HTMLUListElement>('[data-gallery-grid]')!;
  const empty = section.querySelector<HTMLElement>('[data-gallery-empty]')!;
  const count = section.querySelector<HTMLElement>('[data-gallery-count]')!;
  let filter: Filter = 'all';

  filtersEl.innerHTML = `
    <div class="filter-chips" role="group" aria-label="カテゴリで絞り込む">
      <button type="button" class="chip" data-v="all" aria-pressed="true">すべて</button>
      ${(Object.keys(CATEGORY_LABEL) as Category[])
        .map((v) => `<button type="button" class="chip" data-v="${v}" aria-pressed="false">${CATEGORY_LABEL[v].ja}</button>`)
        .join('')}
    </div>`;

  grid.innerHTML = STYLES.map(
    (s, i) => `
      <li class="g-item" data-cats="${s.cats.join(' ')}" data-flip-id="g${i}">
        <button type="button" class="g-open" data-index="${i}" aria-label="${s.title}（${catLabel(s)}）を拡大する">
          <img src="/images/${s.sm}" width="${s.w}" height="${s.h}" alt="${s.alt}" loading="lazy" decoding="async"${s.pos ? ` style="object-position:${s.pos}"` : ''} />
        </button>
        <p class="g-cap">${s.title}<span>${catLabel(s)}</span></p>
      </li>`,
  ).join('');
  const items = [...grid.querySelectorAll<HTMLLIElement>('.g-item')];

  // FLIP アニメーションは GSAP Flip を必要になった時だけ読み込む
  type FlipLib = { gsap: typeof import('gsap').gsap; Flip: typeof import('gsap/Flip').Flip };
  let flipMod: Promise<FlipLib> | null = null;
  const loadFlip = () =>
    (flipMod ??= Promise.all([import('gsap'), import('gsap/Flip')]).then(([g, f]) => {
      g.gsap.registerPlugin(f.Flip);
      return { gsap: g.gsap, Flip: f.Flip };
    }));

  async function apply() {
    const match = (el: HTMLElement) => filter === 'all' || (el.dataset.cats ?? '').split(' ').includes(filter);
    let lib: FlipLib | null = null;
    let state: ReturnType<FlipLib['Flip']['getState']> | null = null;
    if (!prefersReducedMotion()) {
      try {
        lib = await loadFlip();
        state = lib.Flip.getState(items);
      } catch {
        lib = null; // 読み込めなくても絞り込みは動かす
      }
    }
    let n = 0;
    items.forEach((el) => {
      const ok = match(el);
      el.hidden = !ok;
      if (ok) n++;
    });
    if (lib && state) {
      const { gsap, Flip } = lib;
      Flip.from(state, {
        duration: 0.55,
        ease: 'power2.inOut',
        absolute: true,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.4 }),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.94, duration: 0.3 }),
      });
    }
    empty.hidden = n > 0;
    count.textContent = `${n}件のスタイル${filter !== 'all' ? `（${CATEGORY_LABEL[filter].ja}で絞り込み中）` : ''}`;
  }

  const setFilter = (v: Filter) => {
    filter = v;
    filtersEl.querySelectorAll<HTMLButtonElement>('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.v === v)));
    return apply();
  };

  filtersEl.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.chip');
    if (b) void setFilter(b.dataset.v as Filter);
  });

  section.querySelector('[data-gallery-reset]')!.addEventListener('click', () => {
    void setFilter('all').then(() => filtersEl.querySelector<HTMLButtonElement>('.chip')!.focus());
  });

  // HAIR CATALOG のタイル：カテゴリを引き継いで一覧を絞り込み、一覧へ移動する
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('[data-cat-link]');
    if (!a) return;
    e.preventDefault();
    const v = a.dataset.catLink as Filter;
    void setFilter(v);
    const list = section.querySelector<HTMLElement>('#style-list')!;
    list.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    filtersEl.querySelector<HTMLButtonElement>(`.chip[data-v="${v}"]`)?.focus({ preventScroll: true });
    history.replaceState(null, '', `#style-list`);
  });

  // 先読み（操作の邪魔をしない時間帯に）
  if ('requestIdleCallback' in window) requestIdleCallback(() => void loadFlip().catch(() => {}));

  void apply();
  initLightbox(grid);
}

function initLightbox(grid: HTMLElement) {
  const dlg = document.getElementById('lightbox') as HTMLDialogElement;
  const img = dlg.querySelector<HTMLImageElement>('[data-lightbox-img]')!;
  const title = dlg.querySelector<HTMLElement>('[data-lightbox-title]')!;
  const tags = dlg.querySelector<HTMLElement>('[data-lightbox-tags]')!;
  let opener: HTMLElement | null = null;
  let current = 0;

  const visible = () =>
    [...grid.querySelectorAll<HTMLButtonElement>('.g-item:not([hidden]) .g-open')].map((b) => Number(b.dataset.index));

  const show = (i: number) => {
    current = i;
    const s = STYLES[i];
    img.src = `/images/${s.file}`;
    img.alt = s.alt;
    img.width = s.w;
    img.height = s.h;
    title.textContent = s.title;
    tags.textContent = `カテゴリ：${catLabel(s)}`;
  };
  const move = (d: number) => {
    const list = visible();
    const pos = list.indexOf(current);
    show(list[(pos + d + list.length) % list.length]);
  };

  grid.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.g-open');
    if (!b) return;
    opener = b;
    show(Number(b.dataset.index));
    dlg.showModal();
  });
  dlg.querySelector('[data-lightbox-prev]')!.addEventListener('click', () => move(-1));
  dlg.querySelector('[data-lightbox-next]')!.addEventListener('click', () => move(1));
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') move(1);
    if (e.key === 'ArrowLeft') move(-1);
  });
  // 閉じたら、開いた写真のボタン（または今表示していた写真）へフォーカスを戻す
  setupDialogClose(dlg, () => {
    const target = grid.querySelector<HTMLButtonElement>(`.g-open[data-index="${current}"]`) ?? opener;
    target?.focus();
  });
}
