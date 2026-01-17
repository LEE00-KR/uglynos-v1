import { z } from 'zod';

export const startBattleSchema = z.object({
  stageId: z.string(),  // admin_stages.id (VARCHAR)
  partyPetIds: z.array(z.string().uuid()).max(3),
  ridingPetId: z.string().uuid().nullable().optional(),
});

export const battleActionSchema = z.object({
  battleId: z.string().uuid(),

  characterAction: z.object({
    type: z.enum(['attack', 'defend', 'skill', 'item', 'capture', 'wait']),
    targetId: z.string().optional(),
    skillId: z.string().optional(),  // admin_skills.id (VARCHAR)
    itemId: z.string().optional(),  // admin_shop_items.id (VARCHAR)
  }),

  petActions: z.array(z.object({
    petId: z.string().uuid(),
    skillId: z.string(),  // admin_skills.id (VARCHAR)
    targetId: z.string(),
  })),
});

export type StartBattleInput = z.infer<typeof startBattleSchema>;
export type BattleActionInput = z.infer<typeof battleActionSchema>;
