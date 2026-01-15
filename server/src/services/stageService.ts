import { supabase } from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';

export const getAllStages = async () => {
  const { data, error } = await supabase
    .from('stage_templates')
    .select('*')
    .order('id', { ascending: true });

  if (error) throw error;
  return data;
};

export const getStageById = async (stageId: number) => {
  const { data, error } = await supabase
    .from('stage_templates')
    .select(`
      *,
      stage_waves (
        wave_number,
        monster_template_id,
        monster_count,
        is_boss
      )
    `)
    .eq('id', stageId)
    .single();

  if (error || !data) {
    throw new NotFoundError('스테이지');
  }

  return data;
};

export const getStageProgress = async (characterId: string, stageId: number) => {
  const { data, error } = await supabase
    .from('stage_progress')
    .select('*')
    .eq('character_id', characterId)
    .eq('stage_id', stageId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data || {
    character_id: characterId,
    stage_id: stageId,
    is_cleared: false,
    stars: 0,
    best_time: null,
    clear_count: 0,
  };
};
