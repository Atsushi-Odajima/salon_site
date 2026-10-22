import '../styles/base.css';
import '../styles/home.css';
import { initCommon } from '../components/common';
import { initSimulator, renderPriceTable } from '../components/price';
import { initCompare } from '../components/compare';
import { initGallery } from '../components/gallery';
import { renderStaff } from '../components/staff-section';
import { initLeafShadows, initMaskReveal, initMirrorFog } from '../components/effects';
import { STYLES } from '../lib/gallery';
import { hydrateIcons } from '../lib/icons';

/** 1つの処理が失敗しても、ほかの表示は続ける */
function safe(name: string, fn: () => void) {
  try {
    fn();
  } catch (e) {
    console.error(`[${name}]`, e);
  }
}

const $ = <T extends HTMLElement>(s: string) => document.querySelector<T>(s);

safe('effects', () => {
  initMirrorFog();
  initMaskReveal();
  initLeafShadows();
});
safe('price', () => renderPriceTable($('[data-price-table]')!));
safe('simulator', () => initSimulator($('[data-simulator]')!));
safe('compare', () => initCompare($('[data-compare]')!, $('[data-compare-tabs]')!));
safe('gallery', () => initGallery($('#styles')!));
safe('staff', () => renderStaff($('[data-staff]')!));
safe('insta', () => {
  const pick = [0, 1, 4, 6, 7, 2];
  $('[data-insta-grid]')!.innerHTML = pick
    .map((i) => STYLES[i])
    .map((s) => `<li><img src="/images/${s.file}" alt="${s.alt}（掲載イメージ）" width="${s.w}" height="${s.h}" loading="lazy" decoding="async" /></li>`)
    .join('');
});
safe('common', () => {
  initCommon();
  hydrateIcons();
});
