/**
 * 펫 성장 시스템 서비스 (4스탯)
 * admin_pets 테이블 사용
 */

import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/database.js';
import { MAX_LEVEL, getRequiredExpForLevel, GROWTH_GROUPS } from '../config/monster.js';
import {
  generateRandomPetStats,
  generateRandomGrowthRates,
  calculateGrowthGroup,
  calculateLevelUpStatIncrease,
  type GrowthGroup,
} from '../utils/formulas.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import type { BaseStats } from '../types/game.js';

// ============================================
// 레벨업 결과 타입
// ============================================
interface LevelUpResult {
  previousLevel: number;
  newLevel: number;
  statIncreases: BaseStats;
  newStats: BaseStats;
}

// ============================================
// 펫 공개 데이터 타입
// ============================================
interface PetPublicData {
  id: string;
  templateId: string;
  templateName: string;
  nickname?: string;
  level: number;
  exp: number;
  expToNextLevel: number;
  stats: BaseStats;
  growthRates: {
    hp: number;
    atk: number;
    def: number;
    spd: number;
  };
  growthGroup: GrowthGroup;
  currentHp: number;
  maxHp: number;
  loyalty: number;
  isRareColor: boolean;
  element: {
    primary: string;
    secondary?: string;
    primaryRatio: number;
  };
}

// ============================================
// 펫 생성 (포획 시 사용)
// ============================================
export async function createPet(
  characterId: string,
  templateId: string,
  isRareColor: boolean = false,
  initialLoyalty: number = 50
) {
  // 1. 템플릿 조회 (admin_pets)
  const { data: template, error: templateError } = await supabase
    .from('admin_pets')
    .select('*')
    .eq('id', templateId)
    .single();

  if (templateError || !template) {
    throw new NotFoundError('펫 템플릿');
  }

  // 2. 랜덤 스탯 생성 (4스탯)
  const stats = generateRandomPetStats(
    {
      hp: { min: template.base_hp_min, max: template.base_hp_max },
      atk: { min: template.base_atk_min, max: template.base_atk_max },
      def: { min: template.base_def_min, max: template.base_def_max },
      spd: { min: template.base_spd_min, max: template.base_spd_max },
    },
    {
      hp: template.bonus_hp,
      atk: template.bonus_atk,
      def: template.bonus_def,
      spd: template.bonus_spd,
    }
  );

  // 3. 성장률 생성 (4스탯)
  const growthRates = generateRandomGrowthRates({
    hp: { min: template.growth_hp_min, max: template.growth_hp_max },
    atk: { min: template.growth_atk_min, max: template.growth_atk_max },
    def: { min: template.growth_def_min, max: template.growth_def_max },
    spd: { min: template.growth_spd_min, max: template.growth_spd_max },
  });

  // 4. 성장 그룹 결정
  const growthGroup = calculateGrowthGroup(stats, template.total_stats);

  // 5. DB에 저장
  const petId = uuidv4();
  const now = new Date().toISOString();

  const { error: insertError } = await supabase.from('pets').insert({
    id: petId,
    character_id: characterId,
    template_id: templateId,
    nickname: null,
    level: 1,
    exp: 0,
    stat_hp: stats.hp,
    stat_atk: stats.atk,
    stat_def: stats.def,
    stat_spd: stats.spd,
    growth_hp: growthRates.hp,
    growth_atk: growthRates.atk,
    growth_def: growthRates.def,
    growth_spd: growthRates.spd,
    growth_group: growthGroup,
    current_hp: stats.hp,
    loyalty: initialLoyalty,
    is_rare_color: isRareColor,
    is_starter: false,
    created_at: now,
    updated_at: now,
  });

  if (insertError) {
    throw insertError;
  }

  return {
    id: petId,
    templateId,
    characterId,
    level: 1,
    exp: 0,
    stats,
    growthRates,
    growthGroup,
    currentHp: stats.hp,
    loyalty: initialLoyalty,
    isRareColor,
  };
}

// ============================================
// 경험치 추가 및 레벨업 처리
// ============================================
export async function addExperience(
  petId: string,
  characterId: string,
  expAmount: number
): Promise<{ levelUps: LevelUpResult[]; finalExp: number; finalLevel: number }> {
  // 1. 펫 조회
  const { data: pet, error: petError } = await supabase
    .from('pets')
    .select('*')
    .eq('id', petId)
    .single();

  if (petError || !pet) {
    throw new NotFoundError('펫');
  }

  if (pet.character_id !== characterId) {
    throw new ValidationError('접근 권한이 없습니다');
  }

  // 2. 경험치 추가 및 레벨업 처리
  const levelUps: LevelUpResult[] = [];
  let currentExp = pet.exp + expAmount;
  let currentLevel = pet.level;
  let currentStats: BaseStats = {
    hp: pet.stat_hp,
    atk: pet.stat_atk,
    def: pet.stat_def,
    spd: pet.stat_spd,
  };

  while (currentLevel < MAX_LEVEL) {
    const requiredExp = getRequiredExpForLevel(currentLevel);
    if (currentExp < requiredExp) break;

    currentExp -= requiredExp;
    const previousLevel = currentLevel;
    currentLevel++;

    // 레벨업 스탯 증가 계산
    const statIncreases: BaseStats = {
      hp: calculateLevelUpStatIncrease(pet.growth_hp, pet.growth_group),
      atk: calculateLevelUpStatIncrease(pet.growth_atk, pet.growth_group),
      def: calculateLevelUpStatIncrease(pet.growth_def, pet.growth_group),
      spd: calculateLevelUpStatIncrease(pet.growth_spd, pet.growth_group),
    };

    currentStats = {
      hp: currentStats.hp + statIncreases.hp,
      atk: currentStats.atk + statIncreases.atk,
      def: currentStats.def + statIncreases.def,
      spd: currentStats.spd + statIncreases.spd,
    };

    levelUps.push({
      previousLevel,
      newLevel: currentLevel,
      statIncreases,
      newStats: { ...currentStats },
    });
  }

  // 3. DB 업데이트
  const { error: updateError } = await supabase
    .from('pets')
    .update({
      level: currentLevel,
      exp: currentExp,
      stat_hp: Math.floor(currentStats.hp),
      stat_atk: Math.floor(currentStats.atk),
      stat_def: Math.floor(currentStats.def),
      stat_spd: Math.floor(currentStats.spd),
      updated_at: new Date().toISOString(),
    })
    .eq('id', petId);

  if (updateError) {
    throw updateError;
  }

  return {
    levelUps,
    finalExp: currentExp,
    finalLevel: currentLevel,
  };
}

// ============================================
// 펫 정보 조회 (공개 데이터)
// ============================================
export async function getPetPublicData(
  petId: string,
  characterId: string
): Promise<PetPublicData> {
  const { data: pet, error: petError } = await supabase
    .from('pets')
    .select(`
      *,
      admin_pets (
        id,
        name,
        element_primary,
        element_secondary,
        element_primary_ratio
      )
    `)
    .eq('id', petId)
    .single();

  if (petError || !pet) {
    throw new NotFoundError('펫');
  }

  if (pet.character_id !== characterId) {
    throw new ValidationError('접근 권한이 없습니다');
  }

  return toPetPublicData(pet);
}

// ============================================
// 캐릭터의 모든 펫 조회 (공개 데이터)
// ============================================
export async function getAllPetsPublicData(characterId: string): Promise<PetPublicData[]> {
  const { data: pets, error } = await supabase
    .from('pets')
    .select(`
      *,
      admin_pets (
        id,
        name,
        element_primary,
        element_secondary,
        element_primary_ratio
      )
    `)
    .eq('character_id', characterId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (pets || []).map(toPetPublicData);
}

// ============================================
// 충성도 업데이트
// ============================================
export async function updateLoyalty(
  petId: string,
  characterId: string,
  change: number
): Promise<number> {
  const { data: pet, error: petError } = await supabase
    .from('pets')
    .select('loyalty, character_id')
    .eq('id', petId)
    .single();

  if (petError || !pet) {
    throw new NotFoundError('펫');
  }

  if (pet.character_id !== characterId) {
    throw new ValidationError('접근 권한이 없습니다');
  }

  const newLoyalty = Math.max(0, Math.min(100, pet.loyalty + change));

  await supabase.from('pets').update({ loyalty: newLoyalty }).eq('id', petId);

  return newLoyalty;
}

// ============================================
// 전투 후 HP 업데이트 (펫에는 기력 없음)
// ============================================
export async function updateBattleStats(
  petId: string,
  currentHp: number
): Promise<void> {
  await supabase
    .from('pets')
    .update({
      current_hp: Math.max(0, currentHp),
    })
    .eq('id', petId);
}

// ============================================
// 펫 HP 완전 회복 (치료)
// ============================================
export async function fullRestore(petId: string, characterId: string): Promise<void> {
  const { data: pet, error: petError } = await supabase
    .from('pets')
    .select('stat_hp, character_id')
    .eq('id', petId)
    .single();

  if (petError || !pet) {
    throw new NotFoundError('펫');
  }

  if (pet.character_id !== characterId) {
    throw new ValidationError('접근 권한이 없습니다');
  }

  await supabase
    .from('pets')
    .update({
      current_hp: pet.stat_hp,  // 최대 HP로 회복
    })
    .eq('id', petId);
}

// ============================================
// 캐릭터 HP/기력 회복 (치료)
// 기력은 항상 100 고정
// ============================================
export async function restoreCharacter(
  characterId: string,
  userId: string
): Promise<void> {
  const { data: character, error } = await supabase
    .from('characters')
    .select('stat_hp, user_id')
    .eq('id', characterId)
    .single();

  if (error || !character) {
    throw new NotFoundError('캐릭터');
  }

  if (character.user_id !== userId) {
    throw new ValidationError('접근 권한이 없습니다');
  }

  await supabase
    .from('characters')
    .update({
      current_hp: character.stat_hp,  // 최대 HP로 회복
      current_energy: 100,  // 기력 100으로 회복 (고정값)
    })
    .eq('id', characterId);
}

// ============================================
// 헬퍼 함수: DB Row -> PetPublicData
// ============================================
function toPetPublicData(row: any): PetPublicData {
  const template = row.admin_pets;

  return {
    id: row.id,
    templateId: row.template_id,
    templateName: template?.name || 'Unknown',
    nickname: row.nickname || undefined,
    level: row.level,
    exp: row.exp,
    expToNextLevel: getRequiredExpForLevel(row.level),
    stats: {
      hp: row.stat_hp,
      atk: row.stat_atk,
      def: row.stat_def,
      spd: row.stat_spd,
    },
    growthRates: {
      hp: row.growth_hp,
      atk: row.growth_atk,
      def: row.growth_def,
      spd: row.growth_spd,
    },
    growthGroup: row.growth_group,
    currentHp: row.current_hp ?? row.stat_hp,
    maxHp: row.stat_hp,
    loyalty: row.loyalty,
    isRareColor: row.is_rare_color,
    element: {
      primary: template?.element_primary || 'earth',
      secondary: template?.element_secondary || undefined,
      primaryRatio: template?.element_primary_ratio || 100,
    },
  };
}

export const monsterService = {
  createPet,
  addExperience,
  getPetPublicData,
  getAllPetsPublicData,
  updateLoyalty,
  updateBattleStats,
  fullRestore,
  restoreCharacter,
};
