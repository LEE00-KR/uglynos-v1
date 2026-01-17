/**
 * 펫 성장 시스템 서비스 (4스탯)
 * admin_pets 테이블 사용
 */

import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/database.js';
import { MAX_LEVEL, getRequiredExpForLevel } from '../config/monster.js';
import {
  generateRandomPetStats,
  generatePetGrowthInfo,
  calculateLevelUpWithGrowthInfo,
  type PetGrowthInfo,
  type PetStatsRange,
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
// 펫 공개 데이터 타입 (성장 그룹은 비공개)
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
  // growthGroup 제거됨 - 유저에게 비공개
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
// 펫 생성 (포획 시 사용) - ISG 기반 성장 시스템
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

  // 2. 스탯 범위 정의 (ISG 계산용)
  const statsRange: PetStatsRange = {
    hp: {
      min: template.base_hp_min,
      base: template.base_hp_base ?? Math.floor((template.base_hp_min + template.base_hp_max) / 2),
      max: template.base_hp_max,
    },
    atk: {
      min: template.base_atk_min,
      base: template.base_atk_base ?? Math.floor((template.base_atk_min + template.base_atk_max) / 2),
      max: template.base_atk_max,
    },
    def: {
      min: template.base_def_min,
      base: template.base_def_base ?? Math.floor((template.base_def_min + template.base_def_max) / 2),
      max: template.base_def_max,
    },
    spd: {
      min: template.base_spd_min,
      base: template.base_spd_base ?? Math.floor((template.base_spd_min + template.base_spd_max) / 2),
      max: template.base_spd_max,
    },
  };

  // 3. 랜덤 초기 스탯 생성 (min~max 범위 내)
  const stats = generateRandomPetStats(statsRange);

  // 4. 종족 기준 성장률 (base 값 사용)
  const baseGrowthRates = {
    hp: template.growth_hp_base ?? (template.growth_hp_min + template.growth_hp_max) / 2,
    atk: template.growth_atk_base ?? (template.growth_atk_min + template.growth_atk_max) / 2,
    def: template.growth_def_base ?? (template.growth_def_min + template.growth_def_max) / 2,
    spd: template.growth_spd_base ?? (template.growth_spd_min + template.growth_spd_max) / 2,
  };

  // 5. ISG 기반 성장 정보 생성 (초기 스탯 기반 천장 + 확률 적용)
  const growthInfo = generatePetGrowthInfo(stats, statsRange);

  // 6. DB에 저장
  const petId = uuidv4();
  const now = new Date().toISOString();

  const { error: insertError } = await supabase.from('user_pets').insert({
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
    growth_hp: baseGrowthRates.hp,
    growth_atk: baseGrowthRates.atk,
    growth_def: baseGrowthRates.def,
    growth_spd: baseGrowthRates.spd,
    growth_group: growthInfo.baseGroup,  // 레거시 호환
    growth_info: growthInfo,  // 새 시스템: 스탯별 성장 정보 (JSONB)
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

  // 반환값에서 성장 그룹 정보 제외 (유저에게 비공개)
  return {
    id: petId,
    templateId,
    characterId,
    level: 1,
    exp: 0,
    stats,
    growthRates: baseGrowthRates,
    currentHp: stats.hp,
    loyalty: initialLoyalty,
    isRareColor,
  };
}

// ============================================
// 경험치 추가 및 레벨업 처리 - ISG 기반 성장 시스템
// ============================================
export async function addExperience(
  petId: string,
  characterId: string,
  expAmount: number
): Promise<{ levelUps: LevelUpResult[]; finalExp: number; finalLevel: number }> {
  // 1. 펫 조회 (growth_info 포함)
  const { data: pet, error: petError } = await supabase
    .from('user_pets')
    .select('*')
    .eq('id', petId)
    .single();

  if (petError || !pet) {
    throw new NotFoundError('펫');
  }

  if (pet.character_id !== characterId) {
    throw new ValidationError('접근 권한이 없습니다');
  }

  // 2. 성장 정보 파싱 (새 시스템 또는 레거시 호환)
  let growthInfo: PetGrowthInfo;
  if (pet.growth_info) {
    growthInfo = pet.growth_info as PetGrowthInfo;
  } else {
    // 레거시 데이터: 단일 growth_group으로 모든 스탯 동일하게 적용
    type LegacyGrowthGroup = 'S++' | 'S+' | 'S' | 'A' | 'B' | 'C' | 'D';
    const legacyGroup = (pet.growth_group || 'B') as LegacyGrowthGroup;
    const multiplierMap: Record<LegacyGrowthGroup, number> = {
      'S++': 1.04, 'S+': 1.02, 'S': 1.01, 'A': 1.00,
      'B': 0.97, 'C': 0.94, 'D': 0.90
    };
    const legacyMultiplier = multiplierMap[legacyGroup] ?? 0.97;

    growthInfo = {
      baseGroup: legacyGroup,
      perStatGroups: {
        hp: legacyGroup, atk: legacyGroup, def: legacyGroup, spd: legacyGroup,
      },
      perStatMultipliers: {
        hp: legacyMultiplier, atk: legacyMultiplier,
        def: legacyMultiplier, spd: legacyMultiplier,
      },
    };
  }

  // 3. 종족 기준 성장률
  const baseGrowthRates = {
    hp: pet.growth_hp,
    atk: pet.growth_atk,
    def: pet.growth_def,
    spd: pet.growth_spd,
  };

  // 4. 경험치 추가 및 레벨업 처리
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

    // 레벨업 스탯 증가 계산 (스탯별 배수 적용)
    const statIncreases = calculateLevelUpWithGrowthInfo(baseGrowthRates, growthInfo);

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

  // 5. DB 업데이트
  const { error: updateError } = await supabase
    .from('user_pets')
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
    .from('user_pets')
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
    .from('user_pets')
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
    .from('user_pets')
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

  await supabase.from('user_pets').update({ loyalty: newLoyalty }).eq('id', petId);

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
    .from('user_pets')
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
    .from('user_pets')
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
    .from('user_pets')
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
// 헬퍼 함수: DB Row -> PetPublicData (성장 그룹 비공개)
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
    // growthGroup 제거됨 - 유저에게 비공개
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
