/**
 * 装飾的な演出（任意）。失敗しても本文は必ず表示される作り。
 * - 鏡の曇りが晴れる：写真領域だけ。文字やボタンはぼかさない。初回のみ・スキップ可。
 * - 見出しのマスク表示：JS が使えて、動きを減らす設定でない時だけ有効化。
 * - 葉の影：CSS アニメーション。reduced-motion では静止。
 */
import { prefersReducedMotion } from './common';

const FOG_KEY = 'nagi-demo:fog-seen';

export function initMirrorFog() {
  const fig = document.querySelector<HTMLElement>('[data-mirror]');
  if (!fig) return;
  let seen = false;
  try {
    seen = localStorage.getItem(FOG_KEY) === '1';
    localStorage.setItem(FOG_KEY, '1');
  } catch {
    /* noop */
  }
  if (seen || prefersReducedMotion()) return;
  const skip = fig.querySelector<HTMLButtonElement>('[data-fog-skip]');
  const clear = () => {
    fig.classList.remove('is-fogged');
    fig.classList.add('is-clearing');
    window.setTimeout(() => fig.classList.remove('is-clearing'), 1300);
  };
  fig.classList.add('is-fogged');
  skip?.addEventListener('click', () => {
    fig.classList.remove('is-fogged', 'is-clearing');
  });
  // 画像が読めたら（最大でも 400ms 後に）晴らし始める
  const img = fig.querySelector('img');
  let started = false;
  const go = () => {
    if (started) return;
    started = true;
    requestAnimationFrame(() => requestAnimationFrame(clear));
  };
  if (img?.complete) window.setTimeout(go, 150);
  else img?.addEventListener('load', () => window.setTimeout(go, 150), { once: true });
  window.setTimeout(go, 400);
}

export function initMaskReveal() {
  const els = [...document.querySelectorAll<HTMLElement>('[data-mask]')];
  if (!els.length || prefersReducedMotion() || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('mask-ready');
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  els.forEach((el) => io.observe(el));
}

/** 画面外の葉の影アニメーションは止めて負荷を下げる */
export function initLeafShadows() {
  const els = document.querySelectorAll<HTMLElement>('.leaf-shadow');
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) (e.target as HTMLElement).classList.toggle('is-paused', !e.isIntersecting);
  });
  els.forEach((el) => io.observe(el));
}
