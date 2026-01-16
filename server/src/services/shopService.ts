import { supabase } from '../config/database.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { inventoryService } from './inventoryService.js';

export interface Shop {
  id: number;
  name: string;
  description: string;
  npc_name: string;
  shop_type: string;
  icon_url: string;
}

// 4스탯 시스템: HP, ATK, DEF, SPD
export interface ShopItem {
  id: number;
  shop_id: number;
  item_template_id: number;
  stock: number;
  discount_percent: number;
  level_required: number;
  item_templates?: {
    id: number;
    name: string;
    description: string;
    type: string;
    subtype: string;
    rarity: string;
    buy_price: number;
    sell_price: number;
    icon_url: string;
    stat_hp: number;
    stat_atk: number;
    stat_def: number;
    stat_spd: number;
  };
}

class ShopService {
  // 모든 상점 조회
  async getShops(): Promise<Shop[]> {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .order('id');

    if (error) throw error;
    return data || [];
  }

  // 특정 상점 조회
  async getShop(shopId: number): Promise<Shop> {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('id', shopId)
      .single();

    if (error || !data) throw new NotFoundError('상점');
    return data;
  }

  // 상점 아이템 목록 조회
  async getShopItems(shopId: number, characterLevel: number = 1): Promise<ShopItem[]> {
    const { data, error } = await supabase
      .from('shop_items')
      .select('*, item_templates (*)')
      .eq('shop_id', shopId)
      .lte('level_required', characterLevel)
      .order('item_template_id');

    if (error) throw error;
    return data || [];
  }

  // 아이템 구매
  async buyItem(
    characterId: string,
    shopId: number,
    itemTemplateId: number,
    quantity: number = 1
  ): Promise<{ item: any; totalPrice: number }> {
    // 캐릭터 정보 조회
    const { data: character } = await supabase
      .from('characters')
      .select('gold, level')
      .eq('id', characterId)
      .single();

    if (!character) throw new NotFoundError('캐릭터');

    // 상점 아이템 조회
    const { data: shopItem } = await supabase
      .from('shop_items')
      .select('*, item_templates (*)')
      .eq('shop_id', shopId)
      .eq('item_template_id', itemTemplateId)
      .single();

    if (!shopItem) throw new NotFoundError('상점 아이템');
    if (!shopItem.item_templates) throw new NotFoundError('아이템 템플릿');

    // 레벨 확인
    if (character.level < shopItem.level_required) {
      throw new BadRequestError(`레벨 ${shopItem.level_required} 이상만 구매 가능합니다`);
    }

    // 재고 확인
    if (shopItem.stock !== -1 && shopItem.stock < quantity) {
      throw new BadRequestError('재고가 부족합니다');
    }

    // 가격 계산 (할인 적용)
    const basePrice = shopItem.item_templates.buy_price;
    const discountedPrice = Math.floor(basePrice * (100 - shopItem.discount_percent) / 100);
    const totalPrice = discountedPrice * quantity;

    // 골드 확인
    if (character.gold < totalPrice) {
      throw new BadRequestError('골드가 부족합니다');
    }

    // 골드 차감
    const { error: goldError } = await supabase
      .from('characters')
      .update({ gold: character.gold - totalPrice })
      .eq('id', characterId);

    if (goldError) throw goldError;

    // 재고 차감 (무제한이 아닌 경우)
    if (shopItem.stock !== -1) {
      await supabase
        .from('shop_items')
        .update({ stock: shopItem.stock - quantity })
        .eq('id', shopItem.id);
    }

    // 아이템 추가
    const item = await inventoryService.addItem(characterId, itemTemplateId, quantity);

    return { item, totalPrice };
  }

  // NPC 목록 조회
  async getNPCs(): Promise<any[]> {
    const { data, error } = await supabase
      .from('npcs')
      .select('*, shops (*)')
      .order('id');

    if (error) throw error;
    return data || [];
  }

  // 특정 NPC 조회
  async getNPC(npcId: number): Promise<any> {
    const { data, error } = await supabase
      .from('npcs')
      .select('*, shops (*)')
      .eq('id', npcId)
      .single();

    if (error || !data) throw new NotFoundError('NPC');
    return data;
  }
}

export const shopService = new ShopService();
