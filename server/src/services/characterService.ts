import jwt from 'jsonwebtoken';
import { supabase } from '../config/database.js';
import { env } from '../config/env.js';
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from '../utils/errors.js';
import { CreateCharacterInput } from '../validators/characterValidator.js';

export const getCharactersByUserId = async (userId: string) => {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getCharacterById = async (characterId: string, userId: string) => {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('id', characterId)
    .single();

  if (error || !data) {
    throw new NotFoundError('캐릭터');
  }

  if (data.user_id !== userId) {
    throw new ForbiddenError('접근 권한이 없습니다');
  }

  return data;
};

export const createCharacter = async (userId: string, input: CreateCharacterInput) => {
  // Check nickname uniqueness
  const { data: existing } = await supabase
    .from('characters')
    .select('id')
    .eq('nickname', input.nickname)
    .single();

  if (existing) {
    throw new ConflictError('이미 사용 중인 닉네임입니다');
  }

  // Check character limit (max 3)
  const { count } = await supabase
    .from('characters')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (count && count >= 3) {
    throw new ValidationError('캐릭터는 최대 3개까지 생성할 수 있습니다');
  }

  // Create character
  const { data, error } = await supabase
    .from('characters')
    .insert({
      user_id: userId,
      nickname: input.nickname,
      appearance_eye: input.appearance.eye,
      appearance_nose: input.appearance.nose,
      appearance_mouth: input.appearance.mouth,
      appearance_hair: input.appearance.hair,
      appearance_skin: input.appearance.skin,
      element_primary: input.element.primary,
      element_secondary: input.element.secondary || null,
      element_primary_ratio: input.element.primaryRatio,
      stat_str: input.stats.str,
      stat_agi: input.stats.agi,
      stat_vit: input.stats.vit,
      stat_con: input.stats.con,
      stat_int: input.stats.int,
      level: 1,
      exp: 0,
      gold: 1000,
      stat_points: 0,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
};

export const selectCharacter = async (characterId: string, userId: string) => {
  const character = await getCharacterById(characterId, userId);

  // Generate new token with characterId
  const accessToken = jwt.sign(
    { userId, characterId: character.id },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return { accessToken, character };
};

export const distributeStats = async (
  characterId: string,
  stats: { str?: number; agi?: number; vit?: number; con?: number; int?: number }
) => {
  const { data: character } = await supabase
    .from('characters')
    .select('stat_points')
    .eq('id', characterId)
    .single();

  if (!character) {
    throw new NotFoundError('캐릭터');
  }

  const totalPoints = Object.values(stats).reduce((sum, v) => sum + (v || 0), 0);

  if (totalPoints > character.stat_points) {
    throw new ValidationError('스탯 포인트가 부족합니다');
  }

  const { data, error } = await supabase
    .from('characters')
    .update({
      stat_str: supabase.rpc('increment', { x: stats.str || 0 }),
      stat_agi: supabase.rpc('increment', { x: stats.agi || 0 }),
      stat_vit: supabase.rpc('increment', { x: stats.vit || 0 }),
      stat_con: supabase.rpc('increment', { x: stats.con || 0 }),
      stat_int: supabase.rpc('increment', { x: stats.int || 0 }),
      stat_points: character.stat_points - totalPoints,
    })
    .eq('id', characterId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
