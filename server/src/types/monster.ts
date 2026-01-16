/**
 * 몬스터/펫 성장률 시스템 타입 정의
 */

import type { GrowthGroup, Element, Rarity } from '../config/monster.js';

// ============================================
// 기본 타입
// ============================================
export interface StatBlock {
  hp: number;
  atk: number;
  def: number;
  spd: number;
}

export interface StatRange {
  min: number;
  max: number;
}

// ============================================
// 종족 정의 (템플릿)
// ============================================
export interface MonsterSpecies {
  id: number;
  name: string;
  description: string;
  element: Element;
  secondaryElement?: Element;
  elementRatio: number; // 주 속성 비율 (50-100)
  rarity: Rarity;

  // 기본 초기치 범위 (숨김)
  baseStats: {
    hp: StatRange;
    atk: StatRange;
    def: StatRange;
    spd: StatRange;
  };

  // 보너스 풀 범위
  bonusPool: StatRange;

  // 성장률 범위
  growthRates: {
    hp: StatRange;
    atk: StatRange;
    def: StatRange;
    spd: StatRange;
  };

  maxLevel: number;
  evolutionId?: number;
  imageUrl?: string;
}

// ============================================
// 개체 인스턴스 (실제 펫)
// ============================================
export interface MonsterInstance {
  id: string;
  speciesId: number;
  ownerId: string;
  nickname?: string;

  level: number;
  exp: number;

  // 초기치 (숨김)
  baseInitialStats: StatBlock;
  bonusStats: StatBlock;

  // 최종 초기치 (공개) = base + bonus
  initialStats: StatBlock;

  // 현재 스탯
  currentStats: StatBlock;

  // 현재 HP/MP (전투용)
  currentHp: number;
  currentMp: number;
  maxMp: number;

  // 성장 그룹 (기본 초기치 비율로 결정)
  growthGroup: GrowthGroup;

  // 성장률 범위 (그룹 배율 적용됨)
  growthRates: {
    hp: StatRange;
    atk: StatRange;
    def: StatRange;
    spd: StatRange;
  };

  // 레벨업 기록 (평균 성장률 계산용)
  growthHistory: {
    hp: number[];
    atk: number[];
    def: number[];
    spd: number[];
  };

  // 희귀 색상 여부
  isRareColor: boolean;

  // 충성도
  loyalty: number;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// 레벨업 결과
// ============================================
export interface LevelUpResult {
  previousLevel: number;
  newLevel: number;
  statIncreases: StatBlock;
  newStats: StatBlock;
}

// ============================================
// API 응답용 (숨김 데이터 제외)
// ============================================
export interface MonsterPublicData {
  id: string;
  species: {
    id: number;
    name: string;
    element: Element;
    secondaryElement?: Element;
    rarity: Rarity;
    imageUrl?: string;
  };
  nickname?: string;
  level: number;
  exp: number;
  expToNextLevel: number;

  // 공개 스탯
  stats: {
    initial: StatBlock;
    current: StatBlock;
  };

  // 현재 HP/MP
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;

  // 계산된 성장률 (평균)
  growthRates: {
    hp: number;
    atk: number;
    def: number;
    spd: number;
    total: number; // atk + def + spd
  };

  // 등급 표시
  grade: GrowthGroup;
  stars: number;

  // 희귀 색상
  isRareColor: boolean;

  // 충성도
  loyalty: number;
}

// ============================================
// DB 저장용 타입 (PostgreSQL)
// ============================================
export interface PetTemplateRow {
  id: number;
  name: string;
  description: string;
  element_primary: string;
  element_secondary: string | null;
  element_primary_ratio: number;
  rarity: string;

  // 기본 초기치 범위
  base_hp_min: number;
  base_hp_max: number;
  base_atk_min: number;
  base_atk_max: number;
  base_def_min: number;
  base_def_max: number;
  base_spd_min: number;
  base_spd_max: number;

  // 보너스 풀 범위
  bonus_pool_min: number;
  bonus_pool_max: number;

  // 성장률 범위
  growth_hp_min: number;
  growth_hp_max: number;
  growth_atk_min: number;
  growth_atk_max: number;
  growth_def_min: number;
  growth_def_max: number;
  growth_spd_min: number;
  growth_spd_max: number;

  max_level: number;
  evolution_id: number | null;
  image_url: string | null;

  created_at: string;
  updated_at: string;
}

export interface PetRow {
  id: string;
  character_id: string;
  template_id: number;
  nickname: string | null;

  level: number;
  exp: number;

  // 초기치 (숨김)
  base_initial_hp: number;
  base_initial_atk: number;
  base_initial_def: number;
  base_initial_spd: number;

  // 보너스 스탯
  bonus_hp: number;
  bonus_atk: number;
  bonus_def: number;
  bonus_spd: number;

  // 최종 초기치
  initial_hp: number;
  initial_atk: number;
  initial_def: number;
  initial_spd: number;

  // 현재 스탯
  current_hp: number;
  current_atk: number;
  current_def: number;
  current_spd: number;

  // 전투용 HP/MP
  battle_hp: number;
  battle_mp: number;
  max_mp: number;

  // 성장 그룹
  growth_group: string;

  // 성장률 범위 (그룹 배율 적용됨)
  growth_hp_min: number;
  growth_hp_max: number;
  growth_atk_min: number;
  growth_atk_max: number;
  growth_def_min: number;
  growth_def_max: number;
  growth_spd_min: number;
  growth_spd_max: number;

  // 성장 기록 (JSON)
  growth_history: string;

  // 희귀 색상
  is_rare_color: boolean;

  // 충성도
  loyalty: number;

  created_at: string;
  updated_at: string;
}
