/**
 * スタイルギャラリーの写真データ。
 * 写真は素材サイトのイメージで、当店の施術実績・スタッフの作品ではない。
 * 長さ・雰囲気のタグは、写真に実際に写っている髪型に合わせている。
 */
export type Length = 'short' | 'bob' | 'medium' | 'long';
export type Mood = 'natural' | 'elegant' | 'casual' | 'cool';

export const LENGTH_LABEL: Record<Length, string> = { short: 'ショート', bob: 'ボブ', medium: 'ミディアム', long: 'ロング' };
export const MOOD_LABEL: Record<Mood, string> = { natural: 'ナチュラル', elegant: '上品', casual: 'カジュアル', cool: 'クール' };

export interface StylePhoto {
  file: string;
  w: number;
  h: number;
  length: Length;
  mood: Mood;
  title: string;
  alt: string;
}

export const STYLES: StylePhoto[] = [
  { file: 'style-03.webp', w: 562, h: 1000, length: 'bob', mood: 'elegant', title: 'ツヤのあるワンレンボブ', alt: '後ろから見た、毛先をまっすぐにそろえたツヤのあるブラウンのボブ' },
  { file: 'style-09.webp', w: 563, h: 1000, length: 'long', mood: 'natural', title: '毛先に動きのあるロング', alt: '斜め後ろから見た、毛先がゆるく揺れるダークブラウンのロングヘア' },
  { file: 'style-04.webp', w: 800, h: 900, length: 'bob', mood: 'natural', title: '丸みのあるボブ', alt: '夕方の逆光に透ける、丸みのあるボブの後ろ姿' },
  { file: 'style-06.webp', w: 667, h: 1000, length: 'medium', mood: 'cool', title: '肩下のストレート', alt: '後ろから見た、肩下でまっすぐそろえたブロンドのミディアムヘア' },
  { file: 'style-10.webp', w: 667, h: 1000, length: 'long', mood: 'elegant', title: 'グラデーションのウェーブ', alt: '後ろから見た、根元が暗く毛先が明るいグラデーションカラーのウェーブロング' },
  { file: 'style-02.webp', w: 1000, h: 667, length: 'short', mood: 'casual', title: '襟足すっきりのメンズショート', alt: '後ろから見た、襟足を短く整えたメンズショート' },
  { file: 'style-07.webp', w: 1000, h: 1000, length: 'medium', mood: 'casual', title: '軽さのあるミディアム', alt: '髪を振り上げて動きが出たブラウンのミディアムヘア。顔は髪で隠れている' },
  { file: 'style-11.webp', w: 667, h: 1000, length: 'long', mood: 'natural', title: 'ロングのハーフアップ', alt: '後ろから見た、ストレートロングを小さなお団子でハーフアップにした髪型' },
  { file: 'style-05.webp', w: 1000, h: 667, length: 'bob', mood: 'cool', title: 'ピンクカラーのウェーブボブ', alt: '後ろから見た、淡いピンクに染めたウェーブのボブ' },
  { file: 'style-12.webp', w: 1000, h: 667, length: 'long', mood: 'casual', title: 'カールを生かしたロング', alt: '後ろから見た、ボリュームのある黒髪のカーリーロング' },
  { file: 'style-01.webp', w: 1000, h: 667, length: 'short', mood: 'natural', title: '自然な短髪', alt: '後ろから見た、自然に整えたメンズの短髪' },
];

/** スタイル比較（別々のモデルによるイメージ写真。施術前後ではない） */
export const COMPARE_PAIRS: { label: string; a: StylePhoto; b: StylePhoto; aNote: string; bNote: string }[] = [
  {
    label: 'ボブ',
    a: STYLES[0],
    b: STYLES[2],
    aNote: '毛先をそろえた、ツヤのあるボブ',
    bNote: '空気を含んだ、丸みのあるボブ',
  },
  {
    label: 'ロング',
    a: STYLES[7],
    b: STYLES[1],
    aNote: 'まっすぐ落ちるストレート',
    bNote: '毛先に動きを出したロング',
  },
  {
    label: 'メンズ',
    a: STYLES[10],
    b: STYLES[5],
    aNote: '全体を自然に短く',
    bNote: '襟足を締めてすっきり',
  },
];
