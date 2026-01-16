import { z } from 'zod';

const elementTypes = ['earth', 'wind', 'fire', 'water'] as const;
// 인접 속성 (조합 가능): 지화(earth+fire), 수풍(water+wind) 불가
const adjacentElements: Record<string, string[]> = {
  earth: ['wind', 'water'],
  wind: ['earth', 'fire'],
  fire: ['wind', 'water'],
  water: ['fire', 'earth'],
};

export const createCharacterSchema = z.object({
  nickname: z.string()
    .min(2, '닉네임은 2자 이상이어야 합니다')
    .max(8, '닉네임은 8자 이하여야 합니다')
    .regex(/^[가-힣a-zA-Z0-9]+$/, '한글, 영문, 숫자만 사용 가능합니다'),

  appearance: z.object({
    eye: z.number().int().min(1).max(5),
    nose: z.number().int().min(1).max(3),
    mouth: z.number().int().min(1).max(4),
    hair: z.number().int().min(1).max(6),
    skin: z.number().int().min(1).max(5),
  }),

  element: z.object({
    primary: z.enum(elementTypes),
    secondary: z.enum(elementTypes),
    primaryRatio: z.number().int().min(0).max(100).default(50),
  }).refine((data) => {
    return adjacentElements[data.primary].includes(data.secondary);
  }, '인접 속성만 조합할 수 있습니다 (지화, 수풍 조합 불가)'),

  // 4스탯 시스템: HP, ATK, DEF, SPD
  stats: z.object({
    hp: z.number().int().min(10),
    atk: z.number().int().min(5),
    def: z.number().int().min(5),
    spd: z.number().int().min(5),
  }).refine((data) => {
    const total = data.hp + data.atk + data.def + data.spd;
    return total === 45; // 초기 25 (10+5+5+5) + 보너스 20
  }, '스탯 총합은 45여야 합니다'),
});

export type CreateCharacterInput = z.infer<typeof createCharacterSchema>;
