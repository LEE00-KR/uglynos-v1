import { supabase } from '../config/database.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

export interface InventoryItem {
  id: string;
  character_id: string;
  item_template_id: number;
  quantity: number;
  slot_index: number | null;
  enhancement_level: number;
  bonus_stat_str: number;
  bonus_stat_agi: number;
  bonus_stat_vit: number;
  bonus_stat_con: number;
  bonus_stat_int: number;
  is_equipped: boolean;
  equipped_slot: string | null;
  item_templates?: ItemTemplate;
}

export interface ItemTemplate {
  id: number;
  name: string;
  description: string;
  type: string;
  subtype: string;
  rarity: string;
  level_required: number;
  stat_str: number;
  stat_agi: number;
  stat_vit: number;
  stat_con: number;
  stat_int: number;
  effect_type: string | null;
  effect_value: number;
  effect_duration: number;
  capture_rate_bonus: number;
  buy_price: number;
  sell_price: number;
  stackable: boolean;
  max_stack: number;
  icon_url: string;
}

class InventoryService {
  // 인벤토리 조회
  async getInventory(characterId: string): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select('*, item_templates (*)')
      .eq('character_id', characterId)
      .order('slot_index', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // 장착된 아이템 조회
  async getEquippedItems(characterId: string): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select('*, item_templates (*)')
      .eq('character_id', characterId)
      .eq('is_equipped', true);

    if (error) throw error;
    return data || [];
  }

  // 아이템 추가
  async addItem(
    characterId: string,
    itemTemplateId: number,
    quantity: number = 1
  ): Promise<InventoryItem> {
    // 아이템 템플릿 조회
    const { data: template } = await supabase
      .from('item_templates')
      .select('*')
      .eq('id', itemTemplateId)
      .single();

    if (!template) throw new NotFoundError('아이템');

    // 스택 가능한 아이템인 경우 기존 아이템에 추가
    if (template.stackable) {
      const { data: existing } = await supabase
        .from('inventory')
        .select('*')
        .eq('character_id', characterId)
        .eq('item_template_id', itemTemplateId)
        .eq('is_equipped', false)
        .single();

      if (existing) {
        const newQuantity = Math.min(
          existing.quantity + quantity,
          template.max_stack
        );
        const { data: updated, error } = await supabase
          .from('inventory')
          .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select('*, item_templates (*)')
          .single();

        if (error) throw error;
        return updated;
      }
    }

    // 새 아이템 생성
    const { data: newItem, error } = await supabase
      .from('inventory')
      .insert({
        character_id: characterId,
        item_template_id: itemTemplateId,
        quantity: Math.min(quantity, template.max_stack),
      })
      .select('*, item_templates (*)')
      .single();

    if (error) throw error;
    return newItem;
  }

  // 아이템 제거
  async removeItem(
    characterId: string,
    inventoryId: string,
    quantity: number = 1
  ): Promise<void> {
    const { data: item } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', inventoryId)
      .eq('character_id', characterId)
      .single();

    if (!item) throw new NotFoundError('인벤토리 아이템');

    if (item.quantity <= quantity) {
      // 전부 제거
      await supabase.from('inventory').delete().eq('id', inventoryId);
    } else {
      // 일부만 제거
      await supabase
        .from('inventory')
        .update({ quantity: item.quantity - quantity, updated_at: new Date().toISOString() })
        .eq('id', inventoryId);
    }
  }

  // 아이템 장착
  async equipItem(characterId: string, inventoryId: string): Promise<InventoryItem> {
    const { data: item } = await supabase
      .from('inventory')
      .select('*, item_templates (*)')
      .eq('id', inventoryId)
      .eq('character_id', characterId)
      .single();

    if (!item) throw new NotFoundError('인벤토리 아이템');
    if (!item.item_templates) throw new NotFoundError('아이템 템플릿');

    const template = item.item_templates;

    // 장비 타입 확인
    if (!['weapon', 'armor', 'accessory'].includes(template.type)) {
      throw new BadRequestError('장착할 수 없는 아이템입니다');
    }

    // 장착 슬롯 결정
    let equippedSlot: string;
    if (template.type === 'weapon') {
      equippedSlot = 'weapon';
    } else if (template.type === 'armor') {
      equippedSlot = template.subtype; // helmet, chest, pants, boots
    } else {
      // accessory - 빈 슬롯 찾기
      const { data: equipped } = await supabase
        .from('inventory')
        .select('equipped_slot')
        .eq('character_id', characterId)
        .eq('is_equipped', true)
        .in('equipped_slot', ['accessory1', 'accessory2']);

      const usedSlots = equipped?.map((e: { equipped_slot: string }) => e.equipped_slot) || [];
      if (!usedSlots.includes('accessory1')) {
        equippedSlot = 'accessory1';
      } else if (!usedSlots.includes('accessory2')) {
        equippedSlot = 'accessory2';
      } else {
        throw new BadRequestError('악세서리 슬롯이 가득 찼습니다');
      }
    }

    // 기존 장착 아이템 해제
    await supabase
      .from('inventory')
      .update({ is_equipped: false, equipped_slot: null, updated_at: new Date().toISOString() })
      .eq('character_id', characterId)
      .eq('equipped_slot', equippedSlot);

    // 새 아이템 장착
    const { data: equipped, error } = await supabase
      .from('inventory')
      .update({
        is_equipped: true,
        equipped_slot: equippedSlot,
        updated_at: new Date().toISOString(),
      })
      .eq('id', inventoryId)
      .select('*, item_templates (*)')
      .single();

    if (error) throw error;
    return equipped;
  }

  // 아이템 해제
  async unequipItem(characterId: string, inventoryId: string): Promise<InventoryItem> {
    const { data: item } = await supabase
      .from('inventory')
      .select('*, item_templates (*)')
      .eq('id', inventoryId)
      .eq('character_id', characterId)
      .single();

    if (!item) throw new NotFoundError('인벤토리 아이템');
    if (!item.is_equipped) throw new BadRequestError('장착되지 않은 아이템입니다');

    const { data: unequipped, error } = await supabase
      .from('inventory')
      .update({
        is_equipped: false,
        equipped_slot: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', inventoryId)
      .select('*, item_templates (*)')
      .single();

    if (error) throw error;
    return unequipped;
  }

  // 아이템 사용 (소모품)
  async useItem(
    characterId: string,
    inventoryId: string
  ): Promise<{ effect: string; value: number }> {
    const { data: item } = await supabase
      .from('inventory')
      .select('*, item_templates (*)')
      .eq('id', inventoryId)
      .eq('character_id', characterId)
      .single();

    if (!item) throw new NotFoundError('인벤토리 아이템');
    if (!item.item_templates) throw new NotFoundError('아이템 템플릿');

    const template = item.item_templates;

    if (template.type !== 'consumable') {
      throw new BadRequestError('사용할 수 없는 아이템입니다');
    }

    // 효과 적용
    const effectResult = { effect: template.effect_type || '', value: template.effect_value };

    if (template.effect_type === 'heal_hp') {
      // HP 회복은 전투 중이 아닐 때만
      // 실제로는 캐릭터 현재 HP를 업데이트해야 함
      // 여기서는 효과만 반환
    } else if (template.effect_type === 'heal_mp') {
      // MP 회복
    }

    // 아이템 소모
    await this.removeItem(characterId, inventoryId, 1);

    return effectResult;
  }

  // 아이템 판매
  async sellItem(
    characterId: string,
    inventoryId: string,
    quantity: number = 1
  ): Promise<{ gold: number }> {
    const { data: item } = await supabase
      .from('inventory')
      .select('*, item_templates (*)')
      .eq('id', inventoryId)
      .eq('character_id', characterId)
      .single();

    if (!item) throw new NotFoundError('인벤토리 아이템');
    if (!item.item_templates) throw new NotFoundError('아이템 템플릿');
    if (item.is_equipped) throw new BadRequestError('장착 중인 아이템은 판매할 수 없습니다');
    if (item.quantity < quantity) throw new BadRequestError('수량이 부족합니다');

    const sellPrice = item.item_templates.sell_price * quantity;

    // 골드 추가
    await supabase.rpc('add_gold', { p_character_id: characterId, p_amount: sellPrice });

    // 아이템 제거
    await this.removeItem(characterId, inventoryId, quantity);

    return { gold: sellPrice };
  }
}

export const inventoryService = new InventoryService();
