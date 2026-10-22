/**
 * アイコン（Iconoir v7 / MIT License / 線幅1.5 に統一）。
 * Iconoir に無いモチーフ（コーム・ドライヤー・パーマ・スパ・子ども連れ）は
 * 同じ 24px グリッド・線幅1.5・丸い線端で自作（custom: と表記）。
 * ブランドロゴ（Instagram / X / LINE）は Simple Icons（CC0）。詳細は CREDITS.md。
 */

const iconoir = {
  'sparks': `<path fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.5" d="M8 15c4.875 0 7-2.051 7-7c0 4.949 2.11 7 7 7c-4.89 0-7 2.11-7 7c0-4.89-2.125-7-7-7ZM2 6.5c3.134 0 4.5-1.318 4.5-4.5c0 3.182 1.357 4.5 4.5 4.5c-3.143 0-4.5 1.357-4.5 4.5c0-3.143-1.366-4.5-4.5-4.5Z"/>`,
  'phone': `<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18.118 14.702L14 15.5c-2.782-1.396-4.5-3-5.5-5.5l.77-4.13L7.815 2H4.064c-1.128 0-2.016.932-1.847 2.047c.42 2.783 1.66 7.83 5.283 11.453c3.805 3.805 9.286 5.456 12.302 6.113c1.165.253 2.198-.655 2.198-1.848v-3.584z"/>`,
  'calendar': `<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 4V2m0 2v2m0-2h-4.5M3 10v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9zm0 0V6a2 2 0 0 1 2-2h2m0-2v4m14 4V6a2 2 0 0 0-2-2h-.5"/>`,
  'clock': `<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M12 6v6h6"/><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12s4.477 10 10 10"/></g>`,
  'map-pin': `<g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 10c0 4.418-8 12-8 12s-8-7.582-8-12a8 8 0 1 1 16 0Z"/><path fill="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M12 11a1 1 0 1 0 0-2a1 1 0 0 0 0 2"/></g>`,
  'user': `<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M5 20v-1a7 7 0 1 1 14 0v1"/><path d="M12 12a4 4 0 1 0 0-8a4 4 0 0 0 0 8"/></g>`,
  'scissor': `<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7.236 7a3 3 0 1 0-4.472-4a3 3 0 0 0 4.472 4m0 0L20 18M7.236 17a3 3 0 1 1-4.472 4a3 3 0 0 1 4.472-4m0 0L20 6"/>`,
  'palette': `<g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.51 9.54a1.9 1.9 0 0 1-1 1.09A7 7 0 0 0 15.37 17q.002.707.14 1.4a2.16 2.16 0 0 1-.31 1.65a1.8 1.8 0 0 1-1.21.8q-.804.15-1.62.15a9 9 0 0 1-9-9.28A9.05 9.05 0 0 1 11.85 3h.51a9 9 0 0 1 8.06 5a2 2 0 0 1 .09 1.52z"/><path stroke-linecap="round" stroke-linejoin="round" d="m8 16.01l.01-.011M6 12.01l.01-.011M8 8.01l.01-.011M12 6.01l.01-.011M16 8.01l.01-.011"/></g>`,
  'parking': `<g fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 15.5v-2.8m0 0h2.857c.714 0 2.143 0 2.143-2.1s-1.429-2.1-2.143-2.1H10z"/><circle cx="12" cy="12" r="10"/></g>`,
  'credit-card': `<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M22 9v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2zm0 0H6"/>`,
  'hand-cash': `<g fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m2 11l2.807-3.157A4 4 0 0 1 7.797 6.5H8m-6 13h5.5l4-3s.81-.547 2-1.5c2.5-2 0-5.166-2.5-3.5C8.964 12.857 7 14 7 14"/><path d="M8 13.5V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-6.5"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a2 2 0 1 1 0-4a2 2 0 0 1 0 4m4.5-1.99l.01-.011m-9.01.011l.01-.011"/></g>`,
  'qr-code': `<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12v3M12 3v3m6 6v3m-6 3h9m-3 3h3M6 12h3M6 6.011L6.01 6M12 12.011l.01-.011M3 12.011L3.01 12M12 9.011L12.01 9M12 15.011l.01-.011M15 21.011l.01-.011m-3.01.011l.01-.011M21 12.011l.01-.011M21 15.011l.01-.011M18 6.011L18.01 6M9 3.6v4.8a.6.6 0 0 1-.6.6H3.6a.6.6 0 0 1-.6-.6V3.6a.6.6 0 0 1 .6-.6h4.8a.6.6 0 0 1 .6.6m12 0v4.8a.6.6 0 0 1-.6.6h-4.8a.6.6 0 0 1-.6-.6V3.6a.6.6 0 0 1 .6-.6h4.8a.6.6 0 0 1 .6.6M6 18.011L6.01 18M9 15.6v4.8a.6.6 0 0 1-.6.6H3.6a.6.6 0 0 1-.6-.6v-4.8a.6.6 0 0 1 .6-.6h4.8a.6.6 0 0 1 .6.6"/>`,
  'arrow-right': `<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12h18m0 0l-8.5-8.5M21 12l-8.5 8.5"/>`,
  'nav-arrow-right': `<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m9 6l6 6l-6 6"/>`,
  'nav-arrow-left': `<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m15 6l-6 6l6 6"/>`,
  'xmark': `<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6.758 17.243L12.001 12m5.243-5.243L12 12m0 0L6.758 6.757M12.001 12l5.243 5.243"/>`,
  'menu': `<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 5h18M3 12h18M3 19h18"/>`,
  'check': `<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m5 13l4 4L19 7"/>`,
  'info-circle': `<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 11.5v5m0-8.99l.01-.011M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12s4.477 10 10 10"/>`,
  'chat-lines': `<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 10h8m-8 4h4m0 8c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12c0 1.821.487 3.53 1.338 5L2.5 21.5l4.5-.838A9.96 9.96 0 0 0 12 22"/>`,
  'leaf': `<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M7 21s.5-4.5 4-8.5"/><path d="m19.13 4.242l.594 6.175c.374 3.886-2.54 7.346-6.425 7.72c-3.813.367-7.267-2.42-7.634-6.233a6.936 6.936 0 0 1 6.239-7.569l6.571-.632a.6.6 0 0 1 .655.54"/></g>`,
  'sun-light': `<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 18a6 6 0 1 0 0-12a6 6 0 0 0 0 12m10-6h1M12 2V1m0 22v-1m8-2l-1-1m1-15l-1 1M4 20l1-1M4 4l1 1m-4 7h1"/>`,
  'warning-circle': `<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 7v6m0 4.01l.01-.011M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12s4.477 10 10 10"/>`,
  'refresh': `<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M21.888 13.5C21.164 18.311 17.013 22 12 22C6.477 22 2 17.523 2 12S6.477 2 12 2c4.1 0 7.625 2.468 9.168 6"/><path d="M17 8h4.4a.6.6 0 0 0 .6-.6V3"/></g>`,
  'lock': `<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 12h1.4a.6.6 0 0 1 .6.6v6.8a.6.6 0 0 1-.6.6H6.6a.6.6 0 0 1-.6-.6v-6.8a.6.6 0 0 1 .6-.6H8m8 0V8c0-1.333-.8-4-4-4S8 6.667 8 8v4m8 0H8"/>`,
  'calendar-check': `<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 21H5a2 2 0 0 1-2-2v-9h18v5M15 4V2m0 2v2m0-2h-4.5M3 10V6a2 2 0 0 1 2-2h2m0-2v4m14 4V6a2 2 0 0 0-2-2h-.5M16 20l2 2l4-4"/>`,
  'eye': `<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M3 13c3.6-8 14.4-8 18 0"/><path d="M12 17a3 3 0 1 1 0-6a3 3 0 0 1 0 6"/></g>`,
  'droplet': `<path fill="none" stroke="currentColor" stroke-width="1.5" d="M20 14c0-4.418-8-12-8-12S4 9.582 4 14a8 8 0 1 0 16 0Z"/>`,
};

const custom = {
  'comb': `<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M3 9.5h18v2.5H3z"/><path d="M5 12v6M7.5 12v6M10 12v6M12.5 12v6M15 12v6M17.5 12v4.5M20 12v3"/></g>`,
  'dryer': `<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M14.5 5.5a4.5 4.5 0 1 1 0 9H8l-5-1.5v-6L8 5.5z"/><circle cx="14.5" cy="10" r="1.5"/><path d="M12 14.5l1.2 5.5h3l-1-5.6"/><path d="M19.5 3.5l1.5-1M21 6h1.5M19.5 1.5V1"/></g>`,
  'perm': `<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M6 3c-2 3 2 4.5 0 7.5s2 4.5 0 7.5s2 3 0 4"/><path d="M12 3c-2 3 2 4.5 0 7.5s2 4.5 0 7.5s2 3 0 4"/><path d="M18 3c-2 3 2 4.5 0 7.5s2 4.5 0 7.5s2 3 0 4"/></g>`,
  'spa': `<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M3 13h18a9 6 0 0 1-18 0z"/><path d="M8 22h8"/><path d="M12 19v3"/><path d="M8.5 9.5c-1-1.2 1-2.3 0-3.5M12 9.5c-1-1.2 1-2.3 0-3.5s1-2.3 0-3.5M15.5 9.5c-1-1.2 1-2.3 0-3.5"/></g>`,
  'kids': `<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><circle cx="8" cy="5" r="2.5"/><path d="M3.5 21v-6.5A4.5 4.5 0 0 1 8 10a4.5 4.5 0 0 1 4.5 4.5V21"/><circle cx="17" cy="11" r="2"/><path d="M14 21v-3.5a3 3 0 0 1 6 0V21"/></g>`,
};

const brand = {
  'instagram': `<path fill="currentColor" d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/>`,
  'x': `<path fill="currentColor" d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"/>`,
  'line': `<path fill="currentColor" d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>`,
};

export type IconName = keyof typeof iconoir | keyof typeof custom;
export type BrandName = keyof typeof brand;

const ALL: Record<string, string> = { ...iconoir, ...custom };

/** 装飾用アイコン（aria-hidden）。意味を持たせる場合は label を渡す。 */
export function icon(name: IconName, opts: { size?: number; label?: string; cls?: string } = {}): string {
  const { size = 24, label, cls = 'icon' } = opts;
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"';
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" ${a11y}>${ALL[name]}</svg>`;
}

export function brandIcon(name: BrandName, size = 24): string {
  return `<svg class="brand-icon" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${brand[name]}</svg>`;
}

/** data-icon="phone" を持つ要素にアイコンを差し込む */
export function hydrateIcons(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-icon]').forEach((el) => {
    if (el.dataset.iconDone) return;
    const name = el.dataset.icon as IconName;
    const size = Number(el.dataset.iconSize ?? 24);
    el.insertAdjacentHTML('afterbegin', icon(name, { size }));
    el.dataset.iconDone = '1';
  });
  root.querySelectorAll<HTMLElement>('[data-brand]').forEach((el) => {
    if (el.dataset.iconDone) return;
    el.insertAdjacentHTML('afterbegin', brandIcon(el.dataset.brand as BrandName, Number(el.dataset.iconSize ?? 24)));
    el.dataset.iconDone = '1';
  });
}
