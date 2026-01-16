/**
 * 몬스터/펫 성장률 시스템 서비스
 */

import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/database.js';
import { GROWTH_GROUPS, MAX_LEVEL, getRequiredExpForLevel } from '../config/monster.js';
import type {
  MonsterInstance,
  MonsterPublicData,
  LevelUpResult,
  PetRow,
} from '../types/monster.js';
import {
  generateBaseStats,
  generateBonusStats,
  determineGrowthGroup,
  calculateGrowthRates,
  processLevelUp,
  calculateAverageGrowthRates,
  getExpectedGrowthRates,
  templateToSpecies,
  calculateMaxMp,
} from '../utils/monster.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

// ============================================
// 펫 생성 (포획 시 사용)
// ============================================
export async function createPet(
  characterId: string,
  templateId: number,
  isRareColor: boolean = false,
  initialLoyalty: number = 50
): Promise<MonsterInstance> {
  // 1. 템플릿 조회
  const { data: templateData, error: templateError } = await supabase
    .from('pet_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (templateError || !templateData) {
    throw new NotFoundError('펫 템플릿');
  }

  const species = templateToSpecies(templateData);

  // 2. 기본 초기치 생성 (숨김)
  const baseInitialStats = generateBaseStats(species);

  // 3. 보너스 스탯 생성 (숨김)
  const bonusStats = generateBonusStats(species);

  // 4. 최종 초기치 계산 (공개)
  const initialStats = {
    hp: baseInitialStats.hp + bonusStats.hp,
    atk: baseInitialStats.atk + bonusStats.atk,
    def: baseInitialStats.def + bonusStats.def,
    spd: baseInitialStats.spd + bonusStats.spd,
  };

  // 5. 성장 그룹 결정
  const growthGroup = determineGrowthGroup(baseInitialStats, species);

  // 6. 성장률 범위 확정 (그룹 배율 적용)
  const growthRates = calculateGrowthRates(species, growthGroup);

  // 7. MP 계산
  const maxMp = calculateMaxMp(1);

  // 8. DB에 저장
  const petId = uuidv4();
  const now = new Date().toISOString();

  const { error: insertError } = await supabase.from('pets').insert({
    id: petId,
    character_id: characterId,
    template_id: templateId,
    nickname: null,
    level: 1,
    exp: 0,

    // 초기치 (숨김)
    base_initial_hp: baseInitialStats.hp,
    base_initial_atk: baseInitialStats.atk,
    base_initial_def: baseInitialStats.def,
    base_initial_spd: baseInitialStats.spd,

    // 보너스 스탯
    bonus_hp: bonusStats.hp,
    bonus_atk: bonusStats.atk,
    bonus_def: bonusStats.def,
    bonus_spd: bonusStats.spd,

    // 최종 초기치
    initial_hp: initialStats.hp,
    initial_atk: initialStats.atk,
    initial_def: initialStats.def,
    initial_spd: initialStats.spd,

    // 현재 스탯 (초기치와 동일)
    current_hp: initialStats.hp,
    current_atk: initialStats.atk,
    current_def: initialStats.def,
    current_spd: initialStats.spd,

    // 전투용 HP/MP
    battle_hp: initialStats.hp,
    battle_mp: maxMp,
    max_mp: maxMp,

    // 성장 그룹
    growth_group: growthGroup,

    // 성장률 범위
    growth_hp_min: growthRates.hp.min,
    growth_hp_max: growthRates.hp.max,
    growth_atk_min: growthRates.atk.min,
    growth_atk_max: growthRates.atk.max,
    growth_def_min: growthRates.def.min,
    growth_def_max: growthRates.def.max,
    growth_spd_min: growthRates.spd.min,
    growth_spd_max: growthRates.spd.max,

    // 성장 기록
    growth_history: JSON.stringify({ hp: [], atk: [], def: [], spd: [] }),

    // 희귀 색상
    is_rare_color: isRareColor,

    // 충성도
    loyalty: initialLoyalty,

    created_at: now,
    updated_at: now,
  });

  if (insertError) {
    throw insertError;
  }

  // 9. MonsterInstance 객체 반환
  return {
    id: petId,
    speciesId: templateId,
    ownerId: characterId,
    nickname: undefined,
    level: 1,
    exp: 0,
    baseInitialStats,
    bonusStats,
    initialStats,
    currentStats: { ...initialStats },
    currentHp: initialStats.hp,
    currentMp: maxMp,
    maxMp,
    growthGroup,
    growthRates,
    growthHistory: { hp: [], atk: [], def: [], spd: [] },
    isRareColor,
    loyalty: initialLoyalty,
    createdAt: new Date(now),
    updatedAt: new Date(now),
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
  const { data: petData, error: petError } = await supabase
    .from('pets')
    .select('*, pet_templates (*)')
    .eq('id', petId)
    .single();

  if (petError || !petData) {
    throw new NotFoundError('펫');
  }

  if (petData.character_id !== characterId) {
    throw new ValidationError('접근 권한이 없습니다');
  }

  // 2. MonsterInstance로 변환
  const monster = petRowToMonsterInstance(petData);

  // 3. 경험치 추가 및 레벨업 처리
  const levelUps: LevelUpResult[] = [];
  monster.exp += expAmount;

  while (monster.level < MAX_LEVEL) {
    const requiredExp = getRequiredExpForLevel(monster.level);
    if (monster.exp < requiredExp) break;

    monster.exp -= requiredExp;
    const result = processLevelUp(monster);
    levelUps.push(result);
  }

  // 4. DB 업데이트
  const { error: updateError } = await supabase
    .from('pets')
    .update({
      level: monster.level,
      exp: monster.exp,
      current_hp: Math.floor(monster.currentStats.hp),
      current_atk: Math.floor(monster.currentStats.atk),
      current_def: Math.floor(monster.currentStats.def),
      current_spd: Math.floor(monster.currentStats.spd),
      battle_hp: monster.currentHp,
      max_mp: calculateMaxMp(monster.level),
      growth_history: JSON.stringify(monster.growthHistory),
      updated_at: new Date().toISOString(),
    })
    .eq('id', petId);

  if (updateError) {
    throw updateError;
  }

  return {
    levelUps,
    finalExp: monster.exp,
    finalLevel: monster.level,
  };
}

// ============================================
// 펫 정보 조회 (공개 데이터)
// ============================================
export async function getPetPublicData(
  petId: string,
  characterId: string
): Promise<MonsterPublicData> {
  const { data: petData, error: petError } = await supabase
    .from('pets')
    .select('*, pet_templates (*)')
    .eq('id', petId)
    .single();

  if (petError || !petData) {
    throw new NotFoundError('펫');
  }

  if (petData.character_id !== characterId) {
    throw new ValidationError('접근 권한이 없습니다');
  }

  return toPublicData(petData);
}

// ============================================
// 캐릭터의 모든 펫 조회 (공개 데이터)
// ============================================
export async function getAllPetsPublicData(characterId: string): Promise<MonsterPublicData[]> {
  const { data: petsData, error } = await supabase
    .from('pets')
    .select('*, pet_templates (*)')
    .eq('character_id', characterId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (petsData || []).map(toPublicData);
}

// ============================================
// 충성도 업데이트
// ============================================
export async function updateLoyalty(
  petId: string,
  characterId: string,
  change: number
): Promise<number> {
  const { data: petData, error: petError } = await supabase
    .from('pets')
    .select('loyalty, character_id')
    .eq('id', petId)
    .single();

  if (petError || !petData) {
    throw new NotFoundError('펫');
  }

  if (petData.character_id !== characterId) {
    throw new ValidationError('접근 권한이 없습니다');
  }

  const newLoyalty = Math.max(0, Math.min(100, petData.loyalty + change));

  await supabase.from('pets').update({ loyalty: newLoyalty }).eq('id', petId);

  return newLoyalty;
}

// ============================================
// 전투 후 HP/MP 업데이트
// ============================================
export async function updateBattleStats(
  petId: string,
  currentHp: number,
  currentMp: number
): Promise<void> {
  await supabase
    .from('pets')
    .update({
      battle_hp: Math.max(0, currentHp),
      battle_mp: Math.max(0, currentMp),
    })
    .eq('id', petId);
}

// ============================================
// HP/MP 완전 회복
// ============================================
export async function fullRestore(petId: string, characterId: string): Promise<void> {
  const { data: petData, error: petError } = await supabase
    .from('pets')
    .select('current_hp, max_mp, character_id')
    .eq('id', petId)
    .single();

  if (petError || !petData) {
    throw new NotFoundError('펫');
  }

  if (petData.character_id !== characterId) {
    throw new ValidationError('접근 권한이 없습니다');
  }

  await supabase
    .from('pets')
    .update({
      battle_hp: petData.current_hp,
      battle_mp: petData.max_mp,
    })
    .eq('id', petId);
}

// ============================================
// 헬퍼 함수: DB Row -> MonsterInstance
// ============================================
function petRowToMonsterInstance(row: PetRow & { pet_templates: any }): MonsterInstance {
  const growthHistory =
    typeof row.growth_history === 'string'
      ? JSON.parse(row.growth_history)
      : row.growth_history || { hp: [], atk: [], def: [], spd: [] };

  return {
    id: row.id,
    speciesId: row.template_id,
    ownerId: row.character_id,
    nickname: row.nickname ?? undefined,
    level: row.level,
    exp: row.exp,
    baseInitialStats: {
      hp: row.base_initial_hp,
      atk: row.base_initial_atk,
      def: row.base_initial_def,
      spd: row.base_initial_spd,
    },
    bonusStats: {
      hp: row.bonus_hp,
      atk: row.bonus_atk,
      def: row.bonus_def,
      spd: row.bonus_spd,
    },
    initialStats: {
      hp: row.initial_hp,
      atk: row.initial_atk,
      def: row.initial_def,
      spd: row.initial_spd,
    },
    currentStats: {
      hp: row.current_hp,
      atk: row.current_atk,
      def: row.current_def,
      spd: row.current_spd,
    },
    currentHp: row.battle_hp,
    currentMp: row.battle_mp,
    maxMp: row.max_mp,
    growthGroup: row.growth_group as MonsterInstance['growthGroup'],
    growthRates: {
      hp: { min: row.growth_hp_min, max: row.growth_hp_max },
      atk: { min: row.growth_atk_min, max: row.growth_atk_max },
      def: { min: row.growth_def_min, max: row.growth_def_max },
      spd: { min: row.growth_spd_min, max: row.growth_spd_max },
    },
    growthHistory,
    isRareColor: row.is_rare_color,
    loyalty: row.loyalty,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// ============================================
// 헬퍼 함수: DB Row -> MonsterPublicData
// ============================================
function toPublicData(row: PetRow & { pet_templates: any }): MonsterPublicData {
  const growthHistory =
    typeof row.growth_history === 'string'
      ? JSON.parse(row.growth_history)
      : row.growth_history || { hp: [], atk: [], def: [], spd: [] };

  const avgGrowth = calculateAverageGrowthRates(growthHistory);

  // 레벨 1이면 예상 성장률 표시
  const displayGrowth =
    row.level === 1
      ? getExpectedGrowthRates({
          hp: { min: row.growth_hp_min, max: row.growth_hp_max },
          atk: { min: row.growth_atk_min, max: row.growth_atk_max },
          def: { min: row.growth_def_min, max: row.growth_def_max },
          spd: { min: row.growth_spd_min, max: row.growth_spd_max },
        })
      : avgGrowth;

  return {
    id: row.id,
    species: {
      id: row.template_id,
      name: row.pet_templates?.name || 'Unknown',
      element: row.pet_templates?.element_primary || 'earth',
      secondaryElement: row.pet_templates?.element_secondary || undefined,
      rarity: row.pet_templates?.rarity || 'common',
      imageUrl: row.pet_templates?.image_url || undefined,
    },
    nickname: row.nickname ?? undefined,
    level: row.level,
    exp: row.exp,
    expToNextLevel: getRequiredExpForLevel(row.level),
    stats: {
      initial: {
        hp: row.initial_hp,
        atk: row.initial_atk,
        def: row.initial_def,
        spd: row.initial_spd,
      },
      current: {
        hp: Math.floor(row.current_hp),
        atk: Math.floor(row.current_atk),
        def: Math.floor(row.current_def),
        spd: Math.floor(row.current_spd),
      },
    },
    currentHp: row.battle_hp,
    maxHp: Math.floor(row.current_hp),
    currentMp: row.battle_mp,
    maxMp: row.max_mp,
    growthRates: displayGrowth,
    grade: row.growth_group as MonsterPublicData['grade'],
    stars: GROWTH_GROUPS[row.growth_group as keyof typeof GROWTH_GROUPS]?.stars || 0,
    isRareColor: row.is_rare_color,
    loyalty: row.loyalty,
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
};
