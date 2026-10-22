import { COMPARE_PAIRS } from '../lib/gallery';

/**
 * スタイル比較スライダー。
 * ドラッグ（range input をそのまま重ねている）、矢印キー、切替ボタンのどれでも操作できる。
 */
export function initCompare(stage: HTMLElement, tabs: HTMLElement) {
  let pairIdx = 0;

  tabs.innerHTML = COMPARE_PAIRS.map(
    (p, i) =>
      `<button type="button" role="tab" id="cmp-tab-${i}" aria-controls="cmp-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${p.label}</button>`,
  ).join('');

  stage.innerHTML = `
    <div id="cmp-panel" role="tabpanel" aria-labelledby="cmp-tab-0">
      <div class="compare-frame" style="--pos:50%">
        <img class="cmp-b" alt="" />
        <img class="cmp-a" alt="" />
        <span class="cmp-label cmp-label--a" aria-hidden="true">スタイルA</span>
        <span class="cmp-label cmp-label--b" aria-hidden="true">スタイルB</span>
        <span class="cmp-handle" aria-hidden="true"><span></span></span>
        <input class="cmp-range" type="range" min="0" max="100" step="1" value="50"
          aria-label="スタイルAとスタイルBの境目の位置（左右の矢印キーで動かせます）" />
      </div>
      <dl class="compare-notes">
        <div><dt>スタイルA</dt><dd data-note-a></dd></div>
        <div><dt>スタイルB</dt><dd data-note-b></dd></div>
      </dl>
      <div class="compare-buttons" role="group" aria-label="表示の切り替え">
        <button type="button" class="btn btn--ghost btn--sm" data-pos="100">スタイルAだけ</button>
        <button type="button" class="btn btn--ghost btn--sm" data-pos="50">半分ずつ</button>
        <button type="button" class="btn btn--ghost btn--sm" data-pos="0">スタイルBだけ</button>
      </div>
      <p class="note">別のモデルによるイメージ写真の比較です（施術前・施術後ではありません）。</p>
    </div>`;

  const frame = stage.querySelector<HTMLElement>('.compare-frame')!;
  const range = stage.querySelector<HTMLInputElement>('.cmp-range')!;
  const imgA = stage.querySelector<HTMLImageElement>('.cmp-a')!;
  const imgB = stage.querySelector<HTMLImageElement>('.cmp-b')!;
  const panel = stage.querySelector<HTMLElement>('#cmp-panel')!;

  const setPos = (v: number) => {
    range.value = String(v);
    frame.style.setProperty('--pos', `${v}%`);
    range.setAttribute('aria-valuetext', v >= 100 ? 'スタイルAのみ表示' : v <= 0 ? 'スタイルBのみ表示' : `左${v}%がスタイルA、右${100 - v}%がスタイルB`);
  };

  const showPair = (i: number) => {
    pairIdx = i;
    const p = COMPARE_PAIRS[i];
    imgA.src = `/images/${p.a.file}`;
    imgA.alt = `スタイルA：${p.a.alt}`;
    imgB.src = `/images/${p.b.file}`;
    imgB.alt = `スタイルB：${p.b.alt}`;
    stage.querySelector('[data-note-a]')!.textContent = p.aNote;
    stage.querySelector('[data-note-b]')!.textContent = p.bNote;
    tabs.querySelectorAll<HTMLButtonElement>('[role=tab]').forEach((t, j) => {
      t.setAttribute('aria-selected', String(j === i));
      t.tabIndex = j === i ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', `cmp-tab-${i}`);
    setPos(50);
  };

  range.addEventListener('input', () => setPos(Number(range.value)));
  stage.querySelectorAll<HTMLButtonElement>('[data-pos]').forEach((b) =>
    b.addEventListener('click', () => setPos(Number(b.dataset.pos))),
  );
  tabs.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLButtonElement>('[role=tab]');
    if (t) showPair(Number(t.id.split('-').pop()));
  });
  tabs.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const n = COMPARE_PAIRS.length;
    const next = (pairIdx + (e.key === 'ArrowRight' ? 1 : n - 1)) % n;
    showPair(next);
    tabs.querySelector<HTMLButtonElement>(`#cmp-tab-${next}`)!.focus();
  });

  showPair(0);
}
