/**
 * スタイルギャラリーの写真データ。
 * 写真は素材サイトのイメージで、当店の施術実績・スタッフの作品ではない。
 * 長さ・雰囲気のタグは、写真に実際に写っている髪型に合わせている。
 */
export type Length = 'short' | 'bob' | 'medium' | 'long' | 'arrange';
export type Mood = 'natural' | 'elegant' | 'casual' | 'cool';

// まとめ髪は長さが写真から判別できないため「アレンジ」として分類する
export const LENGTH_LABEL: Record<Length, string> = { short: 'ショート', bob: 'ボブ', medium: 'ミディアム', long: 'ロング', arrange: 'アレンジ' };
export const MOOD_LABEL: Record<Mood, string> = { natural: 'ナチュラル', elegant: '上品', casual: 'カジュアル', cool: 'クール' };

export interface StylePhoto {
  file: string;
  w: number;
  h: number;
  length: Length;
  mood: Mood;
  title: string;
  alt: string;
  /** 3:4 に切り抜くときの表示位置 */
  pos?: string;
}

/** ヒーロー・ピックアップ・カット/カラー/ケアで使った写真とは重複させない */
export const STYLES: StylePhoto[] = [
  { file: 'style-03.webp', w: 562, h: 1000, length: 'bob', mood: 'elegant', title: 'ツヤのあるワンレンボブ', alt: '後ろから見た、毛先をまっすぐにそろえたツヤのあるブラウンのボブ' },
  { file: 'v2/bob-copper.webp', w: 1200, h: 800, length: 'bob', mood: 'cool', title: 'カッパーカラーのショートボブ', alt: '明るいカッパーピンクに染めた、丸みのあるショートボブ（顔はそむけている）', pos: '50% center' },
  { file: 'v2/curls-short.webp', w: 900, h: 1200, length: 'short', mood: 'casual', title: 'ふんわりカールのショート', alt: '後ろから見た、細かなカールが立体的に出たショートヘア' },
  { file: 'style-02.webp', w: 1000, h: 667, length: 'short', mood: 'casual', title: '襟足すっきりのメンズショート', alt: '後ろから見た、襟足を短く整えたメンズショート' },
  { file: 'style-01.webp', w: 1000, h: 667, length: 'short', mood: 'natural', title: '自然な短髪（メンズ）', alt: '後ろから見た、自然に整えたメンズの短髪' },
  { file: 'style-06.webp', w: 667, h: 1000, length: 'medium', mood: 'cool', title: '肩下のストレート', alt: '後ろから見た、肩下でまっすぐそろえたブロンドのミディアムヘア' },
  { file: 'style-10.webp', w: 667, h: 1000, length: 'long', mood: 'elegant', title: 'グラデーションのウェーブ', alt: '後ろから見た、根元が暗く毛先が明るいグラデーションカラーのウェーブロング' },
  { file: 'style-12.webp', w: 1000, h: 667, length: 'long', mood: 'casual', title: 'カールを生かしたロング', alt: '後ろから見た、ボリュームのある黒髪のカーリーロング' },
  { file: 'style-11.webp', w: 667, h: 1000, length: 'long', mood: 'natural', title: 'ロングのハーフアップ', alt: '後ろから見た、ストレートロングを小さなお団子でハーフアップにした髪型' },
  { file: 'v2/updo-halfup-curls.webp', w: 900, h: 1200, length: 'arrange', mood: 'elegant', title: 'トップお団子と巻き髪', alt: '頭の上に小さなお団子を作り、下ろした髪を巻いたハーフアップ（斜め後ろ）' },
  { file: 'v2/updo-braid-blonde.webp', w: 900, h: 1200, length: 'arrange', mood: 'elegant', title: '編み込みのルーズアップ', alt: '編み込みを入れてゆるくまとめ、小花とパールのピンを飾ったアップスタイル' },
];
