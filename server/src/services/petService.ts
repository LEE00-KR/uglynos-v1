import { supabase } from '../config/database.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';

export const getPetsByCharacterId = async (characterId: string) => {
  const { data, error } = await supabase
    .from('pets')
    .select(`
      *,
      admin_pets (
        id,
        name,
        element_primary,
        element_secondary,
        element_primary_ratio,
        capture_rate,
        total_stats
      )
    `)
    .eq('character_id', characterId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getPetById = async (petId: string, characterId: string) => {
  const { data, error } = await supabase
    .from('pets')
    .select(`
      *,
      admin_pets (
        id,
        name,
        element_primary,
        element_secondary,
        element_primary_ratio,
        base_hp_min,
        base_hp_max,
        base_atk_min,
        base_atk_max,
        base_def_min,
        base_def_max,
        base_spd_min,
        base_spd_max,
        capture_rate,
        total_stats
      )
    `)
    .eq('id', petId)
    .single();

  if (error || !data) {
    throw new NotFoundError('펫');
  }

  if (data.character_id !== characterId) {
    throw new ForbiddenError('접근 권한이 없습니다');
  }

  return data;
};

export const updateNickname = async (petId: string, characterId: string, nickname: string) => {
  await getPetById(petId, characterId);

  const { data, error } = await supabase
    .from('pets')
    .update({ nickname })
    .eq('id', petId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const addToParty = async (petId: string, characterId: string, slot: number) => {
  if (slot < 1 || slot > 3) {
    throw new ValidationError('슬롯은 1~3 사이여야 합니다');
  }

  await getPetById(petId, characterId);

  // Check if slot is occupied
  const { data: existing } = await supabase
    .from('pets')
    .select('id')
    .eq('character_id', characterId)
    .eq('party_slot', slot)
    .single();

  if (existing) {
    // Remove current pet from slot
    await supabase
      .from('pets')
      .update({ party_slot: null })
      .eq('id', existing.id);
  }

  const { error } = await supabase
    .from('pets')
    .update({ party_slot: slot })
    .eq('id', petId);

  if (error) throw error;
};

export const removeFromParty = async (petId: string, characterId: string) => {
  await getPetById(petId, characterId);

  const { error } = await supabase
    .from('pets')
    .update({ party_slot: null })
    .eq('id', petId);

  if (error) throw error;
};

export const setRiding = async (petId: string, characterId: string) => {
  // Verify pet ownership (throws if not found)
  await getPetById(petId, characterId);

  // admin_pets에는 can_ride 필드가 없으므로 임시로 항상 허용
  // TODO: admin_pets에 can_ride 필드 추가 시 활성화

  // Unset current riding pet
  await supabase
    .from('pets')
    .update({ is_riding: false })
    .eq('character_id', characterId)
    .eq('is_riding', true);

  const { error } = await supabase
    .from('pets')
    .update({ is_riding: true })
    .eq('id', petId);

  if (error) throw error;
};

export const unsetRiding = async (petId: string, characterId: string) => {
  await getPetById(petId, characterId);

  const { error } = await supabase
    .from('pets')
    .update({ is_riding: false })
    .eq('id', petId);

  if (error) throw error;
};

export const releasePet = async (petId: string, characterId: string) => {
  await getPetById(petId, characterId);

  // Check if there's at least one other pet
  const { count } = await supabase
    .from('pets')
    .select('*', { count: 'exact', head: true })
    .eq('character_id', characterId);

  if (count && count <= 1) {
    throw new ValidationError('최소 1마리의 펫은 보유해야 합니다');
  }

  const { error } = await supabase
    .from('pets')
    .delete()
    .eq('id', petId);

  if (error) throw error;
};

// =============================================
// PET STORAGE (창고) FUNCTIONS
// =============================================

const MAX_ACTIVE_PETS = 6;
const MAX_STORAGE_PETS = 20;

export const getStoragePets = async (characterId: string) => {
  const { data, error } = await supabase
    .from('pets')
    .select(`
      *,
      admin_pets (
        id,
        name,
        element_primary,
        element_secondary,
        element_primary_ratio,
        capture_rate,
        total_stats
      )
    `)
    .eq('character_id', characterId)
    .eq('in_storage', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getActivePets = async (characterId: string) => {
  const { data, error } = await supabase
    .from('pets')
    .select(`
      *,
      admin_pets (
        id,
        name,
        element_primary,
        element_secondary,
        element_primary_ratio,
        capture_rate,
        total_stats
      )
    `)
    .eq('character_id', characterId)
    .or('in_storage.is.null,in_storage.eq.false')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const moveToStorage = async (petId: string, characterId: string) => {
  const pet = await getPetById(petId, characterId);

  // Check storage capacity
  const storagePets = await getStoragePets(characterId);
  if (storagePets.length >= MAX_STORAGE_PETS) {
    throw new ValidationError(`창고는 최대 ${MAX_STORAGE_PETS}마리까지 보관 가능합니다`);
  }

  // Remove from party if in party
  if (pet.party_slot) {
    await supabase
      .from('pets')
      .update({ party_slot: null })
      .eq('id', petId);
  }

  // Remove riding if riding
  if (pet.is_riding) {
    await supabase
      .from('pets')
      .update({ is_riding: false })
      .eq('id', petId);
  }

  const { error } = await supabase
    .from('pets')
    .update({ in_storage: true })
    .eq('id', petId);

  if (error) throw error;
};

export const moveFromStorage = async (petId: string, characterId: string) => {
  await getPetById(petId, characterId);

  // Check active capacity
  const activePets = await getActivePets(characterId);
  if (activePets.length >= MAX_ACTIVE_PETS) {
    throw new ValidationError(`활성 펫은 최대 ${MAX_ACTIVE_PETS}마리까지 보유 가능합니다`);
  }

  const { error } = await supabase
    .from('pets')
    .update({ in_storage: false })
    .eq('id', petId);

  if (error) throw error;
};

// =============================================
// REPRESENTATIVE PET & STANDBY SLOT FUNCTIONS
// =============================================

const MAX_STANDBY_SLOTS = 4;

// 대표 펫 설정
export const setRepresentative = async (petId: string, characterId: string) => {
  await getPetById(petId, characterId);

  // 기존 대표 펫 해제
  await supabase
    .from('pets')
    .update({ is_representative: false })
    .eq('character_id', characterId)
    .eq('is_representative', true);

  // 새 대표 펫 설정
  const { error } = await supabase
    .from('pets')
    .update({ is_representative: true })
    .eq('id', petId);

  if (error) throw error;
};

// 대표 펫 해제
export const unsetRepresentative = async (petId: string, characterId: string) => {
  await getPetById(petId, characterId);

  const { error } = await supabase
    .from('pets')
    .update({ is_representative: false })
    .eq('id', petId);

  if (error) throw error;
};

// 대기 슬롯에 펫 배치
export const setStandbySlot = async (petId: string, characterId: string, slot: number) => {
  if (slot < 1 || slot > MAX_STANDBY_SLOTS) {
    throw new ValidationError(`대기 슬롯은 1~${MAX_STANDBY_SLOTS} 사이여야 합니다`);
  }

  const pet = await getPetById(petId, characterId);

  // 대표 펫은 대기 슬롯에 배치 불가
  if (pet.is_representative) {
    throw new ValidationError('대표 펫은 대기 슬롯에 배치할 수 없습니다');
  }

  // 탑승 중인 펫은 대기 슬롯에 배치 불가
  if (pet.is_riding) {
    throw new ValidationError('탑승 중인 펫은 대기 슬롯에 배치할 수 없습니다');
  }

  // 해당 슬롯에 이미 펫이 있으면 해제
  const { data: existing } = await supabase
    .from('pets')
    .select('id')
    .eq('character_id', characterId)
    .eq('standby_slot', slot)
    .single();

  if (existing) {
    await supabase
      .from('pets')
      .update({ standby_slot: null })
      .eq('id', existing.id);
  }

  // 새 펫을 슬롯에 배치
  const { error } = await supabase
    .from('pets')
    .update({ standby_slot: slot })
    .eq('id', petId);

  if (error) throw error;
};

// 대기 슬롯에서 펫 제거
export const clearStandbySlot = async (petId: string, characterId: string) => {
  await getPetById(petId, characterId);

  const { error } = await supabase
    .from('pets')
    .update({ standby_slot: null })
    .eq('id', petId);

  if (error) throw error;
};

// 대기 슬롯의 펫 목록 조회
export const getStandbyPets = async (characterId: string) => {
  const { data, error } = await supabase
    .from('pets')
    .select(`
      *,
      admin_pets (
        id,
        name,
        element_primary,
        element_secondary,
        element_primary_ratio,
        capture_rate,
        total_stats
      )
    `)
    .eq('character_id', characterId)
    .not('standby_slot', 'is', null)
    .order('standby_slot', { ascending: true });

  if (error) throw error;
  return data || [];
};

// 대표 펫 조회
export const getRepresentativePet = async (characterId: string) => {
  const { data, error } = await supabase
    .from('pets')
    .select(`
      *,
      admin_pets (
        id,
        name,
        element_primary,
        element_secondary,
        element_primary_ratio,
        capture_rate,
        total_stats
      )
    `)
    .eq('character_id', characterId)
    .eq('is_representative', true)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data || null;
};
