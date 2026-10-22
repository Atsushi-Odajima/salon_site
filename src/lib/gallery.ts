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
  { file: 'v3/cat-color-balayage-waves.webp', sm: 'v3/cat-color-balayage-waves-sm.webp', w: 933, h: 1400, cats: ['color', 'long'], title: 'ベージュのグラデーションカラー', alt: 'ブラウンから明るいベージュへのグラデーションカラーのウェーブロングの女性', pos: '50% 40%' },
  { file: 'v3/cat-long-straight-brown.webp', sm: 'v3/cat-long-straight-brown-sm.webp', w: 1050, h: 1400, cats: ['long'], title: 'ツヤのあるストレートロング', alt: '明るい背景の前で、ブラウンのストレートロングヘアの女性が正面を向いている', pos: '50% 40%' },
  { file: 'v3/hero-blonde-waves.webp', sm: 'v3/hero-blonde-waves-sm.webp', w: 2000, h: 1333, cats: ['long', 'color'], title: 'ブロンドのウェーブロング', alt: '明るいグレーの背景の前で、ブロンドのウェーブロングヘアの女性が正面を向いている', pos: '50% 40%' },
  { file: 'v3/cat-bob-wavy-dark.webp', sm: 'v3/cat-bob-wavy-dark-sm.webp', w: 934, h: 1400, cats: ['bob_medium'], title: 'ウェーブボブ', alt: '白い背景の前で、ダークブラウンのウェーブボブの女性が横を向いている', pos: '45% 25%' },
  { file: 'v2/bob-black-round.webp', sm: 'v2/bob-black-round-sm.webp', w: 889, h: 1200, cats: ['bob_medium'], title: '丸みのある黒髪ボブ', alt: '肩上の長さで毛先を内側に丸めた、黒髪のボブの横顔', pos: 'center' },
  { file: 'v2/bob-inner-color.webp', sm: 'v2/bob-inner-color-sm.webp', w: 900, h: 1200, cats: ['bob_medium', 'color'], title: 'ブラウンボブ×インナーカラー', alt: 'ブラウンのボブの内側に明るいブロンドを入れたインナーカラー（後ろ姿）', pos: 'center' },
  { file: 'v3/cat-short-pixie-auburn.webp', sm: 'v3/cat-short-pixie-auburn-sm.webp', w: 935, h: 1400, cats: ['short'], title: 'ベリーショート', alt: '明るい背景の前で、ブラウンのベリーショートの女性が正面を向いている', pos: '50% 30%' },
  { file: 'v2/curls-short.webp', sm: 'v2/curls-short-sm.webp', w: 900, h: 1200, cats: ['short'], title: 'ふんわりカールのショート', alt: '後ろから見た、細かなカールが立体的に出たショートヘア', pos: 'center' },
  { file: 'v3/cat-arrange-braid-halfup.webp', sm: 'v3/cat-arrange-braid-halfup-sm.webp', w: 1050, h: 1400, cats: ['arrange'], title: 'ハーフアップ編みおろし', alt: '後ろ姿で、ベージュ系ストレートロングの髪を後ろでねじり編みにまとめたアレンジ', pos: '50% 40%' },
  { file: 'v2/updo-braid-blonde.webp', sm: 'v2/updo-braid-blonde-sm.webp', w: 900, h: 1200, cats: ['arrange'], title: '編み込みのルーズアップ', alt: '編み込みを入れてゆるくまとめ、小花とパールのピンを飾ったアップスタイル', pos: 'center' },
];
