import { z } from 'zod';

const elementTypes = ['earth', 'wind', 'fire', 'water'] as const;
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
    secondary: z.enum(elementTypes).optional(),
    primaryRatio: z.number().int().min(50).max(100).default(100),
  }).refine((data) => {
    if (!data.secondary) return true;
    return adjacentElements[data.primary].includes(data.secondary);
  }, '인접 속성만 조합할 수 있습니다'),

  stats: z.object({
    str: z.number().int().min(5),
    agi: z.number().int().min(5),
    vit: z.number().int().min(5),
    con: z.number().int().min(5),
    int: z.number().int().min(5),
  }).refine((data) => {
    const total = data.str + data.agi + data.vit + data.con + data.int;
    return total === 45; // 초기 25 + 보너스 20
  }, '스탯 총합은 45여야 합니다'),
});

export type CreateCharacterInput = z.infer<typeof createCharacterSchema>;
