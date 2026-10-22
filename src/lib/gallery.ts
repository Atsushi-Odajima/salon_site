/**
 * ヘアカタログ・スタイル一覧の写真データ。
 * 写真は素材サイトのスタイルイメージで、当店の施術実績・スタッフの作品ではない。
 * カテゴリは写真に実際に写っている髪型に合わせている（合わない写真をラベルに当てはめない）。
 */
export type Category = 'long' | 'bob_medium' | 'short' | 'arrange' | 'color';

export const CATEGORY_LABEL: Record<Category, { en: string; ja: string }> = {
  long: { en: 'LONG', ja: 'ロング' },
  bob_medium: { en: 'BOB・MEDIUM', ja: 'ボブ・ミディアム' },
  short: { en: 'SHORT', ja: 'ショート' },
  arrange: { en: 'ARRANGE', ja: 'ヘアアレンジ' },
  color: { en: 'COLOR', ja: 'ヘアカラー' },
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
  { file: 'v4/cat-long-dark-waves.webp', sm: 'v4/cat-long-dark-waves-sm.webp', w: 923, h: 1400, cats: ['long'], title: 'ゆるウェーブのロング', alt: 'ウェーブのかかった黒髪ロングの女性の横顔', pos: '45% 35%' },
  { file: 'v4/extra-long-soft-curls.webp', sm: 'v4/extra-long-soft-curls-sm.webp', w: 933, h: 1400, cats: ['long'], title: 'カールのロング', alt: 'カールのかかった黒髪ロングの女性', pos: '50% 40%' },
  { file: 'v4/cat-color-copper-brown-waves.webp', sm: 'v4/cat-color-copper-brown-waves-sm.webp', w: 1049, h: 1400, cats: ['color', 'long'], title: '明るいブラウンのロングウェーブ', alt: '明るいブラウンのウェーブロングの女性', pos: '50% 35%' },
  { file: 'v4/pick-bob-sleek-black.webp', sm: 'v4/pick-bob-sleek-black-sm.webp', w: 1050, h: 1400, cats: ['bob_medium'], title: 'センターパートのワンレンボブ', alt: '黒髪のワンレンボブの女性のポートレート', pos: '45% 30%' },
  { file: 'v2/bob-black-round.webp', sm: 'v2/bob-black-round-sm.webp', w: 889, h: 1200, cats: ['bob_medium'], title: '丸みのある黒髪ボブ', alt: '肩上の長さで毛先を内側に丸めた、黒髪のボブの横顔', pos: 'center' },
  { file: 'v4/extra-medium-brown-waves.webp', sm: 'v4/extra-medium-brown-waves-sm.webp', w: 933, h: 1400, cats: ['bob_medium', 'color'], title: 'ブラウンのウェーブミディアム', alt: 'ブラウンのウェーブヘアの女性がうつむいているポートレート', pos: '50% 30%' },
  { file: 'v4/hero-pc-short-bob-side-part.webp', sm: 'v4/hero-pc-short-bob-side-part-sm.webp', w: 2000, h: 1138, cats: ['short', 'bob_medium'], title: 'サイドパートのショートボブ', alt: '黒髪のショートボブの女性の横顔寄りのポートレート', pos: '42% 40%' },
  { file: 'v4/cat-short-mens-mash.webp', sm: 'v4/cat-short-mens-mash-sm.webp', w: 1400, h: 933, cats: ['short'], title: 'メンズ マッシュショート', alt: '白い背景の前の、マッシュショートの男性のポートレート', pos: '62% 35%' },
  { file: 'v4/extra-short-mens-center-part.webp', sm: 'v4/extra-short-mens-center-part-sm.webp', w: 1045, h: 1400, cats: ['short'], title: 'メンズ センターパートショート', alt: '白い背景の前に立つ、センターパートの短髪の男性', pos: '50% 15%' },
  { file: 'v4/cat-arrange-kanzashi-updo.webp', sm: 'v4/cat-arrange-kanzashi-updo-sm.webp', w: 1049, h: 1400, cats: ['arrange'], title: '髪飾りをあしらったまとめ髪', alt: '花の髪飾りをつけたまとめ髪の後ろ姿', pos: '50% 35%' },
];
