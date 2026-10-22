import { LENGTH_LABEL, MOOD_LABEL, STYLES, type Length, type Mood } from '../lib/gallery';
import { prefersReducedMotion, setupDialogClose } from './common';

type Filter = { length: Length | 'all'; mood: Mood | 'all' };

export function initGallery(section: HTMLElement) {
  const filtersEl = section.querySelector<HTMLElement>('[data-gallery-filters]')!;
  const grid = section.querySelector<HTMLUListElement>('[data-gallery-grid]')!;
  const empty = section.querySelector<HTMLElement>('[data-gallery-empty]')!;
  const count = section.querySelector<HTMLElement>('[data-gallery-count]')!;
  const filter: Filter = { length: 'all', mood: 'all' };

  const group = (key: keyof Filter, label: string, labels: Record<string, string>) => `
    <div class="filter-group" role="group" aria-label="${label}で絞り込む">
      <span class="filter-label">${label}</span>
      <div class="filter-chips">
        <button type="button" class="chip" data-f="${key}" data-v="all" aria-pressed="true">すべて</button>
        ${Object.entries(labels)
          .map(([v, l]) => `<button type="button" class="chip" data-f="${key}" data-v="${v}" aria-pressed="false">${l}</button>`)
          .join('')}
      </div>
    </div>`;
  filtersEl.innerHTML = group('length', '長さ', LENGTH_LABEL) + group('mood', '雰囲気', MOOD_LABEL);

  grid.innerHTML = STYLES.map(
    (s, i) => `
      <li class="g-item" data-length="${s.length}" data-mood="${s.mood}" data-flip-id="g${i}" style="--ratio:${s.w / s.h}">
        <button type="button" class="g-open" data-index="${i}" aria-label="${s.title}（${LENGTH_LABEL[s.length]}・${MOOD_LABEL[s.mood]}）を拡大する">
          <img src="/images/${s.file}" width="${s.w}" height="${s.h}" alt="${s.alt}" loading="lazy" decoding="async" />
        </button>
        <p class="g-cap">${s.title}<span>${LENGTH_LABEL[s.length]}・${MOOD_LABEL[s.mood]}</span></p>
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
    const match = (el: HTMLElement) =>
      (filter.length === 'all' || el.dataset.length === filter.length) && (filter.mood === 'all' || el.dataset.mood === filter.mood);
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
    count.textContent = `${n}件のスタイル${filter.length !== 'all' || filter.mood !== 'all' ? '（絞り込み中）' : ''}`;
  }

  filtersEl.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.chip');
    if (!b) return;
    const key = b.dataset.f as keyof Filter;
    (filter as Record<string, string>)[key] = b.dataset.v!;
    filtersEl.querySelectorAll<HTMLButtonElement>(`.chip[data-f="${key}"]`).forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
    void apply();
  });

  section.querySelector('[data-gallery-reset]')!.addEventListener('click', () => {
    filter.length = 'all';
    filter.mood = 'all';
    filtersEl.querySelectorAll<HTMLButtonElement>('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.v === 'all')));
    void apply().then(() => filtersEl.querySelector<HTMLButtonElement>('.chip')!.focus());
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
    tags.textContent = `長さ：${LENGTH_LABEL[s.length]}　雰囲気：${MOOD_LABEL[s.mood]}`;
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
