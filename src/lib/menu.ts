/**
 * メニュー・料金・所要時間の共通データと計算処理。
 * 料金表 / 料金シミュレーター / 予約画面 / 管理画面は、すべてこのモジュールを使う。
 *
 * ルール（架空設定）
 * - 価格はすべて税込の固定料金。ロング料金はなし。
 * - 基本メニュー（またはセット）を1つ選び、対応する追加オプションを足す。
 * - 基本メニューにはシャンプー・ブローの料金と時間を含む。
 * - オプションは「追加分だけ」の料金と時間。
 * - 所要時間には準備・片付けを含む（別のバッファは加算しない）。
 * - メンズ・キッズは対象者の分類。メンズ料金の加算はない。
 * - 指名料は、指名した場合だけ予約1件につき1回加算。指名なしは0円。
 */

export type Treatment = 'cut' | 'color' | 'perm' | 'straight' | 'spa' | 'treatment';

export interface BaseMenu {
  id: string;
  kind: 'base';
  name: string;
  /** 料金表での分類 */
  category: 'cut' | 'color' | 'perm' | 'straight' | 'spa' | 'kids';
  price: number;
  minutes: number;
  /** このメニューに含まれる施術 */
  includes: Treatment[];
  description: string;
  /** 対象者の補足（メンズ・キッズなど） */
  audience?: string;
}

export interface OptionMenu {
  id: string;
  kind: 'option';
  name: string;
  price: number;
  minutes: number;
  /** このオプションが追加する施術 */
  adds: Treatment;
  description: string;
  /** 追加できない基本メニューと、その理由 */
  notWith?: Record<string, string>;
}

export const BASE_MENUS: BaseMenu[] = [
  {
    id: 'cut',
    kind: 'base',
    name: 'カット',
    category: 'cut',
    price: 5500,
    minutes: 60,
    includes: ['cut'],
    description: 'カウンセリング・シャンプー・ブロー込み。骨格や髪のくせに合わせて、家で再現しやすい形に整えます。',
    audience: 'メンズの方も同じ料金です',
  },
  {
    id: 'color',
    kind: 'base',
    name: 'カラー単品',
    category: 'color',
    price: 7700,
    minutes: 90,
    includes: ['color'],
    description: 'シャンプー・ブロー込み。白髪ぼかし、透明感のある明るさなど、肌なじみを見てご提案します。',
  },
  {
    id: 'cut-color',
    kind: 'base',
    name: 'カット＋カラー',
    category: 'color',
    price: 11000,
    minutes: 120,
    includes: ['cut', 'color'],
    description: 'いちばん人気のセット。カットとカラーを同じ日に、シャンプー・ブロー込みで。',
  },
  {
    id: 'cut-perm',
    kind: 'base',
    name: 'カット＋パーマ',
    category: 'perm',
    price: 12100,
    minutes: 150,
    includes: ['cut', 'perm'],
    description: '乾かすだけでまとまる、やわらかなパーマ。根元のボリュームのみのご相談も可能です。',
  },
  {
    id: 'cut-straight',
    kind: 'base',
    name: 'カット＋縮毛矯正',
    category: 'straight',
    price: 17600,
    minutes: 180,
    includes: ['cut', 'straight'],
    description: '不自然にまっすぐしすぎない、自然な丸みを残す縮毛矯正。くせの強さを見て薬剤を調整します。',
  },
  {
    id: 'kids-cut',
    kind: 'base',
    name: 'キッズカット',
    category: 'kids',
    price: 3300,
    minutes: 30,
    includes: ['cut'],
    description: '小学生以下のお子さま。シャンプー・ブロー込み。慣れない場合は保護者の方のお膝の上でも大丈夫です。',
    audience: '小学生以下',
  },
  {
    id: 'spa',
    kind: 'base',
    name: 'ヘッドスパ単品（個室）',
    category: 'spa',
    price: 5500,
    minutes: 60,
    includes: ['spa'],
    description: '個室スパルームで、頭皮をほぐすヘッドスパ。シャンプー・ブロー込み。眠ってしまう方が多いメニューです。',
  },
];

export const OPTION_MENUS: OptionMenu[] = [
  {
    id: 'treatment',
    kind: 'option',
    name: 'トリートメント',
    price: 2200,
    minutes: 30,
    adds: 'treatment',
    description: '髪の内側を補修し、指通りとツヤを整えます。カラー・パーマとの相性が良い追加メニューです。',
    notWith: {
      'kids-cut': 'キッズカットには追加できません',
    },
  },
  {
    id: 'spa-add',
    kind: 'option',
    name: 'ヘッドスパ（個室・追加）',
    price: 3300,
    minutes: 30,
    adds: 'spa',
    description: '施術の仕上げに、個室で30分のヘッドスパ。目の疲れや肩のこりが気になる方に。',
    notWith: {
      spa: 'ヘッドスパ単品にすでに含まれています',
      'kids-cut': 'キッズカットには追加できません',
    },
  },
];

export const ALL_MENUS = [...BASE_MENUS, ...OPTION_MENUS];

export function findBase(id: string | null | undefined): BaseMenu | undefined {
  return BASE_MENUS.find((m) => m.id === id);
}

export function findOption(id: string): OptionMenu | undefined {
  return OPTION_MENUS.find((m) => m.id === id);
}

/** オプションが追加できない理由。追加できる場合は null。 */
export function optionBlockedReason(baseId: string | null, optionId: string): string | null {
  const opt = findOption(optionId);
  if (!opt) return '存在しないメニューです';
  if (!baseId) return '先に基本メニューを選んでください';
  const base = findBase(baseId);
  if (!base) return '存在しないメニューです';
  if (opt.notWith?.[baseId]) return opt.notWith[baseId];
  if (base.includes.includes(opt.adds)) return `${base.name}にすでに含まれています`;
  return null;
}

export interface Selection {
  baseId: string | null;
  optionIds: string[];
}

export interface LineItem {
  id: string;
  kind: 'base' | 'option' | 'nomination';
  name: string;
  price: number;
  minutes: number;
}

export interface Quote {
  valid: boolean;
  /** 予約に進めない場合の案内 */
  message: string | null;
  items: LineItem[];
  nominationFee: number;
  total: number;
  minutes: number;
  usesSpaRoom: boolean;
  treatments: Treatment[];
}

/**
 * 選択内容を正規化する。重複や組み合わせ不可のオプションは取り除き、
 * 取り除いた理由を返す（メニュー変更で無効になったオプションの説明に使う）。
 */
export function normalizeSelection(sel: Selection): { selection: Selection; removed: { id: string; reason: string }[] } {
  const base = findBase(sel.baseId);
  const removed: { id: string; reason: string }[] = [];
  const optionIds: string[] = [];
  if (!base) return { selection: { baseId: null, optionIds: [] }, removed };
  for (const id of sel.optionIds) {
    if (optionIds.includes(id)) continue;
    const reason = optionBlockedReason(base.id, id);
    if (reason) removed.push({ id, reason });
    else optionIds.push(id);
  }
  // 表示順を固定
  optionIds.sort((a, b) => OPTION_MENUS.findIndex((o) => o.id === a) - OPTION_MENUS.findIndex((o) => o.id === b));
  return { selection: { baseId: base.id, optionIds }, removed };
}

/**
 * 見積り（合計金額・所要時間）を計算する唯一の関数。
 * @param nominationFee 指名した場合のみ、そのスタッフの指名料。指名なしは 0。
 */
export function quote(sel: Selection, nominationFee = 0): Quote {
  const { selection } = normalizeSelection(sel);
  const base = findBase(selection.baseId);
  if (!base) {
    return {
      valid: false,
      message: '基本メニューを1つ選んでください（例：カット、カット＋カラー）',
      items: [],
      nominationFee: 0,
      total: 0,
      minutes: 0,
      usesSpaRoom: false,
      treatments: [],
    };
  }
  const items: LineItem[] = [{ id: base.id, kind: 'base', name: base.name, price: base.price, minutes: base.minutes }];
  const treatments = new Set<Treatment>(base.includes);
  for (const id of selection.optionIds) {
    const o = findOption(id)!;
    items.push({ id: o.id, kind: 'option', name: o.name, price: o.price, minutes: o.minutes });
    treatments.add(o.adds);
  }
  const fee = Math.max(0, nominationFee);
  const total = items.reduce((s, i) => s + i.price, 0) + fee;
  const minutes = items.reduce((s, i) => s + i.minutes, 0);
  return {
    valid: true,
    message: null,
    items,
    nominationFee: fee,
    total,
    minutes,
    usesSpaRoom: treatments.has('spa'),
    treatments: [...treatments],
  };
}

export const yen = (n: number) => `${n.toLocaleString('ja-JP')}円`;

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}分`;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}

/** URL クエリ（?menu=cut-color&opt=treatment）と選択内容の相互変換 */
export function selectionFromParams(params: URLSearchParams): Selection {
  return normalizeSelection({
    baseId: params.get('menu'),
    optionIds: (params.get('opt') ?? '').split(',').filter(Boolean),
  }).selection;
}

export function selectionToParams(sel: Selection, params = new URLSearchParams()): URLSearchParams {
  if (sel.baseId) params.set('menu', sel.baseId);
  else params.delete('menu');
  if (sel.optionIds.length) params.set('opt', sel.optionIds.join(','));
  else params.delete('opt');
  return params;
}
