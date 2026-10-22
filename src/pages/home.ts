import '../styles/base.css';
import '../styles/home.css';
import { initCommon } from '../components/common';
import { initSimulator, renderPriceTable } from '../components/price';
import { initGallery } from '../components/gallery';
import { renderStaff } from '../components/staff-section';
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

safe('price', () => renderPriceTable($('[data-price-table]')!));
safe('simulator', () => initSimulator($('[data-simulator]')!));
safe('gallery', () => initGallery($('#styles')!));
safe('staff', () => renderStaff($('[data-staff]')!));
safe('common', () => {
  initCommon();
  hydrateIcons();
});
