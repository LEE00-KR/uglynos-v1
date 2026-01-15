// Element types
export type ElementType = 'earth' | 'wind' | 'fire' | 'water';

// Base stats interface
export interface BaseStats {
  str: number;
  agi: number;
  vit: number;
  con: number;
  int: number;
}

// Derived stats interface
export interface DerivedStats {
  maxHp: number;
  maxMp: number;
  atk: number;
  def: number;
  spd: number;
  eva: number;
}

// Element info for compound elements
export interface ElementInfo {
  primary: ElementType;
  secondary?: ElementType;
  primaryRatio: number;
}

// Status effect types
export type StatusEffectType =
  | 'poison'
  | 'petrify'
  | 'confusion'
  | 'freeze'
  | 'paralysis'
  | 'blind'
  | 'silence'
  | 'fear'
  | 'burn';

export interface StatusEffect {
  type: StatusEffectType;
  remainingTurns: number;
  appliedAt: number;
}

// Weapon types
export type WeaponType = 'sword' | 'club' | 'axe' | 'spear' | 'claw' | 'bow';

// Equipment slot types
export type EquipmentSlotType =
  | 'weapon'
  | 'armor'
  | 'helmet'
  | 'bracelet'
  | 'necklace';

// Battle unit interface
export interface BattleUnit {
  id: string;
  type: 'character' | 'pet' | 'enemy';
  templateId?: number;
  ownerId?: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  stats: {
    atk: number;
    def: number;
    spd: number;
    eva: number;
    int: number;
  };
  element: ElementInfo;
  statusEffects: StatusEffect[];
  equipment?: EquipmentInfo;
  skills?: PetSkill[];
  loyalty?: number;
  isRiding?: boolean;
  ridingPetId?: string;
  isCapturable?: boolean;
  isRareColor?: boolean;
  isAlive: boolean;
  isDefending: boolean;
}

export interface EquipmentInfo {
  id: string;
  templateId: number;
  slotType: EquipmentSlotType;
  weaponType?: WeaponType;
  stats: BaseStats;
  attackRatio: number;
  accuracy: number;
  hitCount: number;
  durability: number;
  spellId?: number;
}

export interface PetSkill {
  id: number;
  name: string;
  element?: ElementType;
  damageRatio?: number;
  effectType: string;
  targetType: string;
  mpCost: number;
}

// Battle action types
export type ActionType =
  | 'attack'
  | 'defend'
  | 'magic'
  | 'item'
  | 'capture'
  | 'wait'
  | 'flee';

export interface BattleAction {
  actorId: string;
  type: ActionType;
  targetId?: string;
  spellId?: number;
  itemId?: string;
  skillId?: number;
  reason?: string;
}

// Battle state
export interface BattleState {
  id: string;
  stageId: number;
  phase: 'waiting' | 'in_progress' | 'victory' | 'defeat' | 'fled';
  turnNumber: number;
  units: Map<string, BattleUnit>;
  turnOrder: string[];
  currentTurnIndex: number;
  pendingActions: Map<string, BattleAction>;
  partyId?: string;
  participants: string[];
  turnStartedAt: number;
  turnTimeout: number;
  potentialDrops: Drop[];
  createdAt: number;
  updatedAt: number;
}

export interface Drop {
  itemType: 'material' | 'equipment' | 'consumable';
  itemId: number;
  quantity: number;
}

// Damage calculation
export interface DamageOptions {
  weaponInfo?: EquipmentInfo;
  attackElement?: ElementInfo;
  critChance?: number;
  gangUpBonus?: number;
}

export interface DamageResult {
  damage: number;
  isCritical: boolean;
  elementMultiplier: number;
  statusWeaknessMultiplier: number;
  wasDefending: boolean;
}

// Battle rewards
export interface BattleRewards {
  exp: ExpReward[];
  gold: number;
  drops: DroppedItem[];
  stars: number;
}

export interface ExpReward {
  characterId: string;
  exp: number;
}

export interface DroppedItem {
  itemType: 'material' | 'equipment' | 'consumable';
  itemId: number;
  quantity: number;
}

// Capture result
export interface CaptureResult {
  success: boolean;
  catchRate?: number;
  roll?: number;
  isRareColor?: boolean;
  reason?: string;
}

// Disobey result (pet loyalty)
export interface DisobeyResult {
  disobeyed: boolean;
  action?: string;
  message?: string;
}
