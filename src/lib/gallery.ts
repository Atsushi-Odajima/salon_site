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

// %%STYLES%%
export const STYLES: StylePhoto[] = [];
