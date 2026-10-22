/**
 * ヘアカタログ・スタイル一覧の写真データ。
 * 写真は素材サイトのスタイルイメージで、当店の施術実績・スタッフの作品ではない。
 * カテゴリは写真に実際に写っている髪型に合わせている（合わない写真をラベルに当てはめない）。
 */
export type Category = 'straight' | 'wave' | 'layer' | 'color' | 'arrange';

export const CATEGORY_LABEL: Record<Category, { en: string; ja: string }> = {
  straight: { en: 'STRAIGHT', ja: 'ストレート' },
  wave: { en: 'WAVE・CURL', ja: 'ウェーブ・カール' },
  layer: { en: 'LAYER', ja: 'レイヤー' },
  color: { en: 'COLOR', ja: 'ヘアカラー' },
  arrange: { en: 'ARRANGE', ja: 'ヘアアレンジ' },
};

export interface StylePhoto {
  /** /images/ からのパス（拡大表示用） */
  file: string;
  /** 一覧用の小さい画像 */
  sm: string;
  w: number;
  h: number;
  cats: Category[];
  title: string;
  alt: string;
  pos?: string;
}

export const catLabel = (s: StylePhoto) => s.cats.map((c) => CATEGORY_LABEL[c].ja).join('・');

export const STYLES: StylePhoto[] = [
  { file: 'v4/cat-long-dark-waves.webp', sm: 'v4/cat-long-dark-waves-sm.webp', w: 923, h: 1400, cats: ['wave'], title: 'ゆるウェーブの黒髪ロング', alt: 'ウェーブのかかった黒髪ロングの女性の横顔', pos: '45% 35%' },
  { file: 'v5/cat-straight-long-black.webp', sm: 'v5/cat-straight-long-black-sm.webp', w: 934, h: 1400, cats: ['straight'], title: 'ツヤのある黒髪ストレート', alt: '胸下までの黒髪ストレートロングの女性', pos: '50% 30%' },
  { file: 'v5/pick-back-long-straight.webp', sm: 'v5/pick-back-long-straight-sm.webp', w: 933, h: 1400, cats: ['straight'], title: '後ろ姿で見るストレートロング', alt: '背中まであるダークトーンのストレートロングの女性の後ろ姿', pos: '50% 30%' },
  { file: 'v5/hero-pc-long-straight-black.webp', sm: 'v5/hero-pc-long-straight-black-sm.webp', w: 2000, h: 1333, cats: ['straight'], title: 'センターパートのロング', alt: '胸下まであるダークブラウンのストレートロングの女性', pos: '62% 40%' },
  { file: 'v5/hero-sp-long-bangs.webp', sm: 'v5/hero-sp-long-bangs-sm.webp', w: 1065, h: 1600, cats: ['straight', 'layer'], title: '前髪ありのストレートロング', alt: '前髪のある黒髪ストレートロングの女性', pos: '50% 25%' },
  { file: 'v4/pick-layer-face-framing-long.webp', sm: 'v4/pick-layer-face-framing-long-sm.webp', w: 933, h: 1400, cats: ['layer'], title: '顔まわりレイヤーのロング', alt: '顔まわりに毛束がかかる黒髪ロングの女性', pos: '55% 30%' },
  { file: 'v4/extra-long-soft-curls.webp', sm: 'v4/extra-long-soft-curls-sm.webp', w: 933, h: 1400, cats: ['wave'], title: '毛先カールのロング', alt: 'カールのかかった黒髪ロングの女性', pos: '50% 40%' },
  { file: 'v4/cat-color-copper-brown-waves.webp', sm: 'v4/cat-color-copper-brown-waves-sm.webp', w: 1049, h: 1400, cats: ['color', 'wave'], title: '明るいブラウンのロングウェーブ', alt: '明るいブラウンのウェーブロングの女性', pos: '50% 35%' },
  { file: 'v5/extra-color-copper-curl-long.webp', sm: 'v5/extra-color-copper-curl-long-sm.webp', w: 934, h: 1400, cats: ['color', 'wave'], title: 'カッパーブラウンの巻きロング', alt: '赤みのあるブラウンの巻き髪ロングの女性', pos: '50% 30%' },
  { file: 'v5/pick-color-brown-straight-long.webp', sm: 'v5/pick-color-brown-straight-long-sm.webp', w: 932, h: 1400, cats: ['color', 'straight'], title: 'ブラウンのストレートロング', alt: 'ブラウンのストレートロングの女性', pos: '50% 30%' },
  { file: 'v5/pick-color-gradation-long.webp', sm: 'v5/pick-color-gradation-long-sm.webp', w: 935, h: 1400, cats: ['color'], title: '毛先が明るいグラデーションカラー', alt: '毛先に向かって明るくなるブラウンのロングの女性', pos: '50% 45%' },
  { file: 'v5/extra-straight-long-smile.webp', sm: 'v5/extra-straight-long-smile-sm.webp', w: 933, h: 1400, cats: ['straight'], title: '毛先までまっすぐなロング', alt: '胸下までの黒髪ストレートロングの女性が微笑んでいる', pos: '50% 30%' },
  { file: 'v5/cat-arrange-long-braid.webp', sm: 'v5/cat-arrange-long-braid-sm.webp', w: 933, h: 1400, cats: ['arrange'], title: 'リボンを添えたロングの三つ編み', alt: 'ロングヘアを三つ編みにしてリボンを添えた女性の横向きの姿', pos: '45% 35%' },
  { file: 'v5/extra-arrange-ponytail-back.webp', sm: 'v5/extra-arrange-ponytail-back-sm.webp', w: 1050, h: 1400, cats: ['arrange'], title: '後ろ姿のポニーテール', alt: '黒髪ロングを後ろでひとつに結んだ女性の後ろ姿', pos: '40% 40%' },
];
