import type { Treatment } from './menu';

/** 1日の勤務。時刻は "HH:MM"。 */
export interface Shift {
  start: string;
  end: string;
  breakStart: string;
  breakEnd: string;
}

export interface Staff {
  id: string;
  name: string;
  kana: string;
  initials: string;
  role: string;
  /** 予約の担当者として選べるか（アシスタントは false） */
  bookable: boolean;
  nominationFee: number;
  specialties: string[];
  /** 接客やカウンセリングで大切にしていること */
  approach: string;
  /** 担当できる施術。アシスタントは補助内容を表示用に持つ */
  canDo: Treatment[];
  supportNote?: string;
  /** 曜日（0=日〜6=土）ごとの勤務。定休日以外で null は休み */
  week: (Shift | null)[];
}

const full: Shift = { start: '09:30', end: '19:00', breakStart: '13:00', breakEnd: '14:00' };
const late: Shift = { start: '10:00', end: '19:00', breakStart: '14:00', breakEnd: '15:00' };

export const STAFF: Staff[] = [
  {
    id: 'mizuno',
    name: '水野 灯',
    kana: 'みずの あかり',
    initials: 'A.M',
    role: '店長・スタイリスト',
    bookable: true,
    nominationFee: 1100,
    specialties: ['ショート・ボブ', '骨格に合わせたカット', '自然な縮毛矯正'],
    approach:
      '最初の10分は、鏡の前でゆっくり話を聞く時間にしています。「朝、何分で整えたいか」「どこが気になるか」を具体的にうかがい、次のご来店までの伸び方まで考えて切ります。',
    canDo: ['cut', 'color', 'perm', 'straight', 'spa', 'treatment'],
    // 木曜休み
    week: [full, full, full, full, null, full, full],
  },
  {
    id: 'morishita',
    name: '森下 結',
    kana: 'もりした ゆい',
    initials: 'Y.M',
    role: 'スタイリスト',
    bookable: true,
    nominationFee: 550,
    specialties: ['白髪ぼかしカラー', 'やわらかいパーマ', 'ミディアム〜ロング'],
    approach:
      '色の見本を一緒に見ながら、肌の色や服の雰囲気に合う明るさを決めます。白髪が気になり始めた方には、染め続けるのが楽になる方法から順番にご提案します。',
    canDo: ['cut', 'color', 'perm', 'spa', 'treatment'],
    // 水曜休み
    week: [late, late, late, null, late, late, late],
  },
  {
    id: 'saeki',
    name: '佐伯 湊',
    kana: 'さえき みなと',
    initials: 'M.S',
    role: 'アシスタント',
    bookable: false,
    nominationFee: 0,
    specialties: ['シャンプー', 'ヘッドスパの補助', 'お子さまの付き添い'],
    approach:
      'シャンプーの力加減やお湯の温度は、途中でも遠慮なく伝えてください。お子さま連れの方が施術中も落ち着いて過ごせるよう、待ち時間のお手伝いもしています。',
    canDo: [],
    supportNote: 'アシスタントのため、施術担当としての指名はお受けしていません。スタイリストの施術をサポートします。',
    week: [full, full, full, full, full, full, full],
  },
];

export const BOOKABLE_STAFF = STAFF.filter((s) => s.bookable);

/** 指名なしのときに割り当てる順序（固定・再現可能なルール） */
export const AUTO_ASSIGN_ORDER = ['morishita', 'mizuno'];

export function findStaff(id: string | null | undefined): Staff | undefined {
  return STAFF.find((s) => s.id === id);
}

/** そのスタッフが必要な施術をすべて担当できない場合の理由 */
export function staffCannotReason(staff: Staff, treatments: Treatment[]): string | null {
  if (!staff.bookable) return 'アシスタントは施術担当として指名できません';
  const missing = treatments.filter((t) => !staff.canDo.includes(t));
  if (missing.length === 0) return null;
  const label: Record<Treatment, string> = {
    cut: 'カット',
    color: 'カラー',
    perm: 'パーマ',
    straight: '縮毛矯正',
    spa: 'ヘッドスパ',
    treatment: 'トリートメント',
  };
  return `${missing.map((t) => label[t]).join('・')}は担当していません`;
}
