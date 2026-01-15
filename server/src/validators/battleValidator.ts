import { z } from 'zod';

export const startBattleSchema = z.object({
  stageId: z.number().int().positive(),
  partyPetIds: z.array(z.string().uuid()).max(3),
  ridingPetId: z.string().uuid().nullable().optional(),
});

export const battleActionSchema = z.object({
  battleId: z.string().uuid(),

  characterAction: z.object({
    type: z.enum(['attack', 'defend', 'magic', 'item', 'capture', 'wait']),
    targetId: z.string().optional(),
    spellId: z.number().int().optional(),
    itemId: z.string().uuid().optional(),
  }),

  petActions: z.array(z.object({
    petId: z.string().uuid(),
    skillId: z.number().int().min(1).max(2),
    targetId: z.string(),
  })),
});

export type StartBattleInput = z.infer<typeof startBattleSchema>;
export type BattleActionInput = z.infer<typeof battleActionSchema>;
