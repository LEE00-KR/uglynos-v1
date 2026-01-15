import { supabase } from '../config/database.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';

export const getPetsByCharacterId = async (characterId: string) => {
  const { data, error } = await supabase
    .from('pets')
    .select(`
      *,
      pet_templates (
        name,
        element_primary,
        element_secondary,
        element_primary_ratio
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
      pet_templates (
        name,
        element_primary,
        element_secondary,
        element_primary_ratio,
        base_str,
        base_agi,
        base_vit,
        base_con,
        base_int
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
  const pet = await getPetById(petId, characterId);

  if (!pet.pet_templates?.can_ride) {
    throw new ValidationError('탑승할 수 없는 펫입니다');
  }

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
  const pet = await getPetById(petId, characterId);

  if (pet.is_starter) {
    throw new ValidationError('스타터 펫은 방생할 수 없습니다');
  }

  const { error } = await supabase
    .from('pets')
    .delete()
    .eq('id', petId);

  if (error) throw error;
};
